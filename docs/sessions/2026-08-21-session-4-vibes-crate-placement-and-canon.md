# Session 4 — 2026-08-21 — Vibes + Crate placement, true-hold doctrine, Figma canon ×4

_CD session (browser, Filesystem MCP direct write + Pencil MCP + Figma MCP). Follows session 3 (Mixes State 0). Focus: extend the session-3 placement process to Vibes and Crate end to end, then canonize Vibes, Crate, and both entry stations in Figma. Street interaction pass surveyed and PARKED._

## Decisions (and why)

1. **Placement-first ordering (Al B).** Per-wall State 0 arrangement passes run BEFORE any browse-UI work — placement is empirical (the tray→rail pivot was learned from comps, not specs), and the loaded walls will dictate where browse chrome can live. Wall delta specs demoted to footnotes on what placement reveals.

2. **TRUE-HOLD-FRAME DOCTRINE (the session's load-bearing finding).** A wall's at-rest image is the ARRIVAL CLIP'S LAST FRAME, not the pristine plate. Measured: plate-vibes.png is ~15 mean brighter/sharper than any rendering frame; rest grade varies BY ARRIVAL DIRECTION (Vibes ~6pts R via-Mixes vs via-Crate; Crate ~2.5pts). Convention gift: **reverse-clip posters ARE true hold frames on disk** (reversed clip's first frame == forward clip's final frame; e.g. `vibes-crate.poster.jpg` == the crate→vibes hold). All new arrangement/canon backgrounds use these. Textural drift between arrival directions is absorbed by the slot overhang. **Mixes canon (35:3) still uses the plate — flagged for reconcile at next Mixes touch, not relitigated today.**

3. **Retired vibes push-in confirmed dead.** Its last frame is visibly zoomed vs the ring holds — but `resolveTransition` routes every live counter→Vibes arrival through the chained express, so the outlier never renders. False alarm; no action.

4. **Vibes State 0 FROZEN.** Geometry (1920, from `vibes-crate.poster.jpg`): seats y=227/410/603, baked sleeve ~164sq, slot 172 (=164+4px overhang/side), row 4 DEAD (bins occlude), portrait-safe x 656–1264. Arrangement (Al B): 2×2 cluster — vibes-12 (546,43) · vibes-01 (746,44) / vibes-07 (547,238) · vibes-18 (746,241) — VIEW ALL divider (746,434), all 172sq. **ZERO ROTATION — verdict final:** CD measured baked-sleeve leans and applied capped tilts; Al B rejected by eye ("looked weird"). Occlusion is safe at zero rotation (max keystone displacement ≤ overhang), so tilt was aesthetic-only and the square read won. Do not relitigate. Right column (x746) = 3 portrait-safe slots; left column desktop-only (known trade).

5. **Vibes covers are the real art.** The 18 harvest jpgs are the finished Spotify colorway series (flat field + "al b" + title pill) — CD initially misread them as auto-placeholders; manifest confirms 18 Spotify playlists → art. At 300sq they're fine for slots, marginal for the in-place bloom → **re-pull at 640 queued** (fold Beatport 1400s in).

6. **Crate State 0 FROZEN — Al B inverted the CD proposal, and it's better.** Geometry (from `crate-counter.poster.jpg`): left-grid seats y=190/350/510, sleeve ~158sq w/ ~20px horizontal overlap, slot 166; left grid spans x~20–860 so only its rightmost column survives portrait. Arrangement: **edits spine** = right grid column, Frankie Workout (718,52) / Gaz Nevada (718,212) / Grace Jones (720,371), 125sq, one per row, portrait-safe, honest 1:1 targets. **Bin row** = Carry Nation + Escandalo (133sq, tops 615) + Quimbara (131sq, top 613) seated IN the bins. Commerce is discovered in the dig, not racked — releases sitting in the crate literally say "dig here." Known trade: heroes straddle/left of portrait line; mobile leads with edits. Bins + wall crates stay ZONE territory (dig trigger → 34-item edits inventory). No third hero until earned.

7. **Binclip model invented (bin-seated covers).** Clip wrapper frame whose BOTTOM EDGE = clip line = measured bin lip (y=678 under CN/ES, 679 under Quimbara); cover child at (24,24) inside 24px shadow margins; bottom stroke + shadow die at the lip by construction (no bottom border). Founder handles: drag wrapper to re-bin, drag its TOP edge up to reveal more cover. Reused verbatim in the Figma canon.

8. **Amber multiply carried into canon.** New canon covers carry the Pen harmonization layer (#F5923A @30% MULTIPLY) because that's what Al B approved on canvas. Mixes canon lacks it — second reconcile flag, resolves at the treatment-sampler pass (multiply-vs-clean is itself a sampler question, esp. over the flat Vibes colorways).

9. **Entry canon deltas (deliberate).** Street/door rest = the stills, canonical BY CONSTRUCTION (still-rest model) — no hold extraction. **No Nav/Pad, no DOM Wordmark instances** on entry frames: entry is HUD-free by rule and the brand is baked (neon). Interaction geometry ships as a clearly-named annotations group ("NOT rendered in product") so canon stays honest.

10. **Door mark mapping CONFIRMED (visually, via canon screenshot):** Pen `Ve5Sr` = shade° sticker (969,687 90×50) · `NQZHy` = WE'RE OPEN placard (945,348 68×120) · `d3oPkd` = wordmark neon region (1249,139 299×166). **Egg sticker has NO Pen rect yet** (visible in still ~916–949, 300–332). Pen layers still unnamed — naming pass approved-in-principle, pending a word from Al B. Shade-sticker hotspot needs an **href-opening hotspot type** (StationHotspot currently navigates to StationId only) — small CC type extension, door station only.

11. **Street pass PARKED (Al B).** Pen frame + Figma import = state capture, not a green light. Open when resumed: egg-sticker pick (candidates: left-window cream patch 647,476 37×28 at portrait-safe edge [CD lean] vs right-window label 1290,518 30×13 desktop-only), storefront-hotspot tightening (rect extends onto wet street — odd hover), CROSS THE STREET scrawl gen (the one gen task), stations.ts copy/CTA strip (CC), door-egg payload decision (do NOT invent a second payload; lean = share the unreleased track or stay dormant), unreleased-track pick.

## Shipped / artifacts

**Pen (`design/door-layer.pen`) — ALL REQUIRE Al B ⌘S:**
- `vibes-state0-arrangement` (fTdrZ): true-hold bg, seat + portrait guides, 4 covers + VIEW ALL at frozen positions, geometry/provenance note (incl. zero-rotation verdict).
- `crate-state0-arrangement` (ZCOog): true-hold bg, guides, edits spine, 3 binclip wrappers at measured lips, provenance note.
- `street-station` (tJ0CC): entry-street still bg, portrait guide, storefront-hotspot rect, 2 egg-candidate rects, provenance note. (Door-station `bi8Au` untouched.)

**Figma (`chunkylabs3 — Design System`, ffGlWMJ2GPhhYZyAiHQjJX):**
- Page **08 · Vibes — screens & geometry**: frame `Vibes · State 0 — REST (frozen from Pen 2026-08-21)` (47:2) — true-hold bg, 4 covers + VIEW ALL, locked treatment + amber multiply, shipped scrim verbatim, Wordmark TR 45% + Nav/Pad BL 30% instances, provenance note.
- Page **09 · Crate — screens & geometry**: frame `Crate · State 0 — REST (…)` (47:20) — same pattern + edits spine + 3 binclips at exact lip geometry.
- Page **10 · Entry — screens & geometry**: `Street · REST` (50:3) + `Door · REST` (50:21) — canonical stills, scrim, annotations groups (hotspots, marks, egg candidates), provenance notes. No corner instances (rule).
- 12 sequential image uploads (2 hold posters, 2 stills, 4 vibes covers, 2 Beatport, 3 edit covers — one URL/POST each), all verified by screenshot.

## Tooling learnings (banked)

- **Pen screenshots go STALE after Move/batch operations** — repeated shots returned pre-batch renders while the document data was verifiably correct. Verify via `Get` read-back or founder's eyes; do not reroll screenshots (anti-spin). Single-node screenshots immediately after creation can also return blank (timing).
- **Founder manual rotation removal leaves full-turn residue** (−360/−720) plus sub-pixel position drift from the rotate/unrotate round trip. Normalize (rotation:0, round x/y) after founder passes — same family as the session-3 wrapper-desync caution.
- **Reverse-clip posters are free true-hold frames** (see decision 2) — no ffmpeg extraction needed for wall rest states.
- **Figma MCP held:** sequential upload POSTs 12/12 (session-3 caution holds), `createInstance` cross-page via `getNodeByIdAsync` works without page switch, `upload_assets` with nodeId REPLACES the fills array — re-add overlay layers (amber multiply) in a follow-up pass.
- Pencil: top-level frames created via `Insert` default to flexbox — set `layout:"none"` for stage frames or children x/y are ignored (bit us once, fixed).

## Next steps

1. **Al B: ⌘S `design/door-layer.pen`** — three new frames are unsaved without it. Then run the commit block (chat). Session-3 stack status STILL unconfirmed — the block is additive-safe either way.
2. **Treatment samplers** (now runnable on real art in the canon frames): Vibes (multiply-vs-clean × locked-stroke-vs-banked-5px-cream) and Crate; then reconcile Mixes canon (multiply + plate→hold bg) in one touch.
3. **CC task (small): art re-pull** — Spotify covers at 640, Beatport at 1400, idempotent update to harvest script.
4. **Door micro-pass:** name the three Pen rects (mapping confirmed), add the egg-sticker rect, decide egg payload, CC href-hotspot type extension.
5. **Street pass** when un-parked (see decision 11 list).
6. Carried: comp v2 (Chrome, decisive), VIEW ALL divider design, curation confirms (featured picks per wall now real), mini-player component → canon BRs, Vercel preview eyeball, Phase 4 mobile scan, counter sticker-wall insert (parked, Claude Design trial brief).
