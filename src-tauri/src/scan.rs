//! One source of truth for "which paths does Vellum ignore", plus the walker
//! every tree-scanning command uses.
//!
//! Before this module the watcher, the spec lister and the text search each
//! carried their own hardcoded directory list, so a project using `.venv`,
//! `__pycache__`, `out/` or anything else in its `.gitignore` got scanned and
//! (worse) generated reactive churn. Everything now goes through `walk()` /
//! `Ignorer`, which honour the repo's real `.gitignore` on top of `ALWAYS`.

use ignore::gitignore::{Gitignore, GitignoreBuilder};
use ignore::WalkBuilder;
use std::path::Path;

/// Directory names never descended into, whatever `.gitignore` says. These are
/// either VCS/OS internals or high-churn caches that no view ever wants —
/// several only matter when the workspace is a home directory.
pub const ALWAYS: &[&str] = &[
    ".git",
    "node_modules",
    "target",
    "dist",
    "build",
    ".next",
    "vendor",
    ".DS_Store",
    "Library",
    "Applications",
    "Caches",
    ".cache",
    ".Trash",
    ".Trashes",
    ".cargo",
    ".rustup",
    ".npm",
    ".vscode",
];

/// Does any path component hit the always-ignored list?
pub fn is_always_ignored(path: &Path) -> bool {
    path.components()
        .any(|c| ALWAYS.contains(&c.as_os_str().to_string_lossy().as_ref()))
}

/// A recursive walker over `root` that skips `ALWAYS`, hidden entries, and
/// anything the repo's git ignore rules exclude.
pub fn walk(root: &Path) -> ignore::Walk {
    WalkBuilder::new(root)
        .hidden(true) // skip dotfiles/dotdirs
        .git_ignore(true)
        .git_global(true)
        .git_exclude(true)
        .parents(true)
        .require_git(false) // honour a .gitignore even outside a repo
        .filter_entry(|e| !ALWAYS.contains(&e.file_name().to_string_lossy().as_ref()))
        .build()
}

/// Path-at-a-time ignore test, for callers that get paths pushed at them
/// instead of walking (the filesystem watcher).
pub struct Ignorer {
    gi: Gitignore,
}

impl Ignorer {
    /// Build from `root`'s `.gitignore` (missing file = no extra rules).
    pub fn new(root: &Path) -> Self {
        let mut b = GitignoreBuilder::new(root);
        let _ = b.add(root.join(".gitignore")); // returns Option<Error>; ignore it
        let gi = b.build().unwrap_or_else(|_| Gitignore::empty());
        Self { gi }
    }

    /// True if `path` (absolute) should never reach the UI.
    pub fn ignored(&self, path: &Path, is_dir: bool) -> bool {
        if is_always_ignored(path) {
            return true;
        }
        self.gi
            .matched_path_or_any_parents(path, is_dir)
            .is_ignore()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    /// Build a throwaway tree under the OS temp dir. Returns its root.
    fn fixture(name: &str) -> std::path::PathBuf {
        let root = std::env::temp_dir().join(format!("vellum-scan-{name}"));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("src")).unwrap();
        fs::create_dir_all(root.join("node_modules/pkg")).unwrap();
        fs::create_dir_all(root.join(".venv/lib")).unwrap();
        fs::create_dir_all(root.join("coverage")).unwrap();
        fs::write(root.join(".gitignore"), ".venv/\ncoverage/\n*.log\n").unwrap();
        fs::write(root.join("src/main.rs"), "fn main() {}").unwrap();
        fs::write(root.join("node_modules/pkg/index.js"), "x").unwrap();
        fs::write(root.join(".venv/lib/thing.py"), "x").unwrap();
        fs::write(root.join("coverage/report.html"), "x").unwrap();
        fs::write(root.join("debug.log"), "x").unwrap();
        fs::write(root.join("README.md"), "# hi").unwrap();
        root
    }

    fn walked(root: &Path) -> Vec<String> {
        walk(root)
            .flatten()
            .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
            .map(|e| {
                e.path()
                    .strip_prefix(root)
                    .unwrap()
                    .to_string_lossy()
                    .to_string()
            })
            .collect()
    }

    #[test]
    fn walk_skips_always_ignored_dirs() {
        let root = fixture("always");
        let files = walked(&root);
        assert!(
            !files.iter().any(|f| f.starts_with("node_modules")),
            "node_modules leaked into the walk: {files:?}"
        );
        assert!(files.contains(&"src/main.rs".to_string()), "{files:?}");
    }

    #[test]
    fn walk_honours_gitignore() {
        let root = fixture("gitignore");
        let files = walked(&root);
        // These are NOT in ALWAYS — only .gitignore excludes them. This is the
        // regression the whole module exists for.
        assert!(!files.iter().any(|f| f.starts_with(".venv")), "{files:?}");
        assert!(!files.iter().any(|f| f.starts_with("coverage")), "{files:?}");
        assert!(!files.contains(&"debug.log".to_string()), "{files:?}");
        assert!(files.contains(&"README.md".to_string()), "{files:?}");
    }

    #[test]
    fn ignorer_matches_the_walker() {
        let root = fixture("ignorer");
        let ig = Ignorer::new(&root);
        assert!(ig.ignored(&root.join("node_modules/pkg/index.js"), false));
        assert!(ig.ignored(&root.join(".venv/lib/thing.py"), false));
        assert!(ig.ignored(&root.join("coverage/report.html"), false));
        assert!(ig.ignored(&root.join("debug.log"), false));
        assert!(ig.ignored(&root.join(".git/HEAD"), false));
        assert!(!ig.ignored(&root.join("src/main.rs"), false));
        assert!(!ig.ignored(&root.join("README.md"), false));
    }
}
