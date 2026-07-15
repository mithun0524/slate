//! Thin, read-only wrappers over `git2` for the tree and diff views.

use crate::types::TreeEntry;
use git2::{Delta, DiffFormat, DiffOptions, Repository, Status, StatusOptions};
use std::path::Path;

/// Is `path` inside a git repository?
pub fn is_repo(path: &Path) -> bool {
    Repository::discover(path).is_ok()
}

/// Flat git-status listing (untracked included). The frontend assembles the
/// visual tree; we keep the Rust side simple and just report per-path status.
pub fn tree(path: &Path) -> Result<Vec<TreeEntry>, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;

    let mut opts = StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_ignored(false)
        .include_unmodified(false);

    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?;

    let mut out = Vec::with_capacity(statuses.len());
    for entry in statuses.iter() {
        let s = entry.status();
        let path = match entry.path() {
            Some(p) => p.to_string(),
            None => continue,
        };
        let staged = s.intersects(
            Status::INDEX_NEW
                | Status::INDEX_MODIFIED
                | Status::INDEX_DELETED
                | Status::INDEX_RENAMED
                | Status::INDEX_TYPECHANGE,
        );
        out.push(TreeEntry {
            path,
            status: status_label(s),
            staged,
        });
    }
    out.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(out)
}

/// Unified diff (patch text) of the working tree vs HEAD. If `paths` is
/// non-empty, restrict to those paths.
pub fn diff(path: &Path, paths: &[String]) -> Result<String, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;

    let mut opts = DiffOptions::new();
    opts.include_untracked(true).recurse_untracked_dirs(true);
    for p in paths {
        opts.pathspec(p);
    }

    // Diff HEAD tree -> working dir (with index) so both staged and unstaged
    // edits show. If there's no HEAD yet (fresh repo), diff against an empty tree.
    let diff = match repo.head().ok().and_then(|h| h.peel_to_tree().ok()) {
        Some(tree) => repo
            .diff_tree_to_workdir_with_index(Some(&tree), Some(&mut opts))
            .map_err(|e| e.to_string())?,
        None => repo
            .diff_tree_to_workdir_with_index(None, Some(&mut opts))
            .map_err(|e| e.to_string())?,
    };

    let mut buf = String::new();
    diff.print(DiffFormat::Patch, |_delta, _hunk, line| {
        match line.origin() {
            '+' | '-' | ' ' => buf.push(line.origin()),
            _ => {}
        }
        buf.push_str(std::str::from_utf8(line.content()).unwrap_or(""));
        true
    })
    .map_err(|e| e.to_string())?;

    Ok(buf)
}

fn status_label(s: Status) -> String {
    // Prefer the most meaningful single label; index (staged) and worktree
    // bits can both be set — report the underlying change type.
    let label = if s.intersects(Status::INDEX_NEW | Status::WT_NEW) {
        if s.contains(Status::WT_NEW) && !s.intersects(Status::INDEX_NEW) {
            "untracked"
        } else {
            "new"
        }
    } else if s.intersects(Status::INDEX_MODIFIED | Status::WT_MODIFIED) {
        "modified"
    } else if s.intersects(Status::INDEX_DELETED | Status::WT_DELETED) {
        "deleted"
    } else if s.intersects(Status::INDEX_RENAMED | Status::WT_RENAMED) {
        "renamed"
    } else if s.intersects(Status::INDEX_TYPECHANGE | Status::WT_TYPECHANGE) {
        "typechange"
    } else if s.contains(Status::CONFLICTED) {
        "conflicted"
    } else {
        "clean"
    };
    label.to_string()
}

// Silence unused-import warning for Delta on some git2 versions; kept for clarity.
#[allow(dead_code)]
fn _delta_marker(_d: Delta) {}
