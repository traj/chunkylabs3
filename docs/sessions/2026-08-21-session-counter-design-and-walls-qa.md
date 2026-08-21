# Session log — 2026-08-21 — Counter design track + walls QA batches 1–4

_CD session (browser). Two parallel tracks: CC built + stabilized the three
content walls (5 pushed commits); CD+founder designed the Counter inserts
end-to-end. Several standing locks superseded — recorded below; docs that
contradict this log are older and lose._

## CC track (all pushed to origin/main)

1. **Walls build** — c2fc74e (mixes S0–S2p) / 040b680 (vibes) / 28b705a
   (crate). Shared REST→BROWSE→DETAIL system, WallStage 1920×1080 stage
   mapping, catalog.ts from harvest manifest, SC hidden-iframe transport,
   Spotify official embeds (encrypted-media law held).
2. **Fix batch** — c743ba5. Diagnostic: nav was never click-eaten (decorative
   pad only). Stage-pin clamp added; functional nav puck (room-map compass,
   arrows/WASD, queue-at-most-one, idle-fade, key hint); wordmark white via
   CSS filter; street/door copy stripped.
3. **QA batch 2** — 39d1aba. Full compass (all 12 interior pairs, chained
   hops where no direct clip — mixes⇄crate via vibes); direction-while-open
   = close+go; player relocated BL, draggable (grip), session position,
   persists across navigation incl. entry; title centered on puck; crate
   spine swap; VIEW ALL gradient + vibes size fix; covers stay mounted
   under states (vanishing-records bug fixed).
4. **QA batch 3** — 3032b23. Mixes "grid regression" diagnosed as Browser-2
   poster artifact (coords were verbatim Pen; real cause surfaced in batch
   4 — see below). Player chrome-class (no tween dissolve) + play-button
   clip fix; playlist/vibes card rebuilt around tall 352px Spotify embed
   (small 120² thumb; custom Spotify playback remains DEAD — verified:
   anonymous preview-only, play() bug, OAuth+Premium wall; metadata-API
   display-only tracklist BANKED for v2); frankie off the crate wall
   (stays in catalog); puck at ALL stations — interior four-way + center
   = street exit (routed via counter from walls), entry VERTICAL variant
   (street: up=door; door: up=counter/down=street), title everywhere,
   wordmark still absent on entry.
5. **QA batch 4** — ae244f2. **Canonical rest-still underlay** (see
   Decisions) — pixel-diff proof: two different arrival routes into Mixes
   render byte-identical composites. Clamp floors = designed insets
   (puck ≥58 left, wordmark ≥58 right, scaled by cover.scale; player drag
   clamp stays 16).

## Counter design track (CD + founder; QA-FIRST HOLD: no CC build until
## walls declared stable — Al B call)

- **Figma page 11 · Counter**: canon rest frame 80:13 (bg counter-door
  .poster.jpg = true hold of the entry arrival), insert frames 82:10
  (UPDATES) / 82:11 (INDEX), provenance notes.
- **Plates** (Meshy/NBP + Higgsfield 2×, 2752×1536, verified vs pixels):
  `public/inserts/counter-updates.plate.source.png` = overhead pad;
  `counter-index.plate.source.png` = interior door view. (Label-flip saga:
  CD mapped chat labels by numeric filename order instead of upload order —
  two wasted round-trips; lesson banked in spec Rev B.)
