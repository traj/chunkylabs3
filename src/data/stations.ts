/**
 * Station model — the SINGLE SOURCE OF TRUTH for the walk-through order.
 *
 * The site is an "interactive record store visit": fixed camera stations connected by
 * pre-rendered, PLAY-THROUGH video transitions (never scrubbed — see CLAUDE.md and
 * docs/research/2026-06-video-and-animation-findings.md §Q3), with live DOM layers
 * composited over the video.
 *
 * This module defines the ordered sequence and the typed slots that the (future)
 * transition engine and CMS will fill. No transition engine or real video lives here yet.
 */

export type StationId =
  | "street"
  | "door"
  | "corkboard"
  | "counter"
  | "left-bins"
  | "right-bins"
  | "mixtape-shelf";

/**
 * A pre-rendered transition clip that PLAYS THROUGH to arrive at a station.
 *
 * Delivery rules locked by research (§Q1) — encoded here as the asset contract:
 *  - Ordered <source>: AV1 (Profile 0, 8-bit) first, H.264/MP4 last.
 *  - H.264/MP4 is the MANDATORY floor. `h264Src` is what guarantees playback on every
 *    device; `av1Src` is an optional progressive upgrade. Never ship AV1-only.
 *  - `poster` is the first frame, shown before play AND as the fallback when autoplay is
 *    blocked (Low Power Mode is undetectable — §Q2).
 *
 * All fields are optional because no real clips are encoded yet — this is the shape only.
 */
export interface TransitionAsset {
  /** AV1 (Profile 0, 8-bit) MP4 — optional progressive upgrade. */
  av1Src?: string;
  /** H.264/MP4 — the mandatory compatibility floor once assets exist. */
  h264Src?: string;
  /** Poster / first frame: shown pre-play and as the autoplay-blocked fallback. */
  poster?: string;
  /** Target clip length in seconds (research target window: 2–6s). */
  durationSec?: number;
}

/** A call-to-action rendered in a station's DOM layer. */
export interface StationCta {
  label: string;
  href: string;
}

/** Live DOM content composited OVER the video for a station. */
export interface StationDomLayer {
  heading?: string;
  body?: string;
  cta?: StationCta;
}

/**
 * A directional way OUT of a station — the unit of click-to-navigate (the store is
 * zero-scroll, Flash/SWF style). Clicking an exit makes its `to` station active; that
 * station's `transitionIn` clip plays and the new scene swaps IN PLACE. `direction` is an
 * optional layout hint for placing the CTA.
 *
 * INVARIANT: no exit targets a station whose transition clip does not exist yet, so an
 * unfilmed scene stays unreachable. Right now that means `to` is NEVER `"corkboard"` —
 * there is no public/transitions clip for it (every other station has at least a labeled
 * placeholder encode on disk).
 */
export interface StationExit {
  /** CTA label, e.g. "Come in →". */
  label: string;
  /** Station this exit navigates to. */
  to: StationId;
  /** Optional placement hint for the on-screen CTA. */
  direction?: "forward" | "back" | "left" | "right" | "up" | "down";
}

export interface Station {
  /** Stable id; also used as the in-page anchor target. */
  id: StationId;
  /** 1-based position in the walk-through. */
  order: number;
  /** Human-readable name, e.g. "Left Bins". */
  label: string;
  /** URL-safe slug. Kept distinct from `id` on purpose so they can diverge later. */
  slug: string;
  /** What this fixed camera station shows. */
  description: string;
  /**
   * The transition clip that plays to ARRIVE at this station.
   * `null` for the first station (you start there — nothing plays you in).
   */
  transitionIn: TransitionAsset | null;
  /** DOM layer composited over the scene. */
  dom: StationDomLayer;
  /**
   * On-screen directional ways out of this station (click-to-navigate, no scroll).
   * Additive and optional — a station with no exits is a dead end. See {@link StationExit}
   * for the corkboard-is-unreachable invariant.
   */
  exits?: readonly StationExit[];
}

/**
 * THE ordered sequence. Order in this array is authoritative — derive everything
 * (navigation, progress, prev/next) from it. Do not hard-code order anywhere else.
 *
 * street → door push-in → corkboard → counter/clerk → left bins → right bins → mixtape shelf
 *
 * `transitionIn` is `null`/empty for now: placeholders only, no real video.
 */
