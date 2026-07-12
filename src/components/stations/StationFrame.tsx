"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  STATIONS,
  type Station,
  type StationExit,
  type StationId,
  type TransitionAsset,
} from "@/data/stations";
import { StationTransition } from "./StationTransition";
import { StationStill } from "./StationStill";
import { StationHotspots } from "./StationHotspots";
import { useTransitionPhase } from "./useTransitionPhase";
import { usePlaybackUnlock } from "./PlaybackUnlock";

// The two entry stations run the STILL-REST model: a crisp composited still is the resting frame
// at each end, and the clip is a pure in-between that the stills dissolve into and out of.
const STREET_ID: StationId = "street";
const DOOR_ID: StationId = "door";

// The entry still (the street's own rest frame) is what the walk-up opens ON, so the door station
// starts by showing it and dissolves it into the moving clip. Only this edge: any other clip into
// the door would begin somewhere else entirely, and painting the storefront over it is nonsense.
const WALKUP_CLIP = "/transitions/street-door/";

// Boundary dissolves. Both ends get the same ~250ms: long enough to hide the gen's whole-frame
// repaint delta (the clip's endpoints are ~16-17 MAD off the composites), short enough that the
// entry still feels like a walk rather than a fade-through.
const DISSOLVE_MS = 250;

// Fixed edge safe zones for directional exit CTAs, keyed by StationExit.direction. ONE shared
// map for every station; the scene copy (lower-left, bounded) is positioned to clear all of
// them, so copy and CTAs can never overlap (TASK 5). The -translate-* keeps a button centred on
// its edge midpoint. `up`/`down` reuse top/bottom-centre; an exit with no direction falls back
// to the forward (bottom-centre) zone.
const EXIT_ZONE: Record<NonNullable<StationExit["direction"]>, string> = {
  back: "left-5 top-5 sm:left-6 sm:top-6",
  left: "left-5 top-1/2 -translate-y-1/2 sm:left-6",
  right: "right-5 top-1/2 -translate-y-1/2 sm:right-6",
  forward: "bottom-6 left-1/2 -translate-x-1/2",
  up: "left-1/2 top-5 -translate-x-1/2 sm:top-6",
  down: "bottom-6 left-1/2 -translate-x-1/2",
};

/**
 * ONE fixed camera station, rendered as a full-viewport scene (Fork B layout).
 *
 * Two composited layers, exactly as the real design stacks them:
 *  1. Transition layer — when the station has a clip, the play-through <video>
 *     (StationTransition) mounts here. The first station (street) has none, so it shows the
 *     empty, labeled placeholder box instead.
 *  2. DOM layer — live text/CTAs over the scene, including the directional `exits` that
 *     drive click-to-navigate.
 *
 * Layout: every mounted frame is `absolute inset-0`, so the active scene and its (hidden)
 * neighbors stack on the SAME spot — switching active swaps the visible scene IN PLACE with
 * zero viewport motion. Only the active scene is visible and interactive; neighbors are kept
 * in the DOM (so their video preloads / the decoder window holds) but made `inert` +
 * transparent so they take no clicks, focus, or screen-reader attention.
 */
