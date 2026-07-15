//! Filesystem watcher -> debounced burst -> classifier -> `vellum://intent`.
//!
//! The returned `RecommendedWatcher` must be kept alive (stored in app state);
//! dropping it stops watching and closes the debounce thread.

use crate::classifier::classify;
use crate::types::{ChangeKind, FileBurst, FileChange, IntentEvent, IntentSource};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, RecvTimeoutError};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

const DEBOUNCE_MS: u64 = 400;

/// Directory segments we never surface (noise / build artifacts).
const IGNORED: &[&str] = &[".git", "node_modules", "target", "dist", ".DS_Store"];

/// Start watching `root` recursively. Returns the watcher handle to keep alive.
pub fn start(app: AppHandle, root: PathBuf) -> Result<RecommendedWatcher, String> {
    let (tx, rx) = channel::<Event>();

    let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
        if let Ok(ev) = res {
            let _ = tx.send(ev);
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(&root, RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    // Debounce + classify on a background thread.
    std::thread::spawn(move || loop {
        // Block for the first event of a burst.
        let first = match rx.recv() {
            Ok(ev) => ev,
            Err(_) => return, // watcher dropped
        };
        let mut raw = vec![first];

        // Drain the quiet window.
        loop {
            match rx.recv_timeout(Duration::from_millis(DEBOUNCE_MS)) {
                Ok(ev) => raw.push(ev),
                Err(RecvTimeoutError::Timeout) => break,
                Err(RecvTimeoutError::Disconnected) => return,
            }
        }

        let burst = build_burst(&root, raw);
        if burst.events.is_empty() {
            continue;
        }
        let intent = classify(&burst);
        let payload = IntentEvent {
            intent,
            source: IntentSource::Classifier,
            burst: burst.events.clone(),
        };
        let _ = app.emit("vellum://intent", payload);
    });

    Ok(watcher)
}

fn build_burst(root: &Path, raw: Vec<Event>) -> FileBurst {
    let mut events: Vec<FileChange> = Vec::new();
    for ev in raw {
        let kind = match ev.kind {
            EventKind::Create(_) => ChangeKind::Created,
            EventKind::Modify(_) => ChangeKind::Modified,
            EventKind::Remove(_) => ChangeKind::Deleted,
            _ => continue, // Access / Any / Other -> ignore
        };
        for path in ev.paths {
            if is_ignored(&path) {
                continue;
            }
            let rel = match path.strip_prefix(root) {
                Ok(r) => r.to_string_lossy().to_string(),
                Err(_) => path.to_string_lossy().to_string(),
            };
            if rel.is_empty() {
                continue;
            }
            // Collapse consecutive duplicate (path, kind) pairs.
            if let Some(last) = events.last() {
                if last.path == rel && last.kind == kind {
                    continue;
                }
            }
            events.push(FileChange { path: rel, kind });
        }
    }
    FileBurst { events }
}

fn is_ignored(path: &Path) -> bool {
    path.components().any(|c| {
        let s = c.as_os_str().to_string_lossy();
        IGNORED.iter().any(|ig| *ig == s)
    })
}
