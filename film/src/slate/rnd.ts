/** Deterministic pseudo-random in [0,1). Math.random() is banned in Remotion —
 *  every frame must be reproducible on any renderer. */
export const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789{}()[]<>=+-_/.:;*&$#@!?|";

/** Illegible-but-code-shaped text: what an agent's output looks like when it
 *  is scrolling faster than you can read. */
export const scramble = (len: number, seed: number, frame: number) =>
  Array.from({ length: len }, (_, i) => {
    const t = Math.floor(frame / 2) + i * 7 + seed * 31;
    const r = rnd(t, seed + 1);
    return r < 0.14 ? " " : GLYPHS[Math.floor(rnd(t, seed + 2) * GLYPHS.length)];
  }).join("");

export const PATHS = [
  "src/server/router.ts",
  "src/server/index.ts",
  "src/lib/limiter.ts",
  "src/lib/window.ts",
  "src/config/defaults.ts",
  "src/server/middleware/limit.ts",
  "src/auth/session.ts",
  "tests/limiter.test.ts",
  "tests/router.test.ts",
  "docs/specs/rate-limiting.md",
  "docs/adr/0007-token-bucket.md",
  "package.json",
  "src/db/pool.ts",
  "src/server/errors.ts",
  "src/types/limit.d.ts",
  "src/lib/clock.ts",
  "src/auth/tokens.ts",
  "src/server/health.ts",
  "scripts/bench.mjs",
  "README.md",
];
