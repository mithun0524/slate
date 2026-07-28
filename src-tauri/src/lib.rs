//! Vellum — Tauri core. Owns the pty, the filesystem watcher, git reads, and
//! the agent override socket; exposes them to the webview as commands + events.

mod classifier;
mod git;
mod override_server;
mod pty;
mod scan;
mod search;
mod types;
mod watcher;

use notify::RecommendedWatcher;
use pty::PtySession;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, State};
use types::{BranchInfo, CommitInfo, FileMatches, HeadInfo, StashEntry, TreeEntry};

#[derive(Default)]
struct AppState {
    ptys: Mutex<HashMap<String, PtySession>>,
    workspace: Mutex<Option<PathBuf>>,
    watcher: Mutex<Option<RecommendedWatcher>>,
    shell_pids: Mutex<HashMap<String, u32>>,
}

fn home_dir() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}

/// The open workspace root, or an error the UI can show.
fn ws(state: &State<AppState>) -> Result<PathBuf, String> {
    state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or_else(|| "no workspace open".to_string())
}

/// Open a workspace: (re)start the watcher and report whether it's a git repo.
#[tauri::command]
fn open_workspace(
    app: AppHandle,
    state: State<AppState>,
    path: String,
) -> Result<bool, String> {
    let root = PathBuf::from(&path);
    if !root.is_dir() {
        return Err(format!("not a directory: {path}"));
    }
    let root = root.canonicalize().map_err(|e| e.to_string())?;

    let w = watcher::start(app.clone(), root.clone())?;
    *state.watcher.lock().unwrap() = Some(w); // dropping the old one stops it
    *state.workspace.lock().unwrap() = Some(root.clone());

    Ok(git::is_repo(&root))
}

#[tauri::command]
fn pty_spawn(
    app: AppHandle,
    state: State<AppState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let cwd = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_else(home_dir);
    let session = PtySession::spawn(&app, id.clone(), &cwd, cols.max(1), rows.max(1))?;
    if let Some(pid) = session.pid {
        state.shell_pids.lock().unwrap().insert(id.clone(), pid);
    }
    state.ptys.lock().unwrap().insert(id, session);
    Ok(())
}

#[tauri::command]
fn pty_close(state: State<AppState>, id: String) {
    state.ptys.lock().unwrap().remove(&id); // Drop kills the child
    state.shell_pids.lock().unwrap().remove(&id);
}

/// Heuristic: is an agent (Claude Code) running under the terminal's shell?
/// Walks the process tree from the shell pid and looks for a "claude" process.
#[tauri::command(async)]
fn agent_running(state: State<AppState>) -> Result<bool, String> {
    let shells: Vec<u32> = state.shell_pids.lock().unwrap().values().copied().collect();
    if shells.is_empty() {
        return Ok(false);
    }
    let out = match std::process::Command::new("ps")
        .args(["-axo", "pid=,ppid=,args="])
        .output()
    {
        Ok(o) => o,
        Err(_) => return Ok(false),
    };
    let text = String::from_utf8_lossy(&out.stdout);

    let mut children: HashMap<u32, Vec<u32>> = HashMap::new();
    let mut args_of: HashMap<u32, String> = HashMap::new();
    for line in text.lines() {
        let mut it = line.trim().splitn(3, char::is_whitespace);
        let (Some(pid), Some(ppid), Some(args)) = (it.next(), it.next(), it.next()) else {
            continue;
        };
        if let (Ok(pid), Ok(ppid)) = (pid.parse::<u32>(), ppid.parse::<u32>()) {
            children.entry(ppid).or_default().push(pid);
            args_of.insert(pid, args.to_string());
        }
    }

    let shell_set: std::collections::HashSet<u32> = shells.iter().copied().collect();
    let mut stack = shells;
    let mut seen = std::collections::HashSet::new();
    while let Some(pid) = stack.pop() {
        if !seen.insert(pid) {
            continue;
        }
        if let Some(args) = args_of.get(&pid) {
            let a = args.to_ascii_lowercase();
            if !shell_set.contains(&pid) && a.contains("claude") {
                return Ok(true);
            }
        }
        if let Some(kids) = children.get(&pid) {
            stack.extend(kids);
        }
    }
    Ok(false)
}

