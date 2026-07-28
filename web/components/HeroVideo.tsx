"use client";

import { useEffect, useRef, useState } from "react";

/* The hero demo. Autoplays muted and looping like a screenshot that moves,
   but stays a real <video> with a control strip so it can be paused,
   restarted, and never plays at all under reduced-motion. */

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
          poster="/demo/slate-ad-poster.jpg"
          autoPlay={!still}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Slate ad: an agent edits files while the right-hand pane switches itself between spec, changes and diff; ticking a checkbox in the rendered spec writes back to the file; the agent narrates a note and blocks on an approval; the activity log replays each event's diff."
        >
          <source src="/demo/slate-ad.webm" type="video/webm" />
          <source src="/demo/slate-ad.mp4" type="video/mp4" />
        </video>
        <div className="player-bar">
          <span>Slate 0.1.0 — pane B switching on its own, no keystrokes</span>
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
