//! Pure classification: a debounced `FileBurst` -> a single `ViewIntent`.
//!
//! This is the heart of the reactive engine and is deliberately I/O-free so it
//! can be unit-tested in isolation.

use crate::types::{ChangeKind, FileBurst, ViewIntent};

/// Decide which view Pane B should show for a burst of filesystem changes.
///
/// Rules, in priority order:
/// 1. If any markdown/spec file was touched -> show that spec (last one wins).
/// 2. Else if the burst is dominated by created/deleted files (structure
///    changed) -> show the tree.
/// 3. Else if any file was modified -> show the diff of those files.
/// 4. Otherwise -> fall back to the tree.
pub fn classify(burst: &FileBurst) -> ViewIntent {
    if burst.events.is_empty() {
        return ViewIntent::Tree;
    }

    // 1. Spec wins — but only when markdown is *created* or is the majority of
    //    the burst. A spec merely touched amid code edits should show the diff.
    let md_live: Vec<&crate::types::FileChange> = burst
        .events
        .iter()
        .filter(|c| is_markdown(&c.path) && c.kind != ChangeKind::Deleted)
        .collect();
    if !md_live.is_empty() {
        let non_md = burst.events.iter().filter(|c| !is_markdown(&c.path)).count();
        let md_created = md_live.iter().any(|c| c.kind == ChangeKind::Created);
        if md_created || md_live.len() >= non_md {
            // most recent live markdown
            let path = md_live.last().unwrap().path.clone();
            return ViewIntent::Spec { path };
        }
        // else: fall through — code edits dominate, show the diff.
    }

    // Tally structural vs content changes.
    let mut structural = 0usize; // created + deleted
    let mut modified_paths: Vec<String> = Vec::new();
    for c in &burst.events {
        match c.kind {
            ChangeKind::Created | ChangeKind::Deleted => structural += 1,
            ChangeKind::Modified => modified_paths.push(c.path.clone()),
        }
    }

    // 2. Structure dominates -> tree.
    if structural >= 2 && structural >= modified_paths.len() {
        return ViewIntent::Tree;
    }

    // 3. Content edits -> diff.
    if !modified_paths.is_empty() {
        modified_paths.sort();
        modified_paths.dedup();
        return ViewIntent::Diff {
            paths: modified_paths,
        };
    }

    // 4. Fallback.
    ViewIntent::Tree
}

fn is_markdown(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    lower.ends_with(".md") || lower.ends_with(".markdown")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::FileChange;

    fn burst(events: Vec<(&str, ChangeKind)>) -> FileBurst {
        FileBurst {
            events: events
                .into_iter()
                .map(|(p, k)| FileChange {
                    path: p.to_string(),
                    kind: k,
                })
                .collect(),
        }
    }

    #[test]
    fn empty_burst_is_tree() {
        assert_eq!(classify(&burst(vec![])), ViewIntent::Tree);
    }

    #[test]
    fn markdown_touch_shows_spec() {
        let b = burst(vec![
            ("src/a.rs", ChangeKind::Modified),
            ("docs/spec.md", ChangeKind::Modified),
        ]);
        assert_eq!(
            classify(&b),
            ViewIntent::Spec {
                path: "docs/spec.md".into()
            }
        );
    }

    #[test]
    fn last_markdown_wins() {
        let b = burst(vec![
            ("a.md", ChangeKind::Modified),
            ("b.md", ChangeKind::Modified),
        ]);
        assert_eq!(
            classify(&b),
            ViewIntent::Spec { path: "b.md".into() }
        );
    }

    #[test]
    fn deleted_markdown_does_not_win() {
        let b = burst(vec![
            ("gone.md", ChangeKind::Deleted),
            ("keep.md", ChangeKind::Modified),
        ]);
        assert_eq!(
            classify(&b),
            ViewIntent::Spec {
                path: "keep.md".into()
            }
        );
    }

    #[test]
    fn many_new_files_shows_tree() {
        let b = burst(vec![
            ("a.rs", ChangeKind::Created),
            ("b.rs", ChangeKind::Created),
            ("c.rs", ChangeKind::Created),
        ]);
        assert_eq!(classify(&b), ViewIntent::Tree);
    }

    #[test]
    fn edits_show_diff() {
        let b = burst(vec![
            ("a.rs", ChangeKind::Modified),
            ("b.rs", ChangeKind::Modified),
        ]);
        assert_eq!(
            classify(&b),
            ViewIntent::Diff {
                paths: vec!["a.rs".into(), "b.rs".into()]
            }
        );
    }

    #[test]
    fn markdown_amid_code_edits_shows_diff() {
        // A spec touched while code dominates -> show the diff, not the spec.
        let b = burst(vec![
            ("README.md", ChangeKind::Modified),
            ("src/a.rs", ChangeKind::Modified),
            ("src/b.rs", ChangeKind::Modified),
        ]);
        assert_eq!(
            classify(&b),
            ViewIntent::Diff {
                paths: vec!["README.md".into(), "src/a.rs".into(), "src/b.rs".into()]
            }
        );
    }

    #[test]
    fn new_markdown_always_shows_spec() {
        let b = burst(vec![
            ("src/a.rs", ChangeKind::Modified),
            ("src/b.rs", ChangeKind::Modified),
            ("docs/new.md", ChangeKind::Created),
        ]);
        assert_eq!(
            classify(&b),
            ViewIntent::Spec { path: "docs/new.md".into() }
        );
    }

    #[test]
    fn lone_markdown_edit_shows_spec() {
        let b = burst(vec![("notes.md", ChangeKind::Modified)]);
        assert_eq!(classify(&b), ViewIntent::Spec { path: "notes.md".into() });
    }

    #[test]
    fn single_new_file_with_edits_still_diff() {
        let b = burst(vec![
            ("a.rs", ChangeKind::Created),
            ("b.rs", ChangeKind::Modified),
            ("c.rs", ChangeKind::Modified),
        ]);
        assert_eq!(
            classify(&b),
            ViewIntent::Diff {
                paths: vec!["b.rs".into(), "c.rs".into()]
            }
        );
    }
}
