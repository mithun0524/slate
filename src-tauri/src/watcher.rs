//! Filesystem watcher -> debounced burst -> classifier -> `vellum://intent`.
//!
//! The returned `RecommendedWatcher` must be kept alive (stored in app state);
//! dropping it stops watching and closes the debounce thread.

use crate::classifier::classify;
use crate::scan::Ignorer;
use crate::types::{ChangeKind, FileBurst, FileChange, IntentEvent, IntentSource};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, RecvTimeoutError};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

const DEBOUNCE_MS: u64 = 400;

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

    // Built once per workspace: the repo's own .gitignore decides what's noise,
    // on top of the always-ignored list. A project's `.venv/`, `coverage/` or
    // `__pycache__/` used to generate reactive churn here.
    let ignorer = Ignorer::new(&root);

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

        let burst = build_burst(&root, raw, &ignorer);
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

fn build_burst(root: &Path, raw: Vec<Event>, ignorer: &Ignorer) -> FileBurst {
    let mut events: Vec<FileChange> = Vec::new();
    for ev in raw {
        let kind = match ev.kind {
            EventKind::Create(_) => ChangeKind::Created,
            EventKind::Modify(_) => ChangeKind::Modified,
            EventKind::Remove(_) => ChangeKind::Deleted,
            _ => continue, // Access / Any / Other -> ignore
        };
        for path in ev.paths {
            // A deleted path can't be stat'd, so is_dir() is false — that only
            // costs us directory-only gitignore rules on deletes.
            if ignorer.ignored(&path, path.is_dir()) {
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

#[cfg(test)]
mod tests {
    use super::*;
    use notify::event::{CreateKind, ModifyKind};
    use std::fs;

    fn ev(kind: EventKind, paths: Vec<PathBuf>) -> Event {
        Event {
            kind,
            paths,
            attrs: Default::default(),
        }
    }

    #[test]
    fn burst_drops_ignored_paths_and_relativises() {
        let root = std::env::temp_dir().join("vellum-watcher-burst");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("src")).unwrap();
        fs::write(root.join(".gitignore"), "coverage/\n").unwrap();
        let ignorer = Ignorer::new(&root);

        let burst = build_burst(
            &root,
            vec![
                ev(
                    EventKind::Modify(ModifyKind::Any),
                    vec![root.join("src/a.rs")],
                ),
                ev(
                    EventKind::Modify(ModifyKind::Any),
                    vec![root.join("coverage/report.html")], // .gitignore
                ),
                ev(
                    EventKind::Create(CreateKind::Any),
                    vec![root.join("node_modules/x/index.js")], // ALWAYS
                ),
                ev(EventKind::Any, vec![root.join("b")]), // not a create/modify/delete
            ],
            &ignorer,
        );

        assert_eq!(burst.events.len(), 1, "{:?}", burst.events);
        assert_eq!(burst.events[0].path, "src/a.rs");
        assert_eq!(burst.events[0].kind, ChangeKind::Modified);
    }

    #[test]
    fn consecutive_duplicates_collapse() {
        let root = std::env::temp_dir().join("vellum-watcher-dupes");
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root).unwrap();
        let ignorer = Ignorer::new(&root);
        let p = root.join("a.rs");
        let burst = build_burst(
            &root,
            vec![
                ev(EventKind::Modify(ModifyKind::Any), vec![p.clone()]),
                ev(EventKind::Modify(ModifyKind::Any), vec![p.clone()]),
                ev(EventKind::Modify(ModifyKind::Any), vec![p]),
            ],
            &ignorer,
        );
        assert_eq!(burst.events.len(), 1);
    }
}
