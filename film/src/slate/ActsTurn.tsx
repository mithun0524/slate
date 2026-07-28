import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, c, CAM, IN, inOut, mono } from "./theme";
import { Cap, Tag, Words } from "./Kinetic";
import { Meter } from "./Chrome";
import { Terminal, type Line } from "./Terminal";
import { DiffView, SpecView, TreeView } from "./Panes";
import { PATHS, rnd } from "./rnd";

/* ═══ VI. THE TURN ═══════════════════════════════════════════════
   Every shape from the first half drains into one vertical line. The
   line is drawn by <Seam/> one layer up, so this act only has to let
   go of the chaos. Nothing is claimed yet — the frame just gets quiet,
   which is the feeling the product is actually selling. */

const GHOST = [
  { x: -430, y: -190 },
  { x: 430, y: -190 },
  { x: -430, y: 190 },
  { x: 430, y: 190 },
];

export const Turn: React.FC = () => {
  const frame = useCurrentFrame();
  const drain = at(frame, [0, 34], [1, 0], IN);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {GHOST.map((g, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 520,
              height: 280,
              border: `1px solid ${c.lineSoft}`,
              opacity: drain * 0.8,
              translate: `${g.x * drain}px ${g.y * drain}px`,
              scale: `${drain} ${0.4 + drain * 0.6}`,
            }}
          />
        ))}

        {Array.from({ length: 14 }, (_, i) => (
          <div
            key={`p${i}`}
            style={{
              position: "absolute",
              fontFamily: mono,
              fontSize: 24,
              color: c.dim3,
              whiteSpace: "nowrap",
              opacity: at(frame, [0, 22], [0.5, 0], IN),
              translate: `${(rnd(i) - 0.5) * 1500 * drain}px ${(rnd(i, 5) - 0.5) * 800 * drain}px`,
              scale: String(0.6 + drain * 0.4),
            }}
          >
            {PATHS[i]}
          </div>
        ))}
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 132 }}>
        <div style={{ textAlign: "center" }}>
          <Words
            frame={frame}
            text="Trust needs a window."
            start={34}
            hold={200}
            size={112}
            color={c.dim}
            hot={{ window: c.fg }}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 150 }}>
        <Tag frame={frame} text="one screen · two halves" start={58} hold={180} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ═══ VII. CAUSE AND EFFECT ══════════════════════════════════════
   The whole product in one gesture, three times: the agent acts on the
   left, and the right half is *already* the thing it acted on. No menu,
   no tab, no cursor travelling to a target — because there isn't one. */

const LINES: Line[] = [
  { f: 18, verb: "Read", rest: "src/server/router.ts" },
  { f: 34, verb: "Write", rest: "docs/specs/rate-limiting.md" },
  { f: 92, verb: "Read", rest: "src/lib/limiter.ts" },
  { f: 146, verb: "Edit", rest: "src/server/middleware/limit.ts" },
  { f: 208, verb: "Bash", rest: "npm test · 42 passed", ok: true },
  { f: 240, verb: "Move", rest: "lib/limiter.ts → server/limiter/" },
  { f: 296, verb: "Edit", rest: "src/lib/clock.ts" },
];

const SPEC = 48;
const DIFF = 158;
const TREE = 252;

export const CARD = { left: 210, top: 104, width: 1500, height: 700, split: 750 };

/** The app itself. Every act after the turn shows this same object in the same
 *  place — the film never cuts away from it, it only moves the camera. */
export const AppCard: React.FC<{
  frame: number;
  right: React.ReactNode;
  clip?: string;
  lines?: Line[];
  /** the film frames the app as an object; the hero cut runs it full-bleed */
  box?: { left: number; top: number; width: number; height: number };
  radius?: number;
  padBottom?: number;
  /** the hero runs full-bleed, so its panes are taller — scale the view up to fill */
  zoom?: number;
  termSize?: number;
}> = ({
  frame,
  right,
  clip,
  lines = LINES,
  box = CARD,
  radius,
  padBottom,
  zoom = 1,
  termSize,
}) => (
  <div
    style={{
      position: "absolute",
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      border: box === CARD ? `1px solid ${c.line}` : "none",
      borderRadius: radius,
      background: c.bg,
      boxShadow: box === CARD ? "0 80px 180px -50px rgba(0,0,0,.9)" : "none",
      clipPath: clip,
      display: "flex",
      overflow: "hidden",
    }}
  >
    <div style={{ width: box.width / 2, position: "relative", background: c.bg2 }}>
      <div
        style={{
          height: 46,
          borderBottom: `1px solid ${c.lineSoft}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px",
          fontFamily: mono,
          fontSize: 17,
          color: c.dim2,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        zsh
        <span style={{ color: c.dim3, textTransform: "none", letterSpacing: 0 }}>~/acme-api</span>
      </div>
      <Terminal frame={frame} lines={lines} padBottom={padBottom} size={termSize} />
    </div>

    {/* the seam, now load-bearing */}
    <div style={{ width: 1, background: c.line }} />

    <div style={{ flex: 1, position: "relative", background: c.bg1, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${100 / zoom}%`,
          height: `${100 / zoom}%`,
          scale: String(zoom),
          transformOrigin: "top left",
        }}
      >
        {right}
      </div>
    </div>
  </div>
);

