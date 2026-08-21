"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { StoreHud } from "@/components/nav/StoreHud";

/**
 * Composes the stations and makes the visit navigable — entry (street/door) by diegetic hotspots,
 * interior (counter + walls) by the nav puck (StoreHud) and arrow/WASD keys. Both funnel through
 * `requestMove`, a tween-aware wrapper over the original click-nav: during a transition it queues
 * AT MOST ONE move and drops the rest, then plays the queued move when the clip's duration elapses.
 *
 * Decoder windowing: only the active scene and its two neighbours (active±1) are mounted.
 */

const KEEP_WINDOW = 1;

// Directed edges that CROSSFADE the scene swap (~450ms opacity dissolve) — only clip-less returns.
const CROSSFADE_EDGES = new Set<string>(["door->street", "counter->street"]);

const stationIndex = (id: StationId) => STATIONS.findIndex((s) => s.id === id);

export function StoreWalkthrough() {
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  const [cameFrom, setCameFrom] = useState<StationId | null>(null);
  const [expressAsset, setExpressAsset] = useState<TransitionAsset | null>(null);

  // Tween-queue state (refs so the timed release reads the latest values, not a stale closure).
  const activeRef = useRef(0);
  const tweeningRef = useRef(false);
  const queuedRef = useRef<StationId | null>(null);

  // Wall BROWSE/DETAIL open on the active wall → puck movement is suspended (Esc still walks).
  const [wallStateOpen, setWallStateOpen] = useState(false);
  // First-mount key hint, dismissed on the first successful move for the rest of the session.
  const [keyHintDismissed, setKeyHintDismissed] = useState(false);

  // /store is true zero-scroll. Lenis is a global root provider; stop it while /store is mounted.
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

  // De-flash cold-mounted exit targets: warm the reachable stations' posters into the image cache.
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

  const requestMoveRef = useRef<(to: StationId) => void>(() => {});

  const applyMove = useCallback((to: StationId) => {
    const cur = activeRef.current;
    const idx = stationIndex(to);
    if (idx === -1 || idx === cur) return;
    const fromId = STATIONS[cur].id;
    // Chained-express edges (counter↔Vibes) roll a side 50/50 per trip.
    const express = EXPRESS_EDGES[`${fromId}->${to}`];
    setExpressAsset(express ? express[Math.random() < 0.5 ? 0 : 1] : null);
    setCameFrom(fromId);
    activeRef.current = idx;
    setActive(idx);
    // Lock further moves for the clip's duration; release the one queued move (if any) after.
    const asset = resolveTransition(fromId, to);
    const durMs = Math.max(300, (asset?.durationSec ?? 0.5) * 1000);
    tweeningRef.current = true;
    window.setTimeout(() => {
      tweeningRef.current = false;
      const q = queuedRef.current;
      queuedRef.current = null;
      if (q) requestMoveRef.current(q);
    }, durMs);
  }, []);

  const requestMove = useCallback(
    (to: StationId) => {
      if (stationIndex(to) === activeRef.current) return;
      if (tweeningRef.current) {
        // Queue AT MOST ONE: the first move during a tween is held; further presses are ignored.
        if (queuedRef.current == null) queuedRef.current = to;
        return;
      }
      applyMove(to);
    },
    [applyMove],
  );
  useEffect(() => {
    requestMoveRef.current = requestMove;
  }, [requestMove]);

  const crossfadeActive =
    cameFrom != null && CROSSFADE_EDGES.has(`${cameFrom}->${STATIONS[active].id}`);

  const activeId = STATIONS[active].id;
  const isInterior = activeId !== "street" && activeId !== "door";
  const reachable = useMemo(
    () => new Set((STATIONS[active].exits ?? []).map((e) => e.to)),
    [active],
  );
  const dismissKeyHint = useCallback(() => setKeyHintDismissed(true), []);

  return (
    <PlaybackUnlockProvider>
      <main className="fixed inset-0 overflow-hidden bg-black">
        {STATIONS.map((station, i) => {
          if (Math.abs(i - active) > KEEP_WINDOW) return null;
          const fromId = i === active ? cameFrom : STATIONS[active].id;
          const asset =
            i === active && expressAsset
              ? expressAsset
              : resolveTransition(fromId, station.id);
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
              onWallStateChange={setWallStateOpen}
            />
          );
        })}

        {/* Interior HUD + nav puck (never on street/door). Above the frames; click-through except
            the puck itself. */}
        {isInterior ? (
          <div className="pointer-events-none absolute inset-0 z-40">
            <StoreHud
              currentId={activeId}
              reachable={reachable}
              onMove={requestMove}
              movementLocked={wallStateOpen}
              keyHintDismissed={keyHintDismissed}
              onDismissKeyHint={dismissKeyHint}
            />
          </div>
        ) : null}
      </main>
    </PlaybackUnlockProvider>
  );
}
