import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { at, c, CAM, inOut, mono, sans } from "./theme";
import { Cap, Counter, Tag, Words } from "./Kinetic";
import { Grain, Meter, Scrim, Vignette } from "./Chrome";
import { DiffView, SpecView, TreeView } from "./Panes";
import { Terminal, type Line } from "./Terminal";
import { PATHS, rnd, scramble } from "./rnd";

/**
 * 9:16 cut — 1080×1920, 32s. Not the master letterboxed: the argument is
 * re-staged for a phone held in one hand.
 *
 * The one real decision here: Slate's seam is vertical, and a vertical seam in a
 * vertical frame divides nothing you can read. So the split rotates 90° — shell
 * above, the view it caused below — and the seam draws left→right instead of
 * top→bottom. The gesture (act on one side, the other side is already it)
 * survives; only its axis changes.
 */

const W = 1080;
const CAPTION = 76;

const V = {
  fear: { from: 0, dur: 330 },
  turn: { from: 330, dur: 90 },
  effect: { from: 420, dur: 360 },
  trust: { from: 780, dur: 90 },
  end: { from: 870, dur: 90 },
} as const;

export const V_TOTAL = 960;

/* ── the cost, compressed to eleven seconds ───────────────────────────── */

const PROMPT = 'claude "add rate limiting"';

const Fear: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.round(at(frame, [10, 62], [0, PROMPT.length]));
  const blink = Math.floor(frame / 15) % 2 === 0;
  const give = at(frame, [70, 96], [0, 1]);
  const box = inOut(frame, [78, 108], [172, 196]);
  const torrent = at(frame, [198, 226], [0, 1]);

  return (
    <AbsoluteFill>
      {/* everything it wrote, streaming past faster than reading speed */}
      <AbsoluteFill style={{ opacity: torrent }}>
        {Array.from({ length: 26 }, (_, i) => {
          const speed = at(frame, [198, 300], [10, 20]);
          const y = ((i * 96 - frame * speed) % (26 * 96) + 26 * 96) % (26 * 96);
          const path = PATHS[i % PATHS.length];
          const found = path === "src/auth/session.ts" && frame >= 262;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: y - 300,
                left: 72,
                fontFamily: mono,
                fontSize: 30,
                whiteSpace: "nowrap",
                color: found ? c.del : c.dim3,
                opacity: found ? 1 : at(frame, [258, 282], [0.6, 0.18]),
              }}
            >
              <span style={{ color: found ? c.del : "#3c3c3e", marginRight: 20 }}>
                {rnd(i, 2) > 0.5 ? "Write" : "Edit"}
              </span>
              {path}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* the sentence you typed */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            fontFamily: mono,
            fontSize: 42,
            color: c.fg,
            opacity: at(frame, [4, 18], [0, 1]) - give,
            scale: String(1 - give * 0.3),
            filter: `blur(${give * 3}px)`,
          }}
        >
          <span style={{ color: c.add }}>❯</span>
          {PROMPT.slice(0, chars)}
          <span
            style={{
              display: "inline-block",
              width: 22,
              height: 48,
              background: c.fg,
              translate: "0px 6px",
              opacity: chars >= PROMPT.length && !blink ? 0 : 1,
            }}
          />
        </div>

        {/* the black box: code-shaped, unreadable */}
        <div
          style={{
            position: "absolute",
            width: 880,
            height: 460,
            border: `1px solid rgba(43,43,43,${box})`,
            background: "#0c0c0d",
            overflow: "hidden",
            opacity: box,
            scale: String(0.94 + box * 0.06),
          }}
        >
          <div
            style={{
              padding: "30px 32px",
              fontFamily: mono,
              fontSize: 22,
              lineHeight: 1.9,
              color: c.dim3,
              filter: "blur(2.4px)",
              whiteSpace: "pre",
              opacity: 0.85,
            }}
          >
            {Array.from({ length: 9 }, (_, r) => scramble(38, r, frame)).join("\n")}
          </div>
        </div>
      </AbsoluteFill>

      {/* a dark plate so the instruments read over the stream, not through it */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 236,
          height: 400,
          background:
            "linear-gradient(to bottom, transparent, rgba(10,10,11,.93) 16%, rgba(10,10,11,.93) 84%, transparent)",
          opacity: inOut(frame, [200, 224], [300, 322]),
        }}
      />

      {/* the arithmetic, stacked for the format */}
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 300,
          display: "flex",
          gap: 80,
          opacity: inOut(frame, [204, 226], [300, 322]),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Counter frame={frame} from={0} to={34} range={[204, 268]} size={170} />
          <Tag frame={frame} text="written" start={212} hold={104} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span
            style={{
              fontFamily: mono,
              fontSize: 170,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: c.fg,
              scale: String(at(frame, [240, 258], [1.4, 1])),
              display: "block",
            }}
          >
            00
          </span>
          <Tag frame={frame} text="that you read" start={246} hold={70} color={c.fg2} />
        </div>
      </div>

      <Scrim />

      <Cap left={72} bottom={CAPTION} width={940}>
        <Words frame={frame} text="You gave it write access" start={84} hold={80} size={82} />
        <Words
          frame={frame}
          text="to everything you own."
          start={98}
          hold={66}
          size={82}
          color={c.dim}
        />
      </Cap>
      <Cap left={72} bottom={CAPTION} width={940}>
        <Words frame={frame} text="It wrote thirty-four files." start={200} hold={54} size={82} />
      </Cap>
      <Cap left={72} bottom={CAPTION} width={940}>
        <Words
          frame={frame}
          text="One of them touched auth."
          start={262}
          hold={56}
          size={82}
          hot={{ auth: c.del }}
        />
      </Cap>

      <div
        style={{
          position: "absolute",
          left: 72,
          top: 546,
          opacity: inOut(frame, [222, 244], [300, 322]),
        }}
      >
        <Meter value={at(frame, [222, 306], [0.3, 0.94])} alarm={frame > 250} />
      </div>
    </AbsoluteFill>
  );
};

