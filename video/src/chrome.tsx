import React from "react";
import { C } from "./theme";

/* The app's actual chrome, rebuilt for the camera.
   Mirrors src/components/{TitleBar,TerminalPane,ViewTabs,StatusBar}.tsx and the
   metrics in src/styles.css — 36px title, 41px tab strips, 24px status bar. */

export const SCALE = 2; // the whole shell is drawn at 2× so 1× CSS values read true

const px = (n: number) => n * SCALE;

/* ── icons: the lucide set the app uses, traced at strokeWidth 1.75 ── */

const svg = (d: React.ReactNode, size = 15) => (
  <svg
    width={px(size)} height={px(size)} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
  >
    {d}
  </svg>
);

export const IconFile = () => svg(<>
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
  <path d="M14 2v5h6M8 13h8M8 17h8M8 9h2" />
</>);

export const IconBranch = () => svg(<>
  <line x1="6" y1="3" x2="6" y2="15" />
  <circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
  <path d="M18 9a9 9 0 0 1-9 9" />
</>);

export const IconCompare = () => svg(<>
  <path d="M16 3h1a2 2 0 0 1 2 2v10M21 13l-2 2-2-2" />
  <path d="M8 21H7a2 2 0 0 1-2-2V9M3 11l2-2 2 2" />
</>);

export const IconSearch = () => svg(<><circle cx="11" cy="11" r="7" /><path d="m20 20-4.3-4.3" /></>);

export const IconActivity = () => svg(<path d="M22 12h-4l-3 9L9 3l-3 9H2" />);

export const IconHistory = () => svg(<>
  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />
</>);

export const IconTerminal = () => svg(<>
  <rect x="3" y="4" width="18" height="16" rx="2" />
  <path d="m7 9 3 3-3 3M13 15h4" />
</>, 14);

export const IconGear = () => svg(<>
  <circle cx="12" cy="12" r="3" />
  <path d="M12 2v3M12 19v3M22 12h-3M5 12H2m15.5-6.5-2 2M8.5 15.5l-2 2m0-11 2 2m7 7 2 2" />
</>, 13);

export const IconChevron = () => svg(<path d="m6 9 6 6 6-6" />, 14);

