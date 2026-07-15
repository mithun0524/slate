// Typed wrappers over the Tauri command + event surface. Mirrors the serde
// types in src-tauri/src/types.rs.

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

/// Port of the agent override socket (mirrors override_server::PORT in Rust).
export const OVERRIDE_PORT = 8477;

export type ViewIntent =
  | { kind: "spec"; path: string }
  | { kind: "diff"; paths: string[] }
  | { kind: "tree" }
  | { kind: "log" }
  | { kind: "search" };

export interface LineMatch {
  line: number;
  col: number;
  len: number;
  text: string;
}
export interface FileMatches {
  path: string;
  matches: LineMatch[];
}

export interface CommitInfo {
  hash: string;
  short: string;
  summary: string;
  author: string;
  email: string;
  time: number;
}

export type IntentSource = "classifier" | "override";

export interface IntentEvent {
  intent: ViewIntent;
  source: IntentSource;
}

export interface TreeEntry {
  path: string;
  status: string; // new | modified | deleted | renamed | typechange | untracked | conflicted | clean
  staged: boolean;
}

// --- commands ---

export const openWorkspace = (path: string): Promise<boolean> =>
  invoke("open_workspace", { path });

export const ptySpawn = (id: string, cols: number, rows: number): Promise<void> =>
  invoke("pty_spawn", { id, cols, rows });

export const ptyWrite = (id: string, data: string): Promise<void> =>
  invoke("pty_write", { id, data });

export const ptyResize = (id: string, cols: number, rows: number): Promise<void> =>
  invoke("pty_resize", { id, cols, rows });

export const ptyClose = (id: string): Promise<void> => invoke("pty_close", { id });

export const agentRunning = (): Promise<boolean> => invoke("agent_running");

export const gitTree = (): Promise<TreeEntry[]> => invoke("git_tree");

export const gitDiff = (paths: string[]): Promise<string> =>
  invoke("git_diff", { paths });

export const readText = (path: string): Promise<string> =>
  invoke("read_text", { path });

export const readAsset = (path: string): Promise<string> =>
  invoke("read_asset", { path });

export const writeText = (path: string, content: string): Promise<void> =>
  invoke("write_text", { path, content });

export const listSpecs = (): Promise<string[]> => invoke("list_specs");

export const searchDirs = (query: string): Promise<string[]> =>
  invoke("search_dirs", { query });

export const searchText = (
  query: string,
  caseSensitive: boolean,
  wholeWord: boolean,
  regexMode: boolean,
): Promise<FileMatches[]> =>
  invoke("search_text", {
    query,
    caseSensitive,
    wholeWord,
    regexMode,
  });

export const cloneRepo = (url: string, parent: string): Promise<string> =>
  invoke("clone_repo", { url, parent });

export const createProject = (parent: string, name: string): Promise<string> =>
  invoke("create_project", { parent, name });

export interface HeadInfo {
  branch: string;
  ahead: number;
  behind: number;
}

export const gitBranch = (): Promise<string> => invoke("git_branch");

export const gitHeadInfo = (): Promise<HeadInfo> => invoke("git_head_info");

export const gitLog = (limit: number): Promise<CommitInfo[]> =>
  invoke("git_log", { limit });

export const gitCommitDiff = (hash: string): Promise<string> =>
  invoke("git_commit_diff", { hash });

export const gitStage = (paths: string[]): Promise<void> =>
  invoke("git_stage", { paths });

export const gitUnstage = (paths: string[]): Promise<void> =>
  invoke("git_unstage", { paths });

export const gitCommit = (message: string): Promise<string> =>
  invoke("git_commit", { message });

// --- events ---

export interface PtyData {
  id: string;
  data: string;
}
export interface PtyExit {
  id: string;
  code: number;
}
export interface PtyCwd {
  id: string;
  dir: string;
}

export const onPtyData = (cb: (p: PtyData) => void): Promise<UnlistenFn> =>
  listen<PtyData>("pty://data", (e) => cb(e.payload));

export const onPtyExit = (cb: (p: PtyExit) => void): Promise<UnlistenFn> =>
  listen<PtyExit>("pty://exit", (e) => cb(e.payload));

export const onPtyCwd = (cb: (p: PtyCwd) => void): Promise<UnlistenFn> =>
  listen<PtyCwd>("pty://cwd", (e) => cb(e.payload));

export const onIntent = (cb: (ev: IntentEvent) => void): Promise<UnlistenFn> =>
  listen<IntentEvent>("vellum://intent", (e) => cb(e.payload));
