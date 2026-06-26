"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import {
  STATIONS,
  resolveTransition,
  EXPRESS_EDGES,
  type StationId,
  type TransitionAsset,
} from "@/data/stations";
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

// Directed edges that CROSSFADE the scene swap (~450ms opacity dissolve) instead of snapping.
// Only edges with NO transition clip belong here — the dissolve stands in for the missing motion.
// Members:
//  - `door->street`: the return has no reversed clip (a reversed street→door push-in would run the
//    rain UPWARD — see REVERSE_EDGES), so without this it hard-snaps to the storefront. door
//    (cameFrom) is index-adjacent to street, so it stays mounted and cross-dissolves OUT.
//  - `counter->street`: the counter's back exit now leaves straight OUT to the street as a fade,
//    replacing the retired reversed door→counter video. NOTE: counter (idx 2) is TWO from street
//    (idx 0), outside the active±1 mount window, so — unlike door→street — the outgoing counter
//    frame is not mounted to dissolve; the street (video-less placeholder) simply fades IN. A true
//    counter-held-frame cross-dissolve would need both mount windows widened (engine work,
//    intentionally out of scope). The no-video opacity fade is the shipped behaviour.
// Video edges are NOT listed: their clip already carries the motion, so they must keep snapping
// (the scene swaps in place under the playing video). Keyed `from->to`; an edge not in this set
// is byte-identical to the previous instant swap.
const CROSSFADE_EDGES = new Set<string>(["door->street", "counter->street"]);

export function StoreWalkthrough() {
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  // The station we last came FROM — the source of the directed edge just traversed. Together
  // with the active station it names the edge, which is what resolves the clip to play (a
  // return plays its pre-encoded reversed asset). `null` on first mount: nothing played us in.
  const [cameFrom, setCameFrom] = useState<StationId | null>(null);
  // The chained-express clip chosen for the trip just started (counter↔Vibes), rolled 50/50 per
  // trip in goToId. `null` for every normal single-quarter edge. Lets the destination play the
  // randomly-routed express while the pure resolver stays deterministic (poster-warm + fallback).
  const [expressAsset, setExpressAsset] = useState<TransitionAsset | null>(null);
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
    const fromId = STATIONS[active].id;
    // Chained-express edges (counter↔Vibes) roll a side 50/50 PER TRIP — out via one wall may
    // return via the other ("circle the room"). The roll is a click-time runtime decision (kept
    // OUT of the pure resolver), stored so the destination's StationTransition plays the chosen
    // express. Set to null for every other edge so it never leaks into a normal transition.
    const express = EXPRESS_EDGES[`${fromId}->${to}`];
    setExpressAsset(express ? express[Math.random() < 0.5 ? 0 : 1] : null);
    setCameFrom(fromId);
    setActive(idx);
  }

  // Is the edge we just traversed (cameFrom → active) a gated, clip-less crossfade edge?
  const crossfadeActive =
    cameFrom != null && CROSSFADE_EDGES.has(`${cameFrom}->${STATIONS[active].id}`);

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
          // The ACTIVE station plays the controller's 50/50 express roll when the edge just
          // traversed was a chained express (counter↔Vibes); every other station/edge resolves
          // normally (neighbours preload their own edge; non-express actives use the resolver).
          const asset =
            i === active && expressAsset
              ? expressAsset
              : resolveTransition(fromId, station.id);
          // Gated crossfade role for a clip-less return (only door→street today). Active scene
          // fades in over the outgoing one, which fades out underneath — both rest at their
          // normal opacity, so non-crossfade edges stay byte-identical.
          let crossfade: "in" | "out" | undefined;
          if (crossfadeActive) {
            if (i === active) crossfade = "in";
            else if (station.id === cameFrom) crossfade = "out";
          }
          return (
            <StationFrame
              key={station.id}
              station={station}
              asset={asset}
              index={i}
              total={total}
              activeIndex={active}
              goToId={goToId}
              crossfade={crossfade}
            />
          );
        })}
      </main>
    </PlaybackUnlockProvider>
  );
}