export const Logo = () => (
  <svg width={px(14)} height={px(14)} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke={C.fg} strokeWidth="1.8" />
    <path d="M13.5 4v16" stroke={C.fg} strokeWidth="1.8" />
    <path d="m5.4 9.6 2.2 2.2-2.2 2.2" stroke={C.fg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── title bar (36px) ─────────────────────────────────────── */

export const TitleBar: React.FC<{ mono: string; sans: string }> = ({ mono, sans }) => (
  <div
    style={{
      position: "relative", height: px(36), flex: `0 0 ${px(36)}px`,
      display: "flex", alignItems: "center", padding: `0 ${px(14)}px`,
      background: "#181818", borderBottom: `${px(1)}px solid ${C.line}`,
      fontSize: px(12), fontFamily: sans, color: C.dim,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: px(8) }}>
      <Logo />
      <span style={{ color: C.fg, fontWeight: 500 }}>Slate</span>
      <span style={{ color: C.dim2 }}>—</span>
      <span style={{ color: C.fg }}>checkout-service</span>
    </div>

    <div
      style={{
        position: "absolute", left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: px(8),
        minWidth: px(300), height: px(24), padding: `0 ${px(10)}px`,
        background: "#1e1e1e", border: `${px(1)}px solid ${C.line}`,
        borderRadius: px(6), color: C.dim, fontSize: px(11.5),
      }}
    >
      <IconSearch />
      <span style={{ flex: 1, textAlign: "center" }}>checkout-service</span>
      <span style={{ fontFamily: mono, fontSize: px(10), color: C.dim2, border: `${px(1)}px solid ${C.line}`, borderRadius: px(4), padding: `${px(1)}px ${px(5)}px` }}>
        ⌘K
      </span>
    </div>
  </div>
);

/* ── terminal tab strip (41px) ────────────────────────────── */

export const TermTabs: React.FC<{ sans: string }> = ({ sans }) => (
  <div
    style={{
      height: px(41), flex: `0 0 ${px(41)}px`, display: "flex", alignItems: "center",
      gap: px(2), padding: `0 ${px(6)}px`, background: "#181818",
      borderBottom: `${px(1)}px solid ${C.line}`, fontFamily: sans,
    }}
  >
    <div
      style={{
        display: "flex", alignItems: "center", gap: px(7),
        height: px(28), padding: `0 ${px(10)}px`, borderRadius: px(6),
        background: "#1e1e1e", color: C.fg, fontSize: px(12),
      }}
    >
      <span style={{ color: C.dim }}><IconTerminal /></span>
      Terminal 1
    </div>
    <span style={{ color: C.dim2, fontSize: px(16), padding: `0 ${px(8)}px` }}>+</span>
  </div>
);

/* ── view tabs (41px, centred icon strip) ─────────────────── */

const TABS = [
  { id: "specs", Icon: IconFile },
  { id: "changes", Icon: IconBranch },
  { id: "diff", Icon: IconCompare },
  { id: "timeline", Icon: IconHistory },
  { id: "search", Icon: IconSearch },
  { id: "activity", Icon: IconActivity },
];

export const ViewTabs: React.FC<{ active: string; pulse: number }> = ({ active, pulse }) => (
  <div
    style={{
      height: px(41), flex: `0 0 ${px(41)}px`, display: "flex",
      alignItems: "center", justifyContent: "center", gap: px(3),
      background: "#181818", borderBottom: `${px(1)}px solid ${C.line}`,
    }}
  >
    {TABS.map(({ id, Icon }) => {
      const on = id === active;
      return (
        <span
          key={id}
          style={{
            display: "grid", placeItems: "center", width: px(30), height: px(28),
            borderRadius: px(6),
            background: on ? "rgba(255,255,255,.07)" : "transparent",
            color: on ? C.fg : C.dim2,
            boxShadow: on ? `inset 0 0 0 ${px(1)}px ${C.line}` : "none",
            transform: on ? `scale(${1 + pulse * 0.06})` : "none",
          }}
        >
          <Icon />
        </span>
      );
    })}
    <span style={{ color: C.dim2, display: "grid", placeItems: "center", width: px(26), height: px(28) }}>
      <IconChevron />
    </span>
  </div>
);

/* ── status bar (24px) ────────────────────────────────────── */

export const StatusBar: React.FC<{
  sans: string; changes: number; source: string; sourceFlash: number;
}> = ({ sans, changes, source, sourceFlash }) => {
  const item: React.CSSProperties = { display: "flex", alignItems: "center", gap: px(5) };
  return (
    <div
      style={{
        height: px(24), flex: `0 0 ${px(24)}px`, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: `0 ${px(12)}px`, background: "#181818",
        borderTop: `${px(1)}px solid ${C.line}`, fontSize: px(11), color: C.dim,
        fontFamily: sans,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: px(12) }}>
        <span style={item}>
          <span style={{ color: C.dim, display: "flex" }}>
            <svg width={px(12)} height={px(12)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
              <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
          </span>
          feat/retry-policy
        </span>
        <span style={item}>● {changes}</span>
        <span style={{ ...item, color: C.ok }}>
          <span style={{ width: px(7), height: px(7), borderRadius: "50%", background: C.ok, boxShadow: `0 0 ${px(6)}px rgba(74,194,107,.7)` }} />
          agent
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: px(12) }}>
        <span style={{ ...item, color: sourceFlash > 0 ? C.fg : C.dim }}>
          <span style={{
            width: px(6), height: px(6), borderRadius: "50%",
            background: sourceFlash > 0 ? C.fg : C.dim2,
            boxShadow: sourceFlash > 0 ? `0 0 ${px(6)}px rgba(255,255,255,.6)` : "none",
          }} />
          {source}
        </span>
        <span>◇ pin</span>
        <span>dark-modern</span>
        <span style={{ display: "flex" }}><IconGear /></span>
        <span>LF</span>
        <span>UTF-8</span>
        <span>checkout-service</span>
      </div>
    </div>
  );
};

export { px };

/* ══ the app itself ═══════════════════════════════════════════
   Driven by `t` (seconds inside the product beat). The pane
   switches are consequences of terminal lines, exactly as the real
   classifier behaves. */

type View = "specs" | "changes" | "diff";

const TERM_LINES: { at: number; head?: string; text: string; ink: string; type?: boolean; dur?: number }[] = [
  { at: 0.0, text: "$ claude", ink: C.fg, type: true, dur: 0.4 },
  { at: 0.55, text: "", ink: C.dim },
  { at: 0.65, text: "› implement the retry policy in docs/retry.md", ink: C.dim, type: true, dur: 1.0 },
  { at: 1.75, text: "", ink: C.dim },
  { at: 1.9, head: "●", text: "Read docs/retry.md", ink: C.dim },
  { at: 3.25, head: "●", text: "Write src/checkout/retry.ts", ink: C.ok },
  { at: 3.42, head: "●", text: "Write src/checkout/backoff.ts", ink: C.ok },
  { at: 3.59, head: "●", text: "Delete src/checkout/legacy.ts", ink: C.dim2 },
  { at: 5.65, head: "●", text: "Edit src/checkout/index.ts", ink: C.ok },
  { at: 5.82, head: "●", text: "Edit tests/checkout.spec.ts", ink: C.ok },
  { at: 7.5, text: "", ink: C.dim },
  { at: 7.65, head: "✓", text: "4 tests passed", ink: C.ok },
];

const SWITCHES: [number, View][] = [[0, "specs"], [2.1, "specs"], [3.85, "changes"], [6.1, "diff"]];

const TREE: [string, string, string, number][] = [
  ["A", "src/checkout/retry.ts", C.ok, 3.95],
  ["A", "src/checkout/backoff.ts", C.ok, 4.06],
  ["M", "src/checkout/index.ts", C.warn, 4.17],
  ["M", "tests/checkout.spec.ts", C.warn, 4.28],
  ["D", "src/checkout/legacy.ts", C.bad, 4.39],
];

const DIFF: [("add" | "del" | "ctx"), string, string, number][] = [
  ["del", "42", "  return await charge(order)", 6.2],
  ["add", "42", "  return await withRetry(() => charge(order), {", 6.32],
  ["add", "43", "    attempts: 3,", 6.44],
  ["add", "44", "    backoff: 'exponential',", 6.56],
  ["add", "45", "    idempotencyKey: order.id,", 6.68],
  ["add", "46", "  })", 6.8],
  ["ctx", "47", "}", 6.92],
];

export const Crumb: React.FC<{ mono: string; children: React.ReactNode; right?: string }> = ({ mono, children, right }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: `${px(8)}px ${px(12)}px`, borderBottom: `${px(1)}px solid ${C.line}`,
    fontFamily: mono, fontSize: px(11), color: C.dim2, background: "#1c1c1c",
  }}>
    <span>{children}</span>{right && <span>{right}</span>}
  </div>
);

