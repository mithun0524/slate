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

const OPEN = 56; //  the line opens into the app
const SPEC = 82;
const DIFF = 210;
const TREE = 338;
const CLOSE = 452; //  the app folds back into the line
const OUTRO = 496;
const DRAIN = 604; //  the CTA leaves; the line is alone again

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
  const gone = at(frame, [OPEN - 14, OPEN + 8], [0, 1], IN);
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
        <div style={{ opacity: at(frame, [8, 22], [0, 1]) }}>
          <Mark frame={frame} size={104} box={[10, 40]} seam={[30, 50]} chev={[42, 58]} />
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

  /** the line is bright whenever it is alone — which is exactly the loop point.
   *  It dims under the CTA, because a lit hairline through a line of type reads
   *  as a strike-through, and brightens again before the loop stitch. */
  const alone =
    Math.min(
      1,
      1 - at(frame, [OPEN, OPEN + 28], [0, 1]) + at(frame, [CLOSE + 16, CLOSE + 40], [0, 1]),
    ) * (1 - inOut(frame, [OUTRO - 12, OUTRO + 10], [DRAIN, DRAIN + 22]) * 0.82);

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
            opacity: alone,
          }}
        />
        <div
          style={{
            width: 1.5 + alone * 1.5,
            height: BOX.height,
            background: `rgba(228,228,230,${0.16 + 0.7 * alone})`,
            boxShadow: `0 0 ${50 * alone}px rgba(228,228,230,${0.5 * alone})`,
          }}
        />
      </AbsoluteFill>

      {frame < OPEN + 10 ? <Lockup frame={frame} /> : null}

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