export const Effect: React.FC = () => {
  const frame = useCurrentFrame();
  /** the app opens outward from the seam — the seam is never covered, it becomes the divider */
  const open = at(frame, [0, 40], [50, 0], CAM);
  const push = at(frame, [0, 330], [1, 1.03], CAM);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ scale: String(push) }}>
        <AppCard
          frame={frame}
          clip={`inset(0 ${open}% 0 ${open}%)`}
          right={
            <>
              {frame < DIFF ? <SpecView local={frame - SPEC} tick={56} /> : null}
              {frame >= DIFF && frame < TREE ? <DiffView local={frame - DIFF} bloom={58} /> : null}
              {frame >= TREE ? <TreeView local={frame - TREE} /> : null}
            </>
          }
        />
      </AbsoluteFill>

      {/* the causal line — small, because the picture is doing the arguing */}
      <Cap left={214} bottom={96}>
        <Words
          frame={frame}
          text="It writes a spec → the spec is open."
          start={56}
          hold={86}
          size={56}
          color={c.dim}
          hot={{ "→": c.dim2, spec: c.fg }}
        />
      </Cap>
      <Cap left={214} bottom={96}>
        <Words
          frame={frame}
          text="It edits code → the diff is open."
          start={166}
          hold={72}
          size={56}
          color={c.dim}
          hot={{ "→": c.dim2, diff: c.fg }}
        />
      </Cap>
      <Cap left={214} bottom={96}>
        <Words
          frame={frame}
          text="It moves files → the tree is open."
          start={262}
          hold={62}
          size={56}
          color={c.dim}
          hot={{ "→": c.dim2, tree: c.fg }}
        />
      </Cap>

      {/* the impulse: every beat is one pulse crossing the divider */}
      {[SPEC, DIFF, TREE].map((beat) => {
        const local = frame - (beat - 12);
        return (
          <div
            key={beat}
            style={{
              position: "absolute",
              top: CARD.top,
              left: 960,
              width: 2,
              height: CARD.height,
              background: c.fg,
              opacity: inOut(local, [0, 5], [10, 26]) * 0.55,
              scale: `${at(local, [0, 14], [1, 3])} 1`,
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ═══ VIII. DETERMINISM ══════════════════════════════════════════
   Magic is not trustworthy. Sixty lines of readable Rust are. This act
   exists because the previous one looked like inference, and it isn't. */

const CHIPS = ["fs events", "400ms burst", "classifier"];
const OUTS = ["spec", "diff", "tree"];

const SNIPPET = [
  "if md_created || md_live.len() >= non_md {",
  "    return ViewIntent::Spec { path }",
  "}",
  "if structural >= 2 { return ViewIntent::Tree }",
  "ViewIntent::Diff { paths }",
];

export const Determinism: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* we push through the app rather than cut away from it */}
      <AbsoluteFill
        style={{
          scale: String(at(frame, [0, 150], [1.03, 1.16], CAM)),
          opacity: at(frame, [0, 30], [1, 0.18]),
          filter: `blur(${at(frame, [0, 30], [0, 5])}px)`,
        }}
      >
        <AppCard frame={330 + frame} right={<TreeView local={90 + frame} />} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 60 }}>
        {/* the pipeline, drawn as plumbing rather than intelligence */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {CHIPS.map((chip, i) => (
            <React.Fragment key={chip}>
              {i > 0 ? (
                <div
                  style={{
                    width: 74,
                    height: 1,
                    background: c.line,
                    scale: `${at(frame, [10 + i * 16, 26 + i * 16], [0, 1])} 1`,
                    transformOrigin: "left",
                  }}
                />
              ) : null}
              <div
                style={{
                  padding: "16px 28px",
                  border: `1px solid ${c.line}`,
                  background: c.bg1,
                  fontFamily: mono,
                  fontSize: 24,
                  color: c.fg2,
                  opacity: at(frame, [4 + i * 16, 22 + i * 16], [0, 1]),
                  translate: `0px ${at(frame, [4 + i * 16, 24 + i * 16], [10, 0])}px`,
                }}
              >
                {chip}
              </div>
            </React.Fragment>
          ))}

          <div
            style={{
              width: 74,
              height: 1,
              background: c.line,
              scale: `${at(frame, [58, 74], [0, 1])} 1`,
              transformOrigin: "left",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {OUTS.map((o, i) => (
              <div
                key={o}
                style={{
                  padding: "10px 22px",
                  border: `1px solid ${i === 0 ? c.add : c.line}`,
                  color: i === 0 ? c.add : c.dim2,
                  fontFamily: mono,
                  fontSize: 20,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: at(frame, [66 + i * 8, 84 + i * 8], [0, 1]),
                  translate: `${at(frame, [66 + i * 8, 86 + i * 8], [-12, 0])}px 0px`,
                }}
              >
                {o}
              </div>
            ))}
          </div>
        </div>

        {/* the actual source, because it is short enough to show */}
        <div
          style={{
            border: `1px solid ${c.lineSoft}`,
            background: "#0e0e0f",
            padding: "22px 30px",
            opacity: at(frame, [52, 74], [0, 1]),
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 16,
              color: c.dim3,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            src-tauri/src/classifier.rs
          </div>
          {SNIPPET.map((l, i) => (
            <div
              key={l}
              style={{
                fontFamily: mono,
                fontSize: 21,
                lineHeight: 1.7,
                color: i === 1 ? c.add : c.dim,
                whiteSpace: "pre",
                clipPath: `inset(0 ${at(frame, [58 + i * 6, 76 + i * 6], [100, 0])}% 0 0)`,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </AbsoluteFill>

      <div style={{ position: "absolute", left: 110, top: 96, width: 1200 }}>
        <Words frame={frame} text="No model. No prompt." start={8} hold={124} size={92} />
        <Words
          frame={frame}
          text="Sixty lines of Rust you can read yourself."
          start={26}
          hold={110}
          size={52}
          color={c.dim}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ═══ IX. RELIEF ═════════════════════════════════════════════════
   The film names its enemy once — tabs, trees, breadcrumbs, palettes —
   then deletes it into the seam, and the meter from act IV drains. The
   drain is the payoff; the fill was the setup. */

export const Relief: React.FC = () => {
  const frame = useCurrentFrame();
  const ghost = inOut(frame, [4, 24], [46, 66]);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          scale: String(at(frame, [0, 100], [1.16, 1.02], CAM)),
          opacity: at(frame, [0, 26], [0.18, 1]),
          filter: `blur(${at(frame, [0, 26], [5, 0])}px)`,
        }}
      >
        <AppCard frame={480 + frame} right={<TreeView local={240 + frame} />} />

        {/* the chrome you no longer need, as wireframe, collapsing into the seam */}
        <div
          style={{
            position: "absolute",
            left: CARD.left,
            top: CARD.top,
            width: CARD.width,
            height: CARD.height,
            opacity: ghost,
            scale: `${1 - at(frame, [46, 70], [0, 1], IN)} 1`,
            transformOrigin: "center",
          }}
        >
          <div style={{ display: "flex", gap: 10, padding: 18 }}>
            {["index.ts", "limit.ts", "spec.md", "router.ts", "+"].map((t) => (
              <div
                key={t}
                style={{
                  padding: "8px 18px",
                  border: `1px dashed ${c.dim3}`,
                  fontFamily: mono,
                  fontSize: 17,
                  color: c.dim3,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "0 18px", alignItems: "flex-start" }}>
            <div
              style={{
                width: 240,
                height: 420,
                border: `1px dashed ${c.dim3}`,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {Array.from({ length: 9 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    height: 8,
                    width: `${40 + rnd(i, 11) * 55}%`,
                    background: "#1d1d1e",
                    marginLeft: (i % 3) * 16,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 60,
                width: 620,
                height: 74,
                border: `1px dashed ${c.dim3}`,
                display: "flex",
                alignItems: "center",
                padding: "0 20px",
                fontFamily: mono,
                fontSize: 20,
                color: c.dim3,
              }}
            >
              ⌘K  go to file…
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <Cap bottom={108}>
        <Words frame={frame} text="Nothing to look for." start={4} hold={46} size={104} />
      </Cap>
      <Cap bottom={108}>
        <Words
          frame={frame}
          text="It is already there."
          start={52}
          hold={46}
          size={104}
          color={c.fg}
        />
      </Cap>

      <div style={{ position: "absolute", right: 110, bottom: 118 }}>
        <Meter value={at(frame, [10, 72], [0.94, 0.04])} alarm={frame < 34} />
      </div>
    </AbsoluteFill>
  );
};
