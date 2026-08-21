# chunkylabs3 — Session 5 (2026-08-21): UI States on All Three Walls

_CD session (browser, Figma MCP + Filesystem MCP). Figma: `chunkylabs3 — Design System`
(ffGlWMJ2GPhhYZyAiHQjJX). This log IS the closer access probe — direct closer._

---

## THE BIG CORRECTION — v5 is the FINAL UI (read this first)

CD opened the session building Mixes State 1 from the **v4 browse-rail brief**
(divider tabs, invented rail) because CD's doc trail ended at v4. Al B corrected:
the DD track completed BEFORE session 3 — **v5
(`docs/reference/mixes-player-detail-v5-figma.html`) is the approved FINAL UI design**,
imported to page 06 as section 13:145, with approved comps 5a (PLAYER ALONE),
5b (GATEFOLD DETAIL), 5c (PLAYLIST DETAIL) on page 05 and **page-03 components as the
spec** (page 05's own label says exactly this). The v4 brief's divider tabs LOST their
round to v5's text tabs.

- CD's rail + Tab/Divider + Rail/Row components: deleted same day. Page 03 = single spec.
- CD also briefly renamed the v5 section "SUPERSEDED" — wrong, reverted. Name stands:
  `V5 approved — imported from docs/reference/mixes-player-detail-v5-figma.html`.
- **Locked lesson: the FILE is canon over CD's continuity docs.** Session MDs are the
  map; the Figma/repo is the territory. Verify against the file before overruling it.

## Shipped — states across all three walls (all lifted from v5 verbatim, real data)

**Method for every state frame:** clone the wall canon → clone the approved v5
element (panel 13:23, 5b card 13:86, 5c card 13:123) → `rescale(1.2)` (v5 comps are
1600×900 = 5/6 stage) → mirror/dock RIGHT → swap REAL manifest data + canon image
hashes into rows/cards. No structure invented.

- **Page 06 Mixes:** State 0 REST (35:3, reconciled) · State 1 BROWSE (57:25) ·
  State 2 DETAIL mix/Jan2k (63:32) · State 2p PLAYLIST DETAIL piragua (63:153).
- **Page 08 Vibes:** State 1 BROWSE via VIEW ALL (75:25, NO tabs — single collection,
  Spotify grammar, 18 covers) · State 2 DETAIL vibes 18 = 5c card (75:156).
  Featured-cover click jumps straight to its State 2 (annotated, no extra comp).
- **Page 09 Crate:** State 1 BROWSE RELEASES (77:10) · State 2 RELEASE DETAIL w/ BUY
  (78:26) · State 2e EDIT DETAIL w/ full transport grammar, Frankie playing (77:24).

**Mixes reconcile (both standing flags cleared):** canon bg = `mixes-counter.poster`
TRUE hold (plate retired; letterbox is honest) + amber multiply #F5923A 30% on all 7
covers. Treatment law verified intact (2px #FFF outside / 0 4 14 3 #241200 70% / r0).

## Geometry + HUD spec (LOCKED, for CC implementation as INSETS not pixels)

- Browse panel: 530×754 at **(1265, 91)** — right dock, ALL walls (one structure,
  learnable seat). Detail card seat: (610, 216) mix/5b · (610, 150) playlist/5c —
  Al B eye pending on seats.
- **HUD cluster BL:** Nav/Pad at inset 58/58 → (58, 922) @ 45%. Room title
  (`HUD/LocationTitle` component 56:12) centered UNDER the puck at (58, 1030):
  Archivo Black 12, tracking 0, white, **100% in ALL states** — Al B's spec, lifted
  from his hand-placed instance in the v5 comp. Instances: MIXES/VIBES/CRATE. Entry
  stays HUD-free.
- **Wordmark TR:** inset 58 right / 44 top, rescaled to 196w (v5 proportion ×1.2),
  45%. (Vibes/Crate wordmarks were OVERFLOWING the frame pre-fix — 208w at x1737.)
- **HUD-yields-to-UI fade rule: RETIRED.** CD invention; v5 approved shows HUD at 45%
  with panels open. 45% is the only HUD opacity, every state.
- **Scrim policy (Al B):** removed from ALL comps (Mixes ×4, Vibes, Crate). Lives in
  `StationFrame.tsx`, applied in dev. Comps show the raw picture.
- **Close ✕ (Al B-tuned):** no stroke, mono ✕ 13 @ 70%, 28×28 hit box, 8px corner
  inset, on every panel + card. INTERIM — flow spec's **close-sticker** (collage
  register) is the real design, rides with the sticker-wall pass. Esc ladder:
  detail → browse → rest.

## Grammar rules per wall (locked)

- Pink = playing only. SoundCloud surfaces (Mixes mixes/live, Crate EDITS) get full
  transport grammar: NOW PLAYING row/tag, PLAY → persistent transport. Spotify
  surfaces (Mixes PLAYLISTS, ALL of Vibes) claim NOTHING: no pink, no PLAY, embed is
  the player, OPEN IN SPOTIFY (spec law: `allow="encrypted-media"` survives).
- Crate: **EDITS tab before RELEASES** (Al B), counts "36 EDITS · 2 RELEASES".
  OPEN — default landing tab (EDITS?) awaiting Al B's word.
- Crate buy card: neutral outlined RELEASE tag, single action **BUY ON BEATPORT**
  (secondary hidden — one honest action). Release-moment ceremony layers on later.
- Long edit titles: track name = title, edit credit → meta line.

## Data flags (feed the CC art/data re-pull task)

- **QUIMBARA IS AN EDIT, not a release** — manifest truth (only Carry Nation +
  Escandalo are Beatport). Its bin-row seat in Crate State 0 is now a curation
  question for Al B.
- SoundCloud durations in manifest are junk preview values (4–7s) — re-pull real
  runtimes; rows show years only until then.
- Art still needed in Figma: sancocho dos/tres, Koto, Deee-Lite (ink thumbs today).
- Descriptions don't exist in harvest — every card carries a labeled CD-draft line;
  CD copy pass rides with curation. Playlist URLs are real per item (clean CC data).

## Cautions banked this session

- **v5-derived panels/cards are AUTO-LAYOUT** (HTML import): anything appended needs
  `layoutPositioning: 'ABSOLUTE'` or flex flow eats it (close ✕ bug, fixed).
- **Stage scale:** v5 comps are 1600×900 — multiply positions ×1.2 for 1920 frames;
  HUD elements were hand-placed unscaled, which caused the edge-cramping Al B caught.
- Figma MCP `upload_assets` POST response hash ≠ stored fill hash (internal re-hash) —
  verify swaps by read-back/screenshot, not hash equality.
- Figma client views go STALE (Al B saw a reverted rename minutes after the revert) —
  same class as the Pen screenshot caution: trust tool read-back.
- `query()` selectors choke on `/` in names — use `children.find()` for `Nav/Pad` etc.
- v5 row 6 has no meta text node — guard `texts[1]` when batch-editing rows.

## Open threads

1. Crate default landing tab (edits-first order is in; default = EDITS needs Al B yes).
2. State-2 card seats + whether panel/room dims behind an open card (Al B eye).
3. Player placement — after all rooms; **Counter question:** reception-only wall,
   does it join this grammar pass or not (riffing next session).
4. VIEW ALL divider card + close-sticker designs (collage register, sticker-wall pass).
5. Vibes: 12 remaining covers not yet uploaded to Figma (rows show 6 of 18).
6. Mixes S1 header shows "75 TRACKS · SOUNDCLOUD" — curation will refine what counts.

## Next

- **CC implementation begins** — loop/goal style: CD writes goal-state prompts per
  wall from the LOCKED specs above (panel geometry, grammar rules, insets, Esc
  ladder), CC iterates against acceptance criteria while CD + Al B riff Counter +
  sticker-wall (Claude Design trial brief is parked ready).
