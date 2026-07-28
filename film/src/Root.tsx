import { Composition } from "remotion";
import { SlateFilm } from "./slate/SlateFilm";
import { FPS, TOTAL } from "./slate/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SlateFilm"
      component={SlateFilm}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
