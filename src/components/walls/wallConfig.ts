/**
 * Per-wall content config + S0 REST arrangements.
 *
 * All geometry is 1920×1080 DESIGN SPACE, taken verbatim from the Pen frames
 * `mixes|vibes|crate-state0-arrangement` (design/door-layer.pen). It is authored in raw design
 * px and rendered inside a 1920×1080 canvas pinned to the object-cover box (see WallStage), so
 * these numbers map 1:1 onto the held video frame.
 *
 * TWO interim placements (no Pen node existed — see the build report), clearly flagged:
 *  - Mixes VIEW ALL: seated at the open bottom-row rack seat (365,380).
 *  - Crate VIEW ALL: a 4th edits-spine slot (718,531) as the S0→BROWSE trigger.
 */

import type { StationId } from "@/data/stations";
import {
  EDITS,
  LIVE,
  MIXES,
  MIXES_PLAYLISTS,
  RELEASES,
  TAPES,
  VIBES,
  type WallItem,
} from "@/data/catalog";

/** A featured cover on the wall (rest treatment, plain). Design-space px. */
export interface Slot {
  itemId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** degrees (CSS rotate). Sub-degree design tilts, from the Pen. */
  rot?: number;
}

/** A Crate binclip: a cover seated INTO a bin, its bottom clipped at the bin lip. Design-space px. */
export interface BinSlot {
  itemId: string;
  /** the clipping frame (bin mouth) */
  frameX: number;
  frameY: number;
  frameW: number;
  frameH: number;
  /** cover offset inside the frame (shadow margin) + cover size */
  inset: number;
  sleeve: number;
}

/** Which player grammar a set of items takes. */
export type Grammar = "transport" | "spotify" | "external";

export interface WallTab {
  id: string;
  label: string;
  items: readonly WallItem[];
  grammar: Grammar;
}

export interface WallConfig {
  stationId: StationId;
  /** Room title under the nav pad, and the nav-pad "here" highlight. */
  roomTitle: string;
  navCurrent: "mixes" | "vibes" | "crate";
  /** Browse tabs (Mixes/Crate). Undefined → single list (Vibes). */
  tabs?: readonly WallTab[];
  defaultTabId?: string;
  /** Single flat list when there are no tabs (Vibes). */
  singleList?: { items: readonly WallItem[]; grammar: Grammar };
  /** Featured covers (non-bin) on S0. */
  featured: readonly Slot[];
  /** Crate binclips on S0. */
  bins?: readonly BinSlot[];
  /** Interim VIEW ALL card seat. */
  viewAll: Slot;
  /** Vibes: a featured cover click jumps straight to DETAIL (skips browse). */
  featuredSkipsToDetail?: boolean;
  /** Vibes sleeve inset: slot is 172, sleeve renders ~164 (4px inset). */
  sleeveInset?: number;
}

// --- MIXES (left-bins) ------------------------------------------------------------------------
const MIXES_CONFIG: WallConfig = {
  stationId: "left-bins",
  roomTitle: "MIXES",
  navCurrent: "mixes",
  tabs: [
    { id: "mixes", label: "MIXES", items: MIXES, grammar: "transport" },
    { id: "live", label: "LIVE", items: LIVE, grammar: "transport" },
    { id: "tapes", label: "TAPES", items: TAPES, grammar: "transport" },
    { id: "playlists", label: "PLAYLISTS", items: MIXES_PLAYLISTS, grammar: "spotify" },
  ],
  defaultTabId: "mixes",
  // 7 covers, 104² — Pen frame CKkp3 (rows y=142/261/380).
  featured: [
    { itemId: "sugar-cookies-volume-1", x: 366, y: 142, w: 104, h: 104 },
    { itemId: "age-of-love-mix", x: 489, y: 142, w: 104, h: 104 },
    { itemId: "housetape-2025", x: 240, y: 261, w: 104, h: 104 },
    { itemId: "storm", x: 365, y: 261, w: 104, h: 104 },
    { itemId: "jan2k", x: 490, y: 261, w: 104, h: 104, rot: -0.34 },
    { itemId: "salsa-01-2002", x: 243, y: 380, w: 104, h: 104, rot: -0.58 },
    { itemId: "live-in-bk-2019", x: 488, y: 380, w: 104, h: 104 },
  ],
  // INTERIM: open bottom-row-middle seat.
  viewAll: { itemId: "__view_all__", x: 365, y: 380, w: 104, h: 104 },
};

