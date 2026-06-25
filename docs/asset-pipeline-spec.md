# chunkylabs — asset pipeline spec (gen → encode → QA → slot-in)

_The contract that takes a real creative idea all the way to a clip the transition
engine can ship. The engine is machinery-complete and desktop-verified; this track
fills its slots with real footage instead of the synthetic "DO NOT SHIP" placeholders._

> **STATUS — 2026-06-23 (pt.2): the four-walls navigation pivot supersedes parts of
> this spec.** `/store` is now a **click-navigated, zero-scroll four-walls hub**, not a
> scroll walk-through, so the Stage-1 shot list below was re-cut from a 5-clip linear
> chain into **outbound clips from the counter hub** (see the rewritten Stage 1). Three
> clips are now real and live — **street→door**, **door→counter** (both push-ins), and
> **counter→Mixes** (the first pivot) — proving the pipeline end-to-end. The
> **counter→wall pivot recipe is LOCKED** (Cinema Studio start+end frames) and the
> **speed pass** (now **4× → ~2s** for the counter↔wall quarter-turns) is the encode
> standard for pivots; both are written into Stages 1–2.
> Full history: `docs/2026-06-23-session-pt2-mixes-wall-cinema-studio-pivot.md`.

References fleet capabilities documented in `agent_machine/docs/{media-pipeline-
orchestration-plan,comfyui}.md` — this is the chunkylabs-specific specialization of
that general plan.

---

## The shape: four stages, two of them deterministic

Mapped onto the fleet plan's own bucket framework, so it stays consistent with how
the rest of the media pipeline is being built:

| Stage | What | Bucket | Who |
|---|---|---|---|
| **1. Gen** | Produce raw transition footage | Judgment (pick the take) + deterministic (roll the jobs) | Founder + CD creative; Higgsfield/ComfyUI execute |
| **2. Encode** | Raw output → engine-spec AV1+H.264 MP4 + poster | **Pure deterministic** | A script (extend `encode.sh`) — no LLM |
| **3. QA** | Verify encode correctness + on-device playback + motion reads | Judgment (pass/fail) | Founder + CD; on-device guide |
| **4. Slot-in** | Drop encoded clips into repo, update asset refs | **Pure deterministic** | CC, one scoped prompt |

The two deterministic stages (encode, slot-in) are scripts/CC tasks and cost ~zero
judgment. The two judgment stages (gen take-selection, QA pass/fail) are where you
and I actually spend attention. This is the same split the orchestration doc argues
for — keep the LLM/human out of the mechanical stages.

---

## Stage 1 — Gen

**The shot list is a four-walls hub, not a linear chain.** `/store` places the visitor
at the **counter hub**; they click to travel OUT to a wall, and the outbound clip
starts at the counter and ends at the wall. The lead-in (street → door → counter) is
two push-ins; the three walls hang off the counter. **Four outbound clips total**, one
inbound-less start (The Street mounts no video):

| # | Transition | Type | Camera intent | Status |
|---|---|---|---|---|
| 1 | street → door | push-in | Forward push toward the storefront, neon, rain on glass | **real (49a43fb)** |
| 2 | door → counter | push-in | Through the door, swing toward the clerk counter (kept full 8s — background car is part of the beat) | **real (789ef95)** |
| 3 | counter → **Mixes** (left) | **pivot** | Turn LEFT to the mixes/tapes wall (absorbed the old mixtape-shelf identity) | **real (91b7a1a), 4×→~2s** |
| 4 | counter → **Crate** (right) | **pivot** | Turn RIGHT to the crate-dig wall — invent a *distinct* right-side wedge | pending |
| 5 | counter → **Vibes** (ahead) | push-in | Move AHEAD into the Vibes space — easiest (least invention) | pending |

The walls live on the scaffold station ids `left-bins` (=Mixes), `right-bins` (=Crate),
`mixtape-shelf` (=Vibes); the id→wall rename is a deferred design thread. An exit is
wired only once the destination's real clip exists, so unfilmed walls stay unreachable.

### Two gen recipes — push-in vs pivot (LOCKED 2026-06-23)

- **Axial moves (push-ins): Higgsfield Veo 3.1 Lite, prompted camera.** Camera motion
  is **prompt-driven** on the Create Video screen (Veo offers only "GENERAL" — there is
  **no "Dolly In" preset**; Higgsfield "presets" are content/genre *style* templates,
  not camera-motion). Push toward a fixed scene with positive-state prompt framing
  ("rain has just stopped"). Cheap (~8–12 cr); this is how door & counter were shot.

