import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, c, CAM, inOut, mono } from "./theme";
import { Cap, Counter, Tag, Words } from "./Kinetic";
import { Meter, Scrim } from "./Chrome";
import { PATHS, rnd, scramble } from "./rnd";

/* ═══ I. THE HANDOFF ═════════════════════════════════════════════
   One sentence, typed at human speed, in an empty frame. The viewer
   should recognise themselves doing it before anything is claimed. */

const PROMPT = 'claude "add rate limiting to the public API"';

export const Handoff: React.FC = () => {
  const frame = useCurrentFrame();
  const chars = Math.round(at(frame, [18, 96], [0, PROMPT.length]));
  const done = chars >= PROMPT.length;
  const blink = Math.floor(frame / 15) % 2 === 0;

  /** the sentence is handed over: it shrinks toward the point where the box will form */
  const give = at(frame, [112, 148], [0, 1], CAM);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: at(frame, [0, 14], [0, 1]),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          fontFamily: mono,
          fontSize: 40,
          color: c.fg,
          scale: String(1 - give * 0.34),
          opacity: 1 - give * 0.55,
          filter: `blur(${give * 3}px)`,
        }}
      >
        <span style={{ color: c.add }}>❯</span>
        <span>{PROMPT.slice(0, chars)}</span>
        <span
          style={{
            display: "inline-block",
            width: 22,
            height: 46,
            background: c.fg,
            translate: "0px 6px",
            opacity: done && !blink ? 0 : 1,
          }}
        />
      </div>

      {/* the keypress: one flare across the line, then it is not yours any more */}
      <div
        style={{
          position: "absolute",
          width: 1500,
          height: 1,
          background: c.fg,
          opacity: inOut(frame, [108, 114], [116, 132]) * 0.5,
          scale: `${at(frame, [108, 130], [0.2, 1])} 1`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ═══ II. THE BLACK BOX ══════════════════════════════════════════
   The work happens. It is legible as *code-shaped* and illegible as
   content, which is exactly the experience being sold against. */

export const BlackBox: React.FC = () => {
  const frame = useCurrentFrame();
  const form = at(frame, [0, 30], [0, 1], CAM);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: 660,
            height: 380,
            border: `1px solid rgba(43,43,43,${form})`,
            background: "#0c0c0d",
            overflow: "hidden",
            scale: String(0.92 + form * 0.08),
            boxShadow: `0 60px 140px -40px rgba(0,0,0,${form})`,
          }}
        >
          {/* unreadable interior */}
          <div
            style={{
              padding: "26px 30px",
              fontFamily: mono,
              fontSize: 19,
              lineHeight: 1.85,
              color: c.dim3,
              filter: "blur(2.2px)",
              opacity: at(frame, [22, 52], [0, 0.85]),
              whiteSpace: "pre",
            }}
          >
            {Array.from({ length: 9 }, (_, r) => scramble(46, r, frame)).join("\n")}
          </div>
        </div>

        {/* writes escaping into the dark — you own the consequences of each one */}
        {Array.from({ length: 26 }, (_, i) => {
          const born = 40 + i * 5.2;
          const local = frame - born;
          const up = rnd(i) > 0.5;
          const dir = rnd(i, 3) > 0.5 ? 1 : -1;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 40 + rnd(i, 7) * 90,
                height: 2,
                background: c.dim3,
                opacity: inOut(local, [0, 8], [26, 46]) * 0.7,
                translate: `${dir * at(local, [0, 46], [180, 620 + rnd(i, 5) * 340])}px ${
                  (up ? -1 : 1) * (60 + rnd(i, 9) * 300)
                }px`,
              }}
            />
          );
        })}
      </AbsoluteFill>

      <Scrim opacity={at(frame, [16, 40], [0, 1])} />

      <Cap>
        <Words frame={frame} text="You gave it write access" start={24} hold={112} size={100} />
        <Words
          frame={frame}
          text="to everything you own."
          start={40}
          hold={96}
          size={100}
          color={c.dim}
        />
      </Cap>

      <div
        style={{
          position: "absolute",
          right: 110,
          bottom: 104,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 10,
          opacity: inOut(frame, [46, 62], [156, 176]),
        }}
      >
        <Counter frame={frame} from={0} to={34} range={[46, 158]} size={150} />
        <Tag frame={frame} text="files written" start={52} hold={110} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══ III. THE VOID ══════════════════════════════════════════════
   Loss aversion, stated as arithmetic. Everything it wrote streams
   past faster than reading speed; the count of what you actually saw
   stays at zero, and one line in the torrent is the one that matters. */

