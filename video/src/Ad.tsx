import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { C } from "./theme";
import { App, Shell, Term, px, type TermLine } from "./chrome";
import { ActivityPane, ApprovalCard, AuthDiffPane } from "./panes";

const { fontFamily: SANS } = loadSans();
const { fontFamily: MONO } = loadMono();

/* ══ the ad ═══════════════════════════════════════════════════
   One idea: the cursor never moves.

   A mouse pointer sits frozen at one pixel for the whole film while the
   product does all the work around it, and a counter reads 0 clicks.
   At the end it moves once, to answer the agent. That *shows* "you never
   navigate to the thing you're working on" instead of captioning it.

   Consequences of the idea, which are also the rules:
     · the cursor is rendered at the top level, never inside a Sequence,
       and its position is a constant until frame ASK+40. If you ever find
       yourself animating it earlier, the ad has no point left.
     · no explanatory captions. Type states, it doesn't narrate.
     · cuts land on a 6-frame grid so the thing has a pulse.               */

export const FPS = 30;

/* beat lengths in frames; edit here, offsets and TOTAL follow */
const BEATS = {
  still: 36,    // a cursor alone on black
  watch: 54,    // "Watch the cursor."
  wide: 180,    // the app builds itself around it, pane B keeping up
  turn: 66,     // black. the claim, stated flat
  close: 180,   // hard into pane B — still nobody touches anything
  ask: 96,      // the agent asks; the cursor moves; one click
  payoff: 54,   // "That was the only one."
  end: 66,      // name
} as const;

export const TOTAL_AD = Object.values(BEATS).reduce((a, b) => a + b, 0);

/* absolute start frame of each beat */
const AT = (() => {
  let n = 0;
  const o = {} as Record<keyof typeof BEATS, number>;
  for (const k of Object.keys(BEATS) as (keyof typeof BEATS)[]) { o[k] = n; n += BEATS[k]; }
  return o;
})();

/* the pinned pixel — dead centre horizontally, a little below the middle */
const HOME = { x: 960, y: 620 };

/* where the Approve button lands once the window is back at 1:1.
   window is px(904)×px(404) = 1808×808 drawn centred in 1920×1080, so its
   origin is (56, 136); APPROVE_BTN is (834, 344) in 1× window coords. */
const APPROVE = { x: 56 + 834 * 2, y: 136 + 344 * 2 };

const MOVE_START = AT.ask + 40;
const MOVE_END = AT.ask + 70;
const CLICK = AT.ask + 76;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ── type ────────────────────────────────────────────────────
   Cuts on, cuts off. No springs, no rising words — a fade would make it
   a presentation. The only softness is a 2-frame ramp so the encoder
   doesn't ring on the hard edge. */

