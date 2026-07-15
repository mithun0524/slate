//! Vellum — Tauri core. Owns the pty, the filesystem watcher, git reads, and
//! the agent override socket; exposes them to the webview as commands + events.

mod classifier;
mod git;
mod override_server;
mod pty;
mod types;
mod watcher;

use notify::RecommendedWatcher;
use pty::PtySession;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, State};
use types::{CommitInfo, HeadInfo, TreeEntry};

#[derive(Default)]
struct AppState {
    pty: Mutex<Option<PtySession>>,
    workspace: Mutex<Option<PathBuf>>,
    watcher: Mutex<Option<RecommendedWatcher>>,
}

fn home_dir() -> PathBuf {
    std::env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
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
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let cwd = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_else(home_dir);
    let session = PtySession::spawn(&app, &cwd, cols.max(1), rows.max(1))?;
    *state.pty.lock().unwrap() = Some(session);
    Ok(())
}

#[tauri::command]
fn pty_write(state: State<AppState>, data: String) -> Result<(), String> {
    let mut guard = state.pty.lock().unwrap();
    match guard.as_mut() {
        Some(p) => p.write(&data),
        None => Err("no pty session".into()),
    }
}

#[tauri::command]
fn pty_resize(state: State<AppState>, cols: u16, rows: u16) -> Result<(), String> {
    let guard = state.pty.lock().unwrap();
    match guard.as_ref() {
        Some(p) => p.resize(cols.max(1), rows.max(1)),
        None => Ok(()), // nothing to resize yet
    }
}

#[tauri::command]
fn git_tree(state: State<AppState>) -> Result<Vec<TreeEntry>, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;
    git::tree(&root)
}

#[tauri::command]
fn git_diff(state: State<AppState>, paths: Vec<String>) -> Result<String, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;
    git::diff(&root, &paths)
}

#[tauri::command]
fn git_branch(state: State<AppState>) -> Result<String, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;
    git::branch(&root)
}

#[tauri::command]
fn git_head_info(state: State<AppState>) -> Result<HeadInfo, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;
    git::head_info(&root)
}

#[tauri::command]
fn git_log(state: State<AppState>, limit: u32) -> Result<Vec<CommitInfo>, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;
    git::log(&root, limit as usize)
}

#[tauri::command]
fn git_commit_diff(state: State<AppState>, hash: String) -> Result<String, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;
    git::commit_diff(&root, &hash)
}

/// Read a text file for the markdown viewer. Restricted to inside the workspace.
#[tauri::command]
fn read_text(state: State<AppState>, path: String) -> Result<String, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;

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
#[tauri::command]
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
#[tauri::command]
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
#[tauri::command]
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

/// Directory names never descended into when listing specs.
const SPEC_IGNORED: &[&str] = &[
    ".git",
    "node_modules",
    "target",
    "dist",
    "build",
    ".next",
    "vendor",
];

/// List every markdown file in the workspace (relative paths), for the spec
/// explorer. Bounded so a pathological tree can't hang the UI.
#[tauri::command]
fn list_specs(state: State<AppState>) -> Result<Vec<String>, String> {
    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;

    let mut out: Vec<String> = Vec::new();
    let mut stack: Vec<PathBuf> = vec![root.clone()];
    const MAX: usize = 5000;

    while let Some(dir) = stack.pop() {
        let entries = match std::fs::read_dir(&dir) {
            Ok(e) => e,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let ft = match entry.file_type() {
                Ok(t) => t,
                Err(_) => continue,
            };
            if ft.is_dir() {
                if SPEC_IGNORED.iter().any(|ig| *ig == name) || name.starts_with('.') {
                    continue;
                }
                stack.push(path);
            } else {
                let lower = name.to_ascii_lowercase();
                if lower.ends_with(".md") || lower.ends_with(".markdown") {
                    if let Ok(rel) = path.strip_prefix(&root) {
                        out.push(rel.to_string_lossy().to_string());
                        if out.len() >= MAX {
                            out.sort();
                            return Ok(out);
                        }
                    }
                }
            }
        }
    }
    out.sort();
    Ok(out)
}

/// Read a workspace image and return it as a `data:` URL, so relative `<img>`
/// paths in a rendered README (which the webview cannot fetch) still display.
#[tauri::command]
fn read_asset(state: State<AppState>, path: String) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine};

    let root = state
        .workspace
        .lock()
        .unwrap()
        .clone()
        .ok_or("no workspace open")?;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .setup(|app| {
            override_server::start(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_workspace,
            pty_spawn,
            pty_write,
            pty_resize,
            git_tree,
            git_diff,
            git_branch,
            git_head_info,
            git_log,
            git_commit_diff,
            read_text,
            read_asset,
            list_specs,
            search_dirs,
            clone_repo,
            create_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running vellum");
}