export const Void: React.FC = () => {
  const frame = useCurrentFrame();
  const ROWS = 34;
  const speed = at(frame, [0, 60], [10, 22]);

  return (
    <AbsoluteFill>
      {/* the torrent */}
      <AbsoluteFill style={{ opacity: at(frame, [0, 20], [0, 1]) }}>
        {Array.from({ length: ROWS }, (_, i) => {
          const y = ((i * 74 - frame * speed) % (ROWS * 74) + ROWS * 74) % (ROWS * 74);
          const path = PATHS[i % PATHS.length];
          const isAuth = path === "src/auth/session.ts";
          const found = isAuth && frame > 132;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                top: y - 200,
                left: 110,
                display: "flex",
                gap: 22,
                alignItems: "baseline",
                fontFamily: mono,
                fontSize: 26,
                whiteSpace: "nowrap",
                color: found ? c.del : c.dim3,
                opacity: found ? 1 : at(frame, [132, 152], [0.85, 0.28]),
              }}
            >
              <span style={{ color: found ? c.del : "#3a3a3a" }}>
                {rnd(i, 2) > 0.5 ? "Write" : "Edit"}
              </span>
              <span>{path}</span>
              {found ? (
                <span
                  style={{
                    borderLeft: `2px solid ${c.del}`,
                    paddingLeft: 22,
                    color: c.delFg,
                    opacity: at(frame, [138, 156], [0, 1]),
                  }}
                >
                  never opened
                </span>
              ) : null}
            </div>
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, #0a0a0b 0%, transparent 22%, transparent 74%, #0a0a0b 96%)",
        }}
      />

      {/* the arithmetic */}
      <div
        style={{
          position: "absolute",
          right: 120,
          top: 300,
          display: "flex",
          gap: 90,
          alignItems: "flex-start",
          opacity: inOut(frame, [24, 44], [166, 186]),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Counter frame={frame} from={0} to={34} range={[24, 46]} size={190} color={c.fg2} />
          <Tag frame={frame} text="written" start={34} hold={130} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontFamily: mono,
              fontSize: 190,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: c.fg,
              scale: String(at(frame, [56, 74], [1.5, 1])),
              display: "block",
            }}
          >
            00
          </span>
          <Tag frame={frame} text="that you read" start={62} hold={104} color={c.fg2} />
        </div>
      </div>

      <Scrim />

      <Cap>
        <Words frame={frame} text="It wrote thirty-four files." start={6} hold={56} size={96} />
      </Cap>
      <Cap>
        <Words
          frame={frame}
          text="You read none of them."
          start={74}
          hold={46}
          size={96}
          color={c.dim}
        />
      </Cap>
      <Cap>
        <Words
          frame={frame}
          text="One of them touched auth."
          start={134}
          hold={48}
          size={96}
          hot={{ auth: c.del }}
        />
      </Cap>
    </AbsoluteFill>
  );
};

/* ═══ IV. THE TAB TAX ════════════════════════════════════════════
   The second cost is not the writing, it is the looking. The beam is
   attention; the web it leaves behind is what a session actually
   costs you. The meter is introduced here so it can be drained later. */

const WINDOWS = [
  { label: "terminal", x: -420, y: -260 },
  { label: "editor", x: 420, y: -260 },
  { label: "git diff", x: -420, y: 30 },
  { label: "spec.md", x: 420, y: 30 },
];

/** accelerating jump schedule — the thrash tightens as the session goes on */
const JUMPS = [10, 30, 48, 64, 78, 90, 100, 109, 117, 124, 130, 136, 141, 146, 150, 154, 158, 162];

