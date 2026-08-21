# Session log — 2026-08-20 (session 2): wordmark live, close sticker retired, plates landed, nav pad v1→v9

CD session (browser, Filesystem MCP direct). CC shipped plates mid-session. Al B approving throughout.

## Decisions made (and why)

**Wordmark = white, top-right, 163×17 @ 20/20 inset.** White master generated from `chunky-wordmark.png` alpha (cream variant also cut, rejected — white matches hairline system and warms optically over footage). CD placed TL per doctrine; Al B moved it TR and smaller — better: TR ceiling-shadow band is the calmest region of the frame. Behavior: 45% opacity at rest (persistent faint, never fully idle-fades), 100% hover, click → counter (home). NOT on street/entry — the baked window vinyl carries the brand there; doubling it in chrome breaks the diegetic read. Side effect: portrait brand presence may be solved free (DOM wordmark survives any crop; the July portrait off-crop note may close cheap — Phase 4 confirm).

**Close sticker RETIRED.** Al B challenged: nothing full-window exists that needs a close. Correct — no modals anywhere in the design. Dismissal model: photo-click anywhere outside panels + Esc drop the wall to State 0 (both must be implemented as exact equivalents). Insert views (sticker wall, crate release) get diegetic exits designed per-insert when built. Corner doctrine is now: TL empty/reserved · TR wordmark · BL nav pad · BR mini-player.

**design/plates/ is canon.** CC commit `8c12e57`: six rest-state plates (street/door copied from composited masters; counter/mixes/crate/vibes extracted from held final frames), 1920×1080 sRGB PNG + MANIFEST.md. Verification PASS vs browser's own decode: MAE 0.72/255, PSNR 46.8 dB, 0% pixels >16 off. Empirical color-contract proof: naive default-matrix extraction diverges ~37 dB (red worst) — the encode discipline is load-bearing, not ceremony. RULE (now in CLAUDE.md): plates are the ONLY sanctioned design backgrounds — never Meshy source stills (gen repaints them), never delivery posters (compressed, mixed extraction provenance).

**Scrim discovery.** The store paints a scrim gradient over the video that is not in the plates. Shipped view = plate + scrim. All legibility judgments on raw plates are slightly optimistic. NEXT: extract scrim values from code → reusable overlay layer in Figma + Pen.

**Vibes has no stable rest frame.** Its direct clip is retired; reachable arrivals (cv-mixes / cv-crate / ring) land on visibly different framings (~20 dB apart). Visitors see different walls depending on route. Plate uses engine's deterministic representative (EXPRESS_EDGES side[0] = cv-mixes). CD lean: re-pin (regenerate Vibes arrivals with one shared end frame via the locked Cinema Studio recipe) rather than design a gallery that survives three framings. Decision parked until Vibes design pass — nothing else depends on it.

**Doctrine rev E (tooling).** Pencil renamed Pen; CD now has direct MCP connection (live app state, execute on .pen files, integrated browser). Three lanes: **Pen** = CD-connected collab scratchpad (Meshy images, in-world/collage, composites) → approved work to Figma. **DD** = cold-start honest-UI concepting → Figma. **Figma** = canon, CC implements from it. Standing cautions hold: manual ⌘S after CD edits (no save tool in surface), export_nodes image-fill breakage assumed until retested. NEW caution: Pen's integrated browser mangles fixed-width comps wider than its viewport (page tiling, element-targeting fails) — verify live HTML comps in real Chrome, never Pen's browser.

