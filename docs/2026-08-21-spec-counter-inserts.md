# chunkylabs3 — Spec: Counter Inserts (UPDATES pad + Sticker Index)

_2026-08-21, REV B (supersedes Rev A same day — Rev A was written against a
flipped image-label mapping; CD error, corrected. Plate identities below are
verified against pixels on disk.) The Counter (N, home, reception-only: clerk +
index, NO commerce) gets TWO insert shots per the views-not-places model.
Companion Figma canon: page 11 · Counter (80:12), frame `Counter · State 0 —
REST` (80:13), bg = counter-door.poster.jpg (true hold of the door→counter
entry arrival)._

---

## Sources on disk (VERIFIED, 2752×1536 Higgsfield 2× upscales)

- `public/inserts/counter-updates.plate.source.png` — OVERHEAD PAD: near-top-
  down blank spiral pad + pen on worn wood; mixer corner TL, deck plinth TR,
  cables left. Al B's pick.
- `public/inserts/counter-index.plate.source.png` — INTERIOR DOOR VIEW: shop
  door + adjacent pane from inside at a slight angle; dense weathered flyer/
  scrap cluster on left glass, warm bulbs, grey rain street beyond; clear-ish
  center door glass. Al B's pick.
- `old-*.png` files = pre-upscale 1376×768 copies — delete at cleanup.

## Insert 1 — UPDATES (counter-top notepad)

- **Content model: TEXT ON THE PAD.** The overhead plate's paper is a near-flat
  text plane — DOM entries render DIRECTLY on the pad's paper region with a
  small rotation compensation (pad sits slightly rotated in frame; measure the
  angle in Pencil, apply matching CSS rotate; NO perspective warp needed).
  Pad in the plate is blank; all writing is DOM, forever.
- **Pagination, not scroll (Al B requirement: unlimited items).** Paper flips
  pages. 5–6 entries per page. ALL inputs flip: click page corner / mono page
  indicator ("PG 3/12"), wheel, trackpad, touch-swipe — scroll input MAPS to
  discrete flips. v1 flip = quick crossfade; page-curl banked, do not build.
- **Supersedes** the "cull UPDATES to 6–8" curation item — no cap; curation
  question becomes "what leads on page 1."

## Insert 2 — STICKER INDEX (door glass)

- **Content model:** DOM sticker/flyer collage on the clearer center door
  glass, partially occluding baked scraps at the edges (occlusion-over-baked,
  same as Mixes covers over baked sleeves). Every sticker = die-cut PNG + link.
  Contact lives HERE — the shade° sticker / pinned card IS the contact card.
- **Known trade (recorded once, closed):** baked pseudo-text on the left flyer
  cluster — illegible at rest, partially occluded by collage; acceptable.
- Reroll history (banked failure modes, still valid): a reroll batch produced
  (a) Meshy product-shot drift — object isolated on seamless studio grey
  (likely triggered by "seen straight on, centered" language); (b) pillarboxed
  partial-frame render. Founder stopped the rolling; original picks stand.
- **Process lesson (banked):** chat-upload image labels must be mapped by
  UPLOAD ORDER, not filename numeric order — a flipped mapping cost this spec
  a Rev A and two file round-trips. Verify label→pixel mapping by restating a
  visual tell before judging batches.

## Law carried into both inserts (fade-in contract, insert edition)

- Plates carry the WORLD; DOM carries everything that ever changes.
- ZERO legible text baked in plates. All writing, stickers, flyer faces = DOM.
- Updates maintenance story: edit updates.json, never touch an asset.
- Turntables are NOT a CTA (decks promise music; Mixes owns play). Pad sits
  beside the decks. Decks stay set dressing / clerk territory.
- Brick-wall third plate: KILLED (redundant with door cluster).

## updates.json (schema now, values at curation)

```json
{
  "updates": [
    {
      "id": "u-2026-08-21-a",
      "date": "2026-08-21",
      "dateLabel": "AUG 21",
      "headline": "New mix up",
      "body": "One or two lines max. Optional.",
      "href": "https://…",
      "hrefLabel": "LISTEN"
    }
  ]
}
```

- Newest-first; page 1 = most recent 5–6. `href`/`hrefLabel`/`body` optional.
- **Entry render anatomy:** dateLabel mono uppercase (Space Mono) · headline in
  the handwritten-register voice · body small · optional link arrow.
- **Handwriting call (OPEN, comp-level):** CD lean = hybrid — headlines in a
  handwriting face (or one-time scan of Al B's actual writing for the header
  treatment), dates/detail in mono receipt voice. Judge in the first comp.

## stickers.json (schema now; LIST IS A CURATION INPUT — need from Al B)

```json
{
  "stickers": [
    {
      "id": "shade",
      "label": "shade°",
      "asset": "/inserts/stickers/shade.png",
      "href": "https://…",
      "kind": "brand | friend-label | friend-business | flyer | egg",
      "newTab": true
    }
  ]
}
```

- Known so far: shade° (→ shade site, new tab — rhymes with the door bumper).
- NEEDED FROM AL B: friends' businesses/labels — names + links (+ real sticker
  art vs. to-be-made die-cuts).

## File plan + prep

- Delivery files (prep pass, CC or CD): `counter-updates.plate.jpg` +
  `counter-index.plate.jpg`, 1920×1080 downscale from sources, sRGB, no
  re-grade. Sources stay; a re-crop never needs a re-gen.
- Landing zones measured in Pencil against the plates (geometry source of
  truth): pad paper zone + rotation angle · door collage zone · the two
  hotspots on the Counter rest frame (pad on counter-top; door cluster).
  Phase 4 flag: door hotspot camera-left in the wide shot — off-crop in
  portrait; mobile entry into the index TBD.

## Order of operations

1. ✔ Sources verified + correctly named on disk.
2. Figma page 11: two insert plate frames (this session, CD).
3. Pencil geometry pass: landing zones + rest-frame hotspots (needs Pencil
   app running for MCP).
4. CD: comp v1 of the on-pad updates page (handwriting judged here).
5. Sticker inventory from Al B → die-cut pass → index collage comp.
6. Insert-open/close motion spec → CC build prompt (queues BEHIND the
   in-flight three-wall UI build; do not interrupt the loop).

## Standing notes

- Clerk (Phase 6) shares this wall: pad = clerk's log; future canned line can
  point at it ("check the pad"). No dependency either direction for v1.
- This doc is CD-written and invisible to CC until committed + pushed.
