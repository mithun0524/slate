/* Shared with the site's design tokens — keep the two in step or the hero
   video will read as a screenshot of a different product. */

/* Lifted from the app: src/styles.css, Dark Modern. The video has to look
   like a recording of Slate, not like a different product. */
export const C = {
  bg: "#131313",       // stage, one shade under the app
  panel: "#1a1a1a",    // --bg
  panel2: "#1e1e1e",   // --bg-1
  termBg: "#1e1e1e",   // --term-bg
  line: "#2b2b2b",     // --border
  line2: "#333333",
  fg: "#e4e4e6",       // --fg
  dim: "#9d9d9d",      // --fg-mut
  dim2: "#6e6e6e",     // --fg-dim
  acc: "#d6d6d9",      // --accent (near-white, as in the app)
  accSoft: "rgba(255,255,255,.08)",
  blue: "#6cb0ff",     // --hunk
  ok: "#4ac26b",       // --add
  addBg: "rgba(70,149,74,.18)",
  bad: "#f2726b",      // --del
  delBg: "rgba(203,66,62,.2)",
  warn: "#e2b23c",     // midnight accent, used for M rows
} as const;

export const FPS = 30;
export const DURATION_S = 14;
