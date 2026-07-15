//! Thin, read-only wrappers over `git2` for the tree and diff views.

use crate::types::{CommitInfo, HeadInfo, TreeEntry};
use git2::{
    BranchType, Delta, Diff, DiffFormat, DiffOptions, Oid, Repository, Sort, Status, StatusOptions,
};
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

    print_patch(&diff)
}

/// Render a `git2::Diff` to unified-patch text.
fn print_patch(diff: &Diff) -> Result<String, String> {
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

/// Current branch name (or a short detached-HEAD label). Empty if no HEAD yet.
pub fn branch(path: &Path) -> Result<String, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    let head = match repo.head() {
        Ok(h) => h,
        Err(_) => return Ok(String::new()),
    };
    if head.is_branch() {
        Ok(head.shorthand().unwrap_or("").to_string())
    } else {
        // Detached: show the short commit id.
        let id = head
            .target()
            .map(|o| o.to_string().chars().take(7).collect::<String>())
            .unwrap_or_default();
        Ok(format!("detached@{id}"))
    }
}

/// Branch + ahead/behind vs upstream, for the status bar.
pub fn head_info(path: &Path) -> Result<HeadInfo, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    let head = match repo.head() {
        Ok(h) => h,
        Err(_) => {
            return Ok(HeadInfo {
                branch: String::new(),
                ahead: 0,
                behind: 0,
            })
        }
    };

    if !head.is_branch() {
        let id = head
            .target()
            .map(|o| o.to_string().chars().take(7).collect::<String>())
            .unwrap_or_default();
        return Ok(HeadInfo {
            branch: format!("detached@{id}"),
            ahead: 0,
            behind: 0,
        });
    }

    let branch_name = head.shorthand().unwrap_or("").to_string();
    let local_oid = head.target();

    // Ahead/behind vs the tracking upstream, when one exists.
    let (mut ahead, mut behind) = (0usize, 0usize);
    if let (Some(local_oid), Ok(local_branch)) =
        (local_oid, repo.find_branch(&branch_name, BranchType::Local))
    {
        if let Ok(upstream) = local_branch.upstream() {
            if let Some(up_oid) = upstream.get().target() {
                if let Ok((a, b)) = repo.graph_ahead_behind(local_oid, up_oid) {
                    ahead = a;
                    behind = b;
                }
            }
        }
    }

    Ok(HeadInfo {
        branch: branch_name,
        ahead,
        behind,
    })
}

/// The most recent commits (newest first), for the timeline view.
pub fn log(path: &Path, limit: usize) -> Result<Vec<CommitInfo>, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;

    // No HEAD yet (fresh repo) -> empty timeline, not an error.
    if repo.head().is_err() {
        return Ok(Vec::new());
    }

    let mut walk = repo.revwalk().map_err(|e| e.to_string())?;
    walk.push_head().map_err(|e| e.to_string())?;
    walk.set_sorting(Sort::TIME).map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for oid in walk.flatten() {
        if out.len() >= limit {
            break;
        }
        let commit = match repo.find_commit(oid) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let author = commit.author();
        let hash = oid.to_string();
        out.push(CommitInfo {
            short: hash.chars().take(7).collect(),
            hash,
            summary: commit.summary().unwrap_or("").to_string(),
            author: author.name().unwrap_or("").to_string(),
            email: author.email().unwrap_or("").to_string(),
            time: commit.time().seconds(),
        });
    }
    Ok(out)
}

/// The patch introduced by a single commit (vs its first parent).
pub fn commit_diff(path: &Path, hash: &str) -> Result<String, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    let oid = Oid::from_str(hash).map_err(|e| e.to_string())?;
    let commit = repo.find_commit(oid).map_err(|e| e.to_string())?;
    let tree = commit.tree().map_err(|e| e.to_string())?;
    let parent_tree = commit.parent(0).ok().and_then(|p| p.tree().ok());

    let diff = repo
        .diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)
        .map_err(|e| e.to_string())?;
    print_patch(&diff)
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
