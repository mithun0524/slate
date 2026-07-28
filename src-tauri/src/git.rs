//! Thin, read-only wrappers over `git2` for the tree and diff views.

use crate::types::{BranchInfo, CommitInfo, HeadInfo, StashEntry, TreeEntry};
use git2::{
    build::CheckoutBuilder, BranchType, Delta, Diff, DiffFormat, DiffOptions, Oid, Repository,
    Sort, Status, StatusOptions,
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

/// Stage the given (repo-relative) paths. Handles deletions.
pub fn stage(path: &Path, paths: &[String]) -> Result<(), String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    let workdir = repo.workdir().ok_or("bare repo")?.to_path_buf();
    let mut index = repo.index().map_err(|e| e.to_string())?;
    for p in paths {
        let rel = std::path::Path::new(p);
        if workdir.join(p).exists() {
            index.add_path(rel).map_err(|e| e.to_string())?;
        } else {
            index.remove_path(rel).map_err(|e| e.to_string())?;
        }
    }
    index.write().map_err(|e| e.to_string())
}

/// Unstage the given (repo-relative) paths (reset index entry to HEAD).
pub fn unstage(path: &Path, paths: &[String]) -> Result<(), String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    // Keep the HEAD reference bound so the peeled object doesn't outlive a temp.
    if let Ok(head_ref) = repo.head() {
        if let Ok(obj) = head_ref.peel(git2::ObjectType::Commit) {
            return repo
                .reset_default(Some(&obj), paths.iter())
                .map_err(|e| e.to_string());
        }
    }
    // No commits yet: unstage == remove from index.
    let mut index = repo.index().map_err(|e| e.to_string())?;
    for p in paths {
        let _ = index.remove_path(std::path::Path::new(p));
    }
    index.write().map_err(|e| e.to_string())
}

