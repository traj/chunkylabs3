"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { STATIONS, resolveTransition, type StationId } from "@/data/stations";
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
  // The station we last came FROM — the source of the directed edge just traversed. Together
  // with the active station it names the edge, which is what resolves the clip to play (a
  // return plays its pre-encoded reversed asset). `null` on first mount: nothing played us in.
  const [cameFrom, setCameFrom] = useState<StationId | null>(null);
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

  // De-flash cold-mounted exit targets (e.g. Crate, two indices from the counter hub, is
  // outside the active±1 mount window — so it cold-mounts on click and would paint BLACK until
  // its poster downloads). Warm only the POSTERS of the active station's reachable exits into
  // the image cache (off-DOM Image() — no <video>, so the mounted-element count and the iOS
  // decode budget are untouched, unlike widening the window). The cold mount then paints its
  // poster immediately — a poster hold instead of a black flash. Index-adjacent targets (Mixes)
  // are already warm via the decoder window; re-priming their poster is a harmless cache hit.
  useEffect(() => {
    const activeStation = STATIONS[active];
    const posters = (activeStation.exits ?? [])
      .map((exit) => resolveTransition(activeStation.id, exit.to)?.poster)
      .filter((p): p is string => Boolean(p));
    for (const src of posters) {
      const img = new Image();
      img.src = src;
    }
  }, [active]);

  function goToId(to: StationId) {
    const idx = STATIONS.findIndex((s) => s.id === to);
    if (idx === -1 || idx === active) return;
    // Record the traversed edge before moving: `from` is the current active station (already
    // in scope — previously discarded). The new active's clip is resolved from (from → to).
    setCameFrom(STATIONS[active].id);
    setActive(idx);
  }

  return (
    <PlaybackUnlockProvider>
      {/* Fixed, full-viewport stage. Scenes are absolutely positioned inside and swap in
          place; the stage itself never moves and the page has nothing to scroll. */}
      <main className="fixed inset-0 overflow-hidden bg-black">
        {STATIONS.map((station, i) => {
          if (Math.abs(i - active) > KEEP_WINDOW) return null;
          // Edge-keyed clip resolution. The ACTIVE station plays the edge we just traversed
          // into it (cameFrom → active). A NEIGHBOUR preloads the edge we'd traverse to reach
          // it (active → neighbour). Both name the SAME edge for the station mid-transition, so
          // its <source>s never remount as it becomes active — the clip just starts playing.
          const fromId = i === active ? cameFrom : STATIONS[active].id;
          const asset = resolveTransition(fromId, station.id);
          return (
            <StationFrame
              key={station.id}
              station={station}
              asset={asset}
              index={i}
              total={total}
              activeIndex={active}
              goToId={goToId}
            />
          );
        })}
      </main>
    </PlaybackUnlockProvider>
  );
}
