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
> **speed pass** (now **8× → 1.0s** — every transition, quarters AND the chained express,
> lands at 1.0s) is the encode standard for pivots; both are written into Stages 1–2.
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

**STATUS: the store is now FULLY FILMED — every edge below is real footage, plus the
rotational ring and circular express added 2026-06-25.** The table is kept as the original
shot list; statuses updated.

| # | Transition | Type | Camera intent | Status |
|---|---|---|---|---|
| 1 | street → door | **walk-up** | Gentle push-up onto the canonical CENTERED storefront (out0 → out1) | **real (7d42f3b)** — REPLACED the OG storefront push-in (49a43fb, now dead on disk) |
| 2 | door → counter | push-in | Through the door, swing toward the clerk counter (kept full 8s — background car is part of the beat). The one hard exterior→interior seam. | **real (789ef95)** |
| 3 | counter → **Mixes** (left) | **pivot** | Turn LEFT to the mixes/tapes wall | **real (91b7a1a), 8×→1.0s** |
| 4 | counter → **Crate** (right) | **pivot** | Turn RIGHT to the crate-dig wall (distinct right-side wedge) | **real (a704d7e), 1.0s** |
| 5 | counter → **Vibes** (ahead) | **chained express** | counter↔Vibes circles the ring via a random side wall (the direct push-in is retired) | **real (9ed67a8), 1.0s** |
| 6 | ring **Mixes ↔ Vibes ↔ Crate** | **pivot** | Wall-to-wall turns completing the rotational ring | **real (a704d7e), 1.0s** |

The walls live on the scaffold station ids `left-bins` (=Mixes), `right-bins` (=Crate),
`mixtape-shelf` (=Vibes); the id→wall rename is a deferred design thread. INVARIANT (kept as a
guard for any future scene): an exit is wired only once the destination's real clip exists — but
every wall is now filmed, so nothing is currently unreachable for want of a clip.

### Entry-sequence storefront redesign (LOCKED 2026-06-27)

The entry was rebuilt around a NEW canonical CENTERED storefront; the OG asymmetric one is
RETIRED (dead on disk). Recipe + bankable lessons:

- **Two stills drive it:** `out0` = wide establishing storefront (street rest frame + walk-up
  start pin + root-splash backdrop), `out1` = close centered storefront (canonical exterior +
  the DOOR station's held rest frame). The walk-up (Higgsfield Cinema Studio, start=out0,
  end=out1, **gentle minimum motion**) tweens between them.
- **Encode = the entry push-in class** (`encode.sh --real`, trim, no speed pass — entry walks
  stay at original pace, NOT the 1.0s hub-rotation lock). Codecs are the standard
  `av01.0.08M.08` / `avc1.4D4028`. **TRIM does double duty:** a Cinema Studio push-in overshoots
  its own end pin, and the end-pin (out1) framing lands BEFORE the clip's last frame — so a
  MEASURED trim (out1 at t≈4s of the 8s raw) both lands the hold on out1 AND amputates the
  overshoot in one cut. Measure where the end-pin framing actually lands (frame-diff vs the
  still), don't eyeball.
- **`Station.still` (new data primitive):** stations with `transitionIn: null` can now carry a
  `still` painted full-bleed by StationFrame's no-clip branch (the street's out0 fixes the
  black opening; the swap into the walk-up is seamless because `still` == the walk-up's
  frame-0 poster). Reusable for any future no-inbound-clip scene.
- **Gen lessons (Meshy/Higgsfield):** (1) Meshy's prompt box hard-caps at **800 chars and
  silently truncates** — load-bearing instructions in the first ~600, decorative detail trails.
  (2) **Ref-faithfulness cuts both ways:** it FIGHTS "recompose/move the door" (the model
  protects the ref layout) but works FOR "same facade, pull back / move closer" — lean on the
  ref to preserve a look at a new distance, drop it when you need a re-layout. (3) The REAL
  shop frame as the ref is what carried the warm pink-amber soul; text-only / generic neon-noir
  refs gave rejected stock storefronts. (4) "Center the door" + "faithful single-window shop"
  are internally contradictory — resolved by adopting the centered face wholesale + retiring OG.
