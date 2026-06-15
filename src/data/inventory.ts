/**
 * Inventory model — records, bins, mixtapes, and clerk voice lines.
 *
 * SHAPE + PLACEHOLDERS ONLY. The real catalog is a separate decision; do not add real
 * releases/playlists here. Everything below is obviously fake on purpose.
 *
 * This module is also the data behind the /music escape hatch (the plain-DOM,
 * server-rendered SEO/accessibility surface), so it must stay free of any video or
 * browser-only dependency — pure data.
 */

/** Bins map onto the two "bins" stations. */
export type BinId = "left-bins" | "right-bins";

export interface Bin {
  id: BinId;
  label: string;
  description: string;
}

/**
 * A record in a bin. Named `RecordItem` (not `Record`) to avoid shadowing TypeScript's
 * built-in `Record<K, V>` utility type.
 */
export interface RecordItem {
  id: string;
  title: string;
  artist: string;
  year?: number;
  /** Which bin this lives in. */
  binId: BinId;
  /** Placeholder slot for a future preview/embed URL. Not real content. */
  previewUrl?: string;
}

export interface Mixtape {
  id: string;
  title: string;
  description: string;
  trackCount: number;
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

// --- PLACEHOLDER catalog — replace with the real inventory in a later task. ---

export const RECORDS: readonly RecordItem[] = [
  {
    id: "rec-001",
    title: "Placeholder Side A",
    artist: "Test Artist One",
    year: 2024,
    binId: "left-bins",
  },
  {
    id: "rec-002",
    title: "Placeholder Side B",
    artist: "Test Artist Two",
    year: 2025,
    binId: "right-bins",
  },
  {
    id: "rec-003",
    title: "Untitled Demo (placeholder)",
    artist: "Sample Three",
    binId: "left-bins",
  },
] as const;

export const MIXTAPES: readonly Mixtape[] = [
  {
    id: "mix-001",
    title: "Placeholder Mixtape Vol. 1",
    description: "Sample track list. Not a real release.",
    trackCount: 8,
  },
  {
    id: "mix-002",
    title: "Placeholder Mixtape Vol. 2",
    description: "Another stand-in mixtape for layout purposes.",
    trackCount: 12,
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

/** Records that belong to a given bin — keeps the bins stations driven by data. */
export function getRecordsByBin(binId: BinId): RecordItem[] {
  return RECORDS.filter((r) => r.binId === binId);
}
