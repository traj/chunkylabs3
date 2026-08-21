# chunkylabs3 — current state — 2026-08-21c (end of day)

_Supersedes 2026-08-21b. Add this file to the Claude Project; full detail in
docs/sessions/2026-08-21-session-counter-design-and-walls-qa.md._

## Where things stand

**All three content walls are BUILT and through four QA batches** (CC commits
c2fc74e → ae244f2, all pushed). REST→BROWSE→DETAIL live on real footage with
real catalog data; SC transport + official Spotify embeds; functional nav
puck; canonical rest-still underlay killed the route-divergent-hold problem
permanently (pixel-diff-proven route independence). Walls are in a
stabilization loop: eye pass on ae244f2 is tomorrow's opener.

**Counter is fully DESIGNED, not built** (QA-FIRST HOLD: no counter CC work
until Al B declares walls stable). Both inserts complete in design: UPDATES
pad (text-on-pad at +18.3°, pagination, UPDATES stamp, real 16-entry
updates.json harvested from the old site) and STICKER INDEX (verified die-cut
assets: shade°/CK.LAND/Cut Loose/Il Posto postcard; founder-dragged collage
seats in Pen; stickers.json with 3 hrefs pending). Spec: docs/2026-08-21-
spec-counter-inserts.md Rev B. Figma page 11 + Pen frames carry the canon.

## Locks and supersessions today (these win over older docs)

- Pink grammar CLOSED as-built: pink = "the live thing" (playing + active
  chrome + puck you-are-here).
- Player is chrome-class: persistent at ALL stations incl. entry, through
  tweens, draggable (BL default by the puck), ✕ closes. Stop-on-navigate
  RETIRED.
- Direction-while-open = close + go (player exempt).
- "HUD-free entry" narrowed to "WORDMARK-free entry": puck + title exist
  everywhere from first load; entry = vertical-axis puck variant
  (street up=door; door up=counter/down=street); interior = four-way +
  center-press exits to street (routed via counter from walls).
- Canonical rest stills (underlay, all walls): mixes-counter / vibes-crate /
  crate-counter posters — the exact images the arrangements are pinned to.
  Mixes coords UNCHANGED; session-4 reconcile flag resolved; Vibes re-pin
  flag closed.
- Crate spine: VIEW ALL / gaz / grace (frankie off-wall, stays in catalog).
  VIEW ALL interim = multicolor gradient, correct slot sizes both walls.
- Custom Spotify playback stays DEAD (verified thrice); tall-embed card is
  the design; metadata-API display tracklist banked for v2.

## Tomorrow ("get things tight")

1. Eye pass ae244f2: route-independent occlusion, no still-pop at tween
   edges, 16:9 no-move check, player through real 2-hop, SC scrubber items.
2. Grade decision: underlay sits above the scrim → walls brighter. Sampler
   pass (scrim-over-underlay vs amber multiply vs graded stills).
3. Scoped batch 5 from the pass.
4. Counter follow-ups (design-side only): 3 hrefs, incoming sticker logos,
   zone-measure. Build stays held.

## Standing smalls
White wordmark asset · door hotspot hover-fill · Beatport art mismatch ·
networked art re-pull (640/1400) · genre tagging · blurb copy pass ·
close-✕/VIEW ALL finals (sticker-wall pass) · Phase 4 mobile · Phase 5
domain · Phase 6 clerk (pad = clerk's log tie-in noted in spec).

## New cautions banked
Upload-order label mapping for gen batches · Pen bounds +50 phantom · Pen
rotation CCW-positive · Meshy product-shot drift (bad for plates, ideal for
sticker gens) · remove.bg preview res (fine ≤330px display) · TakeScreenshot
may omit fresh overlay children (read-back + eyes; never reroll).
