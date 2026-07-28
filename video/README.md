# Slate hero demo (Remotion)

Renders `web/public/demo/slate-ad.{mp4,webm}` and the poster still.

```
npm run studio   # preview + scrub at http://localhost:3000
npm run render   # writes straight into ../web/public/demo
```

1920×1080 · 30fps · no audio track · 1530 frames (51s).

## Beats

`src/SlateDemo.tsx` assembles nine `<Sequence>`s. Frame counts live in
`SCENES` — change them there and `TOTAL` follows.

| Beat | Len | What it sells |
|---|---|---|
| hook | 4.0s | you start the agent, then you go blind |
| problem | 4.0s | 200 lines scroll past; one touched auth |
| product | 8.5s | the pane follows the work, on its own |
| writeback | 5.5s | tick a box here, the file changes on disk |
| steer | 8.5s | the agent narrates, then asks, and blocks |
| replay | 7.5s | scrub back through the diffs it kept |
| breadth | 7.0s | source control / timeline / search, ~2.3s each |
| claim | 2.5s | it switches itself |
| end | 3.5s | name, price, platforms |

The five product beats render through one `<Shell>` and run back-to-back
with **no fade between them** (`<SceneFade in={false} out={false}>`). The
window must not blink across those cuts — pane B changing *is* the
transition, and a fade breaks the illusion of one continuous session.

## Files

- `src/SlateDemo.tsx` — the beats, their timings, and the captions.
- `src/chrome.tsx` — the window: title bar, tab strips, status bar,
  `<Shell>` (the frame everything renders into), `<Term>`, and the
  original reactive-loop scene (`<App>`).
- `src/panes.tsx` — pane-B fills for the newer beats, plus `<Cursor>`,
  `<Toast>` and `<ApprovalCard>`.
- `src/theme.ts` — colours copied from the app (`src/styles.css`, Dark
  Modern). Change them there, not inline, or the video drifts from the
  site.

## Geometry

The window is `px(904)×px(404)` drawn at `SCALE = 2`. Title bar 36, tab
strips 41, status bar 24 — so pane B's content box starts at window
`y = px(77)` and pane B's left edge is `x = px(452)`.

Anything the cursor has to click exports its own coordinates
(`checkTarget()`, `APPROVE_BTN`) so the target and the pointer can't
drift apart. If you move a clickable, move its constant.

## Known gap

Every frame is hand-drawn React, not a screen recording — it tracks the
design tokens but not the real app's behaviour. If a pane's layout
changes in `src/components/`, nothing here fails; it just quietly goes
stale. Re-watch the ad after any visible UI change.

Note: Remotion is free for individuals and companies under 4 people; larger
companies need a licence (remotion.pro).
