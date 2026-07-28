"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/* The six surfaces of pane B, rebuilt to match what the app actually renders:
   SpecView (tree + markdown), SourceControl (groups + commit box), DiffView
   (hunk header + gutters), SearchView (query + grouped matches), ActivityFeed
   (reactive log with source dots) and TimelineView (commit rail). */

const Crumb = ({ label, right }: { label: ReactNode; right?: ReactNode }) => (
  <div className="v-crumb">
    <span>{label}</span>
    {right && <span className="v-crumb-r">{right}</span>}
  </div>
);

/* ── 1. specs ─────────────────────────────────────────────── */

const SpecsPanel = () => (
  <div className="v-split">
    <div className="v-tree">
      <div className="vt-row vt-dir"><span className="vt-chev">▾</span>docs</div>
      <div className="vt-row vt-file on" style={{ paddingLeft: 26 }}>
        <span className="vt-md">M↓</span>retry.md
      </div>
      <div className="vt-row vt-file" style={{ paddingLeft: 26 }}><span className="vt-md">M↓</span>checkout.md</div>
      <div className="vt-row vt-dir" style={{ paddingLeft: 26 }}><span className="vt-chev">▸</span>rfcs</div>
      <div className="vt-row vt-file"><span className="vt-md">M↓</span>README.md</div>
    </div>
    <div className="v-pane-r">
      <Crumb label="docs / retry.md" right="markdown" />
      <div className="v-md">
        <h4>Checkout retry policy</h4>
        <p>Payment charges must survive transient gateway failures without ever double-charging a customer.</p>
        <h5>Acceptance</h5>
        <ul>
          <li>Retry up to 3 times on 5xx and network timeouts</li>
          <li>Exponential backoff, full jitter</li>
          <li>Idempotency key reused across attempts</li>
        </ul>
        <pre>{`withRetry(() => charge(order), {
  attempts: 3,
  backoff: "exponential",
})`}</pre>
      </div>
    </div>
  </div>
);

/* ── 2. changes ───────────────────────────────────────────── */

const ScmRow = ({ s, file, dir, action }: { s: string; file: string; dir: string; action: string }) => (
  <div className={`scm-row st-${s}`}>
    <span className="scm-st">{s}</span>
    <span className="scm-file">{file}</span>
    <span className="scm-dir">{dir}</span>
    <span className="scm-act">{action}</span>
  </div>
);

const ChangesPanel = () => (
  <>
    <Crumb
      label="source control"
      right={
        <>
          <span className="v-pill">⎇ feat/retry-policy</span>
          <span className="v-icons">↻ ↓ ↑</span>
        </>
      }
    />
    <div className="scm-group">Staged changes <span className="v-count">2</span></div>
    <ScmRow s="A" file="retry.ts" dir="src/checkout" action="−" />
    <ScmRow s="A" file="backoff.ts" dir="src/checkout" action="−" />
    <div className="scm-group">Changes <span className="v-count">3</span></div>
    <ScmRow s="M" file="index.ts" dir="src/checkout" action="+" />
    <ScmRow s="M" file="checkout.spec.ts" dir="tests" action="+" />
    <ScmRow s="D" file="legacy.ts" dir="src/checkout" action="+" />
    <div className="scm-commit">
      <span className="scm-msg">Message (⌘↵ to commit on &apos;feat/retry-policy&apos;)</span>
      <span className="scm-btn">Commit</span>
    </div>
  </>
);

/* ── 3. diff ──────────────────────────────────────────────── */

const DIFF: [string, string, string, string][] = [
  ["ctx", "40", "40", "async function pay(order: Order) {"],
  ["ctx", "41", "41", "  await audit.start(order.id)"],
  ["del", "42", "", "  return await charge(order)"],
  ["add", "", "42", "  return await withRetry(() => charge(order), {"],
  ["add", "", "43", "    attempts: 3,"],
  ["add", "", "44", "    backoff: \"exponential\","],
  ["add", "", "45", "    idempotencyKey: order.id,"],
  ["add", "", "46", "  })"],
  ["ctx", "43", "47", "}"],
];

