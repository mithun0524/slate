import React from "react";
import { C } from "./theme";
import { Crumb, px } from "./chrome";

/* Pane-B fills and overlays for the beats that chrome.tsx's original
   product scene didn't cover: the checkbox write-back, the agent's
   note/approval channel, the activity scrub, and the breadth montage.

   Geometry note — the window is px(904)×px(404): title 36, tab strip 41,
   status 24, so pane B's content box starts at window y=px(77) and is
   px(303) tall. Pane B's left edge is window x=px(452). Anything the
   cursor has to hit exports its own coordinates so the two can't drift. */

const PANE_X = 452;
const PANE_Y = 77;

/* ── cursor ───────────────────────────────────────────────────
   Teleports between waypoints with an ease, never hunts. A click is a
   short scale-down plus a ring. Coordinates are 1× CSS, same as px(). */

export type Waypoint = { at: number; x: number; y: number };

const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);

export const Cursor: React.FC<{ t: number; path: Waypoint[]; clicks?: number[]; travel?: number }> = ({
  t, path, clicks = [], travel = 0.45,
}) => {
  if (t < path[0].at) return null;

  let from = path[0], to = path[0];
  for (const w of path) if (t >= w.at) { from = to; to = w; }
  const p = to.at === from.at ? 1 : easeInOut(Math.min(1, (t - to.at) / travel));
  const x = from.x + (to.x - from.x) * p;
  const y = from.y + (to.y - from.y) * p;

  const click = clicks.reduce((acc, c) => Math.max(acc, 1 - Math.abs(t - c) / 0.22), 0);
  const press = Math.max(0, click);

  return (
    <div style={{ position: "absolute", left: px(x), top: px(y), pointerEvents: "none", zIndex: 30 }}>
      {press > 0 && (
        <span style={{
          position: "absolute", left: px(-14), top: px(-14), width: px(28), height: px(28),
          borderRadius: "50%", border: `${px(1.5)}px solid rgba(255,255,255,${0.5 * press})`,
          transform: `scale(${0.4 + (1 - press) * 0.9})`,
        }} />
      )}
      <svg
        width={px(19)} height={px(19)} viewBox="0 0 24 24"
        style={{ transform: `translate(${px(-2)}px, ${px(-1)}px) scale(${1 - press * 0.16})`, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.8))" }}
      >
        <path d="M5 2.5 19 12.6l-6.1.5-3.2 6.1z" fill={C.fg} stroke="#0d0d0d" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* ── beat 4: the spec writes back ─────────────────────────────
   Ticking a box in the rendered spec edits docs/retry.md on disk. */

const CHK = { x: 25, row0: 80, rowH: 26, box: 14 };
export const checkTarget = (i: number) => ({ x: PANE_X + CHK.x, y: PANE_Y + CHK.row0 + CHK.rowH * i + CHK.box / 2 });

const CHECKS = [
  "Retry up to 3 times on 5xx and network timeouts",
  "Exponential backoff, full jitter",
  "Idempotency key reused across attempts",
];

export const SpecCheckPane: React.FC<{ t: number; mono: string; sans: string; tickAt: number; tickRow: number }> = ({
  t, mono, sans, tickAt, tickRow,
}) => (
  <>
    <Crumb mono={mono} right="markdown · live">docs / retry.md</Crumb>
    <div style={{ position: "absolute", inset: 0, top: px(30), fontFamily: sans }}>
      <div style={{
        position: "absolute", left: px(18), top: px(16), fontSize: px(17), fontWeight: 600,
        letterSpacing: "-.02em", color: C.fg,
      }}>
        Acceptance
      </div>

      {CHECKS.map((label, i) => {
        /* row 0 and 2 ship pre-ticked; row `tickRow` gets ticked on camera */
        const preset = i !== tickRow && i === 0;
        const on = preset || (i === tickRow && t >= tickAt);
        const fresh = i === tickRow ? Math.max(0, 1 - Math.abs(t - tickAt) / 0.35) : 0;

        return (
          <div
            key={label}
            style={{
              /* CHK.row0 is measured from pane-B's top; this box sits below the crumb */
              position: "absolute", left: px(18), top: px(CHK.row0 - 30 + CHK.rowH * i),
              display: "flex", alignItems: "center", gap: px(11), height: px(CHK.box),
            }}
          >
            <span style={{
              width: px(CHK.box), height: px(CHK.box), borderRadius: px(4), flex: `0 0 ${px(CHK.box)}px`,
              display: "grid", placeItems: "center",
              background: on ? C.ok : "transparent",
              border: `${px(1.5)}px solid ${on ? C.ok : C.dim2}`,
              boxShadow: fresh > 0 ? `0 0 ${px(14)}px rgba(74,194,107,${0.75 * fresh})` : "none",
              transform: `scale(${1 + fresh * 0.18})`,
            }}>
              {on && (
                <svg width={px(9)} height={px(9)} viewBox="0 0 24 24" fill="none" stroke="#10240f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m4 13 6 6L20 5" />
                </svg>
              )}
            </span>
            <span style={{ fontSize: px(13), color: on ? C.dim2 : C.dim, textDecoration: on ? "line-through" : "none" }}>
              {label}
            </span>
          </div>
        );
      })}

      {/* the file on disk, changing underneath */}
      <div style={{
        position: "absolute", left: px(18), right: px(18), bottom: px(14),
        background: "#161616", border: `${px(1)}px solid ${C.line}`, borderRadius: px(6),
        padding: `${px(9)}px ${px(12)}px`, fontFamily: mono, fontSize: px(11.5), lineHeight: 1.8,
      }}>
        <div style={{ color: C.dim2, fontSize: px(10), marginBottom: px(5) }}>docs/retry.md · on disk</div>
        {CHECKS.map((label, i) => {
          const on = (i !== tickRow && i === 0) || (i === tickRow && t >= tickAt);
          const flash = i === tickRow ? Math.max(0, 1 - Math.abs(t - tickAt) / 0.5) : 0;
          return (
            <div key={label} style={{
              color: flash > 0 ? C.ok : C.dim,
              background: flash > 0 ? `rgba(70,149,74,${0.22 * flash})` : "transparent",
              whiteSpace: "pre",
            }}>
              {`- [${on ? "x" : " "}] ${label.slice(0, 34)}`}
            </div>
          );
        })}
      </div>
    </div>
  </>
);

/* ── beat 5: the agent talks back ─────────────────────────────
   A note toast, then an approval the terminal actually blocks on. */

export const Toast: React.FC<{ t: number; at: number; life?: number; text: string; sans: string }> = ({
  t, at, life = 2, text, sans,
}) => {
  const age = t - at;
  if (age < 0 || age > life) return null;
  const inP = Math.min(1, age / 0.3);
  const outP = Math.min(1, Math.max(0, (age - (life - 0.4)) / 0.4));
  const o = inP * (1 - outP);

  return (
    /* bottom-right of pane B, where the app puts them — and clear of the
       approval card, which lands in the same corner a beat later */
    <div style={{
      position: "absolute", right: px(16), bottom: px(34), zIndex: 20,
      opacity: o, transform: `translateY(${(1 - inP) * px(10)}px)`,
      display: "flex", alignItems: "center", gap: px(10),
      maxWidth: px(300), padding: `${px(10)}px ${px(14)}px`,
      background: "rgba(28,28,28,.96)", border: `${px(1)}px solid ${C.line2}`,
      borderLeft: `${px(2)}px solid ${C.warn}`, borderRadius: px(7),
      boxShadow: `0 ${px(12)}px ${px(28)}px -${px(8)}px rgba(0,0,0,.85)`,
      fontFamily: sans, fontSize: px(12.5), color: C.fg, letterSpacing: "-.01em",
    }}>
      <span style={{ color: C.warn, fontSize: px(12) }}>◍</span>
      <span>{text}</span>
    </div>
  );
};

/* the Approve button's centre, in window coords, for the cursor to hit */
export const APPROVE_BTN = { x: 834, y: 344 };

export const ApprovalCard: React.FC<{ t: number; at: number; until: number; mono: string; sans: string }> = ({
  t, at, until, mono, sans,
}) => {
  if (t < at) return null;
  const inP = Math.min(1, (t - at) / 0.3);
  const answered = t >= until;
  const settle = answered ? Math.min(1, (t - until) / 0.35) : 0;

  return (
    <div style={{
      position: "absolute", left: px(PANE_X + 14), right: px(16), bottom: px(34), zIndex: 22,
      opacity: inP * (1 - settle * 0.15),
      transform: `translateY(${(1 - inP) * px(14)}px)`,
      background: "rgba(24,24,24,.98)", border: `${px(1)}px solid ${answered ? C.ok : C.line2}`,
      borderRadius: px(8), padding: `${px(12)}px ${px(14)}px`,
      boxShadow: `0 ${px(16)}px ${px(36)}px -${px(10)}px rgba(0,0,0,.9)`,
      fontFamily: sans,
    }}>
      <div style={{ fontSize: px(11), color: C.dim2, marginBottom: px(7), letterSpacing: ".02em" }}>
        AGENT NEEDS APPROVAL
      </div>
      <div style={{ fontFamily: mono, fontSize: px(12.5), color: C.fg, marginBottom: px(12) }}>
        npm run deploy:staging
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: px(8) }}>
        <span style={{
          padding: `${px(6)}px ${px(14)}px`, borderRadius: px(6), fontSize: px(12),
          border: `${px(1)}px solid ${C.line2}`, color: C.dim,
        }}>
          Deny
        </span>
        <span style={{
          padding: `${px(6)}px ${px(14)}px`, borderRadius: px(6), fontSize: px(12), fontWeight: 500,
          border: `${px(1)}px solid ${answered ? C.ok : C.line2}`,
          background: answered ? "rgba(74,194,107,.22)" : "rgba(255,255,255,.06)",
          color: answered ? C.ok : C.fg,
        }}>
          {answered ? "Approved" : "Approve"}
        </span>
      </div>
    </div>
  );
};