#[tauri::command]
fn pty_write(state: State<AppState>, id: String, data: String) -> Result<(), String> {
    let mut guard = state.ptys.lock().unwrap();
    match guard.get_mut(&id) {
        Some(p) => p.write(&data),
        None => Err("no such pty session".into()),
    }
}

#[tauri::command]
fn pty_resize(state: State<AppState>, id: String, cols: u16, rows: u16) -> Result<(), String> {
    let guard = state.ptys.lock().unwrap();
    match guard.get(&id) {
        Some(p) => p.resize(cols.max(1), rows.max(1)),
        None => Ok(()),
    }
}

// Every command below is marked `(async)`: Tauri runs plain `#[tauri::command]`
// bodies on the main thread, which on macOS is the UI thread — a `git diff` or
// a full-tree search would freeze the window while it ran. `(async)` moves the
// (still synchronous) body onto the async runtime's thread pool.

#[tauri::command(async)]
fn git_tree(state: State<AppState>) -> Result<Vec<TreeEntry>, String> {
    git::tree(&ws(&state)?)
}

#[tauri::command(async)]
fn git_diff(state: State<AppState>, paths: Vec<String>) -> Result<String, String> {
    git::diff(&ws(&state)?, &paths)
}

#[tauri::command(async)]
fn git_branch(state: State<AppState>) -> Result<String, String> {
    git::branch(&ws(&state)?)
}

#[tauri::command(async)]
fn git_head_info(state: State<AppState>) -> Result<HeadInfo, String> {
    git::head_info(&ws(&state)?)
}

#[tauri::command(async)]
fn git_log(state: State<AppState>, limit: u32) -> Result<Vec<CommitInfo>, String> {
    git::log(&ws(&state)?, limit as usize)
}

#[tauri::command(async)]
fn git_stage(state: State<AppState>, paths: Vec<String>) -> Result<(), String> {
    git::stage(&ws(&state)?, &paths)
}

#[tauri::command(async)]
fn git_unstage(state: State<AppState>, paths: Vec<String>) -> Result<(), String> {
    git::unstage(&ws(&state)?, &paths)
}

#[tauri::command(async)]
fn git_discard(state: State<AppState>, paths: Vec<String>) -> Result<(), String> {
    git::discard(&ws(&state)?, &paths)
}

#[tauri::command(async)]
fn git_commit(state: State<AppState>, message: String) -> Result<String, String> {
    git::commit(&ws(&state)?, &message)
}

#[tauri::command(async)]
fn git_commit_diff(state: State<AppState>, hash: String) -> Result<String, String> {
    git::commit_diff(&ws(&state)?, &hash)
}

// --- branches / remote / stash (shell out to the user's git; see git.rs) ---

#[tauri::command(async)]
fn git_branches(state: State<AppState>) -> Result<Vec<BranchInfo>, String> {
    git::branches(&ws(&state)?)
}

#[tauri::command(async)]
fn git_checkout(state: State<AppState>, name: String, create: bool) -> Result<String, String> {
    git::checkout(&ws(&state)?, &name, create)
}

#[tauri::command(async)]
fn git_fetch(state: State<AppState>) -> Result<String, String> {
    git::fetch(&ws(&state)?)
}

#[tauri::command(async)]
fn git_pull(state: State<AppState>) -> Result<String, String> {
    git::pull(&ws(&state)?)
}

#[tauri::command(async)]
fn git_push(state: State<AppState>) -> Result<String, String> {
    git::push(&ws(&state)?)
}

#[tauri::command(async)]
fn git_stash_push(state: State<AppState>, message: String) -> Result<String, String> {
    git::stash_push(&ws(&state)?, &message)
}

#[tauri::command(async)]
fn git_stash_pop(state: State<AppState>, index: usize) -> Result<String, String> {
    git::stash_pop(&ws(&state)?, index)
}

#[tauri::command(async)]
fn git_stash_list(state: State<AppState>) -> Result<Vec<StashEntry>, String> {
    git::stash_list(&ws(&state)?)
}

/// Open a URL in the user's default browser. The terminal's link addon must
/// not use `window.open` — in a WKWebView that navigates the app away.
#[tauri::command(async)]
fn open_external(url: String) -> Result<(), String> {
    // Only ever hand a real http(s) URL to the OS opener.
    if !(url.starts_with("http://") || url.starts_with("https://")) {
        return Err("refusing to open non-http url".into());
    }
    let status = std::process::Command::new("open")
        .arg(&url)
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("failed to open url".into())
    }
}

