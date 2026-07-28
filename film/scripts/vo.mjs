/**
 * Generate the voiceover with ElevenLabs.
 *
 *   node scripts/vo.mjs            # reads scripts/vo-script.json → public/vo/NN.mp3
 *
 * Needs ELEVENLABS_API_KEY, read from film/.env.local (gitignored) or the
 * environment. Lines already generated are skipped, so re-running after editing
 * one line only costs that line — delete a file to force it.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(`${root}scripts/vo-script.json`, "utf8"));

let key = process.env.ELEVENLABS_API_KEY;
if (!key && existsSync(`${root}.env.local`)) {
  key = readFileSync(`${root}.env.local`, "utf8").match(/ELEVENLABS_API_KEY=(.+)/)?.[1]?.trim();
}
if (!key) {
  console.error(
    "No ELEVENLABS_API_KEY.\n" +
      "  printf 'ELEVENLABS_API_KEY=%s\\n' 'sk_...' > film/.env.local",
  );
  process.exit(1);
}

mkdirSync(`${root}public/vo`, { recursive: true });

for (const line of cfg.lines) {
  const out = `${root}public/vo/${line.id}.mp3`;
  if (existsSync(out)) {
    console.log(`· ${line.id} exists, skipping`);
    continue;
  }

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice}`, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: line.text,
      model_id: cfg.model,
      voice_settings: cfg.settings,
    }),
  });

  if (!res.ok) {
    console.error(`✗ ${line.id} — ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  writeFileSync(out, Buffer.from(await res.arrayBuffer()));

  /** the mixer needs to know how long each line runs to duck the bed under it */
  const dur = execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    out,
  ])
    .toString()
    .trim();
  console.log(`✓ ${line.id}  ${(+dur).toFixed(2)}s  "${line.text.slice(0, 46)}…"`);
}

console.log("\npublic/vo/ written. Next: python3 scripts/mix.py");