- **UPDATES insert**: text ON the pad (near-flat plane; measured rotation
  +18.3° — pad edges 18.0/18.6°, mild perspective ignored); pagination not
  scroll (5–6/page, all inputs map to flips); UPDATES brand-stamp title
  (Archivo Black 25, near-black #1A1512); real content — full 16-entry
  history harvested from chunkylabsnyc2 Updates.svelte into
  `public/inserts/updates.json` (real hrefs; internal targets flagged).
  Comp A lives in Pen (`comp-updates-A-on-pad`); lifted-page comp B deleted.
- **INDEX insert**: DOM die-cut collage on door glass. Assets verified
  (real alpha, lettering intact): shade° (design/shade-sticker-trans.png —
  BUILD TASK: copy into public/inserts/stickers/), ck-land.png,
  cut-loose.png, il-posto-postcard.png. Founder-dragged seats in Pen frame
  `counter-index-insert` (read back; collage owns the whole glass — CD's
  rough zone rect retired). `stickers.json` written; 3 hrefs PENDING.
  More stickers expected; drop-in pattern proven (gen brief in spec).
- Spec: `docs/2026-08-21-spec-counter-inserts.md` **Rev B**.

## Decisions / supersessions (these WIN over older docs)

- **Pink grammar CLOSED: as-built.** Pink = "the live thing": playing
  state + active tab/PLAY chrome + puck you-are-here.
- **Player**: chrome-class. Persistent across ALL stations incl. entry,
  through tweens (no dissolve), draggable, session position, ✕ to close.
  "Stop on navigate" and "mini-player-follows out of v1" both RETIRED.
  Corner doctrine: BR freed; player lives BL by the puck by default.
- **Direction-while-open = close + go** (supersedes movement-suspended).
- **"HUD-free entry" NARROWED to "wordmark-free entry."** Puck + title
  exist at all stations from first load; entry uses the vertical-axis
  variant. (CD mis-corrected this once — the street always had the
  vertical puck in the design; canon language was stale.)
- **Canonical rest-still underlay** (all walls): at atRest the content
  stack paints the wall's canonical still (the exact image its arrangement
  was pinned against) as its bottom element, inside the content fade
  group. Kills route-divergent holds permanently; closes the standing
  Vibes re-pin flag; resolves the session-4 Mixes plate→true-hold
  reconcile WITHOUT coord changes (mixes-counter poster ≈ plate framing;
  Pen bg swapped to the true hold, coords verified standing).
  Stills: mixes-counter / vibes-crate / crate-counter posters.
- **VIEW ALL interim**: gradient (#FF4D63→#C9954F→#4B2EA0 @135°), cream
  mono label; crate spine VIEW ALL/gaz/grace (frankie off-wall); vibes
  VIEW ALL at 172/164 like neighbors. Final design still sticker-wall pass.
- **Mixes⇄crate routing**: chained hops via vibes accepted as the circular-
  express feel (no wrong-clip jumps).

## New banked cautions

- Chat-upload image labels map by UPLOAD ORDER, not filename numeric order;
  restate a visual tell before judging gen batches.
- Pen bounds reporter can show a phantom +50 y on children — trust stored
  x/y + founder eyes, don't chase it.
- Pen rotation is CCW-positive (CSS instinct is CW-positive) — cost one
  wrong-way rotation.
- Meshy "product-shot drift" (object on studio grey) is a plate failure
  mode but the DESIRED output for die-cut sticker gens — prompts in spec.
- remove.bg previews are 669×373 — fine ≤~330px display, note if hero-sized.
- TakeScreenshot may render frame fills but not fresh overlay children —
  read-back + founder eyes; never reroll (rule held twice today).

## Open items → tomorrow

1. **Eye pass on ae244f2** (real Chrome): route-independent Mixes occlusion
   (arrive 2–3 ways), still invisible in motion (no pop at tween edges),
   16:9 "nothing moved" check, player through a real 2-hop route, SC
   scrubber items (carried since walls build), key hint on street.
2. **Grade/sampler decision** (CC flag): underlay sits above the
   StationFrame scrim → walls now read brighter. Decide: scrim over
   underlay, amber multiply, or grade baked into stills. Sampler pass.
3. Tighten list from the eye pass → scoped batch 5.
4. Counter: 3 sticker hrefs (Al B) · more sticker gens as logos arrive ·
   zone-measure pass · insert motion spec + CC prompt (STILL HELD behind
   walls stability).
5. Smalls carried: dedicated white wordmark asset · door hotspot hover-fill
   toning · Beatport art mismatch (curation) · networked art re-pull
   (640/1400) · genre tagging · description-line copy pass · close-✕ and
   VIEW ALL final designs (sticker-wall pass) · Phase 4 mobile · Phase 5
   domain · Phase 6 clerk.

## Repo state
CC pushed through ae244f2. CD/design stack committed separately (see
commit for this file): counter spec Rev B, plates + stickers + both JSONs,
door-layer.pen (bg swap, comp A, collage, notes), this log, current-state
2026-08-21c.
