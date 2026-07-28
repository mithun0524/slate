// Per-workspace UI session: which terminals were open, which was focused,
// where the split divider sat, and which view Pane B was showing. Restored on
// reopen so switching projects doesn't reset the window every time.
//
// Pure + storage-agnostic so it can be unit tested; everything is validated on
// read because localStorage is user-editable and survives version changes.

import type { ViewIntent } from "./ipc";

export interface SessionTerm {
  id: string;
  title: string;
}

export interface Session {
  terms: SessionTerm[];
  activeTerm: string;
  /// Divider position as a fraction of window width.
  split: number;
  /// The view Pane B was showing.
  intent: ViewIntent;
  /// Was auto-switching pinned off?
  pinned: boolean;
}

export const DEFAULT_SESSION: Session = {
  terms: [{ id: "t1", title: "Terminal 1" }],
  activeTerm: "t1",
  split: 0.5,
  intent: { kind: "tree" },
  pinned: false,
};

const KEY = (ws: string) => `vellum.session:${ws}`;

/// Intent kinds the UI can restore. An unknown kind (older/newer build, hand
/// -edited storage) falls back to the tree rather than rendering nothing.
const KINDS = ["spec", "diff", "tree", "log", "search", "activity"];

function cleanIntent(v: unknown): ViewIntent {
  if (!v || typeof v !== "object") return { kind: "tree" };
  const o = v as Record<string, unknown>;
  if (typeof o.kind !== "string" || !KINDS.includes(o.kind)) return { kind: "tree" };
  if (o.kind === "spec") {
    return typeof o.path === "string" && o.path ? { kind: "spec", path: o.path } : { kind: "tree" };
  }
  if (o.kind === "diff") {
    const paths = Array.isArray(o.paths) ? o.paths.filter((p) => typeof p === "string") : [];
    return { kind: "diff", paths: paths as string[] };
  }
  return { kind: o.kind } as ViewIntent;
}

/// Normalise anything parsed out of storage into a usable Session.
export function cleanSession(v: unknown): Session {
  if (!v || typeof v !== "object") return DEFAULT_SESSION;
  const o = v as Record<string, unknown>;

  const terms = (Array.isArray(o.terms) ? o.terms : [])
    .filter(
      (t): t is SessionTerm =>
        !!t &&
        typeof t === "object" &&
        typeof (t as SessionTerm).id === "string" &&
        !!(t as SessionTerm).id &&
        typeof (t as SessionTerm).title === "string",
    )
    // Duplicate ids would mean two terminals sharing one pty session.
    .filter((t, i, all) => all.findIndex((x) => x.id === t.id) === i)
    .slice(0, 12);
  if (terms.length === 0) return { ...DEFAULT_SESSION, split: clampSplit(o.split) };

  const activeTerm =
    typeof o.activeTerm === "string" && terms.some((t) => t.id === o.activeTerm)
      ? o.activeTerm
      : terms[0].id;

  return {
    terms,
    activeTerm,
    split: clampSplit(o.split),
    intent: cleanIntent(o.intent),
    pinned: o.pinned === true,
  };
}

function clampSplit(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : DEFAULT_SESSION.split;
  return Math.min(0.8, Math.max(0.2, n));
}

/// Highest `tN` id in use — new terminals must not reuse a restored id.
export function maxTermSeq(terms: SessionTerm[]): number {
  return terms.reduce((n, t) => {
    const m = /^t(\d+)$/.exec(t.id);
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
}

export function loadSession(ws: string): Session {
  if (!ws) return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem(KEY(ws));
    return raw ? cleanSession(JSON.parse(raw)) : DEFAULT_SESSION;
  } catch {
    return DEFAULT_SESSION;
  }
}

export function saveSession(ws: string, s: Session): void {
  if (!ws) return;
  try {
    localStorage.setItem(KEY(ws), JSON.stringify(s));
  } catch {
    /* quota / private mode — a lost layout is not worth an error */
  }
}
