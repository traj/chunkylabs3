"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { STATIONS, type StationId } from "@/data/stations";
import { StationFrame } from "@/components/stations/StationFrame";
import { PlaybackUnlockProvider } from "@/components/stations/PlaybackUnlock";

/**
 * Composes the stations and makes the visit navigable by CLICK ONLY — no scroll.
 *
 * The store is a Flash/SWF-style zero-scroll experience: the visitor occupies ONE scene
 * filling the viewport, and on-screen directional CTAs (`station.exits`, rendered by
 * StationFrame) drive movement. Clicking an exit calls `goToId`, which sets the target
 * active; its `transitionIn` clip plays and the new scene swaps IN PLACE — zero viewport
 * motion. STATIONS stays the single source of order.
 *
 * Decoder windowing (Fork B layout): we mount only the active scene and its two immediate
 * neighbors (active±1) — the exact same window StationTransition keeps live sources for
 * (KEEP_WINDOW = 1). Non-windowed stations are not in the DOM at all, so at most the active
 * scene + 2 neighbors ever hold a <video>/decoder. The neighbors preload (paused on their
 * poster) so the next scene's clip is ready the instant it becomes active.
 */

// Mirror StationTransition's KEEP_WINDOW: mount active±1 so the decode budget (~3) holds.
const KEEP_WINDOW = 1;

export function StoreWalkthrough() {
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  const total = STATIONS.length;

  // /store is true zero-scroll. Lenis is a GLOBAL root provider (it must keep working on
  // /music), so we don't tear it down — we stop it while /store is mounted and start it
  // again on unmount. Also pin <html> overflow as a belt-and-braces native-scroll lock.
  useEffect(() => {
    lenis?.stop();
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevOverflow;
      lenis?.start();
    };
  }, [lenis]);

  function goToId(to: StationId) {
    const idx = STATIONS.findIndex((s) => s.id === to);
    if (idx !== -1) setActive(idx);
  }

  return (
    <PlaybackUnlockProvider>
      {/* Fixed, full-viewport stage. Scenes are absolutely positioned inside and swap in
          place; the stage itself never moves and the page has nothing to scroll. */}
      <main className="fixed inset-0 overflow-hidden bg-black">
        {STATIONS.map((station, i) =>
          Math.abs(i - active) <= KEEP_WINDOW ? (
            <StationFrame
              key={station.id}
              station={station}
              index={i}
              total={total}
              activeIndex={active}
              goToId={goToId}
            />
          ) : null,
        )}
      </main>
    </PlaybackUnlockProvider>
  );
}