const Stab: React.FC<{
  from: number; to: number; children: React.ReactNode;
  size?: number; color?: string; y?: number;
}> = ({ from, to, children, size = 96, color = C.fg, y = 0 }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= to) return null;
  const o = interpolate(frame, [from, from + 2, to - 2, to], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: o }}>
      <div style={{
        transform: `translateY(${y}px)`, textAlign: "center",
        fontFamily: SANS, fontSize: size, fontWeight: 600, color,
        letterSpacing: "-.045em", lineHeight: 1.02,
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};

/* ── the cursor ──────────────────────────────────────────────
   The whole point. Motionless from frame 0 to MOVE_START. */

const AdCursor: React.FC = () => {
  const frame = useCurrentFrame();

  const p = interpolate(frame, [MOVE_START, MOVE_END], [0, 1], clamp);
  const ease = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
  const x = HOME.x + (APPROVE.x - HOME.x) * ease;
  const y = HOME.y + (APPROVE.y - HOME.y) * ease;

  const press = Math.max(0, 1 - Math.abs(frame - CLICK) / 7);

  /* it breathes once before it finally moves — a held breath, not idle drift */
  const tell = interpolate(frame, [MOVE_START - 14, MOVE_START - 6], [0, 1], clamp)
    * interpolate(frame, [MOVE_START - 6, MOVE_START], [1, 0], clamp);

  return (
    <div style={{ position: "absolute", left: x, top: y, zIndex: 60, pointerEvents: "none" }}>
      {press > 0 && (
        <span style={{
          position: "absolute", left: -30, top: -30, width: 60, height: 60, borderRadius: "50%",
          border: `2px solid rgba(255,255,255,${0.55 * press})`,
          transform: `scale(${0.35 + (1 - press) * 1.05})`,
        }} />
      )}
      <span style={{
        position: "absolute", left: -26, top: -26, width: 52, height: 52, borderRadius: "50%",
        background: `rgba(255,255,255,${0.05 * tell})`,
      }} />
      <svg width={34} height={34} viewBox="0 0 24 24"
        style={{ transform: `translate(-3px,-2px) scale(${1 - press * 0.14})`, filter: "drop-shadow(0 3px 8px rgba(0,0,0,.9))" }}>
        <path d="M5 2.5 19 12.6l-6.1.5-3.2 6.1z" fill="#fff" stroke="#0a0a0a" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* ── the counter ─────────────────────────────────────────────
   Small, dim, bottom-left. It is the scoreboard for the whole idea, so it
   is on screen from the first frame and it is the last thing to change. */

const Counter: React.FC = () => {
  const frame = useCurrentFrame();
  const clicked = frame >= CLICK;
  const flash = Math.max(0, 1 - Math.abs(frame - CLICK) / 10);

  return (
    /* the pill is not decoration — in the close crop this sits on top of a
       lit diff line, and without it the counter vanishes exactly when the
       ad most needs you to read it */
    <div style={{
      position: "absolute", left: 72, bottom: 74, zIndex: 55,
      display: "flex", alignItems: "center", gap: 12,
      padding: "9px 18px", borderRadius: 100,
      background: "rgba(11,11,11,.72)", border: "1px solid rgba(255,255,255,.09)",
      backdropFilter: "blur(8px)",
      fontFamily: MONO, fontSize: 19, letterSpacing: ".04em",
      color: clicked ? C.fg : C.dim2,
    }}>
      <span style={{
        width: 9, height: 9, borderRadius: "50%",
        background: clicked ? C.ok : C.dim2,
        boxShadow: flash > 0 ? `0 0 ${18 * flash}px rgba(74,194,107,${flash})` : "none",
      }} />
      {clicked ? "1 click" : "0 clicks"}
    </div>
  );
};

/* ── the window ──────────────────────────────────────────────
   One Shell for the whole film. It is never remounted, only re-framed:
   wide → (cut to black) → hard in on pane B → back out for the ask. The
   session underneath keeps running the entire time. */

const TERM_AD: TermLine[] = [
  { at: 0.0, text: "$ claude", ink: C.fg, type: true, dur: 0.4 },
  { at: 0.6, text: "", ink: C.dim },
  { at: 0.7, text: "› harden the checkout retry path", ink: C.dim, type: true, dur: 0.9 },
  { at: 1.8, text: "", ink: C.dim },
  { at: 2.0, head: "●", text: "Read docs/retry.md", ink: C.dim },
  { at: 3.3, head: "●", text: "Write src/checkout/retry.ts", ink: C.ok },
  { at: 3.5, head: "●", text: "Write src/checkout/backoff.ts", ink: C.ok },
  { at: 5.2, head: "●", text: "Edit src/checkout/index.ts", ink: C.ok },
  { at: 6.6, head: "●", text: "Edit src/auth/session.ts", ink: C.ok },
  { at: 7.4, head: "◍", text: "note: auth touched", ink: C.warn },
  { at: 8.6, head: "✓", text: "12 tests passed", ink: C.ok },
  { at: 9.4, text: "", ink: C.dim },
  { at: 9.6, head: "◍", text: "approval required", ink: C.warn },
  { at: 9.9, text: "› blocked", ink: C.dim2 },
  { at: (CLICK - AT.wide) / FPS + 0.2, head: "✓", text: "approved", ink: C.ok },
  { at: (CLICK - AT.wide) / FPS + 0.7, head: "✓", text: "shipped", ink: C.ok },
];

const Window: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < AT.wide || frame >= AT.payoff) return null;

  /* black between the wide shot and the close — the only cut to nothing */
  const inTurn = frame >= AT.turn && frame < AT.close;
  if (inTurn) return null;

  const wide = frame < AT.turn;
  const close = frame >= AT.close && frame < AT.ask;

  /* Wide drifts in very slightly; close is a hard jump, not a zoom.
     2.2 is the smallest scale at which pane B (px(452) wide → 994px here)
     covers the 1920 frame — anything less leaves black bars down the
     sides and the crop reads as a mistake. tx slides pane B's centre
     (px(226) right of the window's) onto the frame's. */
  const scale = wide ? interpolate(frame, [AT.wide, AT.turn], [0.985, 1.02], clamp)
    : close ? 2.2
      : 1;
  const tx = close ? -226 * 2 * 2.2 : 0;

  /* the session clock runs continuously across all three framings */
  const t = (frame - AT.wide) / FPS;

  const paneB = close && frame >= AT.close + 96
    ? <ActivityPane t={(frame - AT.close - 96) / FPS} mono={MONO} sans={SANS} steps={[0.2, 1.1, 2.0]} />
    : <AuthDiffPane t={t} at={6.8} mono={MONO} />;

  const tab = close && frame >= AT.close + 96 ? "activity" : "diff";

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateX(${tx}px) scale(${scale})` }}>
        {wide
          ? <App t={t} mono={MONO} sans={SANS} />
          : (
            <Shell
              mono={MONO}
              sans={SANS}
              activeTab={tab}
              changes={6}
              source={frame >= AT.ask ? "agent" : "classifier"}
              term={<Term t={t} mono={MONO} sans={SANS} lines={TERM_AD} />}
              paneB={paneB}
              overlay={
                frame >= AT.ask
                  ? <ApprovalCard t={t} at={(AT.ask - AT.wide) / FPS} until={(CLICK - AT.wide) / FPS} mono={MONO} sans={SANS} />
                  : null
              }
            />
          )}
      </div>
    </AbsoluteFill>
  );
};

/* ── assembly ────────────────────────────────────────────────
   Type and window are siblings, and the cursor sits above both — it has
   to survive every cut, so it cannot live inside any of them. */

export const SlateFilm: React.FC = () => (
  <AbsoluteFill style={{ background: "#0d0d0d", fontFamily: SANS }}>
    <Window />

    <Stab from={AT.watch} to={AT.wide - 6} size={62} color={C.dim}>
      Watch the cursor.
    </Stab>

    {/* y lifts the two-line stabs clear of HOME — the pinned cursor would
        otherwise sit on top of a letter and read as a rendering fault */}
    <Stab from={AT.turn + 6} to={AT.close - 6} y={-100}>
      It kept up with all of that.
      <div style={{ color: C.dim2, marginTop: 14 }}>You didn&rsquo;t do anything.</div>
    </Stab>

    <Stab from={AT.payoff + 6} to={AT.end - 6} size={78} y={-100}>
      Then it asked.
      <div style={{ color: C.ok, marginTop: 14 }}>That was the only click.</div>
    </Stab>

    <End />

    <Counter />
    <AdCursor />
  </AbsoluteFill>
);

const End: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < AT.end) return null;
  const o = interpolate(frame, [AT.end, AT.end + 6], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: o }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 86, fontWeight: 500, letterSpacing: "-.06em", color: C.fg }}>
          slate
        </div>
        <div style={{ marginTop: 18, fontSize: 25, color: C.dim, letterSpacing: "-.02em" }}>
          A terminal with a second brain attached.
        </div>
        <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 16, color: C.dim2, letterSpacing: ".05em" }}>
          slate.tools
        </div>
      </div>
    </AbsoluteFill>
  );
};