const DiffPanel = () => (
  <>
    <Crumb
      label="src / checkout / retry.ts"
      right={<><span className="v-add">+128</span> <span className="v-del">−41</span></>}
    />
    <div className="d-hunk">@@ -40,4 +40,8 @@ async function pay(order: Order)</div>
    <div className="d-body">
      {DIFF.map(([k, o, n, text], i) => (
        <div className={`d-line d-${k}`} key={i}>
          <span className="d-num">{o}</span>
          <span className="d-num">{n}</span>
          <span className="d-sign">{k === "add" ? "+" : k === "del" ? "−" : " "}</span>
          <span className="d-code">{text}</span>
        </div>
      ))}
    </div>
  </>
);

/* ── 4. search ────────────────────────────────────────────── */

const Hit = ({ line, before, match, after }: { line: string; before: string; match: string; after: string }) => (
  <div className="s-hit">
    <span className="s-line">{line}</span>
    <span className="s-code">{before}<mark>{match}</mark>{after}</span>
  </div>
);

const SearchPanel = () => (
  <>
    <div className="s-bar">
      <span className="s-input">charge(</span>
      <span className="s-toggles">Aa .* ⌷</span>
    </div>
    <div className="s-summary">4 results in 3 files</div>
    <div className="s-file">src/checkout/index.ts <span className="v-count">2</span></div>
    <Hit line="42" before="  const res = await " match="charge(" after="order)" />
    <Hit line="88" before="  await " match="charge(" after="retryable)" />
    <div className="s-file">src/checkout/retry.ts <span className="v-count">1</span></div>
    <Hit line="8" before="export async function " match="charge(" after="o: Order) {" />
    <div className="s-file">tests/checkout.spec.ts <span className="v-count">1</span></div>
    <Hit line="19" before="  vi.spyOn(gateway, '" match="charge" after="')" />
  </>
);

/* ── 5. activity ──────────────────────────────────────────── */

const ActRow = ({ src, icon, label, sub, meta }: { src: string; icon: string; label: string; sub?: string; meta: string }) => (
  <div className="a-row">
    <span className={`a-dot a-${src}`} />
    <span className="a-ic">{icon}</span>
    <span className="a-body">
      <span className="a-line"><b>{label}</b>{sub && <span className="a-sub">{sub}</span>}</span>
      <span className="a-meta">{meta}</span>
    </span>
    <span className="a-caret">›</span>
  </div>
);

const ActivityPanel = () => (
  <>
    <Crumb label="activity · reactive log" right={<span className="v-count">12</span>} />
    <ActRow src="classifier" icon="⇄" label="Diff" sub="2 files" meta="classifier · 4s ago · 2 changed · ↺ replay" />
    <ActRow src="classifier" icon="⎇" label="Tree" sub="working tree" meta="classifier · 22s ago · 3 changed · ↺ replay" />
    <ActRow src="override" icon="✎" label="Spec" sub="docs/retry.md" meta="agent · 1m ago" />
    <ActRow src="manual" icon="⌕" label="Search" sub="charge(" meta="you · 3m ago" />
    <ActRow src="classifier" icon="⇄" label="Diff" sub="src/auth/session.ts" meta="classifier · 6m ago · 1 changed · ↺ replay" />
  </>
);

/* ── 6. timeline ──────────────────────────────────────────── */

const TlRow = ({ summary, hash, author, time, last }: { summary: string; hash: string; author: string; time: string; last?: boolean }) => (
  <div className={`t-row ${last ? "last" : ""}`}>
    <span className="t-rail"><span className="t-dot" /></span>
    <span className="t-body">
      <span className="t-sum">{summary}</span>
      <span className="t-meta"><code>{hash}</code>{author}<span className="t-time">{time}</span></span>
    </span>
  </div>
);

const TimelinePanel = () => (
  <>
    <Crumb label="timeline · commits" right={<span className="v-count">3</span>} />
    <TlRow summary="feat: retry policy for checkout charges" hash="a41c9e2" author="you" time="4m ago" />
    <TlRow summary="test: cover exponential backoff" hash="7d2a5f8" author="you" time="1h ago" />
    <TlRow summary="refactor: extract gateway client" hash="e93b1c7" author="mira" time="yesterday" last />
  </>
);

/* ── switcher ─────────────────────────────────────────────── */

const VIEWS = [
  { id: "specs", key: "⇧⌘E", name: "Specs", blurb: "The markdown explorer beside the rendered spec.", panel: <SpecsPanel /> },
  { id: "changes", key: "⌃⇧G", name: "Changes", blurb: "Staged and unstaged groups, with the commit box.", panel: <ChangesPanel /> },
  { id: "diff", key: "⇧⌘D", name: "Diff", blurb: "Exactly the files in the burst, hunk by hunk.", panel: <DiffPanel /> },
  { id: "search", key: "⇧⌘F", name: "Search", blurb: "Ripgrep speed, matches grouped by file.", panel: <SearchPanel /> },
  { id: "activity", key: "⇧⌘A", name: "Activity", blurb: "Every switch, why it happened, and replay.", panel: <ActivityPanel /> },
  { id: "timeline", key: "⇧⌘T", name: "Timeline", blurb: "Commits on a rail; open one for its diff.", panel: <TimelinePanel /> },
];

export default function ViewTabs() {
  const [i, setI] = useState(0);
  const [taken, setTaken] = useState(false);   // you clicked — stop cycling
  const [paused, setPaused] = useState(false); // pointer or focus is inside
  const [progress, setProgress] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0); // ms already served on the current card
  const finished = useRef(false); // did this card run out, or was it interrupted?
  const seen = useRef(false);
  const [live, setLive] = useState(false);

  const v = VIEWS[i];
  const DWELL = 4200;

  /* only cycle while the section is actually on screen */
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setLive(e.isIntersecting);
      if (e.isIntersecting) seen.current = true;
    }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* pane B switches itself until you take over — so does this.
     Pausing banks the time already served, so leaving the section or
     hovering picks up where it stopped instead of restarting the card. */
  useEffect(() => {
    if (taken || paused || !live) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const started = performance.now() - elapsed.current;
    let raf = 0;
    const tick = () => {
      const spent = performance.now() - started;
      const p = Math.min(1, spent / DWELL);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        finished.current = true;
        setProgress(0);
        setI((n) => (n + 1) % VIEWS.length);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      /* a card that ran out starts the next one from zero; one that was
         interrupted banks its time so it resumes where it stopped */
      elapsed.current = finished.current ? 0 : Math.min(DWELL, performance.now() - started);
      finished.current = false;
    };
  }, [i, taken, paused, live]);

  const pick = (n: number) => {
    elapsed.current = 0;
    setI(n);
    setTaken(true);
    setProgress(0);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); pick((i + 1) % VIEWS.length); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); pick((i - 1 + VIEWS.length) % VIEWS.length); }
  };

  return (
    <div
      className="tabs"
      ref={box}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="tablist" role="tablist" aria-orientation="vertical" onKeyDown={onKey}>
        {VIEWS.map((view, n) => (
          <button
            key={view.id}
            role="tab"
            id={`tab-${view.id}`}
            aria-selected={n === i}
            aria-controls={`panel-${view.id}`}
            tabIndex={n === i ? 0 : -1}
            className="tabbtn"
            onClick={() => pick(n)}
          >
            <kbd>{view.key}</kbd>
            <span>
              <h3 className="h3">{view.name}</h3>
              <p>{view.blurb}</p>
            </span>
            {n === i && !taken && (
              <span className="tab-progress" aria-hidden="true">
                <span style={{ transform: `scaleX(${progress})` }} />
              </span>
            )}
          </button>
        ))}

        <p className="tab-hint" aria-hidden="true">
          {taken
            ? "Auto-switching off — you took over, exactly like pane B."
            : "Switching itself. Click any view to take over."}
        </p>
      </div>

      <div className="tabpanel" role="tabpanel" id={`panel-${v.id}`} aria-labelledby={`tab-${v.id}`}>
        <div className="tabpanel-hd" aria-hidden="true">
          {VIEWS.map((view) => (
            <span key={view.id} className={`vtab ${view.id === v.id ? "on" : ""}`} title={view.name}>
              {view.id === "specs" ? "\u25a4" : view.id === "changes" ? "\u2387" : view.id === "diff" ? "\u21c4"
                : view.id === "search" ? "\u2315" : view.id === "activity" ? "\u25e0" : "\u25f7"}
            </span>
          ))}
          <span className="vtab-sp" />
          <span className="vsrc">{taken ? "manual" : "classifier"}</span>
        </div>
        <div className="tabpanel-body" key={v.id}>{v.panel}</div>
      </div>
    </div>
  );
}