const SpecView: React.FC<{ mono: string; sans: string }> = ({ mono, sans }) => (
  <>
    <Crumb mono={mono} right="markdown">docs / retry.md</Crumb>
    <div style={{ padding: `${px(18)}px ${px(20)}px`, fontFamily: sans }}>
      <div style={{ fontSize: px(19), fontWeight: 600, letterSpacing: "-.02em", color: C.fg, marginBottom: px(12) }}>
        Checkout retry policy
      </div>
      <p style={{ margin: 0, fontSize: px(13), lineHeight: 1.75, color: C.dim }}>
        Payment charges must survive transient gateway failures without ever double-charging a customer.
      </p>
      <div style={{ fontSize: px(12), fontWeight: 600, color: C.fg, margin: `${px(18)}px 0 ${px(10)}px` }}>Acceptance</div>
      {[
        "Retry up to 3 times on 5xx and network timeouts",
        "Exponential backoff, full jitter",
        "Idempotency key reused across attempts",
      ].map((li) => (
        <div key={li} style={{ display: "flex", gap: px(10), alignItems: "baseline", marginBottom: px(7) }}>
          <span style={{ width: px(4), height: px(4), borderRadius: "50%", background: C.dim2, flex: `0 0 ${px(4)}px` }} />
          <span style={{ fontSize: px(13), color: C.dim, lineHeight: 1.7 }}>{li}</span>
        </div>
      ))}
      <pre style={{
        margin: `${px(14)}px 0 0`, background: "#161616", border: `${px(1)}px solid ${C.line}`,
        borderRadius: px(6), padding: `${px(12)}px ${px(14)}px`,
        fontFamily: mono, fontSize: px(12), color: C.dim, lineHeight: 1.75,
      }}>{`withRetry(() => charge(order), {
  attempts: 3,
  backoff: "exponential",
})`}</pre>
    </div>
  </>
);

