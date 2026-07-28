"use client";

import { useEffect, useRef, useState } from "react";

/* The hero loop (film/ → HeroLoop, 15s). Autoplays muted and looping like a
   screenshot that moves, but stays a real <video> with a control strip so it
   can be paused, restarted, and never plays at all under reduced-motion.
   The cut is stitched so frame 449 matches frame 0 — no visible loop point. */

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      setPlaying(false);
      ref.current?.pause();
    }
  }, []);

  /* don't burn frames on a video nobody is looking at */
  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && playing) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [playing, still]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) { el.play().catch(() => {}); setPlaying(true); }
    else { el.pause(); setPlaying(false); }
  };

  const restart = () => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
    setPlaying(true);
  };

  return (
    <div className="player">
      <div className="player-glow" aria-hidden="true" />
      <div className="frame">
        <video
          ref={ref}
          poster="/demo/slate-hero-poster.jpg"
          autoPlay={!still}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Slate, looping: an agent writes a spec, edits code and moves files in the left-hand shell, and the right-hand pane is already showing the spec, then the diff, then the tree — no tabs, no clicks, nothing navigated to."
        >
          <source src="/demo/slate-hero.webm" type="video/webm" />
          <source src="/demo/slate-hero.mp4" type="video/mp4" />
        </video>
        <div className="player-bar">
          <span>Slate 0.1.0 — pane B opening itself: spec, diff, tree. No keystrokes.</span>
          <span className="sp" />
          <button type="button" onClick={restart}>Restart</button>
          <button type="button" onClick={toggle} aria-pressed={!playing}>
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}
