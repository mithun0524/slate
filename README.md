# Vellum

A terminal with a second brain attached.

The left half is a real shell — run Claude Code, or anything else, in it. The
right half watches the filesystem and *reacts*: edit a spec and it renders the
spec, change code and it shows the diff, add files and it shows the tree. You
never navigate to the thing you're working on; it's already there.

Built with Tauri 2 (Rust) + React 19.

## The reactive loop

```
pty / editor / agent  →  fs watcher  →  400ms debounce  →  classifier  →  ViewIntent  →  Pane B
```

`src-tauri/src/classifier.rs` is the heart of it: a pure function from a burst
of file changes to one view intent (spec / diff / tree / log / search). Pure and
I/O-free so it can be unit tested; every rule in it has a test.

An agent can also steer the pane directly over a local socket
(`src-tauri/src/override_server.rs`, port 8477): force a view, narrate a note
(shows as a toast + activity entry), or ask for human approval and block on the
answer.

Every reactive event is logged to the **Activity** view, and the newest 20 carry
a snapshot of the working-tree diff — so you can scrub back through the movie of
what the agent did.

## Panels

| View | What it shows |
|---|---|
| Source control | Staged/unstaged changes, commit, branch switcher, fetch/pull/push, stash |
| Diff | Working-tree or per-file patch, unified or split, word-level highlight. Falls back to the file's contents when there's nothing to diff |
| Spec | Rendered markdown with live checkbox toggles that write back to the file |
| Timeline | Commit log; click a commit for its patch |
| Search | Full-text search with a resizable file preview beside the results |
| Activity | The reactive log — every event, its trigger files, and replay |

Layout (terminals, split position, current view) is remembered per workspace.

## Develop

```sh
npm install
npm run tauri dev
```

## Test

```sh
npm run check      # tsc + vitest + cargo test
npm test           # vitest only
npm run test:rust  # cargo test only
```

The Rust tests drive real `git` against throwaway repos (including a real local
bare remote for push/pull/fetch) rather than mocking it.

## Performance notes

Things that are deliberate, and will bite if they're undone:

- **All heavy Tauri commands are `#[tauri::command(async)]`.** A plain
  `#[tauri::command]` body runs on the main thread — on macOS that's the UI
  thread, so a `git diff` on a large repo freezes the window.
- **Pty output is coalesced** (`pty.rs`): a reader thread drains the pty and a
  second thread batches ~3ms of output into one IPC event. One event per read
  chunk saturates the webview under build output or agent streaming.
- **The terminal uses the WebGL renderer**, with a silent DOM fallback on
  context loss. It's the other half of the coalescing above.
- **One ignore source of truth** (`scan.rs`): the watcher, the search and the
  spec listing all honour the repo's real `.gitignore` on top of a hardcoded
  always-ignore list. Without it a project's `.venv/` or `coverage/` generates
  reactive churn.
- **Long lists use CSS `content-visibility`** instead of a virtualization
  library. The `contain-intrinsic-size` values in `styles.css` must stay in
  sync with the real row heights.