/// Read a text file for the markdown viewer. Restricted to inside the workspace.
#[tauri::command(async)]
fn read_text(state: State<AppState>, path: String) -> Result<String, String> {
    let root = ws(&state)?;

    // Resolve relative to workspace and confine to it.
    let candidate = if PathBuf::from(&path).is_absolute() {
        PathBuf::from(&path)
    } else {
        root.join(&path)
    };
    let full = candidate.canonicalize().map_err(|e| e.to_string())?;
    if !full.starts_with(&root) {
        return Err("path escapes workspace".into());
    }
    const MAX: u64 = 4 * 1024 * 1024;
    let meta = std::fs::metadata(&full).map_err(|e| e.to_string())?;
    if meta.len() > MAX {
        return Err("file too large".into());
    }
    std::fs::read_to_string(&full).map_err(|e| e.to_string())
}

/// Clone a git repo (via the user's `git`, so their creds/ssh work) into
/// `parent/<name>` and return the created path.
#[tauri::command(async)]
fn clone_repo(url: String, parent: String) -> Result<String, String> {
    let url = url.trim();
    if url.is_empty() {
        return Err("empty url".into());
    }
    let name = url
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("repo")
        .trim_end_matches(".git");
    if name.is_empty() {
        return Err("could not derive repo name".into());
    }
    let dest = PathBuf::from(&parent).join(name);
    if dest.exists() {
        return Err(format!("{name} already exists in that folder"));
    }
    let out = std::process::Command::new("git")
        .args(["clone", url, &dest.to_string_lossy()])
        .output()
        .map_err(|e| e.to_string())?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    Ok(dest.to_string_lossy().into_owned())
}

/// Create a new folder under `parent`, `git init` it, and return its path.
#[tauri::command(async)]
fn create_project(parent: String, name: String) -> Result<String, String> {
    let name = name.trim();
    if name.is_empty() || name.contains('/') || name.contains("..") {
        return Err("invalid project name".into());
    }
    let dest = PathBuf::from(&parent).join(name);
    if dest.exists() {
        return Err("a folder with that name already exists".into());
    }
    std::fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
    let _ = std::process::Command::new("git")
        .args(["init"])
        .current_dir(&dest)
        .output();
    Ok(dest.to_string_lossy().into_owned())
}

/// Spotlight-style directory search. Uses macOS `mdfind` to find folders whose
/// name matches `query`, ranked toward shallow, home-rooted, project-looking
/// dirs. Empty for very short queries. Never errors — returns [] on any trouble.
#[tauri::command(async)]
fn search_dirs(query: String) -> Vec<String> {
    let q = query.trim();
    if q.len() < 2 {
        return Vec::new();
    }
    let safe: String = q.chars().filter(|c| *c != '"' && *c != '\'').collect();
    let expr = format!(
        "kMDItemFSName == \"*{safe}*\"c && kMDItemContentTypeTree == \"public.folder\""
    );

    let output = match std::process::Command::new("mdfind").arg(&expr).output() {
        Ok(o) => o,
        Err(_) => return Vec::new(),
    };
    let text = String::from_utf8_lossy(&output.stdout);

    const NOISE: &[&str] = &[
        "/node_modules/",
        "/.git/",
        "/Library/",
        "/.Trash",
        "/.cargo/",
        "/.rustup/",
        "/target/",
        "/.npm/",
        "/dist/",
        "/.cache/",
    ];
    let home = std::env::var("HOME").unwrap_or_default();
    let ql = safe.to_ascii_lowercase();

    let mut scored: Vec<(i32, String)> = Vec::new();
    for line in text.lines() {
        if line.is_empty() || NOISE.iter().any(|n| line.contains(n)) {
            continue;
        }
        let path = std::path::Path::new(line);
        if !path.is_dir() {
            continue;
        }
        let base = path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        let mut score = 0;
        if base == ql {
            score += 100;
        } else if base.starts_with(&ql) {
            score += 60;
        } else if base.contains(&ql) {
            score += 30;
        }
        if !home.is_empty() && line.starts_with(&home) {
            score += 20;
        }
        if path.join(".git").exists() {
            score += 40; // looks like a project
        }
        score -= line.matches('/').count() as i32; // prefer shallower
        scored.push((score, line.to_string()));

        if scored.len() >= 400 {
            break; // cap work
        }
    }
    scored.sort_by(|a, b| b.0.cmp(&a.0));
    scored.into_iter().take(24).map(|(_, p)| p).collect()
}

