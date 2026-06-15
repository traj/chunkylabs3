"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Plumbing smoke-test: a top scroll-progress bar driven by ScrollTrigger.
 *
 * This exists to PROVE the wiring works end to end — useGSAP() in a "use client"
 * component, ScrollTrigger synced to Lenis via SmoothScrollProvider. It scrubs a DOM
 * transform (the bar's scaleX) against page scroll.
 *
 * NOTE: scrubbing a DOM transform with scroll is exactly what GSAP/Lenis are for and is
 * fully on-spec. It is NOT video scrubbing — we never bind `video.currentTime` to scroll
 * (see CLAUDE.md "Never do this"). Safe to delete once real station work begins.
 */
export function ScrollProgressBar() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".cl-progress-fill",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: "left center",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-white/5"
    >
      <div className="cl-progress-fill h-full w-full origin-left scale-x-0 bg-white/70" />
    </div>
  );
}
