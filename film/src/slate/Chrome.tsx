import React from "react";
import { AbsoluteFill } from "remotion";
import { ACT, at, c, CAM, IN, mono } from "./theme";

/** Static turbulence tile, translated per frame — moving grain without
 *  re-evaluating an SVG filter on 1800 frames. */
const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/></filter><rect width="240" height="240" filter="url(#n)" opacity="0.55"/></svg>`,
  );

export const Grain: React.FC<{ frame: number }> = ({ frame }) => {
  /** deterministic jitter — Math.random() would break Remotion's determinism */
  const x = ((frame * 137) % 240) - 120;
  const y = ((frame * 251) % 240) - 120;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${NOISE}")`,
        backgroundSize: "240px 240px",
        translate: `${x}px ${y}px`,
        scale: "1.4",
        opacity: 0.05,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.5 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 72% at 50% 48%, transparent 40%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/**
 * The through-line. Every act before the turn is chaos with no centre; at the
 * turn all of it drains into this one hairline, which then *is* the product.
 */
export const Seam: React.FC<{ frame: number }> = ({ frame }) => {
  const t = ACT.turn.from;
  const grow = at(frame, [t + 2, t + 34], [0, 1], CAM);
  const cool = at(frame, [t + 34, t + 92], [0, 1]);
  const handOff = at(frame, [ACT.effect.from - 14, ACT.effect.from], [0, 1], IN);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* the line is a light source while it is the subject of the shot */}
      <div
        style={{
          position: "absolute",
          width: 620,
          height: `${grow * 100}%`,
          background:
            "radial-gradient(ellipse 40% 60% at 50% 50%, rgba(228,228,230,.10), transparent 70%)",
          opacity: (1 - cool) * (1 - handOff),
        }}
      />
      <div
        style={{
          width: 1.5 + (1 - cool) * 2,
          height: `${grow * 100}%`,
          background: `rgba(228,228,230,${(0.14 + 0.86 * (1 - cool)) * (1 - handOff)})`,
          boxShadow: `0 0 ${60 * (1 - cool)}px rgba(228,228,230,${0.65 * (1 - cool) * (1 - handOff)})`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Cognitive-load HUD. Introduced while the viewer is being shown the cost of
 * switching, and brought back at the end to drain — the payoff is the drain,
 * not the fill, so the same object has to appear twice.
 */
export const Meter: React.FC<{ value: number; label?: string; alarm?: boolean }> = ({
  value,
  label = "attention",
  alarm,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
    <span
      style={{
        fontFamily: mono,
        fontSize: 19,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: c.dim2,
      }}
    >
      {label}
    </span>
    <div
      style={{
        width: 300,
        height: 8,
        background: c.bg3,
        border: `1px solid ${c.line}`,
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          background: alarm ? c.del : c.dim,
          boxShadow: alarm ? `0 0 18px ${c.delBg}` : "none",
        }}
      />
    </div>
    <span
      style={{
        fontFamily: mono,
        fontSize: 19,
        color: alarm ? c.del : c.dim,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {Math.round(Math.max(0, Math.min(1, value)) * 100)}%
    </span>
  </div>
);

/** Bottom-left caption bed so type never sits directly on moving art. */
export const Scrim: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(to top, rgba(10,10,11,.92) 0%, rgba(10,10,11,.55) 28%, transparent 52%)",
      opacity,
      pointerEvents: "none",
    }}
  />
);
