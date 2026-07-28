import { Easing, interpolate } from "remotion";
import { loadFont as loadSans } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";

export const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/** Palette is the product's own (src/styles.css), one shade darker for the field. */
export const c = {
  void: "#0a0a0b",
  field: "#101011",
  bg: "#1a1a1a",
  bg1: "#1e1e1e",
  bg2: "#181818",
  bg3: "#262626",
  line: "#2b2b2b",
  lineSoft: "#212121",
  fg: "#e4e4e6",
  fg2: "#b6b6ba",
  dim: "#9d9d9d",
  dim2: "#6e6e6e",
  dim3: "#5c5c5f",
  add: "#4ac26b",
  addBg: "rgba(70,149,74,.18)",
  addFg: "#b9f0c7",
  del: "#f2726b",
  delBg: "rgba(203,66,62,.2)",
  delFg: "#f9c4c0",
  wlAdd: "rgba(46,160,67,.45)",
  wlDel: "rgba(248,81,73,.4)",
  hunk: "#6cb0ff",
} as const;

/** One easing family. Entrance out, exit in, camera heavier. Never linear, never bounce. */
export const OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const IN = Easing.bezier(0.7, 0, 0.84, 0);
export const CAM = Easing.bezier(0.16, 1, 0.3, 1);

/** Clamped interpolate — the whole film times off this. */
export const at = (
  frame: number,
  range: readonly [number, number],
  out: readonly [number, number],
  easing = OUT,
) =>
  interpolate(frame, range as [number, number], out as [number, number], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Rises then falls: 0 → 1 → 0. For anything that arrives and leaves. */
export const inOut = (
  frame: number,
  enter: readonly [number, number],
  exit: readonly [number, number],
) => at(frame, enter, [0, 1]) - at(frame, exit, [0, 1], IN);

/**
 * Act map, in frames at 30fps. 1800 frames = 60s.
 *
 * The film is one argument: a blind handoff is expensive (I–V), the cost is
 * removed by making cause and effect visible in one frame (VI–IX), and the
 * thing that does it is small enough to trust (X).
 */
export const ACT = {
  handoff: { from: 0, dur: 150 },
  blackbox: { from: 150, dur: 180 },
  void: { from: 330, dur: 190 },
  tabtax: { from: 520, dur: 200 },
  buried: { from: 720, dur: 140 },
  turn: { from: 860, dur: 120 },
  effect: { from: 980, dur: 330 },
  determinism: { from: 1310, dur: 150 },
  relief: { from: 1460, dur: 100 },
  trust: { from: 1560, dur: 130 },
  end: { from: 1690, dur: 110 },
} as const;

export const TOTAL = 1800;
export const FPS = 30;
