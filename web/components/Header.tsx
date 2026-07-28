"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/download", label: "Download" },
  { href: "/docs", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
];

export function Mark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13.5 4v16" stroke="currentColor" strokeWidth="1.7" />
      <path d="m5.4 9.6 2.2 2.2-2.2 2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hdr = useRef<HTMLElement>(null);

  /* the pill tightens once you leave the top of the page */
  useEffect(() => {
    const onScroll = () => hdr.current?.classList.toggle("stuck", window.scrollY > 12);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.dataset.menu = open ? "open" : "";
    document.body.classList.toggle("lock", open);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  const current = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="hdr" ref={hdr}>
      <div className="hdr-in">
        <Link className="brand" href="/" aria-label="Slate — home">
          <Mark />
          <span>Slate</span>
        </Link>

        <nav className="nav" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href) ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>

        <Link className="hdr-cta" href="/download">Get Slate</Link>

        <button
          className="burger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="menu"
          onClick={() => setOpen((o) => !o)}
        >
          <i />
        </button>
      </div>

      <button
        className="menu-scrim"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
      />

      <div className="menu" id="menu" inert={!open}>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} aria-current={current(n.href) ? "page" : undefined}>
            {n.label}
          </Link>
        ))}
        <Link className="btn btn-primary" href="/download">Download for macOS</Link>
      </div>
    </header>
  );
}
