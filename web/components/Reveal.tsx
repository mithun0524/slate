"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap, reduced } from "@/lib/gsap";

/* One reveal, used everywhere. Short, small travel, no stagger theatre. */

export function Reveal({
  children,
  as: Tag = "div",
  className = "",
  delay = 0,
  y = 14,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced()) { gsap.set(el, { opacity: 1 }); return; }
    const anim = gsap.fromTo(
      el,
      { opacity: 0, y },
      {
        opacity: 1, y: 0, duration: 0.6, delay, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%" },
      }
    );
    return () => { anim.scrollTrigger?.kill(); anim.kill(); };
  }, [delay, y]);

  return <Tag ref={ref} className={`rv ${className}`.trim()}>{children}</Tag>;
}
