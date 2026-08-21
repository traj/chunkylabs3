"use client";

import { useRef } from "react";
import {
  STATIONS,
  type Station,
  type StationId,
  type TransitionAsset,
} from "@/data/stations";
import { StationTransition } from "./StationTransition";
import { StationStill } from "./StationStill";
import { StationHotspots } from "./StationHotspots";
import { useTransitionPhase } from "./useTransitionPhase";
import { usePlaybackUnlock } from "./PlaybackUnlock";
import { WallOverlay } from "@/components/walls/WallOverlay";
import { getWallConfig } from "@/components/walls/wallConfig";

// The two entry stations run the STILL-REST model: a crisp composited still is the resting frame
// at each end, and the clip is a pure in-between that the stills dissolve into and out of.
const STREET_ID: StationId = "street";
const DOOR_ID: StationId = "door";

// The entry still (the street's own rest frame) is what the walk-up opens ON, so the door station
// starts by showing it and dissolves it into the moving clip.
const WALKUP_CLIP = "/transitions/street-door/";

// Boundary dissolves — long enough to hide the gen's whole-frame repaint delta, short enough to
// feel like a walk rather than a fade-through.
const DISSOLVE_MS = 250;

/**
 * ONE fixed camera station, rendered as a full-viewport scene.
 *
 * Layers (bottom→top): the play-through <video> (or a still), the entry stills (door only), the
 * scrim, the wall content overlay (walls only), and the diegetic hotspots (street/door only).
 * Navigation is by the store's nav puck (interior) and these hotspots (entry) — the old on-screen
 * directional CTA pills and the dev scene copy are gone.
 *
 * Every mounted frame is `absolute inset-0`; only the active scene is visible + interactive,
 * neighbours are `inert` + transparent (kept mounted so their clip preloads).
 */
export function StationFrame({
  station,
  asset,
  index,
  activeIndex,
  goToId,
  crossfade,
}: {
  station: Station;
  /** The transition clip to play, resolved by the controller from the directed EDGE into this scene. */
  asset: TransitionAsset | null;
  index: number;
  activeIndex: number;
  /** Navigate to a station (the controller's tween-aware requestMove). */
  goToId: (to: StationId) => void;
  crossfade?: "in" | "out";
}) {
  const hasTransition = Boolean(asset?.h264Src);
  const isActive = index === activeIndex;
  const { markUnlocked } = usePlaybackUnlock();

  const sectionRef = useRef<HTMLElement>(null);
  const phase = useTransitionPhase(sectionRef, {
    isActive,
    hasClip: hasTransition,
  });

  const isDoor = station.id === DOOR_ID;
  const isWalkUpEdge = Boolean(asset?.h264Src?.startsWith(WALKUP_CLIP));
  const entryStill = STATIONS.find((s) => s.id === STREET_ID)?.still;

  // AT REST — the scene is STILL (a clip played through and holds, or the edge has no clip).
  const atRest = isActive && (phase === "ended" || phase === "none");

  // Content walls (Mixes / Vibes / Crate) get the composited content layer over the held frame.
  const isWall = Boolean(getWallConfig(station.id));

  const showEntryStill = isDoor && isWalkUpEdge && phase === "idle";

  const duration = crossfade ? "duration-[450ms]" : "duration-0";
  const stack =
    crossfade === "in"
      ? "z-10 opacity-100"
      : crossfade === "out"
        ? "z-0 opacity-0"
        : isActive
          ? "z-10 opacity-100"
          : "z-0 opacity-0";

  return (
    <section
      ref={sectionRef}
      id={station.id}
      data-station={station.id}
      inert={!isActive}
      className={`absolute inset-0 flex items-center justify-center overflow-hidden transition-opacity ease-out ${duration} ${stack}`}
    >
      {/* 1. TRANSITION LAYER */}
      {hasTransition && asset ? (
        <StationTransition asset={asset} index={index} activeIndex={activeIndex} />
      ) : station.still ? (
        <div
          data-transition-layer
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${station.still})` }}
        />
      ) : (
        <div
          data-transition-layer
          aria-hidden
          className="pointer-events-none absolute inset-0"
        />
      )}

      {/* 1b. ENTRY STILLS (door only) — the crisp composites the walk-up dissolves through. */}
      {isDoor && station.still ? (
        <>
          <StationStill src={entryStill ?? station.still} visible={showEntryStill} fadeMs={DISSOLVE_MS} />
          <StationStill src={station.still} visible={atRest} fadeMs={DISSOLVE_MS} priority />
        </>
      ) : null}

      {/* scrim so overlaid content stays readable over the video */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40"
      />

      {/* CONTENT LAYER — the three content walls. Fades in only at rest. Non-wall stations: none. */}
      {isWall ? (
        <WallOverlay station={station} isActive={isActive} atRest={atRest} />
      ) : null}

      {/* HOTSPOTS — diegetic click regions on the entry scenes (storefront → door → counter). Live
          only at rest. The only nav on street/door; interior navigation is the store nav puck. */}
      {station.hotspots?.length ? (
        <StationHotspots
          hotspots={station.hotspots}
          interactive={atRest}
          onNavigate={(to) => {
            markUnlocked();
            goToId(to);
          }}
        />
      ) : null}
    </section>
  );
}
