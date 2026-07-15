//! Shared serde types crossing the Rust <-> webview IPC boundary.

use serde::{Deserialize, Serialize};

/// What kind of change happened to a path within a debounced burst.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ChangeKind {
    Created,
    Modified,
    Deleted,
}

/// A single file change inside a burst.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileChange {
    /// Path relative to the workspace root.
    pub path: String,
    pub kind: ChangeKind,
}

/// A debounced group of filesystem events collected within one window.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileBurst {
    pub events: Vec<FileChange>,
}

/// The classifier's decision: which view Pane B should show.
/// Serialized as a tagged object, e.g. `{ "kind": "spec", "path": "docs/x.md" }`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum ViewIntent {
    /// Show a rendered markdown/spec file.
    Spec { path: String },
    /// Show a diff of the given (relative) paths. Empty = whole-workdir diff.
    Diff { paths: Vec<String> },
    /// Show the git source tree.
    Tree,
    /// Show the commit timeline.
    Log,
    /// Show the full-text search view.
    Search,
}

/// One matching line within a file (for the search view).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineMatch {
    pub line: u32,
    /// Char offset of the match within `text`.
    pub col: u32,
    pub len: u32,
    pub text: String,
}

/// All matches within one file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMatches {
    pub path: String,
    pub matches: Vec<LineMatch>,
}

/// Where a `ViewIntent` came from — for debugging / UI hinting.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum IntentSource {
    /// Produced by the filesystem-burst classifier.
    Classifier,
    /// Forced by an agent via the override socket.
    Override,
}

/// The event payload pushed to the frontend on `vellum://intent`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntentEvent {
    pub intent: ViewIntent,
    pub source: IntentSource,
}

/// HEAD summary for the status bar.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeadInfo {
    pub branch: String,
    pub ahead: usize,
    pub behind: usize,
}

/// A commit for the timeline view.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitInfo {
    pub hash: String,
    pub short: String,
    pub summary: String,
    pub author: String,
    pub email: String,
    /// Author time, unix seconds.
    pub time: i64,
}

/// One entry in the git status listing (flat; the frontend builds the tree).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TreeEntry {
    /// Path relative to the repo root.
    pub path: String,
    /// One of: "new", "modified", "deleted", "renamed", "typechange",
    /// "untracked", "conflicted", "clean".
    pub status: String,
    /// True if staged (in the index).
    pub staged: bool,
}
