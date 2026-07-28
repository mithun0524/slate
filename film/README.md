# Slate — "Trust needs a window"

A 60s motion-graphics ad for Slate. Not a product demo: the first half is the
psychology of a blind agent handoff, the second half removes it.

```
npx remotion studio              # preview
npx remotion render SlateFilm    # 1920×1080 · 30fps · 1800 frames
```

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

Silent by design (autoplay-muted hero). If it needs sound, the cut points are the
act boundaries above.

## Layout

`theme.ts` tokens + act map · `Kinetic.tsx` type system · `Chrome.tsx` grain,
vignette, seam, meter · `ActsCost.tsx` I–V · `ActsTurn.tsx` VI–IX + `AppCard` ·
`ActsClose.tsx` X–XI · `Panes.tsx` spec/diff/tree · `Terminal.tsx` the shell.
