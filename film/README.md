# Slate — "Trust needs a window"

A motion-graphics ad for Slate. Not a product demo: the first half is the
psychology of a blind agent handoff, the second half removes it.

| Composition | Master | Deliverable | For |
|---|---|---|---|
| `SlateFilm` | 3840×2160 · 60s · **scored** | 1080p, crf 16 | launch post, YouTube, sales |
| `HeroLoop` | 3840×2160 · 22s · silent, seamless | 1080p, crf 17 | above the fold, autoplay muted |
| `SlateVertical` | 2160×3840 · 32s · silent | 1080×1920, crf 17 | Reels / Shorts / TikTok |

```
npx remotion studio                                  # preview all three
python3 scripts/score.py                             # regenerate public/score.wav
npx remotion render SlateFilm  out/film-4k.mp4     --scale=2 --crf=14
npx remotion render HeroLoop   out/hero-4k.mp4     --scale=2 --crf=13
npx remotion render SlateVertical out/vert-4k.mp4  --scale=2 --crf=14
```

**Always render at `--scale=2` and downscale.** The compositions are 1920×1080,
so `--scale=2` renders every element at 2× — this is a DOM render, not an upscale,
so hairlines, mono text and the 1px seam are resolved at 4K and then supersampled
down with `flags=lanczos`. A direct 1080p render of the same frame is measurably
softer on exactly the things this film is made of.

The two silent cuts ship with no audio track at all (`-an`); feeds and hero videos
autoplay muted, and an empty track is just bytes.

## The web encode ladder

| File | Codec | Settings | Size |
|---|---|---|---|
| `slate-hero.webm` | VP9 | `-crf 20 -b:v 0 -cpu-used 1 -auto-alt-ref 1 -lag-in-frames 25` | 696 KB |
| `slate-hero.mp4` | H.264 | `-crf 19 -preset slow -profile:v high +faststart` | 683 KB |
| `slate-film.mp4` | H.264 + AAC 160k | `-crf 20 -preset slow +faststart` | 5.1 MB |

VP9 defaults are wrong for this film. At `-crf 34` the near-black field banded and
blocked (SSIM 0.9992 / 32.8 dB against the master) — nothing about it looked
premium. `-crf 20` off the 4K master measures 0.9996 / 36.1 dB and survives a
3.2× gamma lift with no visible banding, for 700 KB. Check any new encode that
way: lift the gamma on a dark frame and compare against the master, because SSIM
barely registers banding in shadows.

## Why it is built this way

The claim is an absence — you never go looking. An absence can't be shot, so the
film shoots its *cost* first and then deletes it:

| Act | Frames | Job | Lever |
|---|---|---|---|
| I handoff | 0–150 | one sentence, typed, in an empty frame | self-recognition |
| II black box | 150–330 | work happens, code-shaped and unreadable | loss of control |
| III the void | 330–520 | 34 written · 00 read · one touched auth | loss aversion, specificity |
| IV the tab tax | 520–720 | attention ricochets between four windows | attention residue |
| V buried | 720–860 | scrub back, hit the end of the buffer | unresolved loop |
| VI the turn | 860–980 | all of it drains into one hairline | pattern interrupt |
| VII cause and effect | 980–1310 | act on the left, the right is already it | the product, three times |
| VIII determinism | 1310–1460 | fs events → 400ms burst → classifier | mechanism beats magic |
| IX relief | 1460–1560 | ghost chrome collapses, meter drains | closure |
| X trust | 1560–1690 | 12.4 MB · 0 outbound · MIT | risk reversal |
| XI the mark | 1690–1800 | window, seam, prompt — in that order | brand |

The meter in IV is the same object as the meter in IX. The fill is the setup;
the drain is the payoff, so it has to appear twice.

## Rules the film keeps

- **No cross-fades on type.** Words rise out of their own mask (`Words`), always.
  Half-transparent glyphs over moving art read as mush.
- **One easing family** (`theme.ts`): expo-out to enter, expo-in to leave, a
  heavier curve for camera. No linear, no bounce.
- **One caption bed.** Every caption is anchored to the same baseline (`Cap`) so
  consecutive lines replace each other instead of drifting up the frame.
