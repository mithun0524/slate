"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, reduced } from "@/lib/gsap";

/* Smooth scroll plus a short fade between routes.
   Lenis owns the scroll position, so Next's own scroll restoration never
   lands — every route change has to reset Lenis explicitly, and in-page
   hash links have to be handed to it too. */

export default function Chrome() {
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (reduced()) return;
    const l = new Lenis({ duration: 0.9, smoothWheel: true });
    lenis.current = l;
    const raf = (time: number) => l.raf(time * 1000);
    l.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /* anchor links: let Lenis do the travelling, and keep the header clear */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.button !== 0) return;
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href");
      if (!href) return;
      const hash = href.startsWith("#") ? href
        : href.startsWith(location.pathname + "#") ? href.slice(location.pathname.length)
        : null;
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      l.scrollTo(target as HTMLElement, { offset: -80 });
      history.replaceState(null, "", hash);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  /* every route change starts at the top — unless the URL names an anchor */
  useEffect(() => {
    /* fade only what actually changed — on docs pages the sidebar and TOC
       are the same DOM nodes across routes, so blinking them is a lie */
    const main =
      document.querySelector<HTMLElement>("[data-route-fade]") ??
      document.getElementById("main");

    if (first.current) {
      first.current = false;
    } else if (!location.hash) {
      lenis.current?.scrollTo(0, { immediate: true });
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
    }

    if (!reduced() && main) {
      gsap.fromTo(main, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" });
    }
    ScrollTrigger.refresh();
  }, [pathname]);

  return null;
}
