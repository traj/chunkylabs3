/**
 * Inventory model — the typed shapes behind every content surface in the store.
 *
 * SHAPE + PLACEHOLDERS ONLY. The real catalog is a separate task (the content port); do NOT
 * add real SoundCloud/Spotify embeds, Beatport releases, or update text here. Everything
 * below is obviously fake on purpose, with empty media fields and empty `genres`.
 *
 * This module is also the data behind the /music escape hatch (the plain-DOM, server-rendered
 * SEO/accessibility surface), so it must stay free of any video or browser-only dependency —
 * pure data.
 *
 * Content → surface mapping this schema supports (item PLACEMENT is a later curation pass —
 * the shapes here only make it possible, they do not decide who shows where):
 *   - Mixtape          (SoundCloud set) → mixtape shelf
 *   - Playlist         (Spotify set)    → bins (the "Vibes" series bin)
 *   - GenreDividerCard                  → bins (the second, genre-divider bin; from "Various")
 *   - Release          (Beatport)       → counter (purchase CTA surface)
 *   - Update                            → corkboard (by the entrance — see stations.ts)
 *
 * GENRE IS A FIRST-CLASS TAG (CD decision 1): content items carry `genres`, and station
 * population is rule-driven off those tags — so the SAME item can surface at more than one
 * station (a salsa-tagged mix on the shelf AND in a bin). Nothing here binds an item to a
 * single station; placement is computed from tags by a later curation pass.
 */

/**
 * A genre tag. Deliberately an open `string`: the real vocabulary is CD-supplied and gets
 * populated during the content port. We do NOT invent or freeze a genre list in the schema.
 */
export type Genre = string;

// --- Media embeds ------------------------------------------------------------------------

/** A Spotify playlist embed. Stores the bare playlist id; embed/public URLs derive from it. */
export interface SpotifyPlaylistEmbed {
  /** Bare Spotify playlist id (no `?si=` / `utm_source` tokens). Placeholder until the port. */
  playlistId: string;
}

/** A SoundCloud set/playlist embed — the media field the old `Mixtape` type was missing. */
export interface SoundCloudSetEmbed {
  /** SoundCloud numeric playlist/set id. Placeholder until the port. */
  playlistId: string;
}

/** Series identity for a playlist that belongs to a numbered run (e.g. "Vibes 18"). */
export interface SeriesRef {
  /** Series name, e.g. "Vibes". */
  name: string;
  /** Position within the series, e.g. 18. */
  index: number;
}

// --- Content item types ------------------------------------------------------------------

/**
 * A Spotify playlist (CD decision 2: "Playlist = a Spotify set"). Lives in a bin.
 * Playlist-shaped — series identity + a Spotify embed — NOT record-shaped (no artist/year).
 * This replaces the old, wrong-shaped `RecordItem`.
 */
export interface Playlist {
  id: string;
  title: string;
  /**
   * Preserves series identity (e.g. the "Vibes" run). Optional — not every playlist is part
   * of a numbered series.
   */
  series?: SeriesRef;
  embed: SpotifyPlaylistEmbed;
  /** First-class genre tags — drive rule-based, multi-surface placement. */
  genres: readonly Genre[];
}

/**
 * A SoundCloud set (CD decision 2: "Mixtape = a SoundCloud set"). Lives on the shelf.
 * Now carries a real SoundCloud embed — the field the old `Mixtape` shape lacked.
 */
export interface Mixtape {
  id: string;
  title: string;
  description?: string;
  embed: SoundCloudSetEmbed;
  /** Optional track count, surfaced in the plain-text escape hatch. */
  trackCount?: number;
  /** First-class genre tags — a salsa-tagged mix can surface on the shelf AND in a bin. */
  genres: readonly Genre[];
}

/**
 * A genre section-divider card for the second bin. The old "Various" playlists are dissolved
 * and recurated into these — each card represents a GENRE SECTION header within a bin, not a
 * single playlist.
 */
export interface GenreDividerCard {
  id: string;
  /** The genre this card introduces. */
  genre: Genre;
  /** Display label for the divider, e.g. "Latin". */
  label: string;
  description?: string;
}

/**
 * A Beatport (or other storefront) release for the counter — the purchase CTA surface.
 * No release type existed before this.
 */
export interface Release {
  id: string;
  title: string;
  artist?: string;
  /** Cover artwork (local asset path or URL). Placeholder until the port. */
  artworkUrl?: string;
  /** Where to buy. Placeholder until the port. */
  purchaseUrl: string;
  /** Storefront name for the CTA label, e.g. "Beatport". */
  storefront?: string;
  /** Optional genre tags — releases can be genre-surfaced too if curation wants. */
  genres?: readonly Genre[];
}

/**
 * Update kinds (CD decision 3): the corkboard holds ALL updates, each flyer-styled by `kind`.
 * `kind` is a visual/categorisation axis, NOT a filter — only some updates are gigs.
 */
