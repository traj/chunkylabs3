/**
 * Wall catalog — the typed content behind the three content walls (Mixes / Vibes / Crate).
 *
 * DERIVED from the harvested `content/harvest/manifest.json` (the real ported catalog) at module
 * load, so there is ONE source of truth for the item set. Pure data — no browser/video deps — so
 * it can be imported by server components too.
 *
 * GRAMMAR NOTES baked into the shape:
 *  - SoundCloud "durations" in the manifest are junk preview values, so a track's meta shows the
 *    YEAR ONLY (`year`), never a duration. The real duration is read live from the SC Widget by
 *    the transport, never from here.
 *  - `source` decides the surface: `soundcloud` → BR transport (mixes/live/tapes/edits);
 *    `spotify` → official embed (playlists tab + all vibes); `beatport` → external buy, no player.
 *  - `blurb` comes from the clearly-marked INTERIM drafts file; curation replaces it later.
 */

import rawManifest from "../../content/harvest/manifest.json";
import { draftBlurb } from "./blurbs.draft";

export type CatalogSource = "soundcloud" | "spotify" | "beatport";

/** What kind of thing an item is — drives which tab/surface/grammar it takes. */
export type WallItemKind =
  | "mix" // SoundCloud set track — MIXES tab
  | "live" // SoundCloud live-record track — LIVE tab
  | "tape" // SoundCloud tape track — TAPES tab
  | "edit" // SoundCloud edit/remix track — Crate EDITS tab
  | "release" // Beatport release — Crate RELEASES tab (buy only)
  | "playlist" // Spotify "various" playlist — Mixes PLAYLISTS tab
  | "vibe"; // Spotify Vibes-series playlist — Vibes wall

export interface WallItem {
  /** Stable id = the art file basename (globally unique across the catalog). */
  id: string;
  kind: WallItemKind;
  title: string;
  /** Public path under /public (served by Next). */
  artPath: string;
  /** Release/upload year from the source date, or null when the source has no date. */
  year: number | null;
  source: CatalogSource;
  /**
   * SoundCloud public permalink — feeds the Widget (transport) AND "OPEN IN SOUNDCLOUD".
   * Present only on `soundcloud` items.
   */
  scUrl?: string;
  /** Official Spotify embed URL (with encrypted-media). Present only on `spotify` items. */
  spotifyEmbedUrl?: string;
  /** External "open/buy" link: OPEN IN SPOTIFY (spotify) / BUY ON BEATPORT (beatport). */
  externalUrl: string;
  /** INTERIM draft description — replaced by curation. */
  blurb: string;
}

// --- manifest shape (loose; the file is trusted, we just narrow what we read) ------------------
interface ManifestEntry {
  wall: string;
  source: string;
  type: string;
  parentSet?: string;
  title: string;
  canonicalUrl: string;
  embedUrl: string | null;
  art: string | null;
  date: string | null;
}

const MANIFEST = rawManifest as unknown as ManifestEntry[];

/** "art/tracks/housetape-2025.jpg" → "housetape-2025"; also the item id. */
function basename(artPath: string): string {
  const file = artPath.split("/").pop() ?? artPath;
  return file.replace(/\.[a-z0-9]+$/i, "");
}

/** "art/x.jpg" (manifest) → "/catalog/x.jpg" (served from public). */
function publicArt(artPath: string): string {
  return "/catalog/" + artPath.replace(/^art\//, "");
}

function yearOf(date: string | null): number | null {
  if (!date) return null;
  const y = new Date(date).getFullYear();
  return Number.isFinite(y) ? y : null;
}

function kindOf(e: ManifestEntry): WallItemKind | null {
  if (e.source === "beatport") return "release";
  if (e.source === "spotify") return e.wall === "vibes" ? "vibe" : "playlist";
  if (e.source === "soundcloud" && e.type === "track") {
    switch (e.parentSet) {
      case "Mixes by al b":
        return "mix";
      case "Live Records by al b":
        return "live";
      case "Tapes by al b":
        return "tape";
      case "Edits by al b":
      case "Remixes/Production by al b":
        return "edit";
      default:
        return null;
    }
  }
  return null; // SoundCloud parent-set playlists (type "playlist") are not displayed as items
}

function toItem(e: ManifestEntry): WallItem | null {
  const kind = kindOf(e);
  if (!kind || !e.art) return null;
  const id = basename(e.art);
  return {
    id,
    kind,
    title: e.title,
    artPath: publicArt(e.art),
    year: yearOf(e.date),
    source: e.source as CatalogSource,
    scUrl: e.source === "soundcloud" ? e.canonicalUrl : undefined,
    spotifyEmbedUrl: e.source === "spotify" ? e.embedUrl ?? undefined : undefined,
    externalUrl: e.canonicalUrl,
    blurb: draftBlurb(kind, id),
  };
}

const ALL: readonly WallItem[] = MANIFEST.map(toItem).filter(
  (x): x is WallItem => x !== null,
);

const byKind = (k: WallItemKind) => ALL.filter((i) => i.kind === k);

// --- Grouped catalog (order preserved from the manifest = the old grid's newest-first) --------
export const MIXES = byKind("mix"); // 30
export const LIVE = byKind("live"); // 22
export const TAPES = byKind("tape"); // 23
export const MIXES_PLAYLISTS = byKind("playlist"); // 5 (Spotify "various")
export const VIBES = byKind("vibe"); // 18
export const EDITS = byKind("edit"); // 36
export const RELEASES = byKind("release"); // 2

/** Lookup by id (featured arrangements + detail routing reference items by id). */
export const ITEMS_BY_ID: ReadonlyMap<string, WallItem> = new Map(
  ALL.map((i) => [i.id, i]),
);

export function getItem(id: string): WallItem | undefined {
  return ITEMS_BY_ID.get(id);
}

/** Artist SoundCloud page — the tab-level "OPEN IN SOUNDCLOUD" target (set permalinks aren't harvested). */
export const SOUNDCLOUD_ARTIST_URL = "https://soundcloud.com/dj-al-b";
