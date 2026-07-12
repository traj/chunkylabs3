# Session — 2026-07-12 — door layer complete + branded entry + the color contract

Continues from the 2026-07-11 Pencil.dev tooling evaluation (trial planned, not yet
adopted) and the PRD's Phase 1.1. THIS session ran the entire door-layer trial end to
end — Pencil adopted, the asset kit built on three newly-proven recipes, the layer
composed — then expanded into a **branded entry reshoot** (elements baked into the
walk-up via Cinema Studio) and, when the reshoot's boundary artifacts resisted four
correction passes, surfaced the real root cause: **the project had no color contract.**
Every encode was untagged; decoders disagreed (BT.601 vs BT.709, AV1 vs H.264 paths
diverging ~2 luma). Fixed at encode.sh level. The entry now rests on crisp composited
stills with the video as pure in-between motion. Accepted as "close enough for now,
tighten later."

## Decisions

- **Pencil.dev: ADOPTED for DOM-layer design, with documented warts.** The trial ran
  three CC rounds plus extensive hand-editing. What works: `batch_design`/`batch_get`
  (precise geometry read/write), `get_editor_state` schema, image fills, notes as
  annotations, `enabled:false` as the hide-but-keep primitive. The warts (all logged,
  none disqualifying): **no save/persist tool** — every CC canvas change needs a human
  ⌘S before commit (osascript keystrokes blocked by accessibility perms);
  `export_nodes` broken for image-fill designs → **the render path is an external
  Pillow composite driven by .pen geometry**, which proved MORE valuable than a
  working export (it became the reshoot compositor); `get_screenshot` is a ~398px
  thumbnail — full-res verification is always the external composite. **The .pen is
  the geometry source of truth**; components/compositors derive from it by script,
  never hand-typed.

- **The ref-faithful gen recipe — BANKED, won three times.** For photoreal branded
  objects: compose flat art with the REAL mark → hand to Meshy as ref → "photograph
  this exact X faithfully" → **strict letterform gate on the pick** (compare against
  the real vector; any drift = reject). Produced the shade bumper sticker (gate
  passed, star glyph intact), the chunkylabs die-cut sticker, and the "Come in /
  WE'RE OPEN" placard (fonts fetched from google/fonts GitHub for the flat art:
  Pacifico + Anton). Corollary proven by failure first: **manually-drawn vector
  elements and manual blend composites read as UI over the photoreal frame** — the
  glare never meshes. Appearance must come from a photographic process; DOM does
  placement and interaction only.