/// Full-text search across the workspace. Returns matches grouped by file.
#[tauri::command(async)]
fn search_text(
    state: State<AppState>,
    query: String,
    case_sensitive: bool,
    whole_word: bool,
    regex_mode: bool,
) -> Result<Vec<FileMatches>, String> {
    search::search(
        &ws(&state)?,
        &query,
        &search::Opts {
            case_sensitive,
            whole_word,
            regex_mode,
        },
    )
}

/// List every markdown file in the workspace (relative paths), for the spec
/// explorer. Bounded so a pathological tree can't hang the UI.
#[tauri::command(async)]
fn list_specs(state: State<AppState>) -> Result<Vec<String>, String> {
    Ok(search::list_markdown(&ws(&state)?))
}

/// Write text back to a file inside the workspace (spec checkbox toggles).
#[tauri::command(async)]
fn write_text(state: State<AppState>, path: String, content: String) -> Result<(), String> {
    let root = ws(&state)?;
    let candidate = if PathBuf::from(&path).is_absolute() {
        PathBuf::from(&path)
    } else {
        root.join(&path)
    };
    // Confine to the workspace: the parent dir must resolve inside root.
    let parent = candidate.parent().ok_or("bad path")?;
    let parent_real = parent.canonicalize().map_err(|e| e.to_string())?;
    if !parent_real.starts_with(&root) {
        return Err("path escapes workspace".into());
    }
    std::fs::write(&candidate, content).map_err(|e| e.to_string())
}

/// Read a workspace image and return it as a `data:` URL, so relative `<img>`
/// paths in a rendered README (which the webview cannot fetch) still display.
#[tauri::command(async)]
fn read_asset(state: State<AppState>, path: String) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine};

    let root = ws(&state)?;

    let candidate = if PathBuf::from(&path).is_absolute() {
        PathBuf::from(&path)
    } else {
        root.join(&path)
    };
    let full = candidate.canonicalize().map_err(|e| e.to_string())?;
    if !full.starts_with(&root) {
        return Err("path escapes workspace".into());
    }
    const MAX: u64 = 8 * 1024 * 1024;
    let meta = std::fs::metadata(&full).map_err(|e| e.to_string())?;
    if meta.len() > MAX {
        return Err("asset too large".into());
    }

    let mime = match full
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_ascii_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("svg") => "image/svg+xml",
        Some("webp") => "image/webp",
        Some("avif") => "image/avif",
        Some("ico") => "image/x-icon",
        Some("bmp") => "image/bmp",
        _ => "application/octet-stream",
    };

    let bytes = std::fs::read(&full).map_err(|e| e.to_string())?;
    Ok(format!("data:{};base64,{}", mime, STANDARD.encode(bytes)))
}

/// Resolve a pending agent approval request with the human's decision.
#[tauri::command]
fn resolve_approval(
    reg: State<override_server::ApprovalRegistry>,
    id: String,
    approved: bool,
) {
    if let Some(tx) = reg.0.lock().unwrap().remove(&id) {
        let _ = tx.send(approved);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .manage(override_server::ApprovalRegistry::default())
        .setup(|app| {
            override_server::start(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_workspace,
            pty_spawn,
            pty_write,
            pty_resize,
            pty_close,
            agent_running,
            git_tree,
            git_diff,
            git_branch,
            git_head_info,
            git_log,
            git_stage,
            git_unstage,
            git_discard,
            git_commit,
            git_commit_diff,
            git_branches,
            git_checkout,
            git_fetch,
            git_pull,
            git_push,
            git_stash_push,
            git_stash_pop,
            git_stash_list,
            open_external,
            read_text,
            write_text,
            read_asset,
            list_specs,
            search_dirs,
            search_text,
            clone_repo,
            create_project,
            resolve_approval
        ])
        .run(tauri::generate_context!())
        .expect("error while running vellum");
}