export type UpdateKind = "gig" | "release" | "announcement" | "press";

/** A corkboard update — a dated note, flyer-styled by `kind`. No update type existed before. */
export interface Update {
  id: string;
  /** Display / ISO date. Placeholder until the port. */
  date: string;
  kind: UpdateKind;
  title: string;
  body?: string;
  /** Optional outbound link (playlist, venue, article…). */
  link?: { label: string; href: string };
}

// --- Bins --------------------------------------------------------------------------------

/** Bin ids — MUST match the two bins' station ids in stations.ts. */
export type BinId = "left-bins" | "right-bins";

/** What a bin is curated around. Shape only — which physical bin holds what is curation. */
export type BinContentKind = "playlist-series" | "genre-dividers";

export interface Bin {
  id: BinId;
  label: string;
  description: string;
  /**
   * Curated role (playlist-series vs genre-dividers). Left unset in placeholders on purpose —
   * assigning a role to a physical bin is a curation decision, not a schema one.
   */
  holds?: BinContentKind;
}

/** A line the clerk can say, keyed to where/when in the visit it fits. */
export interface ClerkVoiceLine {
  id: string;
  /** Where/when the clerk says it, e.g. "on entry". */
  context: string;
  text: string;
}

export const BINS: readonly Bin[] = [
  {
    id: "left-bins",
    label: "Left Bins",
    description: "Crates down the left wall.",
  },
  {
    id: "right-bins",
    label: "Right Bins",
    description: "Crates down the right wall.",
  },
] as const;

// --- PLACEHOLDER catalog — replace with the real inventory in the content-port task. -------
// Every entry below is obviously fake: empty media ids/URLs and empty `genres` (genres are
// CD-supplied and populated during the content port, NOT here).

export const PLAYLISTS: readonly Playlist[] = [
  {
    id: "pl-placeholder-1",
    title: "Placeholder Playlist (Vibes-shaped)",
    series: { name: "PLACEHOLDER", index: 0 },
    embed: { playlistId: "" }, // no real Spotify id yet
    genres: [], // populated during the content port
  },
] as const;

export const MIXTAPES: readonly Mixtape[] = [
  {
    id: "mix-placeholder-1",
    title: "Placeholder Mixtape (SoundCloud-shaped)",
    description: "Stand-in. Not a real set.",
    embed: { playlistId: "" }, // no real SoundCloud id yet
    trackCount: 0,
    genres: [],
  },
] as const;

export const GENRE_DIVIDERS: readonly GenreDividerCard[] = [
  {
    id: "div-placeholder-1",
    genre: "", // CD-supplied genre, populated during the content port
    label: "Placeholder Genre Divider",
    description: "Stand-in section divider for the second bin.",
  },
] as const;

export const RELEASES: readonly Release[] = [
  {
    id: "rel-placeholder-1",
    title: "Placeholder Release",
    artist: "Placeholder Artist",
    artworkUrl: "", // no real artwork yet
    purchaseUrl: "", // no real Beatport URL yet
    storefront: "Beatport",
    genres: [],
  },
] as const;

export const UPDATES: readonly Update[] = [
  {
    id: "upd-placeholder-1",
    date: "", // placeholder
    kind: "announcement",
    title: "Placeholder update",
    body: "Stand-in corkboard note. Not real news.",
  },
] as const;

export const CLERK_VOICE_LINES: readonly ClerkVoiceLine[] = [
  { id: "vl-001", context: "on entry", text: "Welcome in. Take your time." },
  {
    id: "vl-002",
    context: "at the counter",
    text: "Looking for anything in particular?",
  },
  {
    id: "vl-003",
    context: "at the mixtapes",
    text: "Those are hand-made. One of a kind.",
  },
] as const;

// --- Genre-driven, multi-surface placement -----------------------------------------------

/**
 * MULTI-SURFACING (the whole point of the `genres` tag; resolved by CURATION later, NOT here):
 *
 *   `genres` is the placement axis. A mix tagged ["salsa", "house"] is matched by BOTH a salsa
 *   rule and a house rule, so the same `Mixtape` can appear on the shelf AND be pulled into a
 *   bin's salsa section. Nothing binds an item to one station — placement is computed from tags.
 *
 *   Illustrative only (genres are populated during the content port, not in this scaffold):
 *     itemsWithGenre(MIXTAPES, "salsa")    // → the shelf's salsa picks
 *     itemsWithGenre(PLAYLISTS, "salsa")   // → a bin's salsa section
 *   The SAME underlying item can be returned by more than one such call — that is the
 *   multi-surfacing the schema must (and now does) make possible.
 */
export function itemsWithGenre<T extends { genres?: readonly Genre[] }>(
  items: readonly T[],
  genre: Genre,
): T[] {
  return items.filter((item) => item.genres?.includes(genre) ?? false);
}
