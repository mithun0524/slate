import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { C } from "./theme";
import { App, Logo, Shell, Term, px, type TermLine } from "./chrome";
import {
  ActivityPane, ApprovalCard, APPROVE_BTN, AuthDiffPane, Cursor, SearchPane,
  SourceControlPane, SpecCheckPane, TimelinePane, Toast, checkTarget,
} from "./panes";

const { fontFamily: SANS } = loadSans();
const { fontFamily: MONO } = loadMono();

/* ══ the ad ═══════════════════════════════════════════════════
   ~51 seconds, silent, nine beats:
     0.0  hook       — you start the agent, then you go blind
     4.0  problem    — output nobody can read, flying past
     8.0  react      — the pane follows the work, on its own
    16.5  writeback  — tick a box here, the file changes
    22.0  steer      — the agent notes, then asks, and blocks
    30.5  replay     — scrub back through the diffs it kept
    38.0  breadth    — the rest of the surface, one second each
    45.0  claim      — it switches itself
    47.5  end card   — name, price, platforms

   Every product beat renders through <Shell>, so the window never
   shifts a pixel between cuts — the pane content is the transition. */

export const FPS = 30;
export const SCENES = {
  hook: 120, problem: 120, product: 255, writeback: 165,
  steer: 255, replay: 225, breadth: 210, claim: 75, end: 105,
};
export const TOTAL = Object.values(SCENES).reduce((a, b) => a + b, 0);

/* ── shared motion helpers ───────────────────────────────── */

const useLocal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
};

