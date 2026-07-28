import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, c, CAM, IN, inOut, mono, sans } from "./theme";
import { Cap, Words } from "./Kinetic";
import { Grain, Mark, Vignette } from "./Chrome";
import { AppCard } from "./ActsTurn";
import { DiffView, SpecView, TreeView } from "./Panes";
import { type Line } from "./Terminal";

/**
 * 22s silent hero loop — above the fold, autoplay muted.
 *
 * Three movements, all hung on the seam. It **opens on the lockup**: the mark
 * draws to the left of the line and the wordmark rises to the right, so the
 * logo's own divider and the product's centre seam are the same object. The line
 * then opens into the app, which answers three impulses. It **closes on the CTA**,
 * and everything drains back into the line — frame 659 is the same picture as
 * frame 0, and 660 divides the 30-frame caret blink, so the stitch carries no
 * visible tick.
 *
 * Runs full-bleed, unlike the film, which frames the app as an object on a dark
 * field: a hero already sits inside the site's own card, and a card inside a card
 * leaves the product tiny.
 */

export const HERO_TOTAL = 660;

const BOX = { left: 0, top: 0, width: 1920, height: 1080 };
const STRIP = 118;

/* Nothing overlaps: the lockup leaves, then the line draws, then the app opens.
   The line and type are never on screen together in either bookend. */
const LOCK_OUT = 44; //  wordmark starts leaving
const HINGE = 58; //   the line draws itself, alone
const OPEN = 72; //    the line opens into the app
const SPEC = 98;
const DIFF = 226;
const TREE = 354;
const CLOSE = 462; //  the app folds back into the line
const OUTRO = 516; //  the line is gone by here
const DRAIN = 612; //  the CTA leaves; back to black for the stitch

/** The loop joins a session already under way — negative frames are history, so
 *  the shell is never an empty rectangle, not even on the frame it loops to. */
const LINES: Line[] = [
  { f: -60, verb: "Read", rest: "src/server/router.ts" },
  { f: -52, verb: "Read", rest: "src/server/index.ts" },
  { f: -44, verb: "Grep", rest: '"rate" · 3 matches' },
  { f: -36, verb: "Read", rest: "package.json" },
  { f: -28, verb: "Write", rest: "src/lib/limiter.ts" },
  { f: -20, verb: "Write", rest: "src/lib/window.ts" },
  { f: -12, verb: "Edit", rest: "src/config/defaults.ts" },
  { f: SPEC - 14, verb: "Write", rest: "docs/specs/rate-limiting.md" },
  { f: SPEC + 46, verb: "Read", rest: "src/lib/limiter.ts" },
  { f: DIFF - 14, verb: "Edit", rest: "src/server/middleware/limit.ts" },
  { f: DIFF + 58, verb: "Bash", rest: "npm test · 42 passed", ok: true },
  { f: TREE - 14, verb: "Move", rest: "lib/limiter.ts → server/limiter/" },
];

/* ── intro: mark and wordmark, split by the seam itself ────────────────── */

const Lockup: React.FC<{ frame: number }> = ({ frame }) => {
  const gone = at(frame, [LOCK_OUT, LOCK_OUT + 12], [0, 1], IN);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 92,
          opacity: 1 - gone,
          translate: `0px ${gone * -26}px`,
        }}
      >
        <div style={{ opacity: at(frame, [10, 24], [0, 1]) }}>
          <Mark frame={frame} size={104} box={[12, 42]} seam={[32, 52]} chev={[44, 60]} />
        </div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 108,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            color: c.fg,
            overflow: "hidden",
            paddingBottom: 12,
          }}
        >
          <span
            style={{ display: "block", translate: `0px ${at(frame, [26, 50], [140, 0], CAM)}px` }}
          >
            Slate
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ── outro: what to type, once the argument has been made ──────────────── */

const Outro: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - OUTRO;
  const gone = at(frame, [DRAIN, DRAIN + 26], [0, 1], IN);
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        opacity: 1 - gone,
        translate: `0px ${gone * -24}px`,
      }}
    >
      <Words
        frame={local}
        text="The terminal that shows its work."
        start={10}
        hold={300}
        size={74}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 28px",
          border: `1px solid ${c.line}`,
          background: c.bg1,
          fontFamily: mono,
          fontSize: 30,
          color: c.fg2,
          opacity: at(local, [34, 54], [0, 1]),
          translate: `0px ${at(local, [34, 56], [14, 0])}px`,
        }}
      >
        <span style={{ color: c.add }}>$</span>
        brew install --cask slate
      </div>
    </AbsoluteFill>
  );
};

