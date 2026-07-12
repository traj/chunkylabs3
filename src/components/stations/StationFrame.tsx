"use client";

import Link from "next/link";
import { useRef } from "react";
import type {
  Station,
  StationExit,
  StationId,
  TransitionAsset,
} from "@/data/stations";
import { StationTransition } from "./StationTransition";
import { StationElementLayer } from "./StationElementLayer";
import { useTransitionPhase } from "./useTransitionPhase";
import { usePlaybackUnlock } from "./PlaybackUnlock";

// The two entry stations carry the door-layer element overlay (the crisp marks that cover the
// walk-up's soft baked twins). Keyed off the station id — the walls have no such layer.
const STREET_ID: StationId = "street";
const DOOR_ID: StationId = "door";

// The overlay only makes sense over the WALK-UP, whose frame 0 IS the street's still. Arriving
// at the door from the counter plays the reversed interior clip instead — it opens inside the
// store, where street-placed marks would be nonsense — so the street set is gated on this edge.
const WALKUP_CLIP = "/transitions/street-door/";

// Fade choreography. Out is quicker than in: the marks must be GONE before the facade has
// visibly moved (they're pinned to frame 0 and would smear), whereas the arrival can settle.
const FADE_OUT_MS = 150;
const FADE_IN_MS = 250;

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

  const isStreet = station.id === STREET_ID;
  const isDoor = station.id === DOOR_ID;
  // Is the clip playing into the door the street→door walk-up (vs an interior reverse)?
  const isWalkUpEdge = Boolean(asset?.h264Src?.startsWith(WALKUP_CLIP));

  // THE HOLD — when the crisp marks may land. Two ways to be at rest:
  //   `ended` — a clip played through once and now holds its final frame.
  //   `none`  — the edge has NO clip, so the scene is already still on arrival. This is how the
  //             street is always reached (door→street and counter→street are clip-less
  //             crossfades); waiting for an `ended` there would wait forever.
  // Gated on isActive so a neighbour mounted mid-hold never shows its overlay through a swap.
  const atRest = isActive && (phase === "ended" || phase === "none");

  // The OPEN sign is a diegetic CTA: it fires the door's own forward exit rather than a
  // hard-coded target, so it can never desync from the button it doubles (stations.ts is the
  // single source of the nav graph). The <button> CTAs stay exactly as they were — this is an
  // ADDITIONAL trigger, not a replacement.
  const signExit = isDoor
    ? station.exits?.find((e) => e.direction === "forward")
    : undefined;

  // STREET SET on the door station: the walk-up opens on frame 0 = the street's still, so the
  // crisp street marks carry across the (instant) scene swap and then DIP OUT as motion starts.
  // Without this the swap would pop crisp→soft, and the 150ms fade would be invisible: the
  // street's own section snaps to opacity 0 (street→door is not a crossfade edge), taking its
  // overlay with it before any fade could play.
  // `idle` = parked on frame 0: preloading as a neighbour, or freshly re-armed. Explicitly NOT
  // `playing` (the facade is moving) and NOT `ended` (the door set owns the hold).
  const showStreetSetOnDoor = isDoor && isWalkUpEdge && phase === "idle";

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
          Entry stations only; it sits UNDER the scrim and the DOM layer, because these marks
          are part of the scene (paint on the glass), not part of the UI. */}
      {isStreet ? (
        // The street rests on its still and is always arrived at clip-less (phase `none`), so it
        // is at rest the moment it's active — but it goes through the SAME atRest gate as the
        // door rather than a bare isActive, so the two stations can't drift apart in behaviour.
        <StationElementLayer set="street" visible={atRest} fadeMs={FADE_OUT_MS} />
      ) : null}

      {isDoor ? (
        <>
          {/* Carried across the swap on frame 0, then dips out as the walk-up starts moving. */}
          <StationElementLayer
            set="street"
            visible={showStreetSetOnDoor}
            fadeMs={FADE_OUT_MS}
          />
          {/* THE HOLD: the clip has played through and the facade is STILL — only now may the
              crisp marks land on top of their soft baked twins. Strictly `atRest`: never while
              `playing` (they'd smear over a moving facade) and never on a stale `ended` carried
              over from a previous visit (the re-entry bug — the hook voids it on activation). */}
          <StationElementLayer
            set="door"
            visible={atRest}
            fadeMs={FADE_IN_MS}
            onSignClick={
              signExit
                ? () => {
                    markUnlocked();
                    goToId(signExit.to);
                  }
                : undefined
            }
          />
        </>
      ) : null}

      {/* scrim so DOM text stays readable over the video */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40"
      />

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