const ChangesView: React.FC<{ t: number; mono: string }> = ({ t, mono }) => {
  const shown = TREE.filter((r) => t >= r[3]);
  return (
    <>
      <Crumb mono={mono} right={`${shown.length} changed`}>working tree</Crumb>
      <div style={{ padding: `${px(8)}px 0`, fontFamily: mono, fontSize: px(12.5) }}>
        {shown.map(([s, path, color, at]) => {
          const o = Math.min(1, (t - at) / 0.2);
          const i = path.lastIndexOf("/");
          return (
            <div key={path} style={{
              display: "flex", alignItems: "center", gap: px(10),
              padding: `${px(5)}px ${px(14)}px`, opacity: o, transform: `translateX(${(1 - o) * px(6)}px)`,
            }}>
              <span style={{ color, width: px(12), fontWeight: 500 }}>{s}</span>
              <span style={{ color: C.fg }}>{path.slice(i + 1)}</span>
              <span style={{ color: C.dim2 }}>{path.slice(0, i)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

const DiffView: React.FC<{ t: number; mono: string }> = ({ t, mono }) => (
  <>
    <Crumb mono={mono} right="+128 −41">src / checkout / retry.ts</Crumb>
    <div style={{ fontFamily: mono, fontSize: px(12.5), lineHeight: 1.9, paddingTop: px(8) }}>
      {DIFF.map(([kind, ln, text, at]) => {
        if (t < at) return null;
        const o = Math.min(1, (t - at) / 0.2);
        const bg = kind === "add" ? C.addBg : kind === "del" ? C.delBg : "transparent";
        const fg = kind === "add" ? "#b9f0c7" : kind === "del" ? "#f9c4c0" : C.dim;
        return (
          <div key={text} style={{ display: "flex", background: bg, opacity: o }}>
            <span style={{ width: px(42), textAlign: "right", paddingRight: px(10), color: C.dim2, opacity: .8 }}>{ln}</span>
            <span style={{ width: px(14), color: fg }}>{kind === "add" ? "+" : kind === "del" ? "-" : " "}</span>
            <span style={{ color: fg, whiteSpace: "pre" }}>{text}</span>
          </div>
        );
      })}
    </div>
  </>
);

/* ── terminal ─────────────────────────────────────────────── */

export type TermLine = { at: number; head?: string; text: string; ink: string; type?: boolean; dur?: number };

export const Term: React.FC<{ t: number; mono: string; sans: string; lines: TermLine[] }> = ({
  t, mono, sans, lines,
}) => (
  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: C.termBg }}>
    <TermTabs sans={sans} />
    <div style={{
      flex: 1, minHeight: 0, padding: `${px(14)}px ${px(16)}px`,
      fontFamily: mono, fontSize: px(12.5), lineHeight: 1.85, color: C.fg, overflow: "hidden",
    }}>
      {lines.map((l, i) => {
        if (t < l.at) return null;
        if (l.type) {
          const p = Math.min(1, (t - l.at) / (l.dur ?? 0.5));
          return <div key={i} style={{ color: l.ink }}>{l.text.slice(0, Math.round(p * l.text.length))}</div>;
        }
        return (
          <div key={i} style={{ color: l.ink, display: "flex", gap: px(8) }}>
            {l.head && <span style={{ color: l.head === "✓" ? C.ok : l.head === "◍" ? C.warn : C.blue }}>{l.head}</span>}
            <span>{l.text}</span>
          </div>
        );
      })}
      <span style={{
        display: "inline-block", width: px(7), height: px(13), verticalAlign: px(-2),
        background: C.fg, opacity: Math.floor(t * 2) % 2 === 0 ? 0.9 : 0,
      }} />
    </div>
  </div>
);

/* ── the window shell ─────────────────────────────────────────
   One frame, many fills. Every product beat renders through this so
   the chrome never shifts a pixel between cuts. */

export const Shell: React.FC<{
  mono: string; sans: string;
  term: React.ReactNode;
  paneB: React.ReactNode;
  activeTab: string;
  pulse?: number;
  changes?: number;
  source?: string;
  sourceFlash?: number;
  /** floats over the whole window — toasts, approval cards, the cursor */
  overlay?: React.ReactNode;
}> = ({ mono, sans, term, paneB, activeTab, pulse = 0, changes = 5, source = "classifier", sourceFlash = 0, overlay }) => (
  <div style={{
    position: "relative",
    width: px(904), height: px(404), display: "flex", flexDirection: "column",
    background: C.panel, border: `${px(1)}px solid ${C.line}`, borderRadius: px(9),
    overflow: "hidden", boxShadow: `0 ${px(30)}px ${px(80)}px -${px(20)}px rgba(0,0,0,.9)`,
  }}>
    <TitleBar mono={mono} sans={sans} />

    <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: `1fr ${px(1)}px 1fr` }}>
      {term}
      <div style={{ background: C.line }} />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, background: C.panel2 }}>
        <ViewTabs active={activeTab} pulse={pulse} />
        <div style={{ position: "relative", flex: 1, minHeight: 0 }}>{paneB}</div>
      </div>
    </div>

    <StatusBar sans={sans} changes={changes} source={source} sourceFlash={sourceFlash} />

    {overlay}
  </div>
);

export const App: React.FC<{ t: number; mono: string; sans: string }> = ({ t, mono, sans }) => {
  let cur = SWITCHES[0], prev = SWITCHES[0];
  for (const s of SWITCHES) if (t >= s[0]) { prev = cur; cur = s; }
  const since = t - cur[0];
  const FADE = 0.3;
  const op = (v: View) =>
    v === cur[1] ? Math.min(1, since / FADE)
      : v === prev[1] && prev[1] !== cur[1] && since < FADE ? 1 - since / FADE : 0;

  return (
    <Shell
      mono={mono}
      sans={sans}
      activeTab={cur[1]}
      pulse={Math.max(0, 1 - since / 0.45)}
      changes={t < 3.95 ? 0 : TREE.filter((r) => t >= r[3]).length}
      sourceFlash={since < 1 ? 1 - since : 0}
      term={<Term t={t} mono={mono} sans={sans} lines={TERM_LINES} />}
      paneB={(["specs", "changes", "diff"] as View[]).map((v) => (
        <div key={v} style={{ position: "absolute", inset: 0, opacity: op(v) }}>
          {v === "specs" && <SpecView mono={mono} sans={sans} />}
          {v === "changes" && <ChangesView t={t} mono={mono} />}
          {v === "diff" && <DiffView t={t} mono={mono} />}
        </div>
      ))}
    />
  );
};
