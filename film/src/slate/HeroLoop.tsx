import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, c, CAM, IN, inOut } from "./theme";
import { Cap, Words } from "./Kinetic";
import { Grain, Vignette } from "./Chrome";
import { AppCard } from "./ActsTurn";
import { DiffView, SpecView, TreeView } from "./Panes";
import { type Line } from "./Terminal";

/**
 * 15s silent hero loop for above the fold — acts VI–VII only, no argument, no
 * problem statement, just the gesture. It has to survive being watched twenty
 * times, so it opens from the seam and drains back into it: frame 449 is
 * pixel-identical to frame 0, and 450 divides the 30-frame caret blink, so the
 * stitch carries no visible tick.
 *
 * Runs **full-bleed**, unlike the film, which frames the app as an object on a
 * dark field. A hero already sits inside the site's own card, and a card inside
 * a card leaves the product tiny — so here the app is the frame, and the causal
 * line rides a scrim strip along the bottom.
 */

const BOX = { left: 0, top: 0, width: 1920, height: 1080 };
const STRIP = 118;

/** The loop joins a session already under way — negative frames are history, so
 *  the shell is never an empty rectangle, not even on frame 0. */
const LINES: Line[] = [
  { f: -60, verb: "Read", rest: "src/server/router.ts" },
  { f: -52, verb: "Read", rest: "src/server/index.ts" },
  { f: -44, verb: "Grep", rest: '"rate" · 3 matches' },
  { f: -36, verb: "Read", rest: "package.json" },
  { f: -28, verb: "Write", rest: "src/lib/limiter.ts" },
  { f: -20, verb: "Write", rest: "src/lib/window.ts" },
  { f: -12, verb: "Edit", rest: "src/config/defaults.ts" },
  { f: 14, verb: "Write", rest: "docs/specs/rate-limiting.md" },
  { f: 74, verb: "Read", rest: "src/lib/limiter.ts" },
  { f: 132, verb: "Edit", rest: "src/server/middleware/limit.ts" },
  { f: 210, verb: "Bash", rest: "npm test · 42 passed", ok: true },
  { f: 258, verb: "Move", rest: "lib/limiter.ts → server/limiter/" },
];

const SPEC = 26;
const DIFF = 150;
const TREE = 282;
const CLOSE = 400;

export const HeroLoop: React.FC = () => {
  const frame = useCurrentFrame();

  /** open outward from the line, then close back into it */
  const open = at(frame, [2, 34], [50, 0], CAM) + at(frame, [CLOSE + 12, CLOSE + 40], [0, 50], IN);
  /** the line is bright at the loop point and dim while the app is open, so
   *  frame 0 and frame 449 are the same picture and the stitch is invisible */
  const alone = Math.min(
    1,
    1 - at(frame, [2, 30], [0, 1]) + at(frame, [CLOSE + 22, CLOSE + 46], [0, 1]),
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

      {/* the terminal is inside AppCard; this is only the impulse crossing the seam */}
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
          opacity: at(frame, [24, 48], [0, 1]) - at(frame, [CLOSE - 10, CLOSE + 16], [0, 1], IN),
        }}
      />

      <Cap left={1000} bottom={70} width={860}>
        <Words
          frame={frame}
          text="It writes a spec → the spec is open."
          start={34}
          hold={86}
          size={48}
          color={c.dim}
          hot={{ "→": c.dim2, spec: c.fg }}
        />
      </Cap>
      <Cap left={1000} bottom={70} width={860}>
        <Words
          frame={frame}
          text="It edits code → the diff is open."
          start={158}
          hold={78}
          size={48}
          color={c.dim}
          hot={{ "→": c.dim2, diff: c.fg }}
        />
      </Cap>
      <Cap left={1000} bottom={70} width={860}>
        <Words
          frame={frame}
          text="It moves files → the tree is open."
          start={290}
          hold={74}
          size={48}
          color={c.dim}
          hot={{ "→": c.dim2, tree: c.fg }}
        />
      </Cap>

      <Vignette />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};
