import React from "react";
import { at, c, CAM, IN, mono, OUT, sans } from "./theme";

/**
 * Type never fades on opacity alone — every word rises out of its own mask and
 * leaves the same way. Half-transparent glyphs over moving art read as mush,
 * and this film has moving art under every caption.
 */
export const Words: React.FC<{
  frame: number;
  text: string;
  start?: number;
  hold?: number;
  size?: number;
  weight?: number;
  color?: string;
  family?: string;
  tracking?: number;
  stagger?: number;
  /** words listed here get the accent colour */
  hot?: Record<string, string>;
}> = ({
  frame,
  text,
  start = 0,
  hold = 70,
  size = 104,
  weight = 500,
  color = c.fg,
  family = sans,
  tracking = -0.032,
  stagger = 3,
  hot,
}) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      gap: `0 ${size * 0.26}px`,
      fontFamily: family,
      fontSize: size,
      fontWeight: weight,
      letterSpacing: `${tracking}em`,
      lineHeight: 1.08,
      color,
    }}
  >
    {text.split(" ").map((word, i) => {
      const enter = start + i * stagger;
      const key = word.replace(/[.,—]/g, "");
      return (
        <span
          key={`${word}-${i}`}
          style={{ display: "block", overflow: "hidden", paddingBottom: size * 0.08 }}
        >
          <span
            style={{
              display: "block",
              color: hot?.[key] ?? "inherit",
              translate: `0px ${
                at(frame, [enter, enter + 16], [size * 1.1, 0]) +
                at(frame, [start + hold, start + hold + 12], [0, -size * 1.1], IN)
              }px`,
            }}
          >
            {word}
          </span>
        </span>
      );
    })}
  </div>
);

/**
 * Caption bed. Every caption group in the film is anchored to the same
 * baseline and stacked on top of each other, so consecutive lines replace
 * each other in place instead of drifting up the frame as siblings.
 */
export const Cap: React.FC<{
  children: React.ReactNode;
  left?: number;
  bottom?: number;
  width?: number;
}> = ({ children, left = 110, bottom = 104, width = 1450 }) => (
  <div style={{ position: "absolute", left, bottom, width }}>{children}</div>
);

/** Small mono label with a pip — the film's only chrome-like element. */
export const Tag: React.FC<{
  frame: number;
  text: string;
  start?: number;
  hold?: number;
  color?: string;
  pip?: string;
}> = ({ frame, text, start = 0, hold = 90, color = c.dim2, pip }) => {
  const p = at(frame, [start, start + 14], [0, 1]) - at(frame, [start + hold, start + hold + 10], [0, 1], IN);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: mono,
        fontSize: 22,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color,
        opacity: p,
        translate: `${(1 - p) * -14}px 0px`,
      }}
    >
      {pip ? (
        <span
          style={{ width: 8, height: 8, borderRadius: 8, background: pip, scale: String(p) }}
        />
      ) : null}
      {text}
    </div>
  );
};

/** Odometer digits. Counting is the cheapest way to make a number feel like a cost. */
export const Counter: React.FC<{
  frame: number;
  from: number;
  to: number;
  range: readonly [number, number];
  size?: number;
  color?: string;
  pad?: number;
  easing?: typeof OUT;
}> = ({ frame, from, to, range, size = 200, color = c.fg, pad = 2, easing = OUT }) => {
  const v = Math.round(at(frame, range, [from, to], easing));
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: size,
        fontWeight: 400,
        letterSpacing: "-0.04em",
        color,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
      }}
    >
      {String(v).padStart(pad, "0")}
    </span>
  );
};

/** Hairline that draws itself. Used as a divider, an axis and a seam. */
export const Rule: React.FC<{
  frame: number;
  range: readonly [number, number];
  vertical?: boolean;
  length?: number | string;
  color?: string;
  thickness?: number;
  origin?: "start" | "center";
  style?: React.CSSProperties;
}> = ({
  frame,
  range,
  vertical,
  length = "100%",
  color = c.line,
  thickness = 1,
  origin = "start",
  style,
}) => {
  const p = at(frame, range, [0, 1], CAM);
  return (
    <div
      style={{
        background: color,
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        scale: vertical ? `1 ${p}` : `${p} 1`,
        transformOrigin: origin === "center" ? "center" : vertical ? "top" : "left",
        ...style,
      }}
    />
  );
};
