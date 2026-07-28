"use client";

import { useEffect, useState } from "react";

type Build = { title: string; sub: string; href: string; cta: string; badge: string };

const MAC_ARM: Build = {
  title: "macOS · Apple silicon",
  sub: "0.1.0 · arm64 · .dmg · 12.4 MB · macOS 12+",
  href: "/releases/Slate-0.1.0-arm64.dmg",
  cta: "Download .dmg",
  badge: "Detected",
};
const MAC_X64: Build = {
  title: "macOS · Intel",
  sub: "0.1.0 · x64 · .dmg · 13.1 MB · macOS 12+",
  href: "/releases/Slate-0.1.0-x64.dmg",
  cta: "Download .dmg",
  badge: "Detected",
};
const LINUX: Build = {
  title: "Linux · x86-64",
  sub: "0.1.0 · AppImage · 14.8 MB · glibc 2.31+",
  href: "/releases/Slate-0.1.0-x86_64.AppImage",
  cta: "Download AppImage",
  badge: "Detected",
};
const WIN: Build = {
  title: "Windows",
  sub: "Not available yet — macOS and Linux ship today",
  href: "/changelog",
  cta: "See the roadmap",
  badge: "Coming soon",
};

export default function DownloadCard() {
  const [b, setB] = useState<Build>(MAC_ARM);

  useEffect(() => {
    const plat =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
        ?.platform || navigator.platform || "";

    if (/Linux/i.test(plat) && !/Android/i.test(navigator.userAgent)) return setB(LINUX);
    if (/Win/i.test(plat)) return setB(WIN);
    if (!/Mac/i.test(plat)) return;

    /* Apple silicon reports itself as Intel in the UA string — the GPU
       renderer is the only honest signal available to a web page. */
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      const dbg = gl?.getExtension("WEBGL_debug_renderer_info");
      const r = dbg ? String(gl!.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
      if (/Intel/i.test(r)) setB(MAC_X64);
    } catch { /* keep the arm64 default */ }
  }, []);

  return (
    <div className="dlcard">
      <span className="dl-badge">{b.badge}</span>
      <span className="tag">Recommended build</span>
      <h2 className="h2">{b.title}</h2>
      <p className="dl-sub mono">{b.sub}</p>
        <a className="btn btn-lg btn-primary" href={b.href} download data-cursor="12.4 MB">
          {b.cta}
          <svg className="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2v10M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </a>
      <div className="dl-alt">
        <a className="link" href="#builds">All builds &amp; checksums</a>
        <a className="link" href="/changelog">What&apos;s new</a>
      </div>
    </div>
  );
}
