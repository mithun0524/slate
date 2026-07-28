/* Bundle the composition once, then render mp4 + webm + a poster still. */
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { mkdirSync } from "node:fs";

const OUT = path.resolve("../web/public/demo");
mkdirSync(OUT, { recursive: true });

console.log("bundling…");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });

const composition = await selectComposition({ serveUrl, id: "SlateAd" });
console.log(`composition ${composition.width}x${composition.height} · ${composition.durationInFrames}f`);

/* no audio track — it is a silent UI demo and some browsers are
   fussier about autoplaying media that declares audio */
/* scale 1.5 → 2880×1620 output, so the hero stays sharp on retina */
const common = { serveUrl, composition, concurrency: 4, audioCodec: null, scale: 1.5 };

console.log("rendering mp4…");
await renderMedia({
  ...common,
  codec: "h264",
  crf: 20,
  outputLocation: path.join(OUT, "slate-ad.mp4"),
  onProgress: ({ progress }) => process.stdout.write(`\r  ${Math.round(progress * 100)}%`),
});

console.log("\nrendering webm…");
await renderMedia({
  ...common,
  codec: "vp9",
  crf: 32,
  outputLocation: path.join(OUT, "slate-ad.webm"),
  onProgress: ({ progress }) => process.stdout.write(`\r  ${Math.round(progress * 100)}%`),
});

console.log("\nrendering poster…");
await renderStill({
  serveUrl,
  composition,
  frame: 300,
  output: path.join(OUT, "slate-ad-poster.jpg"),
  imageFormat: "jpeg",
  jpegQuality: 88,
});

console.log("\ndone →", OUT);