- **Element sourcing map (final):** chunkylabs wordmark = gen'd vinyl die-cut letters
  (pink letters keyed out of the die-cut gen — prompting "transparent vinyl" directly
  would fight the model); shade = photographed black bumper sticker (ref-faithful
  gen, bg-removed); flyers = the charcoal-background blanks (reroll after the
  glass-background v1s proved unkeyable — **flat dark ground is the keying contract
  for gen'd cut assets**); OPEN sign = cream placard, which **settles the PRD
  entry-CTA question diegetically** ("Come in / WE'RE OPEN" IS the CTA; hotspot +
  hover treatment carries the affordance).

- **Entry model pivot: STILL-REST.** The rendered DOM element overlay (crisp PNGs
  over their baked twins) was built, three-bug-fixed, and then **retired on Al B's
  call**: crisp-over-warped never fully covers (halos/edges peek), and the
  superimposition mid-walk read as broken. Final model: **composited stills
  (out0/out1 + all five elements) are the resting frames; the video is purely the
  in-between; interaction is transparent percentage-anchored hotspots (imagemap
  model)** — which is exactly the Phase-1.3 wall-zone pattern, so the walls reuse
  the component. Boundary dissolves (~250ms) mask the gen's repaint delta. Stills
  ship as JPEG q94 4:4:4 (~600KB vs 2.4MB PNG; 4:4:4 mandatory — 4:2:0 would smear
  the pink type). Kept from the retired overlay: the atRest gate + hardened
  cover-box math (now serving the hotspots).

- **Branded reshoot: pins are the composited stills; pin-matching is absolute.**
  Cinema Studio start=out0-composited, end=out1-composited. Rules banked: **all
  elements present in BOTH pins** (an element in one pin materializes mid-tween —
  the initial street-scale drop of small elements was reversed on Al B's catch);
  the gen **repaints its pins** (frame 0 ≠ start pin, MAD ~17 — never point a rest
  still at the pin PNG; the poster/frame-0 IS the rest frame, or dissolve); roll
  gate = frame-sweep on letterforms (soft=pass, melt=reject, 2 rejects=fallback).
  Roll 1 rejected (warp, no convergence). Roll 2 shipped after **photometric
  harmonization of the pins** (measured blur/grade/grain match of elements into the
  frames) — alignment gate passed at worst 6.5px vs ≤15 (roll 1 control: 45.7px).

- **Entry speed: 0.75s (revised from "entry not sped").** Deliberate revision of the
  06-25 decision, Al B's call, twice (2s → 1.5s → 0.75s): hides the gen's mid-walk
  softness (the rain-front blink principle) and suits the still-rest model where the
  stills carry the dwell. Built from the raw each time, explicit frame indices.

- **THE COLOR CONTRACT (root cause of the four-pass "dimming" chase).** All encodes
  were color-untagged → ffmpeg decoded BT.601 while Chrome painted BT.709 (every
  grade calibration measured a picture the browser never displayed), AND the AV1 vs
  H.264 paths painted the SAME YUV ~2 luma apart (iOS = the worse H.264 path). Fix:
  encode.sh writes explicit bt709/tv tags **in the bitstream** (`-x264-params` /
  `-svtav1-params` — container-level `-color_*` flags alone don't reach it), and the
  correction pipeline converts RGB with `out_color_matrix=bt709`. Codec agreement
  now ≤0.18 luma. **Durable rule: verify color in the browser (CDP paint), never
  ffmpeg-only.** All OTHER edges remain untagged/divergent — invisible today (no
  edge dissolves against a reference) — swept into Phase 2 (noted in
  asset-pipeline-spec.md).

- **Correction pipeline (correct_walkup.py) — the deterministic stack that made
  roll 2 shippable, in order of discovery:** explicit frame-index selection (ffmpeg's
  fps filter silently drops true frame 0 on PTS-gapped raws — endpoints verified MAD
  0.0); per-frame FULL affine ramp (the gen's drift is anisotropic — y-squash up to
  +1.2%, "the door gets taller" — and `estimateAffinePartial2D` structurally hides
  it; fit full affine); per-frame grade ramp between browser-anchored endpoint fits;
  interior trajectory nudge (per-frame gain to a smooth endpoint-to-endpoint luma
  ramp; the gen bows +2 luma mid-clip); low-frequency spatial gain field
  (blur(still)/blur(video), σ=40px — killed the wood-tint, which was regional
  repaint, not global grade); closed-loop iteration against PAINTED output
  (response gain ~1–2x, measured per frame). Final painted gates: all boundaries
  ≤0.08Δ both codecs, interior 0.12, wood channel-spread 0.96→0.19.

- **"Last correction pass" pre-agreement honored.** Remaining residual is texture
  repaint (unstructured, ~sub-JND). Accepted. The two untouched knobs if perfection
  is chased later: dissolve duration (deliberately held back all session — single
  variable never spent) and further loop iterations.

## Shipped (committed, in order — ALL on the unpushed stack)

- `9020989` — door-layer.pen seeded (held frame as frame fill — the no-lock
  workaround; MCP pipe proven)
- *(two canvas commits with hashes not restated in-session: placement pass 1 and the
  guide-fix/assets-sweep — verify in git log at push time)*
- `b250dfb` — reshoot pins composited from .pen geometry (<0.01px vs Pencil's own
  layout; out0 transform measured by ORB+RANSAC: scale 0.6136)
- `a73baa0` — out0 re-composited with ALL five elements (pin-matching rule)
- `ea7a6dc` — GO: branded 2s walk-up live (alignment gate 6.5px worst)
- `81c8fbd` — 1.5s + the fps-filter frame-0 off-by-one found and fixed (endpoints
  bit-exact)
- *(overlay build commit — hash not restated)* + `967d60c` — DOM overlay 3-bug fix
  (portrait threshold h>w; atRest gate voiding stale `ended`; cover-box hardened)
- `f375240` — STILL-REST model live (stills as rest frames, hotspots, dissolves;
  JPEG 4:4:4 delivery)
- `8adfb86` — constant grade+scale correction (superseded)
- `1576247` — per-frame full-affine + grade ramp (anisotropy found)
- `9d2d494` — **color contract**: bt709 bitstream tagging in encode.sh; recalibrated
  browser-anchored; 0.75s
- `48e3bc4` — closed-loop final: painted gates pass both codecs; spatial gain field
  kills the wood tint; still-nudge proven a dead end (8-bit rounding no-op — the
  float clip is the lever)

**Entry state: splash (crisp branded still) → street rest (crisp still, hotspot) →
0.75s branded walk → door rest (crisp still; sign readable, star correct; hotspot →
counter). All other edges untouched and verified each pass.**

## Asset kit (design/ + public/)

Live: gen'd vinyl chunkylabs letters (window), gen'd shade bumper (door), OPEN
placard (door), flyer-curl + flyer-grimy (flanks), flyer-clean (banked),
chunky-wordmark.png + shade-mark.png (source masters), out0/out1 composited masters
(design/reshoot/, the pins), entry stills (public/stills/, JPEG delivery). Parked:
white-border die-cut chunkylabs sticker ("another part of the site").
Housekeeping open: live assets split between design/ root and design/assets/
(.pen URL prefix quirk); duplicate shade-sticker-trans.png to dedupe.

## Process lessons (beyond the banked decisions)

- **A verification number "close enough to wave through" is the number to chase** —
  the poster-stability check caught the frame-0 drop; the browser-vs-ffmpeg gate
  caught the color contract. Four passes hid behind an ffmpeg-only gate.
- **Feed-forward correction has a ceiling; close the loop against the painted
  output.** And characterize the response gain before iterating (it was 2x in spots).
- **uint8 truncation vs rounding costs ~0.5 level/channel** — enough to fail a gate.
- **Remover-site cuts get verified** (real alpha, lettering not deleted-as-background)
  — this one was fine, but the check is cheap.
- Small type (<~10px lines) is what gen fumbles; letterform gates scale with size.
- CC judgment highlights: refusing the still-nudge with the rounding proof; stopping
  at the color-tagging fork mid-prompt; the fps off-by-one catch. The
  stop-and-report discipline paid three times.

## Open threads

- **Phase 0.1 push — CRITICAL, now ~15+ commits deeper.** The whole session rides
  the unpushed stack on a dead upstream. First domino, genuinely overdue.
- **Phase 2 addition:** color-tag re-encode sweep across ALL edges (+ resolves the
  AV1/H.264 divergence everywhere). No re-gen needed. Noted in
  asset-pipeline-spec.md.
- **Entry perfection (parked, "tighten later"):** dissolve-duration knob unused;
  further closed-loop iterations available. Sub-JND today.
- **Portrait:** wordmark is off-crop in portrait (no relocation in the still-rest
  model — the old DOM relocation retired with the overlay). Phase 4 judgment.
- **Pencil housekeeping:** assets root/assets split + dedupe; two unrestated commit
  hashes to confirm in git log.
- **Carried:** counter surface (1.2, next design block) · wall surfaces (1.3 —
  hotspot component now exists as its foundation) · curation (Phase 3) · on-device
  gauntlet (now includes: verify the entry dissolves + H.264 color on real iOS) ·
  Vercel preview / domain cutover · clerk (Phase 6).

## Next step

**Push the stack (Phase 0.1) before anything else** — this session more than doubled
the unpushed work. Then the natural next build is **Phase 1.2 (counter content
surface)**, now easier than planned: Pencil is proven, the ref-faithful recipe covers
branded objects (Beatport sleeves, contact flyer), and the hotspot component is the
interaction model. The entry sequence is done-for-now by explicit agreement — revisit
only after a real-device look (gauntlet via Vercel preview, which the push unblocks).
