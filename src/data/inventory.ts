/**
 * Inventory model — the typed shapes behind every content surface in the store.
 *
 * REAL CATALOG, ported from the old site (the content port). `genres` is EMPTY on every item
 * on purpose — a dedicated tagging pass assigns genres next, with the full inventory visible.
 * GENRE_DIVIDERS is still a placeholder this round (the "Various → genre divider cards"
 * recuration is a later curation pass).
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

// --- Real inventory, ported from the old site (see docs/research/2026-06-content-inventory.md).
// genres are EMPTY on every item on purpose — a tagging pass assigns them next. Spotify and
// SoundCloud ids are stored bare; embed/public URLs derive from them (si/utm tokens dropped,
// per the inventory doc's share-token note). GENRE_DIVIDERS stays placeholder this round.

export const PLAYLISTS: readonly Playlist[] = [
  // "Vibes" series (Spotify) → the Vibes bin. Series index = the old grid's id; the grid id
  // is canonical for the share-token variance the inventory doc flagged (Updates-mention
  // tokens ignored). Listed newest-first, mirroring the old grid.
  { id: "pl-vibes-18", title: "Vibes 18", series: { name: "Vibes", index: 18 }, embed: { playlistId: "1a3ZlBowVT2CMfWjzm4hvT" }, genres: [] },
  { id: "pl-vibes-17", title: "Vibes 17", series: { name: "Vibes", index: 17 }, embed: { playlistId: "5cQWRRQwpwpezJY5RTfd2x" }, genres: [] },
  { id: "pl-vibes-16", title: "Vibes 16", series: { name: "Vibes", index: 16 }, embed: { playlistId: "0cm55dvJAy7rO7NJZi2cLI" }, genres: [] },
  { id: "pl-vibes-15", title: "Vibes 15", series: { name: "Vibes", index: 15 }, embed: { playlistId: "4NfaOvb8dMjjQ6BWHdxjGO" }, genres: [] },
  { id: "pl-vibes-14", title: "Vibes 14", series: { name: "Vibes", index: 14 }, embed: { playlistId: "31wRFBzKyvTX5MqSCwYb2E" }, genres: [] },
  { id: "pl-vibes-13", title: "Vibes 13", series: { name: "Vibes", index: 13 }, embed: { playlistId: "5QiRuB5rg8eD4BHDJ6p4d3" }, genres: [] },
  { id: "pl-vibes-12", title: "Vibes 12", series: { name: "Vibes", index: 12 }, embed: { playlistId: "1KzTWI74Qoe0fyiFAegVPD" }, genres: [] },
  { id: "pl-vibes-11", title: "Vibes 11", series: { name: "Vibes", index: 11 }, embed: { playlistId: "3XapXTfikXL9QOqvptA9xK" }, genres: [] },
  { id: "pl-vibes-10", title: "Vibes 10", series: { name: "Vibes", index: 10 }, embed: { playlistId: "4EMKuW0DsLcDegIhkAgfrI" }, genres: [] },
  { id: "pl-vibes-9", title: "Vibes 9", series: { name: "Vibes", index: 9 }, embed: { playlistId: "36BHFD4ZpyWrnIkCBpfmIB" }, genres: [] },
  { id: "pl-vibes-8", title: "Vibes 8", series: { name: "Vibes", index: 8 }, embed: { playlistId: "7t1WxoMe6MZBlJaEnPgsD3" }, genres: [] },
  { id: "pl-vibes-7", title: "Vibes 7", series: { name: "Vibes", index: 7 }, embed: { playlistId: "6vviA7YBVzCsOFTnksXkV7" }, genres: [] },
  { id: "pl-vibes-6", title: "Vibes 6", series: { name: "Vibes", index: 6 }, embed: { playlistId: "07A467fclpwLLzHTVWvpDk" }, genres: [] },
  { id: "pl-vibes-5", title: "Vibes 5", series: { name: "Vibes", index: 5 }, embed: { playlistId: "2hzZ8LhvYg4fzuoYMIUosR" }, genres: [] },
  { id: "pl-vibes-4", title: "Vibes 4", series: { name: "Vibes", index: 4 }, embed: { playlistId: "60YEbsjUfOuGjF5qaM0bRU" }, genres: [] },
  { id: "pl-vibes-3", title: "Vibes 3", series: { name: "Vibes", index: 3 }, embed: { playlistId: "52FlFupiggMZc2FcQSNbj4" }, genres: [] },
  { id: "pl-vibes-2", title: "Vibes 2", series: { name: "Vibes", index: 2 }, embed: { playlistId: "7tDW9oOgzjHvT6oABqaZom" }, genres: [] },
  { id: "pl-vibes-1", title: "Vibes 1", series: { name: "Vibes", index: 1 }, embed: { playlistId: "067gebWfQgzosIHrdOc0Jj" }, genres: [] },

  // "Various" (Spotify) → brought in as plain playlists for now; recuration into
  // GenreDividerCards is a later pass. The old grid had no titles (positional labels here).
  // NOTE: pl-various-5's id matches the "sancocho numero tres" Updates mention (upd-2023-12-25).
  { id: "pl-various-1", title: "Various playlist 1", embed: { playlistId: "4Y2QDVRBrlGCJ9SGeDwuGq" }, genres: [] },
  { id: "pl-various-2", title: "Various playlist 2", embed: { playlistId: "7eSRm40kcExqyggV6dbpvK" }, genres: [] },
  { id: "pl-various-3", title: "Various playlist 3", embed: { playlistId: "4LtK2bI7FBoHro1JdsoxdQ" }, genres: [] },
  { id: "pl-various-4", title: "Various playlist 4", embed: { playlistId: "3TEUnudIE8nTH9TkFHDBX1" }, genres: [] },
  { id: "pl-various-5", title: "Various playlist 5", embed: { playlistId: "0n3716q0T1PJSENPSYIevj" }, genres: [] },
] as const;

export const MIXTAPES: readonly Mixtape[] = [
  // SoundCloud sets (the old "SoundCloud Spotlight"). Numeric SoundCloud playlist/set ids.
  // The old grid had no titles → positional labels; real titles need sourcing (inventory doc).
  { id: "mix-sc-1", title: "SoundCloud set 1", embed: { playlistId: "2059410711" }, genres: [] },
  { id: "mix-sc-2", title: "SoundCloud set 2", embed: { playlistId: "497097" }, genres: [] },
  { id: "mix-sc-3", title: "SoundCloud set 3", embed: { playlistId: "1526138" }, genres: [] },
  { id: "mix-sc-4", title: "SoundCloud set 4", embed: { playlistId: "1096372" }, genres: [] },
  { id: "mix-sc-5", title: "SoundCloud set 5", embed: { playlistId: "2058781242" }, genres: [] },
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
  // Beatport. The artwork↔purchaseUrl pairing is taken verbatim from the old DigitalDownloads
  // component (confident — each was one array item). Titles are de-slugged from the Beatport
  // track URL; the artwork FILENAME differs from the track slug (carry≠house-like-this,
  // escandalo≠nocturning) — flagged for CD. No artist in the source (omitted).
  {
    id: "rel-1",
    title: "House Like This",
    artworkUrl: "/assets/carry.png",
    purchaseUrl: "https://www.beatport.com/track/house-like-this/8323955",
    storefront: "Beatport",
    genres: [],
  },
  {
    id: "rel-2",
    title: "Nocturning",
    artworkUrl: "/assets/escandalo.png",
    purchaseUrl: "https://www.beatport.com/track/nocturning/2757165",
    storefront: "Beatport",
    genres: [],
  },
] as const;

// All 16 updates ported as-is (no culling — culling is a later editorial call). `kind` is set
// from each update's content (gig/release/announcement/press). `date` is the source display
// string. Full text is preserved in `body`; in-page section anchors (#anchor-*) don't exist in
// the new model, so their words are kept but their links dropped. Where an update had more than
// one external link, the primary is in `link` and any secondary URL is preserved inline in `body`.
export const UPDATES: readonly Update[] = [
  {
    id: "upd-2026-02-28",
    date: "02.28.26",
    kind: "release",
    title: `Vibes 18`,
    body: `"Vibes 18" just dropped. Listen here, or head to the Vibes section.`,
    link: { label: "Listen", href: "https://open.spotify.com/playlist/1a3ZlBowVT2CMfWjzm4hvT?si=47713d6ce17f4a37" },
  },
  {
    id: "upd-2025-10-03",
    date: "10.03.25",
    kind: "release",
    title: `Vibes 17`,
    body: `"Vibes 17" is out now. Check it here, or via the Vibes section.`,
    link: { label: "Check it", href: "https://open.spotify.com/playlist/5cQWRRQwpwpezJY5RTfd2x?si=7be01c0084e34058" },
  },
  {
    id: "upd-2025-10-01",
    date: "10.01.25",
    kind: "press",
    title: `Sunday at Il Posto — on AppleTV`,
    body: `The "Sunday at Il Posto" film is now available for streaming on AppleTV.`,
    link: { label: "AppleTV", href: "https://tv.apple.com/us/movie/sunday-at-il-posto-accanto/umc.cmc.1xfqwzx9nn0w7ss8catxpohfp" },
  },
  {
    id: "upd-2025-07-22",
    date: "07.22.25",
    kind: "release",
    title: `New "Tapes" section`,
    body: `New "Tapes" section added to the SoundCloud Spotlight. Various mix recordings from the 90's including some classic al b tapes as well as DJ's from those days. Check it out here.`,
  },
  {
    id: "upd-2024-12-20",
    date: "12.20.24",
    kind: "release",
    title: `Vibes 16`,
    body: `"Vibes 16" now available. Check it here, or via the Vibes section.`,
    link: { label: "Check it", href: "https://open.spotify.com/playlist/0cm55dvJAy7rO7NJZi2cLI?si=5962a30248b54496" },
  },
  {
    id: "upd-2024-07-21",
    date: "07.21.24",
    kind: "gig",
    title: `Block party in Greenpoint`,
    body: `Block party in Greenpoint BK on Dobbins Street and Norman Street from 2pm on. DJ's al b and Ben Manzone.`,
  },
  {
    id: "upd-2024-06-14",
    date: "06.14.24",
    kind: "release",
    title: `Housetape 2024`,
    body: `New House mix on SoundCloud: "Housetape 2024."`,
    link: { label: "Housetape 2024", href: "https://soundcloud.com/dj-al-b/housetape-2024" },
  },
  {
    id: "upd-2023-12-25",
    date: "12.25.23",
    kind: "release",
    title: `sancocho numero tres`,
    body: `Enjoy some classic latin sounds this holiday with "sancocho numero tres." Embed here as well.`,
    link: { label: "sancocho numero tres", href: "https://open.spotify.com/playlist/0n3716q0T1PJSENPSYIevj?si=285854d9efc54608" },
  },
  {
    id: "upd-2023-11-11",
    date: "11.11.23",
    kind: "release",
    title: `Vibes 15`,
    body: `"Vibes 15" now available. Check it out here, or via the Vibes section.`,
    link: { label: "Check it out", href: "https://open.spotify.com/playlist/4NfaOvb8dMjjQ6BWHdxjGO?si=b16a9992b4b044be" },
  },
  {
    id: "upd-2023-09-30",
    date: "09.30.23",
    kind: "gig",
    title: `Abe's Pagoda with Tre Dambrocia`,
    body: `Back at Abe's Pagoda in Bushwick playing tracks with Tre Dambrocia (instagram.com/3dambrocia) from 10pm until late.`,
    link: { label: "Abe's Pagoda", href: "https://www.instagram.com/abes_pagoda_bar/" },
  },
  {
    id: "upd-2023-08-04",
    date: "08.04.23",
    kind: "release",
    title: `Storm`,
    body: `"Storm", a new Deep House mix uploaded. Check it here, or via the SoundCloud mixes section.`,
    link: { label: "Check it", href: "https://soundcloud.com/dj-al-b/storm-2023" },
  },
  {
    id: "upd-2023-05-08",
    date: "05.08.23",
    kind: "release",
    title: `Vibes 14`,
    body: `"Vibes 14" is now available for your listening pleasure. Check it out here, or via the Vibes section.`,
    link: { label: "Check it out", href: "https://open.spotify.com/playlist/31wRFBzKyvTX5MqSCwYb2E?si=a7bee61d8db445a9&pt=a79ae0dbfbb010da5e202624dd52669f" },
  },
  {
    id: "upd-2023-05-06",
    date: "05.06.23",
    kind: "announcement",
    title: `New site — Chunkylabs 2.0`,
    body: `New site, who dis? We've launched Chunkylabs 2.0 with mixes, playlists, and more. If you want to live in the past, the old site still lives here.`,
    link: { label: "old site", href: "https://chunkylabsnyc.vercel.app/" },
  },
  {
    id: "upd-2023-04-11",
    date: "04.11.23",
    kind: "gig",
    title: `Abe's Pagoda with Gant Johnson`,
    body: `Catch al b tag teaming all night at Abe's Pagoda in Bushwick with the homie Gant Johnson (instagram.com/djgantjohnson) from 10pm until late.`,
    link: { label: "Abe's Pagoda", href: "https://www.instagram.com/abes_pagoda_bar/" },
  },
  {
    id: "upd-2023-03-10",
    date: "03.10.23",
    kind: "press",
    title: `Laurent Garnier radio show`,
    body: `We've rediscovered one of Laurent Garnier's radio shows featuring al b's remix of Carry Nation's "This Bitch is Alive." Check it out now!`,
    link: { label: "radio show", href: "https://soundcloud.com/laurent-garnier/s4e24" },
  },
  {
    id: "upd-2023-02-22",
    date: "02.22.23",
    kind: "press",
    title: `Sunday at Il Posto`,
    body: `Recently, al b had a small role in an indie film about our favorite NYC spot, Il Posto Accanto (ilpostoaccantonyc.com). Check out some pics from "Sunday at Il Posto" and stay tuned for a release in the near future.`,
    link: { label: "Sunday at Il Posto", href: "https://www.instagram.com/sundayatilpostofilm/" },
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