export const TabTax: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = JUMPS.filter((j) => frame >= j).length;
  const target = WINDOWS[idx % WINDOWS.length];
  const prev = WINDOWS[(idx + WINDOWS.length - 1) % WINDOWS.length];
  const jumpAt = JUMPS[Math.max(0, idx - 1)] ?? 0;
  const travel = at(frame, [jumpAt, jumpAt + 7], [0, 1], CAM);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* the residue: every jump leaves a line you have to hold in your head */}
        <svg width={1920} height={1080} style={{ position: "absolute", overflow: "visible" }}>
          {JUMPS.map((j, i) => {
            const a = WINDOWS[i % WINDOWS.length];
            const b = WINDOWS[(i + 1) % WINDOWS.length];
            const p = at(frame, [j, j + 8], [0, 1]);
            return (
              <line
                key={j}
                x1={960 + a.x}
                y1={540 + a.y}
                x2={960 + a.x + (b.x - a.x) * p}
                y2={540 + a.y + (b.y - a.y) * p}
                stroke="#6a6a6d"
                strokeWidth={1.4}
                opacity={0.3 + 0.6 * at(frame, [j, j + 26], [1, 0.3])}
              />
            );
          })}
        </svg>

        {WINDOWS.map((w, i) => {
          const hot = w.label === target.label;
          return (
            <div
              key={w.label}
              style={{
                position: "absolute",
                width: 520,
                height: 280,
                translate: `${w.x}px ${w.y}px`,
                border: `1px solid ${hot ? "#3a3a3c" : c.line}`,
                background: hot ? "#191a1b" : "#101011",
                opacity: at(frame, [4 + i * 6, 24 + i * 6], [0, 1]),
                scale: String(at(frame, [4 + i * 6, 28 + i * 6], [0.96, 1])),
              }}
            >
              <div
                style={{
                  height: 44,
                  borderBottom: `1px solid ${c.lineSoft}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 18px",
                  fontFamily: mono,
                  fontSize: 18,
                  letterSpacing: "0.1em",
                  color: hot ? c.fg : c.dim2,
                }}
              >
                {w.label}
              </div>
              <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: 6 }, (_, r) => (
                  <div
                    key={r}
                    style={{
                      height: 8,
                      width: `${28 + rnd(i * 9 + r) * 62}%`,
                      background: hot ? "#333335" : "#1d1d1e",
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* attention */}
        <div
          style={{
            position: "absolute",
            width: 16,
            height: 16,
            borderRadius: 16,
            background: c.fg,
            boxShadow: `0 0 40px rgba(228,228,230,.8)`,
            translate: `${prev.x + (target.x - prev.x) * travel}px ${
              prev.y + (target.y - prev.y) * travel
            }px`,
            opacity: at(frame, [8, 20], [0, 1]),
          }}
        />
      </AbsoluteFill>

      <Scrim />

      <Cap>
        <Words frame={frame} text="Four windows." start={8} hold={84} size={100} />
        <Words frame={frame} text="One thought." start={22} hold={84} size={100} color={c.dim} />
      </Cap>
      <Cap width={1180}>
        <Words
          frame={frame}
          text="Every jump costs you the thread."
          start={112}
          hold={72}
          size={80}
        />
      </Cap>

      <div
        style={{
          position: "absolute",
          right: 110,
          bottom: 116,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 26,
          opacity: inOut(frame, [30, 48], [176, 196]),
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <Counter frame={frame} from={0} to={41} range={[30, 168]} size={104} color={c.fg2} />
          <span
            style={{
              fontFamily: mono,
              fontSize: 20,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: c.dim2,
            }}
          >
            switches
          </span>
        </div>
        <Meter value={at(frame, [30, 170], [0.1, 0.94])} alarm={frame > 96} />
      </div>
    </AbsoluteFill>
  );
};

/* ═══ V. THE BURIED CHANGE ═══════════════════════════════════════
   The third cost is the one with no workaround: the evidence expired.
   Scrubbing back is the most familiar motion in the film, and it hits
   a wall on purpose. */

export const Buried: React.FC = () => {
  const frame = useCurrentFrame();
  const BARS = 26;
  const bufferEdge = 15; // everything older than this is gone
  const head = at(frame, [24, 96], [BARS - 1, 3], CAM);

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", translate: "0px -132px" }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 300 }}>
          {Array.from({ length: BARS }, (_, i) => {
            const gone = i < BARS - bufferEdge;
            const isCulprit = i === 4;
            const scrubbedTo = head <= i + 0.5;
            const h = 40 + rnd(i, 4) * 210;
            return (
              <div
                key={i}
                style={{
                  width: 30,
                  height: h,
                  border: `1px solid ${gone ? "#242426" : "#3d3d3f"}`,
                  background: gone
                    ? "transparent"
                    : scrubbedTo
                      ? "#333335"
                      : "#1d1d1f",
                  borderColor: isCulprit && frame > 96 ? c.del : undefined,
                  opacity: at(frame, [i * 2, i * 2 + 16], [0, 1]),
                }}
              />
            );
          })}
        </div>

        {/* playhead scrubbing back until it runs out of tape */}
        <div
          style={{
            position: "absolute",
            width: 2,
            height: 380,
            background: c.fg,
            opacity: at(frame, [22, 32], [0, 0.9]) * (1 - at(frame, [100, 118], [0, 0.75])),
            translate: `${(head - (BARS - 1) / 2) * 46}px 0px`,
          }}
        />

        {/* the wall */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 620,
            height: 420,
            borderRight: `1px dashed ${c.dim3}`,
            background:
              "repeating-linear-gradient(135deg, rgba(255,255,255,.018) 0 2px, transparent 2px 9px)",
            opacity: at(frame, [86, 110], [0, 1]),
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 120,
            top: 430,
            fontFamily: mono,
            fontSize: 21,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: c.dim2,
            opacity: at(frame, [96, 116], [0, 1]),
          }}
        >
          out of buffer
        </span>
      </AbsoluteFill>

      <Scrim />

      <Cap>
        <Words
          frame={frame}
          text="“It worked ten minutes ago.”"
          start={8}
          hold={68}
          size={92}
          color={c.fg2}
        />
      </Cap>
      <Cap>
        <Words
          frame={frame}
          text="The change that broke it is gone."
          start={88}
          hold={44}
          size={92}
          hot={{ gone: c.del }}
        />
      </Cap>
    </AbsoluteFill>
  );
};
