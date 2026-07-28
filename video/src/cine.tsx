import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { P, rnd } from "./palette";

/* Camera, colour and type primitives for the reel.

   Everything here takes an ABSOLUTE frame, not a Sequence-local one. The
   reel is one continuous camera move cut into acts, so a component that
   only knows its own local time can't stay in step with the grade or the
   dolly. Pass `frame` down; don't reach for useCurrentFrame inside a
   layer that has to line up with another one. */

export const FPS = 30;
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - (1 - t) ** 3;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** 0→1 across [from,to] with an ease; clamped outside */
export const ramp = (frame: number, from: number, to: number, ease = easeInOut) =>
  ease(interpolate(frame, [from, to], [0, 1], CLAMP));

/** 1 at `at`, falling to 0 over `fall` frames either side */
export const pulse = (frame: number, at: number, fall: number) =>
  Math.max(0, 1 - Math.abs(frame - at) / fall);

/* ── the world ───────────────────────────────────────────────
   A slow drifting light field. This is what stops the black from
   reading as "nothing rendered" — there is always something moving. */

export const Nebula: React.FC<{ frame: number; hue: string; hue2?: string; power?: number }> = ({
  frame, hue, hue2 = hue, power = 1,
}) => {
  const t = frame / FPS;
  const x1 = 50 + Math.sin(t * 0.31) * 16;
  const y1 = 34 + Math.cos(t * 0.24) * 12;
  const x2 = 46 + Math.cos(t * 0.19 + 2) * 20;
  const y2 = 68 + Math.sin(t * 0.27 + 1) * 14;

  return (
    <AbsoluteFill style={{ opacity: power }}>
      <AbsoluteFill style={{
        background: `radial-gradient(1200px 780px at ${x1}% ${y1}%, ${hue}30, transparent 68%)`,
      }} />
      <AbsoluteFill style={{
        background: `radial-gradient(980px 640px at ${x2}% ${y2}%, ${hue2}22, transparent 66%)`,
      }} />
    </AbsoluteFill>
  );
};

/** film grain + vignette — the two cheapest things that stop a render
 *  looking like a render. Grain is a static SVG turbulence, not animated
 *  per-frame noise, which would strobe and wreck the encode. */
export const Grade: React.FC<{ frame: number; vignette?: string; strength?: number }> = ({
  frame, vignette = "#000", strength = 1,
}) => (
  <>
    <AbsoluteFill style={{
      background: `radial-gradient(1500px 1000px at 50% 50%, transparent 42%, ${vignette}${strength > 0.7 ? "cc" : "88"} 100%)`,
      pointerEvents: "none",
    }} />
    <AbsoluteFill style={{
      opacity: 0.045, mixBlendMode: "overlay", pointerEvents: "none",
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)'/></svg>\")",
      backgroundSize: "180px 180px",
      transform: `translate(${(frame % 3) * 7}px, ${(frame % 5) * 5}px)`,
    }} />
  </>
);

/* ── transitions ─────────────────────────────────────────────
   Real cuts, not crossfades. A crossfade between two dark scenes is
   invisible; a colour flash or a slit wipe is a beat you can feel. */

/** 2–4 frames of flat accent across the whole frame. Use ON the cut. */
export const Flash: React.FC<{ frame: number; at: number; color: string; len?: number }> = ({
  frame, at, color, len = 4,
}) => {
  if (frame < at || frame >= at + len) return null;
  const o = interpolate(frame, [at, at + 1, at + len], [0, 0.92, 0], CLAMP);
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen" }} />;
};

/** collapses the frame to a bright horizontal slit, then opens out of it */
export const SlitWipe: React.FC<{ frame: number; at: number; len: number; color: string; children: React.ReactNode }> = ({
  frame, at, len, color, children,
}) => {
  const half = len / 2;
  const closing = frame < at + half;
  const p = closing
    ? ramp(frame, at, at + half)
    : 1 - ramp(frame, at + half, at + len);
  const inset = p * 50;

  return (
    <>
      <AbsoluteFill style={{ clipPath: `inset(${inset}% 0% ${inset}% 0%)` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{
        opacity: p, pointerEvents: "none",
        background: `linear-gradient(180deg, transparent 48%, ${color} 50%, transparent 52%)`,
        filter: `blur(${2 + p * 6}px)`,
      }} />
    </>
  );
};

/** A soft dark pool behind centred type. Without it, headline text laid
 *  over the log field competes with the log lines and both lose — the
 *  copy has to win that fight, so the bed is not optional. */
export const TypeBed: React.FC<{ w?: number; h?: number; children: React.ReactNode }> = ({
  w = 1500, h = 620, children,
}) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    <div style={{
      position: "absolute", left: "50%", top: "50%", width: w, height: h,
      transform: "translate(-50%,-50%)", pointerEvents: "none",
      background: "radial-gradient(closest-side, rgba(4,5,10,.92), rgba(4,5,10,.55) 58%, transparent 78%)",
      filter: "blur(14px)",
    }} />
    <div style={{ position: "relative" }}>{children}</div>
  </div>
);

