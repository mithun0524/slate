import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { at, c, CAM, mono, sans } from "./theme";
import { Tag, Words } from "./Kinetic";
import { Mark } from "./Chrome";
import { AppCard } from "./ActsTurn";
import { TreeView } from "./Panes";

/* ═══ X. SMALL ENOUGH TO TRUST ═══════════════════════════════════
   The last objection to a tool that watches your filesystem is the
   tool itself. So the closing argument is a spec sheet: nothing to
   sign up for, nothing leaving the machine, and a number for each. */

const STATS: [string, string][] = [
  ["12.4 MB", "install"],
  ["< 0.3%", "idle cpu"],
  ["0", "outbound requests"],
  ["none", "account required"],
  ["MIT", "licence"],
];

export const Trust: React.FC = () => {
  const frame = useCurrentFrame();
  const back = at(frame, [0, 46], [1.02, 0.72], CAM);
  const lift = at(frame, [0, 46], [0, -132], CAM);

  return (
    <AbsoluteFill>
      {/* the app recedes to an object you could pick up */}
      <AbsoluteFill style={{ scale: String(back), translate: `0px ${lift}px` }}>
        <AppCard frame={580 + frame} right={<TreeView local={340 + frame} />} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 280 }}>
        <Words frame={frame} text="Small enough to trust." start={26} hold={200} size={96} />
      </AbsoluteFill>

      {/* the spec sheet */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 118,
          display: "flex",
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        {STATS.map(([v, k], i) => (
          <div
            key={k}
            style={{
              padding: "0 46px",
              borderLeft: i === 0 ? "none" : `1px solid ${c.lineSoft}`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "flex-start",
              opacity: at(frame, [48 + i * 7, 68 + i * 7], [0, 1]),
              translate: `0px ${at(frame, [48 + i * 7, 70 + i * 7], [14, 0])}px`,
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontSize: 46,
                color: k === "outbound requests" ? c.add : c.fg,
                letterSpacing: "-0.03em",
              }}
            >
              {v}
            </span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 17,
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

/* ═══ XI. THE MARK ═══════════════════════════════════════════════
   The logo is the argument in 24 pixels: one window, one seam, a shell
   prompt on the left. It draws in that order on purpose. */

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 34,
        background: `rgba(10,10,11,${at(frame, [0, 26], [0, 1])})`,
      }}
    >
      <Mark frame={frame} size={104} />

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: sans,
            fontSize: 128,
            fontWeight: 500,
            letterSpacing: "-0.045em",
            color: c.fg,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              display: "block",
              translate: `0px ${at(frame, [46, 70], [140, 0], CAM)}px`,
            }}
          >
            Slate
          </span>
        </div>
      </div>

      <Words
        frame={frame}
        text="The terminal that shows its work."
        start={64}
        hold={400}
        size={46}
        color={c.dim}
        tracking={-0.01}
      />

      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 28px",
          border: `1px solid ${c.line}`,
          background: c.bg1,
          fontFamily: mono,
          fontSize: 30,
          color: c.fg2,
          opacity: at(frame, [80, 100], [0, 1]),
          translate: `0px ${at(frame, [80, 102], [14, 0])}px`,
        }}
      >
        <span style={{ color: c.add }}>$</span>
        brew install --cask slate
      </div>

      <div style={{ marginTop: 6 }}>
        <Tag frame={frame} text="macOS & Linux · free · MIT" start={92} hold={400} />
      </div>
    </AbsoluteFill>
  );
};