/// Discard working-tree changes for the given (repo-relative) paths: untracked
/// files are deleted, tracked changes are reverted to HEAD (and unstaged).
pub fn discard(path: &Path, paths: &[String]) -> Result<(), String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    let workdir = repo.workdir().ok_or("bare repo")?.to_path_buf();

    let mut sopts = StatusOptions::new();
    sopts.include_untracked(true).recurse_untracked_dirs(true);
    let statuses = repo.statuses(Some(&mut sopts)).map_err(|e| e.to_string())?;
    let mut status_of: std::collections::HashMap<String, Status> = std::collections::HashMap::new();
    for e in statuses.iter() {
        if let Some(p) = e.path() {
            status_of.insert(p.to_string(), e.status());
        }
    }

    let mut co_paths: Vec<String> = Vec::new();
    for p in paths {
        let st = status_of.get(p).copied().unwrap_or(Status::empty());
        if st.contains(Status::WT_NEW) && !st.intersects(Status::INDEX_NEW) {
            // purely untracked -> delete
            let _ = std::fs::remove_file(workdir.join(p));
        } else {
            co_paths.push(p.clone());
        }
    }

    if !co_paths.is_empty() {
        // Unstage to HEAD first, then restore the working files.
        if let Ok(head_ref) = repo.head() {
            if let Ok(obj) = head_ref.peel(git2::ObjectType::Commit) {
                let _ = repo.reset_default(Some(&obj), co_paths.iter());
            }
        }
        let mut cb = CheckoutBuilder::new();
        cb.force();
        for p in &co_paths {
            cb.path(p);
        }
        repo.checkout_head(Some(&mut cb)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Commit the staged index with `message`. Returns the new short hash.
pub fn commit(path: &Path, message: &str) -> Result<String, String> {
    if message.trim().is_empty() {
        return Err("commit message is empty".into());
    }
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    let sig = repo
        .signature()
        .map_err(|_| "set git user.name and user.email first".to_string())?;

    let mut index = repo.index().map_err(|e| e.to_string())?;
    let tree_oid = index.write_tree().map_err(|e| e.to_string())?;
    let tree = repo.find_tree(tree_oid).map_err(|e| e.to_string())?;

    let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
    let parents: Vec<&git2::Commit> = parent.iter().collect();

    let oid = repo
        .commit(Some("HEAD"), &sig, &sig, message, &tree, &parents)
        .map_err(|e| e.to_string())?;
    Ok(oid.to_string().chars().take(7).collect())
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

// ============ write / network ops ============
//
// These shell out to the user's own `git` rather than using git2, for the same
// reason `clone_repo` does: credentials (ssh-agent, keychain, credential
// helpers), hooks, and per-repo config all live in the user's git, and
// reimplementing that against libgit2 is a large surface for no gain.

/// Run `git <args>` in `root`. Returns combined stdout+stderr on success (git
/// writes progress to stderr), the stderr text as `Err` on a non-zero exit.
pub fn run_git(root: &Path, args: &[&str]) -> Result<String, String> {
    let out = std::process::Command::new("git")
        .args(args)
        .current_dir(root)
        .output()
        .map_err(|e| e.to_string())?;
    let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
    if !out.status.success() {
        let msg = if stderr.is_empty() { stdout } else { stderr };
        return Err(if msg.is_empty() {
            format!("git {} failed", args.join(" "))
        } else {
            msg
        });
    }
    Ok(if stdout.is_empty() { stderr } else { stdout })
}

/// Every local branch plus its upstream tracking name, current flagged.
pub fn branches(path: &Path) -> Result<Vec<BranchInfo>, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    let current = branch(path).unwrap_or_default();

    let mut out = Vec::new();
    for b in repo
        .branches(Some(BranchType::Local))
        .map_err(|e| e.to_string())?
        .flatten()
    {
        let (b, _) = b;
        let name = match b.name() {
            Ok(Some(n)) => n.to_string(),
            _ => continue,
        };
        let upstream = b
            .upstream()
            .ok()
            .and_then(|u| u.name().ok().flatten().map(|s| s.to_string()));
        out.push(BranchInfo {
            current: name == current,
            name,
            upstream,
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

/// Switch to an existing branch, or create it from HEAD when `create`.
pub fn checkout(path: &Path, name: &str, create: bool) -> Result<String, String> {
    let name = name.trim();
    if name.is_empty() {
        return Err("empty branch name".into());
    }
    // `git switch` refuses ambiguous/invalid names for us; `--` is not accepted
    // here, so guard against a name that would read as a flag.
    if name.starts_with('-') {
        return Err("invalid branch name".into());
    }
    let root = repo_root(path)?;
    if create {
        run_git(&root, &["switch", "--create", name])
    } else {
        run_git(&root, &["switch", name])
    }
}

pub fn fetch(path: &Path) -> Result<String, String> {
    let root = repo_root(path)?;
    let out = run_git(&root, &["fetch", "--all", "--prune"])?;
    Ok(if out.is_empty() { "fetched".into() } else { out })
}

pub fn pull(path: &Path) -> Result<String, String> {
    let root = repo_root(path)?;
    run_git(&root, &["pull", "--ff-only"])
}

/// Push HEAD. A branch with no upstream gets one (`-u origin <branch>`), which
/// is what every "publish branch" button does.
pub fn push(path: &Path) -> Result<String, String> {
    let root = repo_root(path)?;
    let head = branch(path)?;
    if head.is_empty() || head.starts_with("detached@") {
        return Err("not on a branch".into());
    }
    let has_upstream = branches(path)?
        .into_iter()
        .any(|b| b.current && b.upstream.is_some());
    let out = if has_upstream {
        run_git(&root, &["push"])?
    } else {
        run_git(&root, &["push", "--set-upstream", "origin", &head])?
    };
    Ok(if out.is_empty() { "pushed".into() } else { out })
}

pub fn stash_push(path: &Path, message: &str) -> Result<String, String> {
    let root = repo_root(path)?;
    let msg = message.trim();
    let out = if msg.is_empty() {
        run_git(&root, &["stash", "push", "--include-untracked"])?
    } else {
        run_git(&root, &["stash", "push", "--include-untracked", "-m", msg])?
    };
    Ok(out)
}

pub fn stash_pop(path: &Path, index: usize) -> Result<String, String> {
    let root = repo_root(path)?;
    run_git(&root, &["stash", "pop", &format!("stash@{{{index}}}")])
}

pub fn stash_list(path: &Path) -> Result<Vec<StashEntry>, String> {
    let root = repo_root(path)?;
    let out = run_git(&root, &["stash", "list", "--format=%gd%x00%gs"])?;
    Ok(out
        .lines()
        .filter(|l| !l.is_empty())
        .enumerate()
        .map(|(i, line)| {
            let (_, msg) = line.split_once('\0').unwrap_or((line, line));
            StashEntry {
                index: i,
                message: msg.to_string(),
            }
        })
        .collect())
}

/// Working-directory root of the repo containing `path` (so `git` runs at the
/// top level even when the workspace is a subdirectory).
fn repo_root(path: &Path) -> Result<std::path::PathBuf, String> {
    let repo = Repository::discover(path).map_err(|e| e.to_string())?;
    repo.workdir()
        .map(|p| p.to_path_buf())
        .ok_or_else(|| "bare repository".to_string())
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

#[cfg(test)]
mod tests {
    //! These drive a real `git` against throwaway repos on disk — including a
    //! real local bare remote, so push/pull/fetch are exercised end to end
    //! rather than mocked.
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn tmp(name: &str) -> PathBuf {
        let p = std::env::temp_dir().join(format!("vellum-git-{name}"));
        let _ = fs::remove_dir_all(&p);
        fs::create_dir_all(&p).unwrap();
        p
    }

    /// A repo with one commit on `main`, identity configured locally so the
    /// test never depends on (or touches) the developer's global git config.
    fn repo(name: &str) -> PathBuf {
        let root = tmp(name);
        run_git(&root, &["init", "--initial-branch=main"]).unwrap();
        run_git(&root, &["config", "user.email", "test@vellum.local"]).unwrap();
        run_git(&root, &["config", "user.name", "Vellum Test"]).unwrap();
        run_git(&root, &["config", "commit.gpgsign", "false"]).unwrap();
        fs::write(root.join("a.txt"), "one\n").unwrap();
        run_git(&root, &["add", "."]).unwrap();
        run_git(&root, &["commit", "-m", "init"]).unwrap();
        root
    }

    #[test]
    fn run_git_reports_failure_as_err() {
        let root = repo("failure");
        let err = run_git(&root, &["checkout", "no-such-branch"]).unwrap_err();
        assert!(!err.is_empty(), "error text must reach the UI");
    }

    #[test]
    fn branches_lists_and_flags_current() {
        let root = repo("branches");
        run_git(&root, &["branch", "feature"]).unwrap();

        let bs = branches(&root).unwrap();
        let names: Vec<&str> = bs.iter().map(|b| b.name.as_str()).collect();
        assert_eq!(names, vec!["feature", "main"]);
        assert!(bs.iter().find(|b| b.name == "main").unwrap().current);
        assert!(!bs.iter().find(|b| b.name == "feature").unwrap().current);
        // Nothing pushed yet.
        assert!(bs.iter().all(|b| b.upstream.is_none()));
    }

    #[test]
    fn checkout_switches_and_creates() {
        let root = repo("checkout");
        checkout(&root, "wip", true).unwrap();
        assert_eq!(branch(&root).unwrap(), "wip");

        checkout(&root, "main", false).unwrap();
        assert_eq!(branch(&root).unwrap(), "main");

        assert!(checkout(&root, "", false).is_err());
        assert!(checkout(&root, "-rf", false).is_err(), "flag-like name");
        assert!(checkout(&root, "ghost", false).is_err(), "no such branch");
    }

    #[test]
    fn stash_round_trips_including_untracked() {
        let root = repo("stash");
        fs::write(root.join("a.txt"), "two\n").unwrap();
        fs::write(root.join("new.txt"), "fresh\n").unwrap();

        stash_push(&root, "wip work").unwrap();
        // Working tree is clean again, both tracked edit and untracked file gone.
        assert_eq!(fs::read_to_string(root.join("a.txt")).unwrap(), "one\n");
        assert!(!root.join("new.txt").exists());

        let list = stash_list(&root).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].index, 0);
        assert!(list[0].message.contains("wip work"), "{:?}", list[0]);

        stash_pop(&root, 0).unwrap();
        assert_eq!(fs::read_to_string(root.join("a.txt")).unwrap(), "two\n");
        assert!(root.join("new.txt").exists());
        assert!(stash_list(&root).unwrap().is_empty());
    }

    #[test]
    fn push_sets_upstream_then_pull_and_fetch_work() {
        let root = repo("remote");
        let bare = tmp("remote-origin.git");
        run_git(&bare, &["init", "--bare", "--initial-branch=main"]).unwrap();
        run_git(&root, &["remote", "add", "origin", &bare.to_string_lossy()]).unwrap();

        // First push: no upstream yet -> must publish the branch.
        push(&root).unwrap();
        let up = branches(&root)
            .unwrap()
            .into_iter()
            .find(|b| b.current)
            .unwrap()
            .upstream;
        assert_eq!(up.as_deref(), Some("origin/main"));

        // Second push with an upstream present takes the other code path.
        fs::write(root.join("a.txt"), "two\n").unwrap();
        run_git(&root, &["commit", "-am", "second"]).unwrap();
        push(&root).unwrap();
        assert_eq!(head_info(&root).unwrap().ahead, 0);

        // A clone gets the commits back via pull/fetch.
        let other = tmp("remote-clone");
        let _ = fs::remove_dir_all(&other);
        run_git(
            &std::env::temp_dir(),
            &[
                "clone",
                &bare.to_string_lossy(),
                &other.to_string_lossy(),
            ],
        )
        .unwrap();
        run_git(&other, &["config", "user.email", "test@vellum.local"]).unwrap();
        run_git(&other, &["config", "user.name", "Vellum Test"]).unwrap();
        assert_eq!(fs::read_to_string(other.join("a.txt")).unwrap(), "two\n");

        fs::write(root.join("a.txt"), "three\n").unwrap();
        run_git(&root, &["commit", "-am", "third"]).unwrap();
        push(&root).unwrap();

        fetch(&other).unwrap();
        assert_eq!(head_info(&other).unwrap().behind, 1, "fetch saw the commit");
        pull(&other).unwrap();
        assert_eq!(fs::read_to_string(other.join("a.txt")).unwrap(), "three\n");
        assert_eq!(head_info(&other).unwrap().behind, 0);
    }

    #[test]
    fn push_refuses_on_detached_head() {
        let root = repo("detached");
        let hash = run_git(&root, &["rev-parse", "HEAD"]).unwrap();
        run_git(&root, &["checkout", &hash]).unwrap();
        assert!(push(&root).unwrap_err().contains("not on a branch"));
    }

    #[test]
    fn ops_run_from_a_subdirectory_of_the_repo() {
        // The workspace can be a subdir (the pty cwd drives it), but git ops
        // must still apply to the whole repo.
        let root = repo("subdir");
        let sub = root.join("nested/deep");
        fs::create_dir_all(&sub).unwrap();
        // Tracked, or `stash --include-untracked` would delete the directory
        // out from under us mid-test.
        fs::write(sub.join("keep.txt"), "keep\n").unwrap();
        run_git(&root, &["add", "."]).unwrap();
        run_git(&root, &["commit", "-m", "nested"]).unwrap();

        fs::write(root.join("a.txt"), "edited\n").unwrap();

        stash_push(&sub, "from subdir").unwrap();
        assert_eq!(fs::read_to_string(root.join("a.txt")).unwrap(), "one\n");
        stash_pop(&sub, 0).unwrap();
        assert_eq!(fs::read_to_string(root.join("a.txt")).unwrap(), "edited\n");
    }
}