- **Continuity is WORLD, not GEOMETRY.** The centered storefront is window-on-both-sides and
  does NOT carry the interior's brick door-flank; the door→counter cut is held together by the
  "multiple rooms" fiction (record shelves through the door imply a first room, counter deeper
  in) — same abstraction as the invented ring wedges. door→counter is the load-bearing seam;
  watch it if door→counter is ever revisited.

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
  frames and risks judder). **EVERY transition now lands at 1.0s** ("same time regardless of
  distance"): the counter↔wall **quarter-turns are 8×** (`setpts=PTS/8.0,fps=24` → 24f/1.0s;
  verified **24/24 distinct frames, no judder**, 2026-06-25). This superseded the earlier 2×
  (~4s) then 4× (~2s) passes — halved again for a snappier click-hub; the "deeper shop"
  character survives even at 24 frames. Codec strings stay file-accurate (`av01.0.08M.08` /
  `avc1.4D4028`). **Derive the matching REVERSE from the NEW forward** via `encode.sh
  --reverse` — never speed forward/reverse independently; they must stay exact mirrors at the
  new duration. **The chained EXPRESS (counter↔Vibes) also lands at 1.0s**, built from the
  RAWS in one pass (per-raw `setpts` + `xfade`, NOT by re-speeding the 2.0s express — that
  would crush the dissolve into the visible PSNR~14 seam): each quarter compressed to ~15f,
  joined by a ~6-frame `xfade` dissolve, → 24f/1.0s; the dissolve must still read as a BLEND
  on a frame-sweep (longer-than-proportional is fine — hiding the seam beats exact symmetry).
  **Note:** an in-place re-encode overwrites the *tracked* binaries, so the `durationSec`
  change MUST commit the new binaries alongside or the repo pairs new metadata with old assets
  (learned on the Mixes 2× pass, 49b0c11; re-confirmed on the 4× and 8× passes).

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
  `encode.sh` — every wall is now filmed, so the synthetic set is purely the encoder/regression
  fixture now. Real clips live in their own `public/transitions/<id>/` dirs alongside it.
- **Take-count → bounded by review, not credits.** In practice stills took ~3–4 batches
  to land the composition; clips one-or-two takes once the recipe was right.

**Resolved since:**

1. **Mobile aspect ratio → RESOLVED 2026-06-27: option 1 (landscape + `object-cover`
   everywhere), revisit per-screen.** Rather than speculatively double-gen portrait variants,
   ship landscape with the engine's `object-cover` and build a custom portrait screen ONLY for
   the ones that "truly suck" once REAL mobile is in hand. The per-screen portrait override stays
   a known low-risk tool (opt-in viewport branch; engine cost trivial, gen cost is the doubling) —
   not built speculatively. New exteriors are composed landscape with the door + CTA in the
   portrait-safe CENTER column so object-cover reads as well as it can for free.
2. **Return behavior → RESOLVED (2026-06-24/25): option (b), pre-encoded reversed clips.**
   Returns play a PRE-ENCODED reversed variant of the forward (the "reverse" lives in the file
   bytes, played plain-forward — no negative playbackRate, play-once-hold intact). Keyed by
   directed edge in `REVERSE_EDGES`; `encode.sh --reverse` derives each from its forward master.
   EXCEPTIONS where reverse is wrong: door→street (a reversed street→door runs the rain UPWARD)
   and counter→street (2026-06-27) both use a ~450ms opacity crossfade to the video-less street
   instead (`CROSSFADE_EDGES`); the old reversed door→counter is retired/dead on disk.

---

## Division of labor

- **Founder + CD:** compose the Higgsfield prompts (camera intent per the shot list),
  pick the take, pass/fail QA. The judgment slots.
- **A script (extend `encode.sh`):** gen-output → spec-encoded AV1+H.264+poster.
  Deterministic; runs local (ffmpeg already installed).
- **CC:** the encode-script hardening (if we want it productionized beyond the
  current `encode.sh`), and the Stage-4 slot-in. Both clean, scoped, copy-paste prompts.

## Next concrete step

The store is **fully filmed** (entry, four walls, rotational ring, circular express) and the
**entry redesign is shipped** (7d42f3b). The asset spine is DONE; remaining work is polish +
cutover, not transitions:

1. **DOM door layer (no gen, no engine risk):** an entry-CTA affordance over out1's door
   region (hover-glow desktop / subtle cue mobile) + brand stickers + cover the AI-gibberish
   posters on the held door frame. Absolutely-positioned DOM over the held frame, same
   machinery as the edge CTAs.
2. **Counter content surface:** productions, 2 Beatport buy CTAs, re-homed UPDATES corkboard,
   net-new contact card; the clerk negative-space slot is already composed into the counter
   still.
3. **Dead-on-disk cleanup (whenever):** OG `/transitions/door/door.*`,
   `REVERSE_EDGES["counter->door"]` + `counter-door.*`.
4. **Cutover groundwork:** `git push` the ahead stack (origin/main is healthy), then Vercel
   project + domain.

Two walls to a fully navigable store. Still outstanding regardless: the **on-device
gauntlet** (Stage 3.2 — hardware-blocked on a non-AV1 iPhone + LPM) and **encode
hardening** (vertical-crop branch, poster=last-frame fix, codec self-test, a built-in
2× flag for pivots).
