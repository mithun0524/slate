/* The ad's palette — deliberately *not* the app's.

   The product's own UI is near-black and almost achromatic by design, and
   30 seconds of that reads as dead footage. So the film grades in colour
   around the product: each act owns a hue, the hue carries the emotion,
   and the app keeps its real tokens wherever it is actually on screen.

   Act order is also a colour order — cold → alarm → warm → resolved. */

export const P = {
  ink: "#06070c",        // the void everything sits in
  inkSoft: "#0b0d16",

  blue: "#4d7cff",       // act 1 — the machine working in the dark
  blueDeep: "#16204a",

  red: "#ff5a52",        // act 2 — the blind spot
  redDeep: "#3a0f12",

  violet: "#9b6cff",     // spec
  amber: "#ffab3d",      // activity, the audit trail
  green: "#3ddc84",      // resolution
  greenDeep: "#0d2b1c",

  white: "#f4f5f8",
  mute: "#8b90a3",
  dim: "#4a4f61",
} as const;

/** deterministic pseudo-random — Remotion frames must be reproducible */
export const rnd = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
