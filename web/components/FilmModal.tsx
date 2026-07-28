"use client";

import { useRef } from "react";

/* The 60s film, click-to-play in a native <dialog> — Esc, focus trapping and
   the backdrop come free from the platform, so this is a button and a ref.
   preload="none" so a page view costs nothing; the file is only fetched by
   someone who asked for it. */

export default function FilmModal() {
  const dlg = useRef<HTMLDialogElement>(null);
  const vid = useRef<HTMLVideoElement>(null);

  const open = () => {
    dlg.current?.showModal();
    vid.current?.play().catch(() => {});
  };

  const close = () => {
    vid.current?.pause();
    dlg.current?.close();
  };

  return (
    <>
      <button type="button" className="film-cta" onClick={open}>
        <svg className="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M5.5 3.5 12 8l-6.5 4.5v-9Z" fill="currentColor" />
        </svg>
        Watch the film
        <span className="sep">·</span>
        <span className="film-cta-meta">60s, with sound</span>
      </button>

      <dialog
        ref={dlg}
        className="film-dlg"
        aria-label="Slate — Trust needs a window"
        onClose={() => vid.current?.pause()}
        onClick={(e) => {
          if (e.target === dlg.current) close();
        }}
      >
        <video
          ref={vid}
          width={1920}
          height={1080}
          controls
          playsInline
          preload="none"
          poster="/demo/slate-film-poster.jpg"
          src="/demo/slate-film.mp4"
          aria-label="Slate — Trust needs a window. A one-minute film: an agent is handed write access and writes thirty-four files you never read, one of them touching auth; four windows compete for one thought; the change that broke the build has scrolled out of the buffer. All of it collapses into a single vertical line, which becomes Slate's centre seam — the agent works on the left and the right half is already showing the spec, the diff, the tree. Then the sixty lines of Rust that decide which, and the spec sheet: 12.4 MB, no outbound requests, no account, MIT."
        >
          {/* the voice reads the on-screen captions word-for-word, so the VO
              script is also the transcript — scripts/vtt.py writes this */}
          <track
            kind="captions"
            src="/demo/slate-film.en.vtt"
            srcLang="en"
            label="English"
            default
          />
        </video>
        <button type="button" className="film-close" onClick={close} aria-label="Close">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </dialog>
    </>
  );
}
