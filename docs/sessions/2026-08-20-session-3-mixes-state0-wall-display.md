# Session 3 — 2026-08-20 — Mixes State 0: wall-display pivot, treatment law, Figma freeze

_CD session (browser, Filesystem MCP direct write). Follows session 2 (wordmark/plates/navpad). Focus: Mixes wall State 0 rest state, end to end: concept → arrangement → treatment → measured geometry → Figma canon._

## Decisions (and why)

1. **Featured objects are RECORDS, not tapes.** Tapes are too small to read at web scale; a face-out 12" sleeve is the record-shop featuring gesture and the cover art is the content itself. Supersedes the 08-20 spec's "3–4 featured tapes with legible spines" wording for State 0.
2. **Occlusion, not replacement.** Baked records in the plate are scenery (in the video); DOM covers sit OVER them. Covers are sized slightly larger than the baked sleeve beneath so no ghost edges peek.
3. **CONCEPT PIVOT (Al B): featuring lives on the LEFT DISPLAY WALL** — covers racked 1:1 over baked face-out records on the three shelf rows — not on box-tops/floor-leaners (CD's original model). Bigger covers, the natural featuring surface, activates dead space. Box-top/leaner model retired.
4. **Current featured seven** (curation NOT yet confirmed as final): sugar-cookies-1 · age-of-love · housetape-2025 · storm · jan2k · salsa-01 · live-in-bk. Al B placed all positions by hand; salsa (−0.58°) and jan2k (−0.34°) carry deliberate compensation angles.
5. **Rest treatment LOCKED (via 7-way sampler on-canvas):** `2px #FFFFFF stroke, OUTSIDE` + `shadow 0/4 blur 14 spread 3 #241200 @70%` + radius 0. Shipped CSS: `border: 2px solid #fff; box-shadow: 0 4px 14px 3px rgba(36,18,0,0.7);`
   - Sampler verdict: glows (white/pink/amber) read as smudge on a photograph; crisp strokes read as intent AND speak the smoked-glass kit's 1px-white-border signature.
   - Pink glow rejected on color law (pink = active/playing only).
   - 5px cream frame BANKED as a candidate for Vibes featured slots (gallery-matte read).
6. **Hover intent (unproven, comp v2):** warm glow bloom outside the stroke + 2–3px sleeve-pull lift + deepened shadow. Rest deliberately quiet; the bloom-from-nothing is the affordance.
7. **Shelf geometry MEASURED from plate pixels** (no more eyeballing): board shadow lines y = 254 / 373 / 492; board TOP (seat) lines y = **246 / 365 / 484**; row clear gap ≈ 119px incl. shadow → **cover size 104px**. Cover bottoms sit on seat lines.
8. **Scrim values extracted from `StationFrame.tsx`:** `linear-gradient(to top, rgba(0,0,0,.7), rgba(0,0,0,.2) 50%, rgba(0,0,0,.4))`. Now composited in the Figma canon frame. (07/Pen overlay component still carried.)
9. **VIEW ALL divider card:** two stagger slots reserved (row1-col2, row3-col3). Design TBD, collage register, ancestor of the rail's divider tabs.
10. **Placement authority rule adopted:** founder owns x/y/size by eye on canvas; CD does not touch placement unless asked — CD reads back and specs. (CD's "helpful" placement math lost to Al B's eye twice.)

## Shipped / artifacts

- **Figma canon (CC's build source):** frame `Mixes · State 0 — REST` (node 35:3) on page **06 · Mixes — screens & geometry**, right of the v5 import. Contains: canonical plate fill, 7 covers (real art, frozen positions/rotations, locked treatment), shipped scrim, **Brand/Wordmark instance TR** (163w, 20/20, 45%), **Nav/Pad instance BL** (20 inset, 30% idle), provenance note. BR mini-player pending (no component yet). Page 08 was created then merged into 06 and deleted.
- **Pen arrangement (working):** frame `mixes-state0-arrangement` inside `design/door-layer.pen` (Pen could not create a separate file — see learnings) + `fx-diagnostic` frame (scratch, delete when convenient). REQUIRES Al B ⌘S to persist.
- **Chrome comp v1:** `docs/reference/mixes-state0-composite-test-v1.html` — CD-written. Grading-recipe scaffold + judging protocol valid; **placement model outdated** (box-tops) → superseded by wall display; re-aim as v2.
- `exports/CKkp3.png`, `exports/VD9cU.png` — scratch exports, not for commit.

## Tooling learnings (Pen, banked)

- `execute` filePath **cannot create a new .pen file**; writes route to the ACTIVE editor file. (Why the arrangement lives in door-layer.pen.)
- **Effects DO render and live-sync** (strokes, shadows, image + plain fills — fx-diagnostic proved it). The session's "invisible effects" were contrast failures (amber glow on amber wall) + values too subtle at fit zoom, NOT a rendering bug. Earlier CD claims of faintly seeing them in exports were confirmation bias — verify loud before tuning quiet.
- **Full-stage overlay rects (scrim) eat canvas clicks** — hide the layer while arranging, or select via layers panel.
- **Drag-resizing desyncs wrapper frames from inner rects** (grab mismatch feels "mushy") — normalize sizes after founder drag passes.
- Anti-spin note: glow strength was rerolled 3× before the controlled diagnostic; the control-pair pattern (plain fill vs image fill, same effect) resolved it in one step. Diagnose earlier.

## Next steps

1. **Comp v2 (Chrome, decisive artifact):** wall placement from canon + real CSS grade + rest treatment + hover bloom/sleeve-pull + fade-in stagger (120ms). Answers realism AND hover in one file.
2. VIEW ALL divider card design (collage register) → fills a reserved slot.
3. Curation confirm: are these seven final? (Feeds tab-set decision against catalog counts.)
4. Mini-player component → BR of canon frame when transport exists.
5. Carried from session 2: **run the commit/push stack (status unconfirmed)**, Vercel preview peek, scrim overlay comp into 07/Pen, Crate release moment, CC Mixes panel build spec, nav pad implementation, Vibes re-pin decision.