/* ── kinetic type ────────────────────────────────────────────
   Words arrive one at a time out of depth. The stagger is what makes it
   read as authored rather than as a caption appearing. */

export const Words: React.FC<{
  frame: number; from: number; text: string;
  size?: number; color?: string; weight?: number; stagger?: number;
  accent?: string; accentWords?: number[];
  font: string;
}> = ({ frame, from, text, size = 104, color = P.white, weight = 620, stagger = 3, accent, accentWords = [], font }) => (
  <div style={{
    display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `0 ${size * 0.26}px`,
    perspective: 1400,
  }}>
    {text.split(" ").map((w, i) => {
      const s = spring({ frame: frame - from - i * stagger, fps: FPS, config: { damping: 200, mass: 0.55 } });
      return (
        <span key={`${w}-${i}`} style={{
          display: "inline-block",
          fontFamily: font, fontSize: size, fontWeight: weight,
          letterSpacing: "-.045em", lineHeight: 1.04,
          color: accent && accentWords.includes(i) ? accent : color,
          opacity: s,
          transform: `translateY(${(1 - s) * size * 0.42}px) translateZ(${(1 - s) * -420}px) rotateX(${(1 - s) * 42}deg)`,
          transformOrigin: "50% 100%",
        }}>
          {w}
        </span>
      );
    })}
  </div>
);

/** a number that counts up and dwarfs everything around it */
export const BigNumber: React.FC<{
  frame: number; from: number; to: number; value: number; suffix?: string; font: string; color?: string;
}> = ({ frame, from, to, value, suffix = "", font, color = P.white }) => {
  const p = ramp(frame, from, to, easeOut);
  const s = spring({ frame: frame - from, fps: FPS, config: { damping: 200, mass: 0.7 } });
  return (
    <span style={{
      fontFamily: font, fontSize: 300, fontWeight: 700, letterSpacing: "-.06em", color,
      opacity: s, transform: `scale(${0.82 + s * 0.18})`, display: "inline-block",
      textShadow: `0 0 90px ${color}44`,
    }}>
      {Math.round(value * p)}{suffix}
    </span>
  );
};

/* ── the streaming-log field ─────────────────────────────────
   Act 1's set: the agent's output receding into depth, too fast and too
   far away to read. That unreadability IS the point of the act. */

const LOG = [
  "Read src/checkout/index.ts", "Edit src/checkout/index.ts", "Write src/checkout/retry.ts",
  "Bash npm test -- --run", "Read src/auth/session.ts", "Edit src/auth/session.ts",
  "Write src/checkout/backoff.ts", "Read tests/checkout.spec.ts", "Edit tests/checkout.spec.ts",
  "Delete src/checkout/legacy.ts", "Read src/middleware.ts", "Edit src/middleware.ts",
  "Bash npx tsc --noEmit", "Write src/checkout/types.ts", "Read package.json",
  "Edit src/auth/tokens.ts", "Bash git status --porcelain", "Read docs/retry.md",
];

export const LogField: React.FC<{ frame: number; from: number; font: string; tint: string; hot?: number }> = ({
  frame, from, font, tint, hot = -1,
}) => {
  const t = (frame - from) / FPS;
  const rows = 26;

  return (
    <AbsoluteFill style={{ perspective: 900, alignItems: "center", justifyContent: "center" }}>
      <div style={{ transformStyle: "preserve-3d", transform: "rotateX(50deg) rotateZ(-2deg)" }}>
        {Array.from({ length: rows }, (_, i) => {
          const line = LOG[i % LOG.length];
          const z = ((i * 78 + t * 300) % (rows * 78)) - rows * 39;
          const near = 1 - Math.abs(z) / (rows * 39);
          const isHot = i % LOG.length === hot;
          return (
            <div key={i} style={{
              position: "absolute", left: -560, top: -20, width: 1120,
              transform: `translateZ(${-z}px)`,
              fontFamily: font, fontSize: 26, whiteSpace: "nowrap",
              color: isHot ? P.red : tint,
              opacity: Math.max(0, near) * (isHot ? 1 : 0.28 + rnd(i) * 0.4),
              textShadow: isHot ? `0 0 26px ${P.red}` : "none",
            }}>
              <span style={{ opacity: 0.5 }}>● </span>{line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
