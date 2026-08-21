"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import {
  STATIONS,
  resolveTransition,
  EXPRESS_EDGES,
  type StationId,
  type TransitionAsset,
} from "@/data/stations";
import { MIXES } from "@/data/catalog";
import { StationFrame } from "@/components/stations/StationFrame";
import { PlaybackUnlockProvider } from "@/components/stations/PlaybackUnlock";
import { SoundCloudProvider } from "@/components/walls/soundcloud";
import { StoreHud } from "@/components/nav/StoreHud";
import { StorePlayer } from "@/components/nav/StorePlayer";

/**
 * Composes the stations and makes the visit navigable — entry (street/door) by diegetic hotspots,
 * interior (counter + walls) by the nav puck. FULL COMPASS: every OTHER room is reachable from any
 * interior station in one press — a direct edge where one exists, otherwise the engine's circular
 * route chained at runtime (glue only, e.g. Mixes→Vibes→Crate). requestMove drives it as a route:
 * it plays each hop, continues to the final target when a hop ends, and queues AT MOST ONE further
 * press to run after the route completes.
 *
 * The SoundCloud engine + player live HERE (store level) so playback + the player persist across
 * every navigation. Decoder windowing: only active±1 scenes are mounted.
 */

const KEEP_WINDOW = 1;
const CROSSFADE_EDGES = new Set<string>(["door->street", "counter->street"]);
const stationIndex = (id: StationId) => STATIONS.findIndex((s) => s.id === id);

/** A single resolvable move (direct/express/reverse/forward — all are exits entries). */
function hasEdge(from: StationId, to: StationId): boolean {
  return (STATIONS[stationIndex(from)].exits ?? []).some((e) => e.to === to);
}

/** The hop sequence from `from` to `to`: [to] if adjacent, else circle via an intermediate. */
function routeTo(from: StationId, to: StationId): StationId[] {
  if (from === to) return [];
  if (hasEdge(from, to)) return [to];
  for (const mid of ["mixtape-shelf", "counter"] as StationId[]) {
    if (mid !== from && mid !== to && hasEdge(from, mid) && hasEdge(mid, to)) return [mid, to];
  }
  return [to]; // last resort — a single hop, resolveTransition falls back to the dest clip
}

export function StoreWalkthrough() {
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  const [cameFrom, setCameFrom] = useState<StationId | null>(null);
  const [expressAsset, setExpressAsset] = useState<TransitionAsset | null>(null);
  const [keyHintDismissed, setKeyHintDismissed] = useState(false);

  // Route state (refs so the timed hop-release reads the latest values).
  const activeRef = useRef(0);
  const tweeningRef = useRef(false);
  const finalTargetRef = useRef<StationId | null>(null);
  const queuedTargetRef = useRef<StationId | null>(null);
  const requestMoveRef = useRef<(to: StationId) => void>(() => {});
  const stepRef = useRef<() => void>(() => {});

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

  // Warm the reachable stations' posters into the image cache (de-flash cold mounts).
  useEffect(() => {
    const posters = (STATIONS[active].exits ?? [])
      .map((exit) => resolveTransition(STATIONS[active].id, exit.to)?.poster)
      .filter((p): p is string => Boolean(p));
    for (const src of posters) {
      const img = new Image();
      img.src = src;
    }
  }, [active]);

  const applyHop = useCallback((to: StationId) => {
    const cur = activeRef.current;
    const idx = stationIndex(to);
    if (idx === -1 || idx === cur) return;
    const fromId = STATIONS[cur].id;
    const express = EXPRESS_EDGES[`${fromId}->${to}`];
    setExpressAsset(express ? express[Math.random() < 0.5 ? 0 : 1] : null);
    setCameFrom(fromId);
    activeRef.current = idx;
    setActive(idx);
    const asset = resolveTransition(fromId, to);
    const durMs = Math.max(300, (asset?.durationSec ?? 0.5) * 1000);
    tweeningRef.current = true;
    window.setTimeout(() => {
      tweeningRef.current = false;
      const final = finalTargetRef.current;
      if (final && activeRef.current !== stationIndex(final)) {
        stepRef.current(); // continue the route
      } else {
        finalTargetRef.current = null;
        const q = queuedTargetRef.current;
        queuedTargetRef.current = null;
        if (q) requestMoveRef.current(q);
      }
    }, durMs);
  }, []);

  const step = useCallback(() => {
    const final = finalTargetRef.current;
    if (!final) return;
    const route = routeTo(STATIONS[activeRef.current].id, final);
    if (route.length === 0) {
      finalTargetRef.current = null;
      return;
    }
    applyHop(route[0]);
  }, [applyHop]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const requestMove = useCallback(
    (to: StationId) => {
      if (stationIndex(to) === activeRef.current && !finalTargetRef.current) return;
      if (finalTargetRef.current) {
        // Mid-route: queue AT MOST ONE further target; ignore the rest.
        if (queuedTargetRef.current == null) queuedTargetRef.current = to;
        return;
      }
      finalTargetRef.current = to;
      step();
    },
    [step],
  );
  useEffect(() => {
    requestMoveRef.current = requestMove;
  }, [requestMove]);

  const crossfadeActive =
    cameFrom != null && CROSSFADE_EDGES.has(`${cameFrom}->${STATIONS[active].id}`);

  const activeId = STATIONS[active].id;
  const dismissKeyHint = useCallback(() => setKeyHintDismissed(true), []);

  return (
    <PlaybackUnlockProvider>
      {/* Store-level SoundCloud engine — playback + the player persist across every navigation. */}
      <SoundCloudProvider primeUrl={MIXES[0]?.scUrl}>
        <main className="fixed inset-0 overflow-hidden bg-black">
          {STATIONS.map((station, i) => {
            if (Math.abs(i - active) > KEEP_WINDOW) return null;
            const fromId = i === active ? cameFrom : STATIONS[active].id;
            const asset =
              i === active && expressAsset ? expressAsset : resolveTransition(fromId, station.id);
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
                activeIndex={active}
                goToId={requestMove}
                crossfade={crossfade}
              />
            );
          })}

          {/* HUD + nav puck — travels to EVERY station (interior room-map + entry vertical variant). */}
          <div className="pointer-events-none absolute inset-0 z-40">
            <StoreHud
              currentId={activeId}
              onMove={requestMove}
              keyHintDismissed={keyHintDismissed}
              onDismissKeyHint={dismissKeyHint}
            />
          </div>

          {/* Persistent player — chrome above everything, on every station (music object). */}
          <div className="pointer-events-none absolute inset-0 z-50">
            <StorePlayer />
          </div>
        </main>
      </SoundCloudProvider>
    </PlaybackUnlockProvider>
  );
}
