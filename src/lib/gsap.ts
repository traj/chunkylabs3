/**
 * Central GSAP setup. The ONLY place plugins get registered.
 *
 * Why this exists (see docs/research/2026-06-video-and-animation-findings.md §4.3):
 *  - Plugins must be registered exactly once, guarded by `typeof window !== "undefined"`,
 *    so SSR never touches `window` and Strict Mode double-mounts don't double-register.
 *  - Import this module from "use client" components only. It is intentionally NOT
 *    marked "use client" itself so it can be a shared leaf, but ScrollTrigger is a
 *    browser plugin — keep it out of server component render paths.
 *
 * Smooth scroll is Lenis, NOT GSAP ScrollSmoother (see §4.4 / CLAUDE.md "Never do this").
 * ScrollSmoother is intentionally never imported or registered here.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// This module is an ES singleton — it evaluates exactly once per bundle, so this runs
// once. The `typeof window` guard keeps it off the server (SSR never touches `window`).
// `registerPlugin` is idempotent, so it's also safe under Strict Mode remounts and HMR.
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export { gsap, ScrollTrigger, useGSAP };
