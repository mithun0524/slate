import React from "react";
import { at, c, mono } from "./theme";

export type Line = { f: number; verb: string; rest: string; ok?: boolean };

/** The same session as the cold open, still running — but now at the speed a
 *  person reads, because nothing has to be chased. */
export const Terminal: React.FC<{
  frame: number;
  lines: Line[];
  size?: number;
  /** extra room at the bottom, for cuts that overlay a caption strip */
  padBottom?: number;
}> = ({ frame, lines, size = 22, padBottom = 28 }) => {
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: `0 30px ${padBottom}px`,
        fontFamily: mono,
        overflow: "hidden",
        maskImage: "linear-gradient(to bottom, transparent 0, #000 16%)",
      }}
    >
      {lines
        .filter((l) => frame >= l.f)
        .map((l) => (
          <div
            key={l.f}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "baseline",
              fontSize: size,
              lineHeight: 1.95,
              whiteSpace: "nowrap",
              clipPath: `inset(0 ${at(frame - l.f, [0, 12], [100, 0])}% 0 0)`,
              translate: `0px ${at(frame - l.f, [0, 12], [5, 0])}px`,
            }}
          >
            <span style={{ color: l.ok ? c.add : c.dim3 }}>●</span>
            <span style={{ color: l.ok ? c.add : c.fg2, fontWeight: 500 }}>{l.verb}</span>
            <span style={{ color: c.dim }}>{l.rest}</span>
          </div>
        ))}

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "baseline",
          fontSize: size,
          lineHeight: 1.95,
          marginTop: 10,
        }}
      >
        <span style={{ color: c.add, fontWeight: 500 }}>❯</span>
        <span
          style={{
            display: "inline-block",
            width: size * 0.58,
            height: size * 1.2,
            background: c.fg,
            translate: `0px ${size * 0.18}px`,
            opacity: blink ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
};