export function StationFrame({
  station,
  asset,
  index,
  total,
  activeIndex,
  goToId,
  crossfade,
}: {
  station: Station;
  /**
   * The transition clip to play, resolved by the controller from the directed EDGE that leads
   * to this scene (forward arrival or a pre-encoded reverse), not from `station.transitionIn`.
   * `null` when the edge has no clip (e.g. the initial street mount) → the empty placeholder.
   */
  asset: TransitionAsset | null;
  index: number;
  total: number;
  activeIndex: number;
  goToId: (to: StationId) => void;
  /**
   * Scene-swap crossfade role for the edge currently being traversed (set ONLY for the
   * controller's gated crossfade edges — see StoreWalkthrough CROSSFADE_EDGES). `"in"` = the
   * incoming scene fading up (z-10, opacity 0→1); `"out"` = the outgoing scene fading down
   * (z-0, opacity 1→0). Both land on their normal resting opacity, so the rested state is
   * identical to a hard snap. `undefined` (every video edge) = instant swap, unchanged.
   */
  crossfade?: "in" | "out";
}) {
  const hasTransition = Boolean(asset?.h264Src);
  const isActive = index === activeIndex;
  const { markUnlocked } = usePlaybackUnlock();

  // Element-overlay wiring (entry stations only). `phase` watches THIS station's <video> from
  // the outside — the engine owns playback and stays untouched (see useTransitionPhase). It is
  // told about activation so a stale `ended` from a PREVIOUS visit can't paint the crisp marks
  // over a re-armed, moving clip (the re-entry bug — see the hook).
  const sectionRef = useRef<HTMLElement>(null);
  const phase = useTransitionPhase(sectionRef, {
    isActive,
    hasClip: hasTransition,
  });

  const isDoor = station.id === DOOR_ID;
  // Is the clip playing into the door the street→door walk-up (vs an interior reverse)?
  const isWalkUpEdge = Boolean(asset?.h264Src?.startsWith(WALKUP_CLIP));
  // The frame the walk-up OPENS on = the street's own rest still. Read from STATIONS rather than
  // duplicated here, so the two can never point at different files.
  const entryStill = STATIONS.find((s) => s.id === STREET_ID)?.still;

  // AT REST — the scene is STILL, so the crisp composite may hold the screen. Two ways:
  //   `ended` — a clip played through once and now holds its final frame (the door).
  //   `none`  — the edge has NO clip, so the scene is already still on arrival. This is how the
  //             street is ALWAYS reached: door→street and counter→street are clip-less crossfade
  //             edges (the counter's back exit goes to the street, not the door), so waiting for
  //             an `ended` there would wait forever.
  // Gated on isActive so a neighbour mounted mid-hold never shows its still through a swap, and
  // so a stale `ended` from a previous visit can't paint over a re-armed, moving clip.
  const atRest = isActive && (phase === "ended" || phase === "none");

  // ENTRY STILL on the door station. The walk-up opens on the street's own rest frame, so the door
  // scene starts holding that SAME crisp still — the (instant) street→door section swap therefore
  // shows an identical image — and then dissolves it into the moving clip. Without it the swap
  // would hard-cut the crisp composite to the gen's repainted frame 0 (MAD 17.3 apart): a visible
  // pop. It can't live on the street's own section — street→door is not a crossfade edge, so that
  // section snaps to opacity 0 and takes any fade with it.
  // `idle` = parked on frame 0 (preloading as a neighbour, or freshly re-armed): explicitly NOT
  // `playing` (dissolve away, the facade is moving) and NOT `ended` (the rest still owns the hold).
  const showEntryStill = isDoor && isWalkUpEdge && phase === "idle";

  // Visibility/stacking. `transition-opacity` is ALWAYS present so the crossfade animates
  // reliably (the property pre-exists; only the duration changes). Normal swaps use
  // `duration-0` → instant, byte-identical to the old hard snap; a crossfade role uses ~450ms.
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
      className={`absolute inset-0 flex items-center justify-center overflow-hidden px-6 transition-opacity ease-out ${duration} ${stack}`}
    >
      {/* 1. TRANSITION LAYER */}
      {hasTransition && asset ? (
        <StationTransition
          asset={asset}
          index={index}
          activeIndex={activeIndex}
        />
      ) : station.still ? (
        // No inbound clip, but the station provides a static still (the street/entry storefront)
        // — paint it full-bleed as the scene background instead of the black placeholder. Same
        // object-cover framing as the <video>, so landscape + mobile match the clip stations.
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
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-white/25">
            transition layer
            <span className="mt-1 block normal-case tracking-normal text-white/15">
              first station — no transition plays in
            </span>
          </div>
        </div>
      )}

      {/* 1b. ELEMENT LAYER — the crisp door-layer marks, pinned to the object-cover box of the
          frame BELOW them (not the viewport), so they stay glued to the facade at any aspect.
          Entry stations only; it sits UNDER the scrim and the DOM layer, because these frames are
          part of the SCENE, not part of the UI — they take the same grading as everything else. */}
      {isDoor && station.still ? (
        <>
          {/* ENTRY still (the street's rest frame) — held over the clip's frame 0 so the section
              swap is image-identical, then dissolved away as the walk-up starts moving. */}
          <StationStill
            src={entryStill ?? station.still}
            visible={showEntryStill}
            fadeMs={DISSOLVE_MS}
          />
          {/* REST still — the hold. The clip has played through and holds its last frame; this
              crisp composite dissolves over it and is what the visitor actually dwells on. */}
          <StationStill
            src={station.still}
            visible={atRest}
            fadeMs={DISSOLVE_MS}
            priority
          />
        </>
      ) : null}

      {/* scrim so DOM text stays readable over the video */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40"
      />

      {/* 1c. HOTSPOTS — transparent, percentage-anchored click regions ON the scene (imagemap).
          Above the scrim so the hover affordance reads, but still under the DOM layer, so a real
          CTA button always wins the click where they overlap. Only live once the scene is at
          rest — you can't click a facade that hasn't arrived yet. */}
      {station.hotspots?.length ? (
        <StationHotspots
          hotspots={station.hotspots}
          interactive={atRest}
          onNavigate={(to) => {
            // Same gesture contract as the button CTAs: capture the transient activation for iOS
            // media autoplay synchronously, BEFORE the re-render mounts the next clip.
            markUnlocked();
            goToId(to);
          }}
        />
      ) : null}

      {/* 2. DOM LAYER — full-bleed; every child is pinned to a fixed safe zone so scene copy
          and directional CTAs can never collide (ONE shared layout, all stations). The layer
          ignores pointer events; only the copy's CTA + the exit buttons re-enable them. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Scene copy — anchored lower-left, width- and height-bounded so it stays clear of the
            edge CTAs: below the left/right-centre buttons, left of and above the bottom-centre
            one. Body text is line-clamped and the block clips, so long copy never grows into a
            CTA. */}
        <div className="absolute bottom-20 left-0 max-h-[36vh] max-w-[min(26rem,68vw)] overflow-hidden px-5 sm:px-7 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">
            Station {index + 1} / {total}
          </p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            STATION: {station.label}
          </h2>
          <p className="mt-2 text-sm text-white/75 line-clamp-2">
            {station.description}
          </p>
          {station.dom.heading && (
            <h3 className="mt-4 text-lg font-medium text-white">
              {station.dom.heading}
            </h3>
          )}
          {station.dom.body && (
            <p className="mt-1 text-sm text-white/80 line-clamp-2">
              {station.dom.body}
            </p>
          )}
          {station.dom.cta && (
            <Link
              href={station.dom.cta.href}
              className="pointer-events-auto mt-3 inline-block rounded-full border border-white/30 bg-black/40 px-5 py-2 text-sm text-white transition-colors hover:bg-white/10"
            >
              {station.dom.cta.label}
            </Link>
          )}
        </div>

        {/* Directional exits — click-to-navigate, each pinned to its direction's edge safe zone
            via EXIT_ZONE (back: top-left · left: left-centre · right: right-centre · forward:
            bottom-centre). The click is the user gesture that grants iOS media autoplay, so we
            markUnlocked() synchronously IN the handler (before the re-render mounts the next
            clip) to capture that transient activation, then swap. */}
        {/* Key on to+direction, not `to` alone: a station may have TWO exits to the same
            destination — e.g. a side wall's persistent top-left "home" button AND its spatial
            directional counter exit both navigate to the counter (intentional, see stations.ts). */}
        {station.exits?.map((exit) => (
          <button
            key={`${exit.to}:${exit.direction ?? ""}`}
            type="button"
            onClick={() => {
              markUnlocked();
              goToId(exit.to);
            }}
            className={`pointer-events-auto absolute rounded-full border border-white/30 bg-black/40 px-5 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/10 ${
              EXIT_ZONE[exit.direction ?? "forward"]
            }`}
          >
            {exit.label}
          </button>
        ))}
      </div>
    </section>
  );
}