const AUTH_DIFF: [("add" | "del" | "ctx"), string, string][] = [
  ["ctx", "18", "export function renewSession(s: Session) {"],
  ["del", "19", "  if (s.expiresAt < Date.now()) return null"],
  ["add", "19", "  if (s.expiresAt <= Date.now()) return null"],
  ["add", "20", "  audit('session.renew', { sub: s.sub })"],
  ["ctx", "21", "  return rotate(s)"],
  ["ctx", "22", "}"],
];

export const AuthDiffPane: React.FC<{ t: number; at: number; mono: string }> = ({ t, at, mono }) => (
  <>
    <Crumb mono={mono} right="+2 −1">src / auth / session.ts</Crumb>
    <div style={{ fontFamily: mono, fontSize: px(12.5), lineHeight: 1.95, paddingTop: px(10) }}>
      {AUTH_DIFF.map(([kind, ln, text], i) => {
        const o = Math.min(1, Math.max(0, (t - at - i * 0.06) / 0.2));
        const bg = kind === "add" ? C.addBg : kind === "del" ? C.delBg : "transparent";
        const fg = kind === "add" ? "#b9f0c7" : kind === "del" ? "#f9c4c0" : C.dim;
        return (
          <div key={text} style={{ display: "flex", background: bg, opacity: o }}>
            <span style={{ width: px(42), textAlign: "right", paddingRight: px(10), color: C.dim2, opacity: 0.8 }}>{ln}</span>
            <span style={{ width: px(14), color: fg }}>{kind === "add" ? "+" : kind === "del" ? "-" : " "}</span>
            <span style={{ color: fg, whiteSpace: "pre" }}>{text}</span>
          </div>
        );
      })}
    </div>
  </>
);