- **Sideways pivots (counter→wall turns): Higgsfield Cinema Studio with start+end
  frames.** **Prompted panning does NOT work for this content** — three escalating
  failures proved it (Veo → geometry melt; Kling → held geometry but invented an
  off-frame window; Kling+dim → still inventing). Root cause: a pan reveals off-frame
  area and the model hallucinates what's there; no prompt fully controls invention.
  **The fix is to pin both ends:** start frame = **the counter's held final frame**
  (extracted from the counter clip via `ffmpeg -sseof -0.1`), end frame = **the
  destination-wall still** (Meshy NBP), Cinema Studio tweens between the two pinned
  images, Camera/Lens/Aperture on Auto. ~80 cr/clip — justified: pay once for control
  instead of repeatedly for "meh". Real per-shot camera control only lives here.

- **Invented in-between room is CANON, not a bug.** The pivot tween travels through
  invented shop geometry (a left-side wedge between counter and wall) — it reads as the
  shop being *deeper than the storefront implies*, and Al B banked it as canon.
  **Consequence rule:** each wall pivot invents the wedge to *that* wall; wedges must
  not overlap or imply each other (Left/Mixes wedge is built; the Right/Crate wedge must
  read as a distinct right-side space; Vibes/ahead is a push-in so it invents least).

### Still-frame gen (the wall destinations)

Wall stills are **Meshy NBP, prompt-only** (no reference image — a counter ref drags
counter geometry in; warm-world continuity is carried by prompt language). Lessons
banked: compose walls in **zones** (e.g. crates below / shelved above) so the eye gets
a reading order, not a uniform "wall of books"; and aim spine text at **ILLEGIBILITY,
not blankness** ("blurred, smudged, illegible — texture and colour, no readable words")
— positive-state framing beats hard negation. The v2 **clerk is a composite layer**,
not baked into the counter still (the still leaves a clerk-shaped negative space).

**Secondary: ComfyUI / HunyuanVideo on powerpuff** (`192.168.7.251:8188`) — ambient
loops / clerk idle / texture stills (Flux.1), not the hero transitions (tops out ~512×320
/ 25 frames). Optional v1; the transitions are the spine.

**Output reality — why gen isn't "done":** Higgsfield hands back its own mp4 (whatever
codec/params it chose); ComfyUI hands back animated WEBP. **Neither is shippable** — the
engine requires ordered AV1→H.264 sources with file-accurate codec strings. That's
Stage 2, non-negotiable.

---

## Stage 2 — Encode  (the bridge that makes gen output shippable)

This is the stage we flagged as "design it in, don't discover it at integration."
Good news: **it mostly exists.** CC already wrote `encode.sh` to produce the
synthetic clips; it needs to point at real gen output instead of `testsrc2` and
otherwise keeps the exact spec it already encodes to.

**Per clip, produce — into the same MP4 container family the engine expects:**

- **AV1:** SVT-AV1 (`libsvtav1`, *not* libaom), Profile 0, 8-bit, `yuv420p`,
  `+faststart`. Parse the actual `av1C` box for the real codecs string (the engine
  uses file-accurate strings — `av01.0.08M.08` for the placeholders — not the
  illustrative one; keep that discipline so the `<source>` fallback discriminates
  cleanly).
- **H.264:** libx264, Main profile, broadly compatible level, `+faststart`. **The
  mandatory floor** — never ship AV1-only. Parse `avcC` for the real string.