// --- VIBES (mixtape-shelf) --------------------------------------------------------------------
const VIBES_CONFIG: WallConfig = {
  stationId: "mixtape-shelf",
  roomTitle: "VIBES",
  navCurrent: "vibes",
  singleList: { items: VIBES, grammar: "spotify" },
  // 2×2, 172² slots, ZERO rotation — Pen frame fTdrZ (matches the frozen spec exactly).
  featured: [
    { itemId: "vibes-12", x: 546, y: 43, w: 172, h: 172 },
    { itemId: "vibes-01", x: 746, y: 44, w: 172, h: 172 },
    { itemId: "vibes-07", x: 547, y: 238, w: 172, h: 172 },
    { itemId: "vibes-18", x: 746, y: 241, w: 172, h: 172 },
  ],
  viewAll: { itemId: "__view_all__", x: 746, y: 434, w: 172, h: 172 },
  featuredSkipsToDetail: true,
  sleeveInset: 4,
};

// --- CRATE (right-bins) -----------------------------------------------------------------------
const CRATE_CONFIG: WallConfig = {
  stationId: "right-bins",
  roomTitle: "CRATE",
  navCurrent: "crate",
  tabs: [
    { id: "edits", label: "EDITS", items: EDITS, grammar: "transport" },
    { id: "releases", label: "RELEASES", items: RELEASES, grammar: "external" },
  ],
  defaultTabId: "edits",
  // Edits spine, 125² — Pen frame ZCOog. Spine reads top→bottom: VIEW ALL, gaz, grace, frankie
  // (VIEW ALL took frankie's top seat; frankie moved to the interim 4th slot).
  featured: [
    { itemId: "gaz-nevada-i-c-love-affair-al-b-s-rapless-edit", x: 718, y: 212, w: 125, h: 125 },
    { itemId: "grace-jones-love-on-top-of-love-al-b-s-endless-dub-edit", x: 720, y: 371, w: 125, h: 125 },
    { itemId: "frankie-knuckles-workout-al-b-s-fk-always-edit", x: 718, y: 531, w: 125, h: 125 },
  ],
  // Bin row — binclips (bottom clipped at the lip; 24px shadow margin; 133/131² sleeve).
  bins: [
    { itemId: "the-carry-nation-house-like-this-al-b-s-bitches-before-snitc", frameX: 790, frameY: 591, frameW: 181, frameH: 87, inset: 24, sleeve: 133 },
    { itemId: "escandalo-nocturning-al-b-and-garito-s-cold-d-remix-bagpak-s", frameX: 943, frameY: 591, frameW: 181, frameH: 87, inset: 24, sleeve: 133 },
    { itemId: "celia-and-johnny-quimbara-al-b-s-azucar-edit", frameX: 1095, frameY: 589, frameW: 177, frameH: 90, inset: 24, sleeve: 131 },
  ],
  // INTERIM: top spine seat as the S0→BROWSE trigger.
  viewAll: { itemId: "__view_all__", x: 718, y: 52, w: 125, h: 125 },
};

export const WALL_CONFIGS: Readonly<Record<string, WallConfig>> = {
  "left-bins": MIXES_CONFIG,
  "mixtape-shelf": VIBES_CONFIG,
  "right-bins": CRATE_CONFIG,
};

export function getWallConfig(stationId: StationId): WallConfig | undefined {
  return WALL_CONFIGS[stationId];
}

export const VIEW_ALL_ID = "__view_all__";