/* ── beat 6: the activity log keeps the movie ─────────────────
   Each entry carries the working-tree diff as it stood, so selecting an
   older row rewinds the snapshot underneath. */

type Event = { time: string; label: string; files: string; view: string; snap: [string, string][] };

const EVENTS: Event[] = [
  { time: "14:22:07", label: "tests passed", files: "tests/checkout.spec.ts", view: "diff", snap: [["ctx", "expect(charge).toHaveBeenCalledTimes(3)"], ["add", "+ await flushRetries()"]] },
  { time: "14:21:54", label: "code edited", files: "src/checkout/index.ts", view: "diff", snap: [["del", "- return await charge(order)"], ["add", "+ return await withRetry(() => charge(order), {"], ["add", "+   attempts: 3,"]] },
  { time: "14:21:31", label: "files added", files: "retry.ts, backoff.ts", view: "changes", snap: [["add", "+ export async function withRetry<T>("], ["add", "+   fn: () => Promise<T>, opts: RetryOpts"], ["add", "+ ): Promise<T> {"]] },
  { time: "14:21:02", label: "spec read", files: "docs/retry.md", view: "specs", snap: [["ctx", "## Checkout retry policy"], ["ctx", "- [ ] Exponential backoff, full jitter"]] },
  { time: "14:20:48", label: "session started", files: "—", view: "specs", snap: [["ctx", "clean working tree"]] },
];