**NAV PAD designed and frozen (v9).** Full arc, nine versions in one sitting, built as live HTML comps in docs/reference/ (CD-written via Filesystem, clicked by Al B in Chrome — first design run in the new no-relay loop; no DD used):
- v1–v2 record puck (smoke vinyl disc, world-fixed compass ticks, fixed specular sheen): liked, but "too much for the site" — killed.
- v3 plain 4-triangle d-pad, relative turn/step grammar: confusing.
- Research (mid-iteration): Grimrock separates turn buttons from step buttons (forward sits BETWEEN the turns); NN/G — labeling arrows with the room they lead to works for one-image-per-room tours (exactly our structure); tour-builder heuristic — the glyph should encode the outcome (circle = end up here, arrow = travel beyond).
- v4 arc-arrows-for-turn + destination hover labels: rejected on feel.
- v5 portal center (Al B's idea): round thumbnail of the other world as a press-to-go-there button; express-walks in/out from anywhere (NN/G anti-linear finding supports). Chained quick cuts sell "walking out."
- v6: all floating words killed; word moved INSIDE the button (OUT/IN) over faint scene texture + smoke.
- v7 COMPASS ROSE pivot (Al B): arrows go ABSOLUTE — ▲ counter · ◀ mixes · ▶ crate · ▼ vibes; pink arrow = current wall (pad is map + controls + you-are-here, zero words). ▼ sheds its exit meaning entirely; leaving is the button's only job. Square replaces circle (zero-radius law; drop shadows also stripped — zero-shadow law). Opposite walls chain shortest ring path so the room turns rather than jump-cuts (circular-express work supports absolute selection).
- v8 gem form: triangle bases span the full square width, flush. v9 FROZEN: caps 48×22 with 4px air off the square (constellation not monolith), button text = destination names — STREET inside / STORE outside (diegetic; same label-the-destination principle as the research). Assembly 100×100.
- Keys: WASD/arrows for compass, E/Enter for portal. Idle 30% after 4s. Appears at first counter arrival. Movement/tuning deferred to on-site ("we'll tighten movement once on the site" — Al B).
- Reference: docs/reference/nav-puck-v9.html (graph + express routing in its script = implementation spec in miniature). v1–v8 kept as design history.

## Figma HQ changes (file ffGlWMJ2GPhhYZyAiHQjJX)

- **Brand/Wordmark** component (18:13) on 03 · Components: image fill, full behavior description incl. close-sticker retirement note. Instances: Corner Doctrine (TL placeholder text deleted, TR placement), 5a (18:15), 5b (18:16) — all 163×17 @ 20/20, 45%.
- **Corner Doctrine board**: close sticker deleted; TL relabeled EMPTY/reserved; TR·IDENTITY text with dismissal model; BL record-puck placeholder ellipses deleted, **Nav/Pad instance** placed (30:20), BL text rewritten for compass-rose model; AT REST text updated ("faint wordmark + faded nav pad").
- **Nav/Pad** component (30:12) on 03 · Components: native layers (SVG-imported caps at exact v9 geometry, smoke square hairline stroke, STREET in Instrument Sans — font available in Figma, no fallback needed). Description = full behavioral contract + pointer to v9 file + "movement provisional" note. Instances on 5a (30:28) and 5b (30:36) at 45% rest. 5a screenshot verifies full corner doctrine live: wordmark TR + pad BL + mini-player BR on real footage.
- **NEW page 07 · Plates — canonical rest states** (22:2): all six plates native 1920×1080 in journey order with station labels (counter = home, vibes = route-divergent flag), + **MOBILE row** — six 390×844 frames sharing the desktop image hashes with FILL scale mode (Figma FILL ≡ CSS object-cover, so crops are live and exact; assumes default center object-position — verify against engine cover-box on device). Counter crop composes shockingly well in portrait — best Phase 4 omen yet. Provenance note carries commit hash, sanctioned-backgrounds rule, scrim caveat, Vibes flag. Page = reference library: design ON walls by duplicating a plate into a working page, never inside 07.

## Environment notes (banked to CLAUDE.md)

- Chrome extension instances reach the dev server via LAN IP, not localhost.
- Browser 1 (aeac6079…) = throttled relay: no input injection, media won't decode. Browser 2 (ee3e85ab…) is the working verification browser.
- Figma MCP upload URLs: POST sequentially — parallel POSTs silently dropped 5 of 6.
- Figma FILL scale mode = CSS object-cover (exact mobile-crop previews for free).
- figma.createNodeFromSvg = precise vector geometry import (used for pad caps).

## Locked / not to relitigate

- Wordmark: white, TR, 163×17 @ 20/20, 45→100 hover, → counter, absent outside.
- Close sticker retired; dismissal = photo-click ≡ Esc → State 0; insert exits per-insert.
- design/plates/ only sanctioned design background.
- Nav pad v9 form + compass-rose grammar + STREET/STORE naming (motion values provisional).
- Corner doctrine: TL empty · TR wordmark · BL nav pad · BR mini-player.

## Open threads → next session

1. **Commit CD-written files** (this log, nav-puck v1–v9, CLAUDE.md append) — block handed to Al B this closer.
2. **Scrim layer**: read gradient from code → overlay component in Figma (07 page) + Pen.
3. **Vibes re-pin decision** (CD lean: re-pin) — gates Vibes design pass only.
4. **State 0 Mixes**: Al B picks 3–4 featured titles → gen prompts + Pen composite (Pen scratchpad's first real outing).
5. **Crate release moment** design pass — only wall without an identity; dismissal-now-diegetic makes its exit a design beat.
6. **CC: Mixes panel build spec** (Figma + v5 crib + manifest + SC Widget smoke test) — fold in photo-click ≡ Esc equivalence.
7. **CC: nav pad implementation** — after Mixes or alongside; v9 file is the reference; movement tuning on-site after first pass.
8. Figma housekeeping (carried): page-03 components vs imported v5 layers reconcile; create+bind text styles.
9. Vercel preview URL peek (Al B, carried).
10. Phase 4 portrait: mobile row on 07 makes the portrait gauntlet a glance — Al B to scan and note broken stations; wordmark-in-portrait may be free now.
