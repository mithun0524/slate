# Slate — "Trust needs a window"

A motion-graphics ad for Slate. Not a product demo: the first half is the
psychology of a blind agent handoff, the second half removes it.

| Composition | Out | For |
|---|---|---|
| `SlateFilm` | 1920×1080 · 60s · **scored** | the film — launch post, YouTube, sales |
| `HeroLoop` | 1920×1080 · 15s · silent, seamless | above the fold, autoplay muted |
| `SlateVertical` | 1080×1920 · 32s · silent | Reels / Shorts / TikTok |

```
npx remotion studio                              # preview all three
python3 scripts/score.py                         # regenerate public/score.wav
npx remotion render SlateFilm                    # the film
npx remotion render HeroLoop                     # hero loop
npx remotion render SlateVertical                # 9:16
```

The two silent cuts ship with no audio track at all (`ffmpeg -an` after render);
feeds and hero videos autoplay muted, and an empty track is just bytes.

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

## The score

`scripts/score.py` synthesises `public/score.wav` from nothing — sines, filtered
noise, a deterministic LCG. No samples, no licences, ~4s to render, and every cue
is placed off the same frame numbers as the picture, so re-timing an act means
moving one number in each place.

It is a tension curve, not a soundtrack: room tone and a low drone that tighten
through the four cost acts (a tick per typed character, a tick per escaped write,
a tick per window switch, accelerating with the picture), a **hard cut to silence
at the turn**, one bell as the seam draws, then a calm pad that resolves into the
only consonant chord in the film on the end card. Peak −3.2 dBFS, mean −19.4.

## The vertical cut

Slate's seam is vertical, and a vertical seam in a vertical frame divides nothing
you can read. So the 9:16 cut rotates the gesture 90° — shell above, the view it
caused below, seam drawing left→right. Same argument, one fewer act (the tab tax
and the buffer wall are cut; a phone viewer gives you eleven seconds of setup, not
twenty-four). It is a re-stage, not a letterbox.

## The hero loop

Frame 449 is the same picture as frame 0: the seam sits bright and alone at the
loop point, the app opens outward from it and drains back into it, and 450 divides
the 30-frame caret blink so the stitch carries no visible tick.

## Layout

`theme.ts` tokens + act map · `Kinetic.tsx` type system (`Words`, `Cap`,
`Counter`) · `Chrome.tsx` grain, vignette, seam, meter · `ActsCost.tsx` I–V ·
`ActsTurn.tsx` VI–IX + `AppCard` · `ActsClose.tsx` X–XI · `Panes.tsx`
spec/diff/tree · `Terminal.tsx` the shell · `HeroLoop.tsx` and `VerticalFilm.tsx`
re-use all of the above · `scripts/score.py` the audio.

`public/score.wav` is generated, not committed — `python3 scripts/score.py`
rebuilds it byte-for-byte.