- **One object after the turn.** Acts VII–X are the same `AppCard` in the same
  place; only the camera moves. Nothing is ever cut to.
- **Colour is semantic.** Everything is the app's greys; green/red/blue only
  where the app itself uses them (added, deleted, hunk).
- **No `Math.random()`** — `rnd.ts` is deterministic, so renders are reproducible.

## The sound

Four sources, assembled by one script:

```
python3 scripts/score.py    →  public/bed.wav     drones, sub drops, risers, pads (synth)
sh      scripts/sfx.sh      →  public/sfx/*.wav   real recordings: switch, click, whoosh, page-turn, bell
node    scripts/vo.mjs      →  public/vo/NN.mp3   ElevenLabs, 11 lines (needs .env.local)
python3 scripts/mix.py      →  public/mix.wav     ← what the film plays
```

**Nothing mechanical is synthesised.** The first pass synthesised its clicks and
that is exactly what made it sound cheap — a synthesised click is the most obvious
tell in a mix. Every tick, switch, page turn and the bell at the turn is now a real
recording, and most are **trimmed to their first ~50ms**: a 0.4s recorded click
played whole reads as *a sound effect*, while its transient reads as the interface
itself. What stays synthesised is what synthesises well — low sines, filtered noise,
slow pads — and it lives at −7.5 dBFS to leave room above.

**The voice argues; the type states.** The captions carry the facts, so the
voiceover never reads them aloud (the one exception is the payoff line, where
hearing and seeing it together is the point). Low, calm, British male, 0.94×
speed. The bed ducks 9 dB under it with a 140 ms attack and 340 ms release;
effects duck only 3.5 dB so a tick under a line still cuts through.

**Talk is 38s of 60 — 64%.** The first cut was 71% and felt like a webinar; one
line went because it said what the captions and the line before it already said.
`scripts/mix.py` re-runs in ~10s, so check every retime by ear.

Timing is verified, not eyeballed: no line may overlap the next, run past frame
1800, or intrude on the twelve frames of silence at the turn — that silence is
the loudest thing in the film.

To change a line: edit `scripts/vo-script.json`, delete that line's mp3, re-run
`vo.mjs` (only the missing line is billed) and `mix.py`.

## The vertical cut

Slate's seam is vertical, and a vertical seam in a vertical frame divides nothing
you can read. So the 9:16 cut rotates the gesture 90° — shell above, the view it
caused below, seam drawing left→right. Same argument, one fewer act (the tab tax
and the buffer wall are cut; a phone viewer gives you eleven seconds of setup, not
twenty-four). It is a re-stage, not a letterbox.

## The hero loop

Three movements, all hung on the seam: it **opens on the lockup** (the mark draws
to the left of the line, the wordmark rises to the right — the logo's divider and
the product's seam are the same object), the line opens into the app for three
impulses, and it **closes on the CTA**. The seam dims under the type, because a
lit hairline through a line of text reads as a strike-through.

Frame 659 is the same picture as frame 0: the seam sits bright and alone at the
loop point, the app opens outward from it and drains back into it, and 660 divides
the 30-frame caret blink so the stitch carries no visible tick.

It runs full-bleed (the film frames the app as an object; a hero already sits in
the site's own card, and a card in a card leaves the product tiny). Two things
follow from filling the frame: the shell joins a session **already under way** —
`LINES` starts at negative frames, so no viewer ever sees an empty pane — and the
causal line rides a scrim in the right pane's own dead space rather than over the
log. Pane content is scaled (`zoom`) because a full-bleed pane is taller than the
film's.

## Layout

`theme.ts` tokens + act map · `Kinetic.tsx` type system (`Words`, `Cap`,
`Counter`) · `Chrome.tsx` grain, vignette, seam, meter · `ActsCost.tsx` I–V ·
`ActsTurn.tsx` VI–IX + `AppCard` · `ActsClose.tsx` X–XI · `Panes.tsx`
spec/diff/tree · `Terminal.tsx` the shell · `HeroLoop.tsx` and `VerticalFilm.tsx`
re-use all of the above · `scripts/score.py` the audio.

`public/score.wav` is generated, not committed — `python3 scripts/score.py`
rebuilds it byte-for-byte.