export const ActivityPane: React.FC<{ t: number; mono: string; sans: string; steps: number[] }> = ({
  t, mono, sans, steps,
}) => {
  /* steps[i] = the second at which selection lands on row i (scrubbing back) */
  let sel = 0;
  for (let i = 0; i < steps.length; i++) if (t >= steps[i]) sel = i;
  const ev = EVENTS[Math.min(sel, EVENTS.length - 1)];
  const held = t - (steps[sel] ?? 0);

  return (
    <>
      <Crumb mono={mono} right={`${EVENTS.length} events`}>activity · working tree snapshots</Crumb>
      <div style={{ position: "absolute", inset: 0, top: px(30), display: "flex", flexDirection: "column" }}>
        <div style={{ flex: `0 0 ${px(150)}px`, padding: `${px(4)}px 0`, overflow: "hidden" }}>
          {EVENTS.map((e, i) => {
            const on = i === sel;
            return (
              <div key={e.time} style={{
                display: "flex", alignItems: "center", gap: px(10), height: px(28), padding: `0 ${px(14)}px`,
                background: on ? "rgba(255,255,255,.07)" : "transparent",
                boxShadow: on ? `inset ${px(2)}px 0 0 ${C.ok}` : "none",
                fontFamily: mono, fontSize: px(11.5),
              }}>
                <span style={{ color: C.dim2 }}>{e.time}</span>
                <span style={{ color: on ? C.fg : C.dim, fontFamily: sans, fontSize: px(12) }}>{e.label}</span>
                <span style={{ color: C.dim2, marginLeft: "auto" }}>{e.files}</span>
              </div>
            );
          })}
        </div>

        <div style={{
          flex: 1, minHeight: 0, margin: `0 ${px(14)}px ${px(12)}px`,
          background: "#161616", border: `${px(1)}px solid ${C.line}`, borderRadius: px(6),
          padding: `${px(9)}px ${px(12)}px`, fontFamily: mono, fontSize: px(11.5), lineHeight: 1.8,
          opacity: Math.min(1, held / 0.2 + 0.35),
        }}>
          <div style={{ color: C.dim2, fontSize: px(10), marginBottom: px(4) }}>snapshot @ {ev.time}</div>
          {ev.snap.map(([kind, text]) => (
            <div key={text} style={{
              whiteSpace: "pre", color: kind === "add" ? "#b9f0c7" : kind === "del" ? "#f9c4c0" : C.dim,
              background: kind === "add" ? C.addBg : kind === "del" ? C.delBg : "transparent",
            }}>
              {text}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/* ── beat 7: breadth montage ──────────────────────────────────
   One second each. Enough to prove the surface exists, not a tour. */

export const SourceControlPane: React.FC<{ mono: string; sans: string }> = ({ mono, sans }) => (
  <>
    <Crumb mono={mono} right="feat/retry-policy">source control</Crumb>
    <div style={{ padding: `${px(10)}px 0`, fontFamily: sans }}>
      <div style={{ fontSize: px(11), color: C.dim2, padding: `0 ${px(14)}px ${px(6)}px`, letterSpacing: ".03em" }}>STAGED · 3</div>
      {[["A", "retry.ts", C.ok], ["A", "backoff.ts", C.ok], ["M", "index.ts", C.warn]].map(([s, f, col]) => (
        <div key={f} style={{ display: "flex", gap: px(10), padding: `${px(4)}px ${px(14)}px`, fontFamily: mono, fontSize: px(12) }}>
          <span style={{ color: col as string, width: px(12) }}>{s}</span><span style={{ color: C.fg }}>{f}</span>
        </div>
      ))}
      <div style={{
        margin: `${px(12)}px ${px(14)}px 0`, height: px(52), borderRadius: px(6),
        border: `${px(1)}px solid ${C.line2}`, background: "#161616",
        padding: `${px(9)}px ${px(11)}px`, fontSize: px(12), color: C.dim,
      }}>
        feat: retry charges with full-jitter backoff
      </div>
      <div style={{
        margin: `${px(10)}px ${px(14)}px 0`, display: "inline-block", padding: `${px(6)}px ${px(16)}px`,
        borderRadius: px(6), background: "rgba(74,194,107,.18)", border: `${px(1)}px solid rgba(74,194,107,.4)`,
        color: C.ok, fontSize: px(12), fontWeight: 500,
      }}>
        Commit
      </div>
    </div>
  </>
);

export const TimelinePane: React.FC<{ mono: string; sans: string }> = ({ mono, sans }) => (
  <>
    <Crumb mono={mono} right="24 commits">timeline</Crumb>
    <div style={{ padding: `${px(10)}px ${px(14)}px`, fontFamily: sans }}>
      {[
        ["a3f0c11", "feat: retry charges with backoff", "2m"],
        ["8b21d04", "test: cover gateway 5xx paths", "1h"],
        ["11c9ae7", "refactor: extract charge()", "3h"],
        ["4de5b90", "chore: bump stripe sdk", "yesterday"],
        ["77a0f3c", "fix: double-charge on timeout", "2d"],
      ].map(([sha, msg, ago], i) => (
        <div key={sha} style={{ display: "flex", alignItems: "center", gap: px(11), height: px(30) }}>
          <span style={{ display: "grid", placeItems: "center", width: px(9) }}>
            <span style={{ width: px(7), height: px(7), borderRadius: "50%", background: i === 0 ? C.ok : C.dim2, boxShadow: i === 0 ? `0 0 ${px(7)}px rgba(74,194,107,.7)` : "none" }} />
          </span>
          <span style={{ fontFamily: mono, fontSize: px(11), color: C.blue }}>{sha}</span>
          <span style={{ fontSize: px(12), color: i === 0 ? C.fg : C.dim }}>{msg}</span>
          <span style={{ marginLeft: "auto", fontSize: px(11), color: C.dim2 }}>{ago}</span>
        </div>
      ))}
    </div>
  </>
);

export const SearchPane: React.FC<{ mono: string }> = ({ mono }) => (
  <>
    <Crumb mono={mono} right="9 in 4 files">search · withRetry</Crumb>
    <div style={{ display: "flex", height: `calc(100% - ${px(30)}px)`, fontFamily: mono, fontSize: px(11.5) }}>
      <div style={{ flex: `0 0 45%`, borderRight: `${px(1)}px solid ${C.line}`, padding: `${px(8)}px 0` }}>
        {["checkout/index.ts", "checkout/retry.ts", "checkout/backoff.ts", "checkout.spec.ts"].map((f, i) => (
          <div key={f} style={{
            padding: `${px(5)}px ${px(12)}px`, color: i === 1 ? C.fg : C.dim,
            background: i === 1 ? "rgba(255,255,255,.06)" : "transparent",
          }}>
            {f}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: `${px(10)}px ${px(12)}px`, lineHeight: 1.9, color: C.dim, whiteSpace: "pre" }}>
        {"export async function "}
        <span style={{ background: "rgba(108,176,255,.28)", color: C.fg }}>withRetry</span>
        {"<T>(\n  fn: () => Promise<T>,\n  opts: RetryOpts,\n): Promise<T> {\n  let attempt = 0\n"}
      </div>
    </div>
  </>
);
