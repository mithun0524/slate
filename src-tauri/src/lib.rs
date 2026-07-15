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
use types::TreeEntry;

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
            read_text,
            read_asset
        ])
        .run(tauri::generate_context!())
        .expect("error while running vellum");
}