export const STATIONS: readonly Station[] = [
  {
    id: "street",
    order: 1,
    label: "The Street",
    slug: "street",
    description:
      "Exterior. Neon in the window, rain on the glass. You're standing outside chunkylabs.",
    transitionIn: null,
    dom: {
      heading: "chunkylabs",
      body: "A record store that only exists here.",
    },
    // Forward to the door (street has no back — it's the entry).
    exits: [{ label: "Come in →", to: "door", direction: "forward" }],
  },
  {
    id: "door",
    order: 2,
    label: "The Door",
    slug: "door",
    description: "Push-in through the front door. The bell rings.",
    transitionIn: {
      // Real encode (street → door). AV1 av01.0.08M.08 + H.264 avc1.4D4028 — codec strings
      // parsed from the actual av1C/avcC boxes; they match the engine's <source> types.
      av1Src: "/transitions/door/door.av1.mp4",
      h264Src: "/transitions/door/door.h264.mp4",
      poster: "/transitions/door/door.poster.jpg",
      durationSec: 4,
    },
    dom: {
      heading: "Come in",
      body: "Mind the step.",
    },
    // Forward (→ corkboard) is intentionally omitted: corkboard has no clip yet, so the
    // walk-through is gated here until it's filmed. Back to the street works.
    exits: [{ label: "← Back to the street", to: "street", direction: "back" }],
  },
  {
    // The gig-flyer corkboard, just inside the entrance. It surfaces UPDATES (see
    // src/data/inventory.ts) — ALL updates, flyer-styled by `kind`, not just gigs.
    id: "corkboard",
    order: 3,
    label: "The Corkboard",
    slug: "corkboard",
    description:
      "A cork notice board just inside the entrance, papered with gig flyers and news.",
    transitionIn: {
      av1Src: "/transitions/_placeholder/corkboard.av1.mp4",
      h264Src: "/transitions/_placeholder/corkboard.h264.mp4",
      poster: "/transitions/_placeholder/corkboard.poster.jpg",
      durationSec: 3,
    },
    dom: {
      heading: "On the board",
      body: "Flyers, drops, and news. (Updates are placeholders for now.)",
    },
    // Defined linearly for when corkboard is filmed; unreachable today (nothing routes IN).
    // Neither exit targets corkboard, so the invariant holds.
    exits: [
      { label: "← Back to the door", to: "door", direction: "back" },
      { label: "To the counter →", to: "counter", direction: "forward" },
    ],
  },
  {
    // The counter is the purchase CTA surface — it surfaces RELEASES (Beatport) from
    // src/data/inventory.ts.
    id: "counter",
    order: 4,
    label: "The Counter",
    slug: "counter",
    description: "The clerk looks up from behind the counter.",
    transitionIn: {
      av1Src: "/transitions/_placeholder/counter.av1.mp4",
      h264Src: "/transitions/_placeholder/counter.h264.mp4",
      poster: "/transitions/_placeholder/counter.poster.jpg",
      durationSec: 3,
    },
    dom: {
      heading: "The Counter",
      body: "Ask the clerk anything. (Voice lines are placeholders for now.)",
    },
    // Back would be corkboard (no clip) → stripped. Forward to the left bins.
    exits: [{ label: "Left bins →", to: "left-bins", direction: "forward" }],
  },
  {
    id: "left-bins",
    order: 5,
    label: "Left Bins",
    slug: "left-bins",
    description: "Crates down the left wall. Flip through the records.",
    transitionIn: {
      av1Src: "/transitions/_placeholder/left-bins.av1.mp4",
      h264Src: "/transitions/_placeholder/left-bins.h264.mp4",
      poster: "/transitions/_placeholder/left-bins.poster.jpg",
      durationSec: 3,
    },
    dom: {
      heading: "Left Bins",
      body: "Dig through the crates.",
    },
    exits: [
      { label: "← The counter", to: "counter", direction: "back" },
      { label: "Right bins →", to: "right-bins", direction: "forward" },
    ],
  },
  {
    id: "right-bins",
    order: 6,
    label: "Right Bins",
    slug: "right-bins",
    description: "More crates down the right wall.",
    transitionIn: {
      av1Src: "/transitions/_placeholder/right-bins.av1.mp4",
      h264Src: "/transitions/_placeholder/right-bins.h264.mp4",
      poster: "/transitions/_placeholder/right-bins.poster.jpg",
      durationSec: 3,
    },
    dom: {
      heading: "Right Bins",
      body: "Keep digging.",
    },
    exits: [
      { label: "← Left bins", to: "left-bins", direction: "back" },
      { label: "Mixtape shelf →", to: "mixtape-shelf", direction: "forward" },
    ],
  },
  {
    id: "mixtape-shelf",
    order: 7,
    label: "Mixtape Shelf",
    slug: "mixtape-shelf",
    description: "Hand-made mixtapes on the back shelf. One of a kind.",
    transitionIn: {
      av1Src: "/transitions/_placeholder/mixtape-shelf.av1.mp4",
      h264Src: "/transitions/_placeholder/mixtape-shelf.h264.mp4",
      poster: "/transitions/_placeholder/mixtape-shelf.poster.jpg",
      durationSec: 3,
    },
    dom: {
      heading: "Mixtape Shelf",
      body: "Or just take it all home.",
      cta: { label: "Browse everything →", href: "/music" },
    },
    // Last station — forward is the /music CTA above; only a back exit here.
    exits: [{ label: "← Right bins", to: "right-bins", direction: "back" }],
  },
] as const;

/** Station ids in walk-through order. */
export const STATION_ORDER: readonly StationId[] = STATIONS.map((s) => s.id);

/** The first station — where the visit starts. */
export const FIRST_STATION: Station = STATIONS[0];

export function getStationBySlug(slug: string): Station | undefined {
  return STATIONS.find((s) => s.slug === slug);
}

export function getStationIndex(id: StationId): number {
  return STATIONS.findIndex((s) => s.id === id);
}

export function getNextStation(id: StationId): Station | undefined {
  const i = getStationIndex(id);
  return i >= 0 ? STATIONS[i + 1] : undefined;
}

export function getPrevStation(id: StationId): Station | undefined {
  const i = getStationIndex(id);
  return i > 0 ? STATIONS[i - 1] : undefined;
}
