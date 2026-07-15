# Vellum — Design Spec

**Date:** 2026-07-15
**Status:** Approved (v1 scope)

## Context

IDEs center the code buffer. But in an agent-driven workflow, the human no longer
reads or edits code by hand — a coding agent (Claude Code) writes it. The human
steers through **specs** (markdown) and verifies through **git** (tree, diff,
history). Vellum kills the code buffer and replaces the IDE with two panes:

- **Pane A — Terminal:** a real pty running Claude Code.
- **Pane B — Vellum:** a *reactive* visualizer that auto-shows whatever matters
  right now — the spec being edited, the git tree lighting up, the diff of what
  just changed. No clicking. You watch a movie of the work.

The novel bet: Pane B is reactive and driven by filesystem + git events (with an
agent override channel), so it works with any terminal tool out of the box and
requires no manual navigation.

## Goals

- Two resizable panes: terminal (real pty) + reactive visualizer.
- Pane B auto-switches between **md viewer**, **git tree**, **diff** based on
  classified filesystem bursts — smoothly, without flicker.
- Agent can override the auto-view via a local signal channel (hybrid model).
- Ship the reactive core (v1); leave room for timeline, live preview, spec↔code
  trace (v2/v3).

## Non-Goals (v1)

- No code editing buffer. Ever. (This is the whole point.)
- No commit timeline, live preview, scrubber, or spec↔code trace in v1 (roadmap).
- No multi-repo / multi-workspace management.

## Architecture

Tauri desktop app. Rust core owns the OS-facing work; webview owns rendering.

```
Tauri shell (Rust core + webview UI)
├── Pane A: xterm.js  ↕ pty (Rust portable-pty)  → Claude Code
├── Pane B: Vellum views (md viewer · git tree · diff)
├── resizable split (drag divider)
└── Rust core:
      pty        — spawn/stream terminal (portable-pty)
      watcher    — FS events (notify) → debounced bursts
      git        — status / diff / tree (git2)
      classifier — FileBurst → ViewIntent (pure fn)
      override   — local socket; agent signals → ViewIntent
```

- **Frontend:** web UI (React or Svelte), xterm.js, a markdown renderer, a diff
  renderer, a file tree.
- **Backend (Rust):** owns pty, FS watch, git reads, the classifier, the override
  socket. Pushes `ViewIntent` events to the frontend over Tauri IPC.

## The Reactive Engine (core product)

1. FS watcher fires on changes under the workspace.
2. **Debounce ~500ms** — collect the burst of events into one `FileBurst`.
3. **Classify** the burst into a `ViewIntent`:
   - spec / `.md` file touched → `Spec { path }`
   - mostly edits to git-tracked files → `Diff`
   - many new/deleted files → `Tree`
   - ambiguous → last-event-wins fallback
4. Emit **one** `ViewIntent` per burst → Pane B animates to that view.

**Override channel:** a Claude Code hook (or MCP tool) POSTs to a local socket;
that signal produces a `ViewIntent` that beats the classifier. This is the hybrid
model — app-driven by default, agent can force a view.

**Controls:**
- `pin` — lock Pane B to one view; ignore auto-switching.
- manual view tabs — click to override until next burst (or while pinned).
- (v2) `scrubber` — replay burst history.

## Modules (isolated units)

| Module | Does | In | Out |
|---|---|---|---|
| `pty` | spawn/stream terminal | command | bytes ↔ |
| `watcher` | FS events → debounced bursts | fs events | `FileBurst` |
| `git` | status / diff / tree (pure reads) | repo path | git data |
| `classifier` | burst → view decision (pure fn) | `FileBurst` | `ViewIntent` |
| `override` | agent signal channel | socket msg | `ViewIntent` |
| `ui/panelB` | render current view | `ViewIntent` | DOM |
| `ui/split` | resizable layout | drag | layout |

`classifier` is a pure function — unit-testable with no I/O. `git` and `watcher`
are thin wrappers over `git2` / `notify`.

## Data Types (sketch)

```
FileBurst  = { events: [{ path, kind: Created|Modified|Deleted }], at }
ViewIntent = Spec { path } | Diff { paths } | Tree | Preview(v2) | Timeline(v2)
```

## v1 Scope

Pane split + resize · pty running Claude Code · md viewer (live-reload) ·
git tree (git-status colors) · diff (auto on change) · debounced classifier ·
pin control · manual tabs · agent override socket.

## Roadmap

- **v2:** commit timeline, live preview (iframe dev server), burst scrubber.
- **v3:** spec ↔ code trace (map spec sections to files they spawned).

## Error Handling

- pty exit → show status in Pane A, offer restart.
- not a git repo → git views show an empty/instructional state; md viewer still works.
- watcher backpressure → debounce coalesces; drop duplicate paths within a burst.
- override socket down → silently fall back to classifier (never blocks).

## Testing

- `classifier`: pure unit tests over crafted `FileBurst` inputs → expected `ViewIntent`.
- `git`: integration tests against a temp repo fixture.
- `watcher`: debounce timing test (burst coalescing).
- UI: manual smoke in v1; component tests later.

## Tech Stack

- Tauri 2 (Rust core + webview).
- Rust crates: `portable-pty`, `notify`, `git2`, `tokio`, `serde`.
- Frontend: Vite + (React or Svelte), `xterm.js`, a markdown renderer
  (e.g. `markdown-it`), a diff renderer (e.g. `diff2html` or custom).
