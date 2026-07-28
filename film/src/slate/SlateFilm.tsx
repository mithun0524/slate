import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { ACT, c } from "./theme";
import { Grain, Seam, Vignette } from "./Chrome";
import { BlackBox, Buried, Handoff, TabTax, Void } from "./ActsCost";
import { Determinism, Effect, Relief, Turn } from "./ActsTurn";
import { End, Trust } from "./ActsClose";

/**
 * SLATE — "Trust needs a window"
 *
 * Eleven acts, one argument, no cuts to anything that isn't already on
 * screen. The first half is the cost of a blind handoff (the fear), the
 * second half removes it (the relief), and the last two acts make the
 * thing doing it small enough to believe.
 */
export const SlateFilm: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: c.void }}>
      <Sequence name="I · handoff" from={ACT.handoff.from} durationInFrames={ACT.handoff.dur}>
        <Handoff />
      </Sequence>
      <Sequence name="II · black box" from={ACT.blackbox.from} durationInFrames={ACT.blackbox.dur}>
        <BlackBox />
      </Sequence>
      <Sequence name="III · the void" from={ACT.void.from} durationInFrames={ACT.void.dur}>
        <Void />
      </Sequence>
      <Sequence name="IV · the tab tax" from={ACT.tabtax.from} durationInFrames={ACT.tabtax.dur}>
        <TabTax />
      </Sequence>
      <Sequence name="V · buried" from={ACT.buried.from} durationInFrames={ACT.buried.dur}>
        <Buried />
      </Sequence>

      {/* the hinge of the film */}
      <Seam frame={frame} />

      <Sequence name="VI · the turn" from={ACT.turn.from} durationInFrames={ACT.turn.dur}>
        <Turn />
      </Sequence>
      <Sequence name="VII · cause and effect" from={ACT.effect.from} durationInFrames={ACT.effect.dur}>
        <Effect />
      </Sequence>
      <Sequence
        name="VIII · determinism"
        from={ACT.determinism.from}
        durationInFrames={ACT.determinism.dur}
      >
        <Determinism />
      </Sequence>
      <Sequence name="IX · relief" from={ACT.relief.from} durationInFrames={ACT.relief.dur}>
        <Relief />
      </Sequence>
      <Sequence name="X · trust" from={ACT.trust.from} durationInFrames={ACT.trust.dur}>
        <Trust />
      </Sequence>
      <Sequence name="XI · the mark" from={ACT.end.from} durationInFrames={ACT.end.dur}>
        <End />
      </Sequence>

      <Vignette />
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};