export const HeroLoop: React.FC = () => {
  const frame = useCurrentFrame();

  /** the app unfolds from the line and folds back into it */
  const open =
    at(frame, [OPEN, OPEN + 34], [50, 0], CAM) + at(frame, [CLOSE, CLOSE + 30], [0, 50], IN);

  /** The line is a hinge, not a backdrop. It draws just before the app opens and
   *  dies once the app's own divider takes over; it comes back to catch the app
   *  folding, then goes. It is never on screen under type — a lit hairline through
   *  a line of text reads as a strike-through, dimmed or not — so the loop point
   *  is clean black at both ends. */
  const line = Math.min(
    1,
    inOut(frame, [HINGE, HINGE + 14], [OPEN + 2, OPEN + 20]) +
      inOut(frame, [CLOSE + 16, CLOSE + 28], [CLOSE + 34, CLOSE + 52]),
  );

  return (
    <AbsoluteFill style={{ background: c.void }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 520,
            height: BOX.height,
            background:
              "radial-gradient(ellipse 40% 60% at 50% 50%, rgba(228,228,230,.09), transparent 70%)",
            opacity: line,
          }}
        />
        <div
          style={{
            width: 1.5 + line * 1.5,
            height: `${line * 100}%`,
            background: `rgba(228,228,230,${0.9 * line})`,
            boxShadow: `0 0 ${50 * line}px rgba(228,228,230,${0.5 * line})`,
          }}
        />
      </AbsoluteFill>

      {frame < LOCK_OUT + 14 ? <Lockup frame={frame} /> : null}

      <AppCard
        frame={frame}
        lines={LINES}
        box={BOX}
        zoom={1.2}
        termSize={26}
        padBottom={40}
        clip={`inset(0 ${open}% 0 ${open}%)`}
        right={
          <>
            {frame < DIFF ? <SpecView local={frame - SPEC} tick={44} /> : null}
            {frame >= DIFF && frame < TREE ? <DiffView local={frame - DIFF} bloom={52} /> : null}
            {frame >= TREE ? <TreeView local={frame - TREE} /> : null}
          </>
        }
      />

      {/* every beat is one impulse crossing the seam */}
      {[SPEC, DIFF, TREE].map((beat) => {
        const local = frame - (beat - 10);
        return (
          <div
            key={beat}
            style={{
              position: "absolute",
              top: 0,
              left: 960,
              width: 2,
              height: BOX.height,
              background: c.fg,
              opacity: inOut(local, [0, 5], [10, 26]) * 0.5,
              scale: `${at(local, [0, 14], [1, 3])} 1`,
              filter: "blur(1px)",
            }}
          />
        );
      })}

      {/* one scrim, in the pane's own dead space — the log stays clean */}
      <div
        style={{
          position: "absolute",
          left: 962,
          right: 0,
          bottom: 0,
          height: STRIP + 120,
          background:
            "linear-gradient(to top, rgba(24,24,25,.96) 0%, rgba(24,24,25,.72) 52%, transparent 100%)",
          opacity:
            at(frame, [OPEN + 20, OPEN + 44], [0, 1]) -
            at(frame, [CLOSE - 12, CLOSE + 14], [0, 1], IN),
        }}
      />

      <Cap left={1000} bottom={70} width={860}>
        <Words
          frame={frame}
          text="It writes a spec → the spec is open."
          start={SPEC + 12}
          hold={92}
          size={48}
          color={c.dim}
          hot={{ "→": c.dim2, spec: c.fg }}
        />
      </Cap>
      <Cap left={1000} bottom={70} width={860}>
        <Words
          frame={frame}
          text="It edits code → the diff is open."
          start={DIFF + 12}
          hold={92}
          size={48}
          color={c.dim}
          hot={{ "→": c.dim2, diff: c.fg }}
        />
      </Cap>
      <Cap left={1000} bottom={70} width={860}>
        <Words
          frame={frame}
          text="It moves files → the tree is open."
          start={TREE + 12}
          hold={84}
          size={48}
          color={c.dim}
          hot={{ "→": c.dim2, tree: c.fg }}
        />
      </Cap>

      {frame >= OUTRO ? <Outro frame={frame} /> : null}

      <Vignette />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};