/* ── the turn: the seam arrives on the other axis ─────────────────────── */

const Turn: React.FC = () => {
  const frame = useCurrentFrame();
  const grow = at(frame, [4, 40], [0, 1], CAM);
  const cool = at(frame, [40, 90], [0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          width: `${grow * 100}%`,
          height: 420,
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(228,228,230,.10), transparent 70%)",
          opacity: 1 - cool,
        }}
      />
      <div
        style={{
          width: `${grow * 100}%`,
          height: 1.5 + (1 - cool) * 2,
          background: `rgba(228,228,230,${0.16 + 0.84 * (1 - cool)})`,
          boxShadow: `0 0 ${60 * (1 - cool)}px rgba(228,228,230,${0.6 * (1 - cool)})`,
        }}
      />
      <Cap left={72} bottom={220} width={940}>
        <Words
          frame={frame}
          text="Trust needs a window."
          start={26}
          hold={200}
          size={92}
          color={c.dim}
          hot={{ window: c.fg }}
        />
      </Cap>
    </AbsoluteFill>
  );
};

/* ── cause and effect, rotated ────────────────────────────────────────── */

const LINES: Line[] = [
  { f: 14, verb: "Write", rest: "docs/specs/rate-limiting.md" },
  { f: 96, verb: "Read", rest: "src/lib/limiter.ts" },
  { f: 140, verb: "Edit", rest: "src/server/middleware/limit.ts" },
  { f: 214, verb: "Bash", rest: "npm test · 42 passed", ok: true },
  { f: 250, verb: "Move", rest: "lib/limiter.ts → server/limiter/" },
];

const SPEC = 34;
const DIFF = 150;
const TREE = 262;

const SHELL_H = 390;
const PANE_H = 730;
const TOP = 380;

