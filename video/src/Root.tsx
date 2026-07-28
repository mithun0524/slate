import React from "react";
import { Composition } from "remotion";
import { SlateDemo, FPS, TOTAL } from "./SlateDemo";
import { SlateFilm, TOTAL_AD } from "./Ad";
import { SlateReel, TOTAL_REEL } from "./Reel";

export const RemotionRoot: React.FC = () => (
  <>
    {/* the walkthrough: what it does, surface by surface */}
    <Composition
      id="SlateAd"
      component={SlateDemo}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* the ad: one idea — the cursor never moves */}
    <Composition
      id="SlateFilm"
      component={SlateFilm}
      durationInFrames={TOTAL_AD}
      fps={FPS}
      width={1920}
      height={1080}
    />
    {/* the reel: graded acts, 3D camera, kinetic type */}
    <Composition
      id="SlateReel"
      component={SlateReel}
      durationInFrames={TOTAL_REEL}
      fps={FPS}
      width={1920}
      height={1080}
    />
  </>
);
