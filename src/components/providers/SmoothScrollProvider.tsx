"use client";

import { ReactLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Lenis smooth-scroll, wired to GSAP with a SINGLE rAF loop.
 *
 * Per docs/research/2026-06-video-and-animation-findings.md §4.4:
 *  - `options={{ autoRaf: false }}` so Lenis does NOT run its own rAF. GSAP's ticker is
 *    the single source of truth — running both is the classic double-RAF bug.
 *  - One `gsap.ticker.add(update)` drives `lenis.raf` (seconds → milliseconds).
 *  - `lenis.on("scroll", ScrollTrigger.update)` keeps ScrollTrigger in sync.
 *  - `gsap.ticker.lagSmoothing(0)` keeps them in lockstep.
 *  - Effect uses an empty dependency array so the ticker is registered exactly once.
 *
 * Lenis only — GSAP ScrollSmoother is never enabled (do not double-smooth).
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      // GSAP ticker time is in seconds; Lenis expects milliseconds.
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const lenis = lenisRef.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);

    return () => {
      gsap.ticker.remove(update);
      lenis?.off("scroll", ScrollTrigger.update);
    };
  }, []);

  return (
    <ReactLenis root options={{ autoRaf: false }} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