- **Poster:** first frame, jpg — and **deliberately so** (verified at full speed
  2026-06-25; *not* a bug, the earlier "deferred fix" is **rejected**). The engine plays
  every clip from `currentTime 0` and HOLDS the video's *own* last decoded frame as the
  rested "you are here" view; the `poster` is only ever shown in the brief cold-mount decode
  gap (~90–125ms, measured) and behind the autoplay-blocked tap-to-play backdrop. So the
  poster must MATCH frame 0 to precede playback seamlessly — which on a *pivot* is the counter
  (where you ARE as the turn starts), exactly right. A LAST-frame poster (the earlier proposal)
  would paint the *destination* wall, then snap back to frame 0 to play — a visible backward
  jump, worse on slow mobile decode. The cold-mount "black flash" that motivated revisiting
  this was a **Slow-3G artifact** (a download stand-in that never exercises the decode gap); at
  real speed the warmed poster (StoreWalkthrough's exit-poster preload) covers the gap.
  `encode.sh` stays **first-frame** in all three modes (`--real`, `--reverse`, synthetic).
- Target 1080p, GOP ~2s (not keyframe-dense — these are play-through, never scrubbed).
- **SPEED PASS for pivots (LOCKED standard).** Raw Cinema Studio pivots run ~8s, which
  feels slow in a click-hub. Speed them up with a **single `setpts` from the RAW** plus
  `fps=24` — *not* stacked on an already-sped file (stacking re-samples already-dropped
  frames and risks judder). The counter↔wall **quarter-turns (Mixes, Crate) are 4× → ~2s**
  (`setpts=PTS/4.0,fps=24`; verified **48/48 distinct frames, no judder**, 2026-06-25). The
  earlier 2× (`setpts=PTS/2.0` → ~4s) was a first cut, halved again for snappier click-nav;
  the "deeper shop" character survives. Codec strings stay file-accurate (`av01.0.08M.08` /
  `avc1.4D4028`). **Derive the matching REVERSE from the NEW forward** via `encode.sh
  --reverse` — never speed forward/reverse independently; they must stay exact mirrors at the
  new duration. **Note:** an in-place re-encode overwrites the *tracked* binaries, so the
  `durationSec` change MUST commit the new binaries alongside or the repo pairs new metadata
  with old assets (learned on the Mixes 2× pass, 49b0c11; re-confirmed on the 4× pass).

**This stage is pure deterministic — a script, no agent.** Per the fleet plan's
core argument, routing `ffmpeg encode → parse boxes → write files` through an LLM
turn would burn tokens on bucket-1 work for zero gain. ffmpeg is already installed
locally, so the encode can run on the Mac; it does not need powerpuff/GPU.

**Mobile aspect ratio — the one real open question in this stage.** The kickoff
committed to "mobile designed in from day one — vertical crops or alternate renders."
The engine renders video with `object-cover`, so a landscape clip *will* cover-crop
to portrait on a phone — but cover-crop may cut the framing that makes the shot read.
Three options, decision needed (see Decisions):
1. **Gen landscape only, rely on `object-cover`** — cheapest, risks bad mobile crops.
2. **Gen a vertical variant per transition** — best framing, doubles gen + encode.
3. **One landscape gen, encode-stage center/safe crop to a vertical file** — middle
   path; the engine picks the file by viewport. Adds a branch to the encode script
   and an asset slot.

---

## Stage 3 — QA  (gen output is not "done" until this passes)

A clip is a *candidate* until it clears all three; only then does it replace a
synthetic placeholder. This is the gate that the "DO NOT SHIP" labels enforce by
embarrassment.

1. **Encode correctness (deterministic check):** both AV1 and H.264 present in the
   right order; codecs strings parse and match the files; poster exists; faststart
   set. Scriptable as part of the encode stage's self-test.
2. **On-device playback (the gauntlet):** the existing on-device guide —
   non-AV1 iPhone *plays at all* (proves H.264 fallback), AV1 iPhone plays AV1,
   Low Power Mode shows the overlay + one-tap unlock, decode ceiling survives fast
   scroll, in-app WKWebViews behave. **This is the stage that loops device testing
   back in at the point it matters** — you don't need the older iPhone to *build*,
   but a clip isn't QA-passed until it's been seen on one.
3. **Motion + composite read (judgment):** does the transition read as the intended
   camera move, and does the station's DOM layer (titles, CTAs) sit legibly over it?
   The placeholder clips are deliberately too busy to judge this — real footage is
   the first time scroll-feel and legibility can actually be assessed (ties to the
   parked fine-grained scroll-feel watch-item; re-check it here with the throttle
   prompt ready if jank surfaces).

---

## Stage 4 — Slot-in  (CC, one clean prompt)

The engine is already proven, so this is genuinely mechanical — swap file paths,
remove the placeholder gate. When real encoded clips exist:

- Place encoded files under `public/transitions/<id>/` (a *new* dir per wall, e.g.
  `door/`, `counter/`, `mixes/`), each with `.av1.mp4`, `.h264.mp4`, `.poster.jpg`
  (+ vertical variant once that decision lands). The `_placeholder/` set **stays** — it
  backs the unbuilt walls and is the fixture.
- Update that station's `TransitionAsset` (`av1Src`, `h264Src`, `poster`, `durationSec`)
  to the real files. Match the pattern an already-real station uses.
- **Un-gate navigation:** wire the exit that leads to the now-real wall (and a back exit
  for the return), reusing `goToId`. Before this, the wall had no inbound exit so it was
  unreachable. **Do not enable an exit into any still-synthetic wall** — and if the
  newly-reachable station already had a forward exit into a placeholder, drop/redirect it
  (the coupled decision made on counter→Mixes, 789ef95 / 91b7a1a).
- `npm run build` clean; `/store` plays the real clip and holds its end frame; `/music`
  still video-free. Parse `av1C`/`avcC` read-only to confirm the codec strings match the
  engine constants; commit real paths staged from `git status`, not typed from a report.

This becomes a copy-paste CC prompt the moment Stage 3 passes for any one wall — slot
clips in one at a time as they clear QA (this is exactly how door, counter, and Mixes
shipped — one scoped slot-in prompt each).

---

## Decisions

**Resolved by the build (2026-06-23):**

- **Pipeline weight → hand-run.** The lead-in + first pivot were hand-run gen→encode→
  slot-in; no orchestration runner needed for a four-clip project.
- **ComfyUI in v1 → no.** Transitions-first; ambient/texture is later.
- **Synthetic clips → KEEP as fixture.** Slot-in does *not* delete `_placeholder/` or
  `encode.sh` — the synthetic set still backs the unbuilt walls (Crate, Vibes) and is
  the encoder/regression fixture. Real clips live in their own `public/transitions/<id>/`
  dirs alongside it.
- **Take-count → bounded by review, not credits.** In practice stills took ~3–4 batches
  to land the composition; clips one-or-two takes once the recipe was right.

**Still open:**

1. **Mobile aspect ratio** — landscape-only + cover-crop / vertical variants /
   encode-stage crop. (Stage 2.) Still unbuilt; folded into encode hardening (the
   vertical-crop branch). Highest-impact remaining gen/asset decision.
2. **Return behavior (NEW — first proposed engine change since the nav pivot).** Returns
   need no separate clips, but with play-once-hold the engine **re-plays the destination's
   arrival clip** on return (it does NOT snap-cut to the held frame). Al B wants returns
   to play the pivot **reversed** (spatially "turning back"). That's an **engine change**
   (the engine must know "this is a return" and pick a reversed asset variant) *and* an
   asset implication (encode a reversed variant per pivot). Settle before genning more
   walls — it sets the pattern for all returns. Options: (a) accept replay-arrival,
   (b) reversed-clip returns (engine + reversed encode per pivot), (c) instant snap-cut
   (engine change, but motion-on-return is wanted, so probably not).

---

## Division of labor

- **Founder + CD:** compose the Higgsfield prompts (camera intent per the shot list),
  pick the take, pass/fail QA. The judgment slots.
- **A script (extend `encode.sh`):** gen-output → spec-encoded AV1+H.264+poster.
  Deterministic; runs local (ffmpeg already installed).
- **CC:** the encode-script hardening (if we want it productionized beyond the
  current `encode.sh`), and the Stage-4 slot-in. Both clean, scoped, copy-paste prompts.

## Next concrete step

The pipeline is proven end-to-end (three real clips). Remaining order:

1. **Settle the return-behavior decision** (Decision 2, above) — it's an engine change
   that sets the pattern for ALL returns and decides whether each pivot needs a reversed
   encode, so it's cheaper to lock once than retrofit.
2. **Crate wall (RIGHT)** on the locked pivot recipe: counter-endframe → Crate-wall Meshy
   still → Cinema Studio (RIGHT turn, a *distinct* right-side wedge) → 2× speed → encode →
   slot-in + un-gate counter→Crate.
3. **Vibes wall (AHEAD)** — a push-in (not a pivot), the easiest of the three: Veo +
   prompted forward push → encode → slot-in.

Two walls to a fully navigable store. Still outstanding regardless: the **on-device
gauntlet** (Stage 3.2 — hardware-blocked on a non-AV1 iPhone + LPM) and **encode
hardening** (vertical-crop branch, poster=last-frame fix, codec self-test, a built-in
2× flag for pivots).
