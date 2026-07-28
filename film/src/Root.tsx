import { Composition } from "remotion";
import { SlateFilm } from "./slate/SlateFilm";
import { HeroLoop } from "./slate/HeroLoop";
import { VerticalFilm, V_TOTAL } from "./slate/VerticalFilm";
import { FPS, TOTAL } from "./slate/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* the film — 60s, scored */}
      <Composition
        id="SlateFilm"
        component={SlateFilm}
        durationInFrames={TOTAL}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* above the fold — 15s, silent, seamless */}
      <Composition
        id="HeroLoop"
        component={HeroLoop}
        durationInFrames={450}
        fps={FPS}
        width={1920}
        height={1080}
      />

      {/* social — 32s, 9:16, silent (feeds autoplay muted) */}
      <Composition
        id="SlateVertical"
        component={VerticalFilm}
        durationInFrames={V_TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