const Effect: React.FC = () => {
  const frame = useCurrentFrame();
  /** opens outward from the horizontal seam, the same gesture on its side */
  const open = at(frame, [0, 40], [50, 0], CAM);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 40,
          top: TOP,
          width: W - 80,
          height: SHELL_H + PANE_H + 1,
          border: `1px solid ${c.line}`,
          background: c.bg,
          boxShadow: "0 60px 160px -40px rgba(0,0,0,.9)",
          clipPath: `inset(${open}% 0 ${open}% 0)`,
          overflow: "hidden",
        }}
      >
        <div style={{ height: SHELL_H, position: "relative", background: c.bg2 }}>
          <div
            style={{
              height: 52,
              borderBottom: `1px solid ${c.lineSoft}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 22px",
              fontFamily: mono,
              fontSize: 19,
              color: c.dim2,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            zsh
            <span style={{ color: c.dim3, textTransform: "none", letterSpacing: 0 }}>
              ~/acme-api
            </span>
          </div>
          <Terminal frame={frame} lines={LINES} size={24} />
        </div>

        <div style={{ height: 1, background: c.line }} />

        <div style={{ height: PANE_H, position: "relative", background: c.bg1 }}>
          {frame < DIFF ? <SpecView local={frame - SPEC} tick={48} /> : null}
          {frame >= DIFF && frame < TREE ? <DiffView local={frame - DIFF} bloom={54} /> : null}
          {frame >= TREE ? <TreeView local={frame - TREE} /> : null}
        </div>
      </div>

      {/* the impulse crossing the seam — horizontal now */}
      {[SPEC, DIFF, TREE].map((beat) => {
        const local = frame - (beat - 12);
        return (
          <div
            key={beat}
            style={{
              position: "absolute",
              left: 40,
              top: TOP + SHELL_H,
              width: W - 80,
              height: 2,
              background: c.fg,
              opacity: inOut(local, [0, 5], [10, 26]) * 0.55,
              scale: `1 ${at(local, [0, 14], [1, 3])}`,
              filter: "blur(1px)",
            }}
          />
        );
      })}

      <Cap left={72} bottom={90} width={940}>
        <Words
          frame={frame}
          text="It writes a spec →"
          start={44}
          hold={94}
          size={62}
          color={c.dim}
          hot={{ "→": c.dim2 }}
        />
        <Words frame={frame} text="the spec is open." start={56} hold={82} size={62} />
      </Cap>
      <Cap left={72} bottom={90} width={940}>
        <Words
          frame={frame}
          text="It edits code →"
          start={158}
          hold={88}
          size={62}
          color={c.dim}
          hot={{ "→": c.dim2 }}
        />
        <Words frame={frame} text="the diff is open." start={170} hold={76} size={62} />
      </Cap>
      <Cap left={72} bottom={90} width={940}>
        <Words
          frame={frame}
          text="It moves files →"
          start={272}
          hold={76}
          size={62}
          color={c.dim}
          hot={{ "→": c.dim2 }}
        />
        <Words frame={frame} text="the tree is open." start={284}  hold={64} size={62} />
      </Cap>

      <div style={{ position: "absolute", left: 72, top: 130 }}>
        <Meter value={at(frame, [20, 90], [0.94, 0.04])} alarm={frame < 44} />
      </div>
    </AbsoluteFill>
  );
};

/* ── trust, then the mark ─────────────────────────────────────────────── */

const STATS: [string, string][] = [
  ["12.4 MB", "install"],
  ["0", "outbound requests"],
  ["< 0.3%", "idle cpu"],
  ["MIT", "no account, ever"],
];

const Trust: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Words frame={frame} text="Small enough to trust." start={6} hold={150} size={84} />
      <div
        style={{
          marginTop: 70,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "44px 70px",
        }}
      >
        {STATS.map(([v, k], i) => (
          <div
            key={k}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              opacity: at(frame, [22 + i * 8, 42 + i * 8], [0, 1]),
              translate: `0px ${at(frame, [22 + i * 8, 44 + i * 8], [16, 0])}px`,
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontSize: 54,
                color: k === "outbound requests" ? c.add : c.fg,
                letterSpacing: "-0.03em",
              }}
            >
              {v}
            </span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 19,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: c.dim2,
              }}
            >
              {k}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const frame = useCurrentFrame();
  const box = at(frame, [4, 34], [0, 1], CAM);
  const seam = at(frame, [24, 44], [0, 1], CAM);
  const chev = at(frame, [38, 56], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        background: `rgba(10,10,11,${at(frame, [0, 22], [0, 1])})`,
      }}
    >
      <svg width={112} height={112} viewBox="0 0 24 24" fill="none">
        <rect
          x={2}
          y={4}
          width={20}
          height={16}
          rx={3}
          stroke={c.fg}
          strokeWidth={1.7}
          strokeDasharray={72}
          strokeDashoffset={72 - 72 * box}
        />
        <path
          d="M13.5 4v16"
          stroke={c.fg}
          strokeWidth={1.7}
          strokeDasharray={16}
          strokeDashoffset={16 - 16 * seam}
        />
        <path
          d="m5.4 9.6 2.2 2.2-2.2 2.2"
          stroke={c.add}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={7}
          strokeDashoffset={7 - 7 * chev}
        />
      </svg>

      <div
        style={{
          fontFamily: sans,
          fontSize: 126,
          fontWeight: 500,
          letterSpacing: "-0.045em",
          color: c.fg,
          overflow: "hidden",
        }}
      >
        <span style={{ display: "block", translate: `0px ${at(frame, [38, 62], [140, 0], CAM)}px` }}>
          Slate
        </span>
      </div>

      <Words
        frame={frame}
        text="The terminal that shows its work."
        start={56}
        hold={300}
        size={40}
        color={c.dim}
        tracking={-0.01}
      />

      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 26px",
          border: `1px solid ${c.line}`,
          background: c.bg1,
          fontFamily: mono,
          fontSize: 28,
          color: c.fg2,
          opacity: at(frame, [66, 84], [0, 1]),
          translate: `0px ${at(frame, [66, 86], [14, 0])}px`,
        }}
      >
        <span style={{ color: c.add }}>$</span>
        brew install --cask slate
      </div>
    </AbsoluteFill>
  );
};

export const VerticalFilm: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: c.void }}>
      <Sequence name="cost" from={V.fear.from} durationInFrames={V.fear.dur}>
        <Fear />
      </Sequence>
      <Sequence name="turn" from={V.turn.from} durationInFrames={V.turn.dur}>
        <Turn />
      </Sequence>
      <Sequence name="cause and effect" from={V.effect.from} durationInFrames={V.effect.dur}>
        <Effect />
      </Sequence>
      <Sequence name="trust" from={V.trust.from} durationInFrames={V.trust.dur}>
        <Trust />
      </Sequence>
      <Sequence name="the mark" from={V.end.from} durationInFrames={V.end.dur}>
        <End />
      </Sequence>
      <Vignette strength={0.42} />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};
