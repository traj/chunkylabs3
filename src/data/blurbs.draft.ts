/**
 * ⚠️ INTERIM DRAFT COPY — NOT FINAL. ⚠️
 *
 * One plausible sentence per catalog item, so the DETAIL cards have a `blurb` to render.
 * These are machine-stubbed placeholders (sentence case), deliberately low-effort per the
 * build brief ("do not spend time on copy quality"). A curation pass REPLACES this whole file
 * with hand-written blurbs — either edit `draftBlurb` into a real `Record<id, string>`, or swap
 * the template out entirely. Nothing else in the app should encode blurb copy.
 */

import type { WallItemKind } from "./catalog";

// A few rotating sentence frames per kind. The item's own id picks one deterministically, so the
// drafts read varied rather than identical — but they are still placeholders, not real copy.
const FRAMES: Record<WallItemKind, readonly string[]> = {
  mix: [
    "A long-form set that settles into a groove and stays there.",
    "Recorded in one pass — the room, the records, the hour.",
    "House and its neighbours, mixed the way the night ran.",
    "One of al b's deep-cut sessions, dusted off and re-racked.",
  ],
  live: [
    "Captured live off the board, crowd and all.",
    "A real room on a real night — warts, tape hiss, and everything.",
    "Straight from the booth, no edits, no second takes.",
    "The set as it happened, start to finish.",
  ],
  tape: [
    "A mixtape rescued from a shoebox and dubbed forward.",
    "Ninety minutes of whatever was on heavy rotation that season.",
    "An old cassette, transferred before it faded for good.",
    "Vintage sequencing from the tape-trading days.",
  ],
  edit: [
    "An al b re-edit — extended, chopped, and built for the floor.",
    "Rebuilt from the original so it actually mixes.",
    "A DJ tool: the good part, looped and stretched.",
    "Reworked with the dancefloor, not the radio, in mind.",
  ],
  release: [
    "An official release, mastered and out on the label.",
    "Available to buy — support the artist and the imprint.",
    "The finished record, pressed and for sale.",
    "A proper release, licensed and cleared.",
  ],
  playlist: [
    "A rolling selection, updated as the mood moves.",
    "A themed set of tracks pulled together for the season.",
    "Curated listening — press play and let it run.",
    "A grab-bag of current favourites in playlist form.",
  ],
  vibe: [
    "One entry in the Vibes series — a mood in playlist form.",
    "Another chapter of Vibes: unhurried, warm, and easy.",
    "A Vibes volume for the slower part of the day.",
    "The Vibes run continues — sequenced to drift.",
  ],
};

// Tiny stable hash so the same id always draws the same frame.
function pick(id: string, n: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % n;
}

export function draftBlurb(kind: WallItemKind, id: string): string {
  const frames = FRAMES[kind];
  return frames[pick(id, frames.length)];
}
