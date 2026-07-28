"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined" && !(gsap.core as unknown as { __slate?: boolean }).__slate) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  (gsap.core as unknown as { __slate?: boolean }).__slate = true;
}

/** True when the visitor asked for less motion. Every effect must check it. */
export const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText };
