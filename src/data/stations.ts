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

/**
 * Stable station ids — the scaffold identities. These INTENTIONALLY differ from the
 * user-facing display labels for now: `left-bins` shows as "Mixes", `right-bins` as "Crate",
 * `mixtape-shelf` as "Vibes" (see each station's `label`/`dom`/`exits`). Renaming the ids
 * themselves ripples through this union, the resolver edges (REVERSE_EDGES keys), and the
 * /transitions asset paths, so it is a separate, deliberate refactor (the id→wall rename — a
 * deferred design thread). Keep id ≠ label until that pass.
 */
export type StationId =
  | "street"
  | "door"
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
 *  - `poster` is the FIRST frame, shown before play AND as the autoplay-blocked fallback
 *    (Low Power Mode is undetectable — §Q2). First-frame is DELIBERATE, not a stopgap: the
 *    engine plays every clip from `currentTime = 0`, and the poster's only visible role is the
 *    brief cold-mount decode gap + the blocked-autoplay backdrop — so it must MATCH frame 0 to
 *    precede playback seamlessly. A last-frame poster would paint the destination, then the clip
 *    would snap back to frame 0 to play (a visible backward jump). The HELD "you are here" view
 *    is the video's OWN last decoded frame, not this poster. Verified at full speed 2026-06-25.
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
 * INVARIANT: an exit never targets a station whose transition-clip files don't exist on
 * disk, so an unfilmed scene can't become a destination you arrive at into a black frame.
 * Every station in STATIONS now has at least a labeled placeholder encode under
 * public/transitions. (Door's forward edge is held absent for a separate, product reason —
 * see its `exits` comment — not because of a missing clip.)
 */
export interface StationExit {
  /** CTA label, e.g. "Come in →". */
  label: string;
  /** Station this exit navigates to. */
  to: StationId;
  /** Optional placement hint for the on-screen CTA. */
  direction?: "forward" | "back" | "left" | "right" | "up" | "down";
}

/**
 * A transparent, clickable region ON the scene — the imagemap model (StationHotspots).
 *
 * The rect is a PERCENTAGE of the 1920x1080 master frame, so it is resolution- and
 * aspect-independent: the renderer places it inside the measured object-cover box, which keeps it
 * welded to the thing it sits on (the door, the storefront) at any window shape.
 *
 * A hotspot is ADDITIVE — a diegetic double for an exit the visitor can already take via a real
 * <button> CTA. It must never be the only route to a destination: it is invisible, so it carries
 * no affordance for keyboard or screen-reader users. Keep a matching entry in `exits`.
 *
 * Deliberately generic (id/label/rect/to) so the walls can reuse it for the zone→tray model
 * without changing the type.
 */
export interface StationHotspot {
  /** Stable id, unique within the station. */
  id: string;
  /** Human-readable intent, e.g. "Go inside — the counter". Used as the region's tooltip. */
  label: string;
  /** Station this region navigates to. MUST also exist as a real exit (see above). */
  to: StationId;
  /** Percentage rect of the 1920x1080 master frame. */
  rect: { xPct: number; yPct: number; wPct: number; hPct: number };
}

export interface Station {
  /** Stable id; also used as the in-page anchor target. */
  id: StationId;
  /** 1-based position in the walk-through. */
  order: number;
  /** Human-readable display name, e.g. "Mixes" — may differ from `id` (see StationId). */
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
  /**
   * The station's RESTING FRAME — the crisp composited still the visitor actually looks at while
   * standing here. Painted full-bleed (object-cover) when the station has no inbound clip.
   *
   * STILL-REST MODEL: this is no longer "the clip's poster". The gen'd clips are pure in-betweens
   * that carry motion; the frames at either END are these composites, baked from design/
   * door-layer.pen by compose_reshoot.py, so the wordmark / OPEN sign / stickers are sharp by
   * construction rather than the soft, warped versions the gen painted. It therefore deliberately
   * does NOT match the clip's frame 0 any more (Cinema Studio repaints its pins — frame 0 is MAD
   * 17.3 off this composite): the entry stations cross-dissolve still↔video at each boundary
   * (StationStill), and that dissolve is what hides the delta. A hard cut would show it.
   */
  still?: string;
  /** Transparent, clickable regions ON the scene. Additive to `exits` — see StationHotspot. */
  hotspots?: readonly StationHotspot[];
  /** DOM layer composited over the scene. */
  dom: StationDomLayer;
  /**
   * On-screen directional ways out of this station (click-to-navigate, no scroll).
   * Additive and optional — a station with no exits is a dead end. See {@link StationExit}
   * for the no-exit-to-an-unfilmed-scene invariant.
   */
  exits?: readonly StationExit[];
}

/**
 * THE ordered sequence. Order in this array is authoritative — derive everything
 * (navigation, progress, prev/next) from it. Do not hard-code order anywhere else.
 *
 * street → door push-in → counter/clerk → Mixes (left-bins) → Crate (right-bins) → Vibes (mixtape-shelf)
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
    // REST FRAME — the crisp out0 composite (wide storefront + the .pen door-layer marks baked
    // on). This SUPERSEDES the old frame-0 poster: the poster was the gen's soft, repainted
    // rendering of this exact plate, so the wordmark and sign type were mush. The street is the
    // first thing anyone sees; it should be the sharp one.
    //
    // It no longer matches the walk-up's frame 0 (the gen repaints its pins — MAD 17.3 apart), and
    // that is fine BY DESIGN: the door station opens on this same still and cross-dissolves into
    // the clip, so the delta is absorbed by the dissolve instead of popping on a hard cut.
    still: "/stills/entry-street.jpg",
    // Diegetic double for "Come in →": the storefront itself is clickable. Rect = the facade's
    // measured footprint in out0 — the whole shop front, [366,158]-[1545,818] of the 1920x1080
    // master (the out1→out0 transform's image; see design/reshoot/README.md).
    hotspots: [
      {
        id: "storefront",
        label: "Come in",
        to: "door",
        rect: { xPct: 19.06, yPct: 14.63, wPct: 61.41, hPct: 61.11 },
      },
    ],
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
      // Real encode — the street → door WALK-UP, BRANDED (Roll 2 of the sticker reshoot: generated
      // from the harmonized sticker-composited pins, so the wordmark / OPEN sign / flyers are on
      // the glass throughout). REPLACES the retired OG storefront push-in (/transitions/door/door.*
      // — now DEAD on disk, cleanup later). Built from the 8s RAW (never re-sped from a processed
      // file) by EXPLICIT frame selection — 36 evenly-spaced source frames, anchored bit-exact on
      // the raw's true frame 0 and true final frame — laid on a 24fps timeline → 1.5s, every frame
      // distinct (no dupes, no judder). TRIM=1.5 keeps the whole clip.
      //
      // Frame selection is deliberately NOT `fps=24`: this raw has a PTS gap near the head, and the
      // fps filter (round=near) resolves output slot 0 to the LAST source frame in the slot — it
      // silently DROPS true frame 0, so the poster/still would drift into the push. Selecting frame
      // indices outright is the only way to guarantee both endpoints.
      //
      // Lands HELD on out1. The clip is now a pure IN-BETWEEN: what rests on screen at either end
      // is a crisp composite (`still` below / the street's `still`), cross-dissolved over this
      // video, so the gen's soft baked marks are never what the visitor dwells on.
      // The raw settles by t≈7.8s of 8s with NO overshoot past the end pin.
      // AV1 av01.0.08M.08 + H.264 avc1.4D4028.
      av1Src: "/transitions/street-door/street-door.av1.mp4",
      h264Src: "/transitions/street-door/street-door.h264.mp4",
      // Poster stays the clip's own frame 0 (the locked poster contract — it is the pre-roll /
      // autoplay-blocked backdrop, so it must MATCH the frame the clip starts on, not the still).
      poster: "/transitions/street-door/street-door.poster.jpg",
      durationSec: 1.5,
    },
    // REST FRAME — the crisp out1 composite (close storefront + the .pen marks baked on). The clip
    // plays through, holds its last frame, and this dissolves over it: the held frame the visitor
    // actually reads is the sharp one, where "Come in / WE'RE / OPEN" is legible instead of the
    // gen's garbled "Cwn is / WETIE". Same plate, 15.8 MAD apart — hence the dissolve, not a cut.
    still: "/stills/entry-door.jpg",
    // Diegetic double for "To the counter →": the door itself is clickable. Rect covers the door
    // slab + the OPEN sign hanging on it (master coords ~[854,227]-[1085,950]).
    hotspots: [
      {
        id: "doorway",
        label: "Go inside — the counter",
        to: "counter",
        rect: { xPct: 44.5, yPct: 21, wPct: 12, hPct: 67 },
      },
    ],
    dom: {
      heading: "Come in",
      body: "Mind the step.",
    },
    // Forward edge is now live: the real counter clip exists, so door → counter walks the
    // visitor onto real footage (street → door → counter). The remaining walls still hold
    // synthetic placeholders, so the reachable chain stops at the counter for now.
    exits: [
      { label: "← Back to the street", to: "street", direction: "back" },
      { label: "To the counter →", to: "counter", direction: "forward" },
    ],
  },
  {
    // The counter is the purchase CTA surface — it surfaces RELEASES (Beatport) from
    // src/data/inventory.ts.
    id: "counter",
    order: 3,
    label: "The Counter",
    slug: "counter",
    description: "The clerk looks up from behind the counter.",
    transitionIn: {
      // Real encode (door → counter push-in, 8s — full length kept on purpose: a car passes
      // in the background as part of the arrival beat). AV1 av01.0.08M.08 + H.264 avc1.4D4028,
      // matching the engine's <source> types (codec strings parsed from the av1C/avcC boxes).
      av1Src: "/transitions/counter/counter.av1.mp4",
      h264Src: "/transitions/counter/counter.h264.mp4",
      poster: "/transitions/counter/counter.poster.jpg",
      durationSec: 8,
    },
    dom: {
      heading: "The Counter",
      body: "Ask the clerk anything. (Voice lines are placeholders for now.)",
    },
    // Reachable hub. The BACK exit now leaves straight OUT to the street as an opacity crossfade
    // (CROSSFADE_EDGES counter->street, no video), replacing the old reversed door→counter push-in.
    // That reverse edge (REVERSE_EDGES counter->door) is therefore now unreachable/DEAD — entry +
    // asset kept on disk for a later cleanup pass. The three WALLS stay real, each with a
    // pre-encoded reversed return (see REVERSE_EDGES): turn LEFT to Mixes (left-bins), RIGHT to
    // Crate (right-bins), and AHEAD to Vibes (mixtape-shelf). The ring Mixes ↔ Vibes ↔ Crate
    // (wall-to-wall) is intact — full rotational nav. No synthetic placeholder reachable anywhere.
    exits: [
      { label: "← Back to the street", to: "street", direction: "back" },
      { label: "← Mixes", to: "left-bins", direction: "left" },
      { label: "Crate →", to: "right-bins", direction: "right" },
      { label: "Vibes ↑", to: "mixtape-shelf", direction: "forward" },
    ],
  },
  {
    id: "left-bins",
    order: 4,
    label: "Mixes",
    slug: "left-bins",
    description: "The left wall. Mixes and live sets, end to end.",
    transitionIn: {
      // Real encode (counter → Mixes wall, a left pan/turn, ~1s — re-encoded at 8× from the
      // original 8s raw, a snappy quarter-turn for the click-hub). This is the left/Mixes wall — SoundCloud mixes / live sets — reached by
      // turning left from the counter hub. AV1 av01.0.08M.08 + H.264 avc1.4D4028, matching the
      // engine's <source> types (codec strings parsed from the av1C/avcC boxes).
      av1Src: "/transitions/mixes/mixes.av1.mp4",
      h264Src: "/transitions/mixes/mixes.h264.mp4",
      poster: "/transitions/mixes/mixes.poster.jpg",
      durationSec: 1,
    },
    dom: {
      heading: "Mixes",
      body: "SoundCloud sets and live recordings.",
    },
    // Two ways to the counter, intentionally DISTINCT (do not "dedupe"): the persistent top-left
    // "← Back to the counter" is the HOME/hub button present on every station; the RIGHT-side
    // "Counter →" is the SPATIAL directional exit — facing the Mixes wall, the counter is to your
    // RIGHT and Vibes to your LEFT. Both wire to the existing counter↔Mixes edge (no new
    // transition). The ring edge to Vibes (LEFT turn, FORWARD_EDGES left-bins→mixtape-shelf) sits
    // on the left. (back=top-left · left=left-centre · right=right-centre — no zone collision.)
    exits: [
      { label: "← Back to the counter", to: "counter", direction: "back" },
      { label: "← Vibes", to: "mixtape-shelf", direction: "left" },
      { label: "Counter →", to: "counter", direction: "right" },
    ],
  },
  {
    id: "right-bins",
    order: 5,
    label: "Crate",
    slug: "right-bins",
    description: "The right wall. A crate of everything.",
    transitionIn: {
      // Real encode (counter → Crate wall, a RIGHT pivot, ~1s — 8×'d from the original 8s
      // Cinema Studio raw, a snappy quarter-turn matching Mixes). The right/Crate dig-bin
      // wall, reached by turning right from the counter hub. AV1 av01.0.08M.08 + H.264
      // avc1.4D4028, matching the engine's <source> types (codec strings parsed from the
      // av1C/avcC boxes). Poster is the first frame (the counter) — CORRECT, not a stopgap: the
      // clip plays from frame 0, so a frame-0 poster seamlessly precedes the pivot (a last-frame
      // poster would flash the Crate wall, then jump back to the counter to play). See the
      // TransitionAsset `poster` contract above for the full rationale.
      av1Src: "/transitions/crate/crate.av1.mp4",
      h264Src: "/transitions/crate/crate.h264.mp4",
      poster: "/transitions/crate/crate.poster.jpg",
      durationSec: 1,
    },
    dom: {
      heading: "Crate",
      body: "A bit of everything.",
    },
    // Two ways to the counter, intentionally DISTINCT (do not "dedupe"): the persistent top-left
    // "← Back to the counter" is the HOME/hub button present on every station; the LEFT-side
    // "← Counter" is the SPATIAL directional exit — facing the Crate wall, the counter is to your
    // LEFT and Vibes to your RIGHT. Both wire to the existing counter↔Crate edge (no new
    // transition). The ring edge to Vibes (RIGHT turn, FORWARD_EDGES right-bins→mixtape-shelf)
    // sits on the right. (back=top-left · left=left-centre · right=right-centre — no collision.)
    exits: [
      { label: "← Back to the counter", to: "counter", direction: "back" },
      { label: "Vibes →", to: "mixtape-shelf", direction: "right" },
      { label: "← Counter", to: "counter", direction: "left" },
    ],
  },
  {
    id: "mixtape-shelf",
    order: 6,
    label: "Vibes",
    slug: "mixtape-shelf",
    description: "Straight ahead. The Vibes series and featured picks.",
    transitionIn: {
      // RETIRED from the active path (kept on disk as fallback): counter→Vibes now plays the
      // CHAINED EXPRESS (EXPRESS_EDGES), not this straight-across push-in — every edge INTO Vibes
      // is express (counter) or forward ring (Mixes/Crate), so this transitionIn never resolves.
      // Real encode (counter → Vibes wall, a forward PUSH-IN — the door/counter push recipe,
      // no pivot/no 2× pass). Trimmed to 2.6s: the Veo source is clean to ~2.7s then dissolves
      // into an invented wall, so only the clean head ships. This is the ahead/Vibes (j2
      // record-display back) wall, reached by moving straight ahead from the counter hub. AV1
      // av01.0.08M.08 + H.264 avc1.4D4028, matching the engine's <source> types (codec strings
      // parsed from the av1C/avcC boxes). (id/DOM keep the scaffold "mixtape-shelf" identity —
      // the id→Vibes rename is the deferred design thread.)
      av1Src: "/transitions/vibes/vibes.av1.mp4",
      h264Src: "/transitions/vibes/vibes.h264.mp4",
      poster: "/transitions/vibes/vibes.poster.jpg",
      durationSec: 2.6,
    },
    dom: {
      heading: "Vibes",
      body: "Or just take it all home.",
      cta: { label: "Browse everything →", href: "/music" },
    },
    // Back to the counter (reversed push-in, REVERSE_EDGES mixtape-shelf→counter — a safe
    // pull-back). Plus the ring returns to BOTH side walls (REVERSE_EDGES mixtape-shelf→left-bins
    // / →right-bins): turn right to Mixes, left to Crate — completing the rotational ring.
    exits: [
      { label: "← Back to the counter", to: "counter", direction: "back" },
      { label: "Mixes →", to: "left-bins", direction: "right" },
      { label: "← Crate", to: "right-bins", direction: "left" },
    ],
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

/**
 * Directed-edge transition assets — the RETURN (back) edges only.
 *
 * Transitions used to be keyed to the DESTINATION station (one inbound clip per station), so
 * a return replayed the forward arrival clip — wrong for the two reachable back edges
 * (counter→door replayed street→door; left-bins/Mixes→counter replayed door→counter). They
 * are now keyed to the directed EDGE (`from`→`to`): a return plays a PRE-ENCODED reversed
 * clip — the forward master, time-reversed IN THE FILE — which the engine still plays plain
 * FORWARD (play-once-hold intact; no negative `playbackRate`, iOS-unsafe). "Reverse" lives
 * only in the asset bytes.
 *
 * Reverse poster = first frame of the reversed file (= forward clip's LAST frame = the room
 * you leave from on the return), so the pre-play/blocked still shows where you ARE, not the
 * opposite room. Assets produced deterministically by `encode.sh --reverse` (local ffmpeg),
 * same codec spec as the forwards (av01.0.08M.08 / avc1.4D4028).
 */
const REVERSE_EDGES: Readonly<Record<string, TransitionAsset>> = {
  // counter → door: reversed door→counter push-in. 8s (inherits the forward length). NOW DEAD —
  // the counter's back exit fades straight OUT to the street (CROSSFADE_EDGES counter->street), so
  // no exit traverses counter→door anymore. Entry + asset kept on disk for a later cleanup pass.
  "counter->door": {
    av1Src: "/transitions/counter-door/counter-door.av1.mp4",
    h264Src: "/transitions/counter-door/counter-door.h264.mp4",
    poster: "/transitions/counter-door/counter-door.poster.jpg",
    durationSec: 8,
  },
  // left-bins (Mixes) → counter: reversed counter→Mixes pivot (~1s) — turning back to the hub.
  "left-bins->counter": {
    av1Src: "/transitions/mixes-counter/mixes-counter.av1.mp4",
    h264Src: "/transitions/mixes-counter/mixes-counter.h264.mp4",
    poster: "/transitions/mixes-counter/mixes-counter.poster.jpg",
    durationSec: 1,
  },
  // right-bins (Crate) → counter: reversed counter→Crate pivot (~1s) — turning back to the hub.
  "right-bins->counter": {
    av1Src: "/transitions/crate-counter/crate-counter.av1.mp4",
    h264Src: "/transitions/crate-counter/crate-counter.h264.mp4",
    poster: "/transitions/crate-counter/crate-counter.poster.jpg",
    durationSec: 1,
  },
  // mixtape-shelf (Vibes) → counter: RETIRED from the active path. It used to play the reversed
  // counter→Vibes push-in (vibes-counter, 2.6s, straight across the room); the counter↔Vibes trip
  // is now a CHAINED EXPRESS that circles the ring (two quarters, EXPRESS_EDGES below). The
  // vibes-counter files stay on disk as a fallback — resolveTransition checks EXPRESS first, so
  // this edge resolves to the express even with no entry here.
  // Ring returns (Vibes ↔ side walls): reversed wall→Vibes pivots, turning back along the ring.
  // The FORWARD ring edges (Mixes→Vibes, Crate→Vibes) live in FORWARD_EDGES, not here — Vibes
  // now has multiple inbound forward arrivals, so they can't use the transitionIn fall-through.
  // mixtape-shelf (Vibes) → left-bins (Mixes): reversed Mixes→Vibes pivot (~1s) — turning back to Mixes.
  "mixtape-shelf->left-bins": {
    av1Src: "/transitions/vibes-mixes/vibes-mixes.av1.mp4",
    h264Src: "/transitions/vibes-mixes/vibes-mixes.h264.mp4",
    poster: "/transitions/vibes-mixes/vibes-mixes.poster.jpg",
    durationSec: 1,
  },
  // mixtape-shelf (Vibes) → right-bins (Crate): reversed Crate→Vibes pivot (~1s) — turning back to Crate.
  "mixtape-shelf->right-bins": {
    av1Src: "/transitions/vibes-crate/vibes-crate.av1.mp4",
    h264Src: "/transitions/vibes-crate/vibes-crate.h264.mp4",
    poster: "/transitions/vibes-crate/vibes-crate.poster.jpg",
    durationSec: 1,
  },
  // NB: door → street has NO reverse entry on purpose. A reversed street→door push-in runs the
  // rain UPWARD (unshippable), so door→street falls through to street.transitionIn (null) — a
  // clean no-video snap back to the storefront. A real moving return would be a forward-filmed
  // clip, not a reversed one (a separate task).
};

/**
 * Directed FORWARD-edge overrides — forward arrivals that are NOT the destination's default
 * `transitionIn`. Needed when a destination has MORE THAN ONE inbound forward arrival: Vibes
 * (mixtape-shelf) is reached from the counter (push-in, = its `transitionIn`) AND from each side
 * wall along the ring, so the two ring forwards are keyed per-edge here — otherwise they'd fall
 * through to the counter→Vibes push-in. Single-arrival destinations keep using `transitionIn`
 * (no entry here). These are forward-filmed clips (not reversed); same codec spec as the rest.
 */
const FORWARD_EDGES: Readonly<Record<string, TransitionAsset>> = {
  // left-bins (Mixes) → mixtape-shelf (Vibes): the new Mixes→Vibes pivot (~1s, LEFT turn).
  "left-bins->mixtape-shelf": {
    av1Src: "/transitions/mixes-vibes/mixes-vibes.av1.mp4",
    h264Src: "/transitions/mixes-vibes/mixes-vibes.h264.mp4",
    poster: "/transitions/mixes-vibes/mixes-vibes.poster.jpg",
    durationSec: 1,
  },
  // right-bins (Crate) → mixtape-shelf (Vibes): the new Crate→Vibes pivot (~1s, RIGHT turn).
  "right-bins->mixtape-shelf": {
    av1Src: "/transitions/crate-vibes/crate-vibes.av1.mp4",
    h264Src: "/transitions/crate-vibes/crate-vibes.h264.mp4",
    poster: "/transitions/crate-vibes/crate-vibes.poster.jpg",
    durationSec: 1,
  },
};

/**
 * Directed CHAINED-EXPRESS edges — the counter↔Vibes trip. Instead of a straight-across push-in,
 * the camera CIRCLES the room: two existing quarter clips are pre-concatenated (with a ~6-frame
 * crossfade masking the geometric seam — the held end frame of clip 1 and the start frame of
 * clip 2 are the same wall but NOT pixel-aligned, PSNR ~14–18, so a hard cut would jump) and
 * compressed to ~1.0s, so every trip takes the same time regardless of distance. Each direction
 * has TWO side-routes (via Mixes / via Crate); the controller (StoreWalkthrough) rolls one 50/50
 * PER TRIP — out via one side may return via the other ("circle the room"). To the engine these
 * are ordinary SINGLE 1.0s clips (no runtime chaining / playbackRate). The two side-routes of a
 * direction share ONE poster — their first frame is the same wall (counter outbound, Vibes
 * return) — so the cold-mount poster-warm stays a cache hit whichever side is rolled.
 * `resolveTransition` returns side[0] as the representative (what poster-warm reads + a safe
 * deterministic fallback); the actually-played clip is the controller's roll. The direct push-in
 * (vibes.*) and vibes-counter.* files are kept on disk but no longer resolve.
 */
const CV_POSTER = "/transitions/cv-mixes/cv-mixes.poster.jpg"; // counter (shared outbound first frame)
const VC_POSTER = "/transitions/vc-mixes/vc-mixes.poster.jpg"; // Vibes wall (shared return first frame)
export const EXPRESS_EDGES: Readonly<
  Record<string, readonly [TransitionAsset, TransitionAsset]>
> = {
  // counter → Vibes:  counter→Mixes ⌢ Mixes→Vibes   |   counter→Crate ⌢ Crate→Vibes
  "counter->mixtape-shelf": [
    { av1Src: "/transitions/cv-mixes/cv-mixes.av1.mp4", h264Src: "/transitions/cv-mixes/cv-mixes.h264.mp4", poster: CV_POSTER, durationSec: 1 },
    { av1Src: "/transitions/cv-crate/cv-crate.av1.mp4", h264Src: "/transitions/cv-crate/cv-crate.h264.mp4", poster: CV_POSTER, durationSec: 1 },
  ],
  // Vibes → counter:  Vibes→Mixes ⌢ Mixes→counter   |   Vibes→Crate ⌢ Crate→counter
  "mixtape-shelf->counter": [
    { av1Src: "/transitions/vc-mixes/vc-mixes.av1.mp4", h264Src: "/transitions/vc-mixes/vc-mixes.h264.mp4", poster: VC_POSTER, durationSec: 1 },
    { av1Src: "/transitions/vc-crate/vc-crate.av1.mp4", h264Src: "/transitions/vc-crate/vc-crate.h264.mp4", poster: VC_POSTER, durationSec: 1 },
  ],
};

/**
 * Resolve the transition clip for a directed move `from`→`to`. Checked in order:
 *  - A CHAINED-EXPRESS edge (EXPRESS_EDGES) → the representative side[0] (counter↔Vibes). The
 *    controller overrides with its 50/50 side roll; side[0]'s shared poster is what poster-warm
 *    reads, and it's a safe deterministic fallback if the controller doesn't override.
 *  - An explicit RETURN edge (REVERSE_EDGES) → its pre-encoded reversed clip.
 *  - An explicit FORWARD override (FORWARD_EDGES) → a forward-filmed clip for a destination with
 *    multiple inbound arrivals (the ring edges into Vibes).
 *  - Everything else — single-arrival forward edges, the no-edge initial mount, unreachable
 *    synthetic edges — falls through to the destination's `transitionIn`, so those arrivals and
 *    the starting street state stay byte-for-byte unchanged.
 * `from` is `null` on the initial mount: you start at the first station, nothing played you in.
 */
export function resolveTransition(
  from: StationId | null,
  to: StationId,
): TransitionAsset | null {
  if (from) {
    const express = EXPRESS_EDGES[`${from}->${to}`];
    if (express) return express[0];
    const reverse = REVERSE_EDGES[`${from}->${to}`];
    if (reverse) return reverse;
    const forward = FORWARD_EDGES[`${from}->${to}`];
    if (forward) return forward;
  }
  const dest = STATIONS[getStationIndex(to)];
  return dest ? dest.transitionIn : null;
}