/** a line of type that wipes up into place */
const Line: React.FC<{
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
  weight?: number;
}> = ({ children, delay = 0, size = 76, color = C.fg, weight = 500 }) => {
  const { frame, fps } = useLocal();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.7 } });
  return (
    <div style={{ overflow: "hidden", padding: `${px(3)}px 0` }}>
      <div
        style={{
          fontFamily: SANS, fontSize: px(size), fontWeight: weight, color,
          letterSpacing: "-.035em", lineHeight: 1.05,
          transform: `translateY(${(1 - p) * 110}%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Fades a scene in/out so cuts breathe. Product beats run back-to-back
 *  with both fades off — the window must not blink between them, or the
 *  illusion that it is one continuous session breaks. */
const SceneFade: React.FC<{ len: number; children: React.ReactNode; in?: boolean; out?: boolean }> = ({
  len, children, in: fadeIn = true, out: fadeOut = true,
}) => {
  const { frame } = useLocal();
  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const a = fadeIn ? interpolate(frame, [0, 6], [0, 1], clamp) : 1;
  const b = fadeOut ? interpolate(frame, [len - 12, len], [1, 0], clamp) : 1;
  return <AbsoluteFill style={{ opacity: a * b }}>{children}</AbsoluteFill>;
};

/** the window, parked dead centre — identical geometry in every product beat */
const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>{children}</AbsoluteFill>
);

/* ── 1. hook ─────────────────────────────────────────────── */

const Hook: React.FC = () => {
  const { frame } = useLocal();
  const drift = interpolate(frame, [0, SCENES.hook], [0, -px(14)]);
  return (
    <SceneFade len={SCENES.hook}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${drift}px)`, textAlign: "center" }}>
          <Line delay={0}>You start the agent.</Line>
          <Line delay={16} color={C.dim2}>Then you go blind.</Line>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

/* ── 2. the problem: output nobody reads ─────────────────── */

const NOISE = [
  "● Read src/checkout/index.ts", "● Edit src/checkout/index.ts", "● Read docs/retry.md",
  "● Write src/checkout/retry.ts", "● Bash: npm test -- --watch=false", "● Read src/auth/session.ts",
  "● Edit src/auth/session.ts", "● Write src/checkout/backoff.ts", "● Read tests/checkout.spec.ts",
  "● Edit tests/checkout.spec.ts", "● Bash: git status --porcelain", "● Delete src/checkout/legacy.ts",
  "● Read src/middleware.ts", "● Edit src/middleware.ts", "● Write src/checkout/types.ts",
  "● Read package.json", "● Bash: npx tsc --noEmit", "● Edit src/auth/tokens.ts",
];

const Problem: React.FC = () => {
  const { frame } = useLocal();
  const scroll = interpolate(frame, [0, SCENES.problem], [0, px(560)]);
  const blur = interpolate(frame, [40, 100], [0, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const capIn = spring({ frame: frame - 52, fps: FPS, config: { damping: 200 } });

  return (
    <SceneFade len={SCENES.problem}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "relative", width: px(760), height: px(400), overflow: "hidden",
            fontFamily: MONO, fontSize: px(14), lineHeight: 2, color: C.dim2,
            filter: `blur(${blur}px)`,
            WebkitMaskImage: "linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent)",
            maskImage: "linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent)",
          }}
        >
          <div style={{ transform: `translateY(${-scroll}px)` }}>
            {[...NOISE, ...NOISE].map((l, i) => (
              <div key={i} style={{ opacity: i % 3 === 0 ? 0.85 : 0.5 }}>{l}</div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "absolute", textAlign: "center",
            opacity: capIn, transform: `translateY(${(1 - capIn) * px(10)}px)`,
          }}
        >
          <div
            style={{
              display: "inline-block", padding: `${px(14)}px ${px(26)}px`, borderRadius: px(10),
              background: "rgba(19,19,19,.86)", border: `${px(1)}px solid ${C.line}`,
              backdropFilter: "blur(6px)",
              fontFamily: SANS, fontSize: px(34), fontWeight: 500, color: C.fg, letterSpacing: "-.03em",
            }}
          >
            200 lines scroll past. One of them touched auth.
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

/* ── 3. the product ──────────────────────────────────────── */

const CAPTIONS: [number, number, string][] = [
  [24, 92, "It wrote a spec — so the pane shows the spec"],
  [104, 168, "It moved files — so the pane shows the tree"],
  [182, 245, "It edited code — so the pane shows the diff"],
];

const Product: React.FC = () => {
  const { frame } = useLocal();
  const inP = spring({ frame, fps: FPS, config: { damping: 200, mass: 0.8 } });
  const cap = CAPTIONS.find(([a, b]) => frame >= a && frame < b);

  return (
    <SceneFade len={SCENES.product} out={false}>
      <Stage>
        <div
          style={{
            transform: `translateY(${(1 - inP) * px(18)}px) scale(${0.985 + inP * 0.015})`,
            opacity: inP,
          }}
        >
          <App t={frame / FPS} mono={MONO} sans={SANS} />
        </div>

        {cap && <Caption key={cap[2]} text={cap[2]} start={cap[0]} end={cap[1]} />}
      </Stage>
    </SceneFade>
  );
};

const Caption: React.FC<{ text: string; start: number; end: number }> = ({ text, start, end }) => {
  const { frame } = useLocal();
  const o = interpolate(frame, [start, start + 8, end - 10, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute", bottom: px(30), opacity: o,
        transform: `translateY(${(1 - o) * px(8)}px)`,
        display: "flex", alignItems: "center", gap: px(10),
        padding: `${px(10)}px ${px(18)}px`, borderRadius: px(100),
        background: "rgba(19,19,19,.9)", border: `${px(1)}px solid ${C.line2}`,
        fontFamily: SANS, fontSize: px(19), color: C.fg, letterSpacing: "-.02em",
      }}
    >
      <span style={{ width: px(6), height: px(6), borderRadius: "50%", background: C.ok }} />
      {text}
    </div>
  );
};

/* ── 4. write-back: the spec is not read-only ────────────────
   Tick a box in the rendered pane, docs/retry.md changes on disk, and
   the agent picks the change straight back up. The loop closes. */

const TICK_AT = 2.0;
const TICK_ROW = 1;

const TERM_WRITEBACK: TermLine[] = [
  { at: 0.0, head: "●", text: "Edit src/checkout/index.ts", ink: C.ok },
  { at: 0.0, head: "✓", text: "4 tests passed", ink: C.ok },
  { at: 0.0, text: "", ink: C.dim },
  { at: 0.0, text: "› waiting for you", ink: C.dim2 },
  { at: TICK_AT + 0.35, text: "", ink: C.dim },
  { at: TICK_AT + 0.5, head: "●", text: "Read docs/retry.md", ink: C.dim },
  { at: TICK_AT + 1.5, head: "●", text: "Edit src/checkout/backoff.ts", ink: C.ok },
  { at: TICK_AT + 2.4, head: "✓", text: "full jitter applied", ink: C.ok },
];

const WriteBack: React.FC = () => {
  const { frame, t } = useLocal();
  const target = checkTarget(TICK_ROW);

  return (
    <SceneFade len={SCENES.writeback} in={false} out={false}>
      <Stage>
        <Shell
          mono={MONO}
          sans={SANS}
          activeTab="specs"
          changes={5}
          source="you"
          sourceFlash={Math.max(0, 1 - Math.abs(t - TICK_AT) / 0.8)}
          term={<Term t={t} mono={MONO} sans={SANS} lines={TERM_WRITEBACK} />}
          paneB={<SpecCheckPane t={t} mono={MONO} sans={SANS} tickAt={TICK_AT} tickRow={TICK_ROW} />}
          overlay={
            <Cursor
              t={t}
              path={[
                { at: 0.2, x: 700, y: 300 },
                { at: 0.9, x: target.x, y: target.y },
                { at: 3.4, x: target.x + 40, y: target.y + 60 },
              ]}
              clicks={[TICK_AT]}
            />
          }
        />
        <Caption text="Tick it here — it writes the file" start={18} end={150} />
      </Stage>
    </SceneFade>
  );
};

/* ── 5. steer: the agent talks back ──────────────────────────
   Over the local socket it can force a view, narrate a note, or ask for
   approval and block on the answer. Nothing else in the terminal does
   the last one, so it gets the longest beat. */

const NOTE_AT = 1.0;
const ASK_AT = 3.4;
const ANSWER_AT = 6.6;

const STEER_CAPTIONS: [number, number, string][] = [
  [18, 94, "It can steer the pane and narrate"],
  [ASK_AT * FPS + 6, 232, "…and ask, blocking until you answer"],
];

const TERM_STEER: TermLine[] = [
  { at: 0.0, head: "●", text: "Bash: npx tsc --noEmit", ink: C.dim },
  { at: 0.7, head: "●", text: "Edit src/auth/session.ts", ink: C.ok },
  { at: NOTE_AT, head: "◍", text: "note: auth touched — see the diff", ink: C.warn },
  { at: ASK_AT - 0.2, text: "", ink: C.dim },
  { at: ASK_AT, head: "◍", text: "approval required", ink: C.warn },
  { at: ASK_AT + 0.3, text: "› blocked — waiting for you", ink: C.dim2 },
  { at: ANSWER_AT + 0.15, head: "✓", text: "approved", ink: C.ok },
  { at: ANSWER_AT + 0.5, head: "●", text: "Bash: npm run deploy:staging", ink: C.dim },
  { at: ANSWER_AT + 1.4, head: "✓", text: "staging up in 41s", ink: C.ok },
];

const Steer: React.FC = () => {
  const { frame, t } = useLocal();
  const cap = STEER_CAPTIONS.find(([a, b]) => frame >= a && frame < b);

  return (
    <SceneFade len={SCENES.steer} in={false} out={false}>
      <Stage>
        <Shell
          mono={MONO}
          sans={SANS}
          activeTab="diff"
          pulse={Math.max(0, 1 - Math.abs(t - NOTE_AT) / 0.45)}
          changes={6}
          source="agent"
          sourceFlash={Math.max(0, 1 - Math.abs(t - NOTE_AT) / 1)}
          term={<Term t={t} mono={MONO} sans={SANS} lines={TERM_STEER} />}
          paneB={<AuthDiffPane t={t} at={NOTE_AT} mono={MONO} />}
          overlay={
            <>
              <Toast t={t} at={NOTE_AT} text="Auth touched — check the session diff" sans={SANS} />
              <ApprovalCard t={t} at={ASK_AT} until={ANSWER_AT} mono={MONO} sans={SANS} />
              <Cursor
                t={t}
                path={[
                  { at: 4.5, x: 640, y: 250 },
                  { at: 5.5, x: APPROVE_BTN.x, y: APPROVE_BTN.y },
                ]}
                clicks={[ANSWER_AT]}
              />
            </>
          }
        />
        {cap && <Caption key={cap[2]} text={cap[2]} start={cap[0]} end={cap[1]} />}
      </Stage>
    </SceneFade>
  );
};

/* ── 6. replay: the movie of what the agent did ──────────────
   The newest 20 activity entries carry a snapshot of the working tree,
   so selecting an older row rewinds the diff underneath it. */

const REPLAY_STEPS = [0.4, 1.7, 3.0, 4.3, 5.6];

const TERM_REPLAY: TermLine[] = [
  { at: 0.0, head: "●", text: "Bash: npm run deploy:staging", ink: C.dim },
  { at: 0.0, head: "✓", text: "staging up in 41s", ink: C.ok },
  { at: 0.0, text: "", ink: C.dim },
  { at: 0.0, text: "› what did it touch in auth?", ink: C.dim2 },
];

const Replay: React.FC = () => {
  const { t } = useLocal();
  const rowY = (i: number) => 125 + 28 * i;

  return (
    <SceneFade len={SCENES.replay} in={false} out={false}>
      <Stage>
        <Shell
          mono={MONO}
          sans={SANS}
          activeTab="activity"
          changes={6}
          source="you"
          term={<Term t={t} mono={MONO} sans={SANS} lines={TERM_REPLAY} />}
          paneB={<ActivityPane t={t} mono={MONO} sans={SANS} steps={REPLAY_STEPS} />}
          overlay={
            <Cursor
              t={t}
              travel={0.3}
              path={REPLAY_STEPS.map((at, i) => ({ at: at - 0.3, x: 660, y: rowY(i) }))}
              clicks={REPLAY_STEPS}
            />
          }
        />
        <Caption text="Every event kept its diff — scrub back through it" start={24} end={210} />
      </Stage>
    </SceneFade>
  );
};

/* ── 7. breadth: the rest of the surface, fast ───────────────
   Three shots, ~2.3s each, hard cut, pane B only. Proof the surfaces
   exist without turning the ad into a feature tour. */

const SHOTS: { tab: string; label: string; pane: React.ReactNode }[] = [
  { tab: "changes", label: "Stage, commit, push", pane: <SourceControlPane mono={MONO} sans={SANS} /> },
  { tab: "timeline", label: "Commit log, patch on click", pane: <TimelinePane mono={MONO} sans={SANS} /> },
  { tab: "search", label: "Full-text search with preview", pane: <SearchPane mono={MONO} /> },
];

const SHOT_LEN = Math.floor(SCENES.breadth / SHOTS.length);

const Breadth: React.FC = () => {
  const { frame, t } = useLocal();
  const i = Math.min(SHOTS.length - 1, Math.floor(frame / SHOT_LEN));
  const shot = SHOTS[i];
  const local = frame - i * SHOT_LEN;

  return (
    <SceneFade len={SCENES.breadth} in={false}>
      <Stage>
        <Shell
          mono={MONO}
          sans={SANS}
          activeTab={shot.tab}
          pulse={Math.max(0, 1 - local / 12)}
          changes={6}
          source="you"
          term={<Term t={3 + t * 0.15} mono={MONO} sans={SANS} lines={TERM_REPLAY} />}
          paneB={shot.pane}
        />
        <Caption key={shot.label} text={shot.label} start={i * SHOT_LEN + 4} end={(i + 1) * SHOT_LEN - 4} />
      </Stage>
    </SceneFade>
  );
};

/* ── 8. the claim ────────────────────────────────────────── */

const Claim: React.FC = () => (
  <SceneFade len={SCENES.claim}>
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <Line delay={0} size={68}>No prompts. No clicks.</Line>
        <Line delay={12} size={68} color={C.dim}>It switches itself.</Line>
      </div>
    </AbsoluteFill>
  </SceneFade>
);

/* ── 9. end card ─────────────────────────────────────────── */

const EndCard: React.FC = () => {
  const { frame } = useLocal();
  const a = spring({ frame, fps: FPS, config: { damping: 200 } });
  const b = spring({ frame: frame - 12, fps: FPS, config: { damping: 200 } });
  const c = spring({ frame: frame - 22, fps: FPS, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: px(14), opacity: a, transform: `scale(${0.96 + a * 0.04})` }}>
          <div style={{ transform: `scale(${2.4})`, transformOrigin: "center" }}><Logo /></div>
          <span style={{ fontFamily: SANS, fontSize: px(58), fontWeight: 500, letterSpacing: "-.04em", color: C.fg }}>
            Slate
          </span>
        </div>

        <div style={{ marginTop: px(18), opacity: b, transform: `translateY(${(1 - b) * px(8)}px)` }}>
          <span style={{ fontFamily: SANS, fontSize: px(26), color: C.dim, letterSpacing: "-.02em" }}>
            The terminal that shows its work.
          </span>
        </div>

        <div
          style={{
            marginTop: px(26), display: "flex", justifyContent: "center", gap: px(10),
            opacity: c, transform: `translateY(${(1 - c) * px(8)}px)`,
          }}
        >
          {["Free · MIT", "macOS & Linux", "12.4 MB", "slate.tools"].map((s, i) => (
            <span
              key={s}
              style={{
                fontFamily: MONO, fontSize: px(14), color: i === 3 ? C.fg : C.dim,
                border: `${px(1)}px solid ${i === 3 ? C.line2 : C.line}`,
                borderRadius: px(100), padding: `${px(6)}px ${px(14)}px`,
                background: i === 3 ? "rgba(255,255,255,.06)" : "transparent",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── assembly ────────────────────────────────────────────── */

export const SlateDemo: React.FC = () => {
  const { hook, problem, product, writeback, steer, replay, breadth, claim } = SCENES;
  let at = 0;
  const next = (len: number) => { const from = at; at += len; return from; };

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1300px 700px at 50% -12%, rgba(255,255,255,.05), transparent 62%), ${C.bg}`,
        fontFamily: SANS,
      }}
    >
      <Sequence from={next(hook)} durationInFrames={hook}><Hook /></Sequence>
      <Sequence from={next(problem)} durationInFrames={problem}><Problem /></Sequence>
      <Sequence from={next(product)} durationInFrames={product}><Product /></Sequence>
      <Sequence from={next(writeback)} durationInFrames={writeback}><WriteBack /></Sequence>
      <Sequence from={next(steer)} durationInFrames={steer}><Steer /></Sequence>
      <Sequence from={next(replay)} durationInFrames={replay}><Replay /></Sequence>
      <Sequence from={next(breadth)} durationInFrames={breadth}><Breadth /></Sequence>
      <Sequence from={next(claim)} durationInFrames={claim}><Claim /></Sequence>
      <Sequence from={at}><EndCard /></Sequence>
    </AbsoluteFill>
  );
};
