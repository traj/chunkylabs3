# chunkylabs — asset pipeline spec (gen → encode → QA → slot-in)

_Spec only. Nothing built yet. Defines the contract that takes a real creative idea
all the way to a clip the transition engine can ship. The engine is already
machinery-complete and desktop-verified; this is the track that fills its reserved
slots with real footage instead of the synthetic "DO NOT SHIP" placeholders._

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

**Primary engine: Higgsfield (Veo 3.1 Lite).** 8 cr/clip, 3 concurrent jobs, ~553
credits on hand. The five station *transitions* are short play-through camera moves —
exactly Higgsfield's strength.

**The shot list — five transitions, in STATIONS order:**

| # | Transition | Camera intent | Notes |
|---|---|---|---|
| 1 | street → door | Push-in toward the storefront, neon, rain on glass | The "enter" beat |
| 2 | door → counter | Through the door, bell, swing toward the clerk counter | |
| 3 | counter → left bins | Pan/track left into the record bins | |
| 4 | left bins → right bins | Sweep across the room, bins to bins | |
| 5 | right bins → mixtape shelf | Track to the back wall / mixtape shelf | The "take it all home" beat |

Station 1 (The Street) has **no inbound transition** by design — you arrive there.
So it's five clips, not six. (Confirmed in the engine: station 1 mounts no video.)

**Secondary: ComfyUI / HunyuanVideo on powerpuff** (`192.168.7.251:8188`) — for
ambient loops, clerk idle motion, or texture *stills* (Flux.1), not the full-screen
transitions (it tops out around 512×320 / 25 frames — too small to be the hero
layer). Treat as optional v1; the transitions are the spine.

**Gen-stage rolls (the deterministic part):** per transition, roll N takes from a
fixed prompt at concurrency ≤ 3, collect `result_url`s. This is bucket-1 plumbing —
the orchestration runner's `roll → await → fetch` stages, or for five clips, a
hand-run loop. **The only judgment is picking which take is "the one"** (framing,
motion that reads, room for the DOM layer to sit legibly on top).

**Budget reality:** 5 transitions × a handful of rolls each × 8 cr ≈ trivial against
553 credits. Cost is not a constraint here; take-quality is.

**Output reality — and why it's not done:** Higgsfield hands back its own mp4
(whatever codec/params it chooses); ComfyUI hands back animated WEBP. **Neither is
shippable as-is** — the engine requires ordered AV1→H.264 sources with file-accurate
codecs strings. That's Stage 2, and it's non-negotiable.

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
- **Poster:** first frame, jpg.
- Target 1080p, ~2–4s, GOP ~2s (not keyframe-dense — these are play-through, never
  scrubbed).

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

- Place encoded files under `public/transitions/<transition>/` (replacing
  `_placeholder/`), each with `.av1.mp4`, `.h264.mp4`, `.poster.jpg` (+ vertical
  variant if Decision lands there).
- Update the `TransitionAsset` entries in the stations data (`av1Src`, `h264Src`,
  `poster`) to point at the real files.
- Delete the synthetic placeholder clips + the "DO NOT SHIP" generator, or keep them
  behind a flag for regression. (Decision: keep one synthetic set as a test fixture?)
- `npm run build` clean; `/store` plays real clips; `/music` still video-free.

This becomes a copy-paste CC prompt the moment Stage 3 passes for at least the first
clip — no need to wait for all five (slot them in as they clear QA).

---

## Decisions needed (before or during gen)

1. **Mobile aspect ratio** — landscape-only + cover-crop / vertical variants /
   encode-stage crop. (Stage 2.) Highest-impact; shapes gen *and* the asset model.
2. **Pipeline weight** — for five clips, hand-run the gen+encode loop, or route it
   through the planned media-pipeline orchestration runner? YAGNI says hand-run now,
   promote to the runner only if the chunkylabs clips become a repeating job. Leaning
   hand-run.
3. **ComfyUI in v1 or not** — ambient loops / clerk idle as a v1 layer, or ship
   transitions-only first and add texture later? Leaning transitions-first.
4. **Synthetic clips: delete or keep as fixture** at slot-in. (Stage 4.)
5. **Take-count per transition** — how many Higgsfield rolls per shot before picking.
   Cheap on credits; bounded only by review time.

---

## Division of labor

- **Founder + CD:** compose the Higgsfield prompts (camera intent per the shot list),
  pick the take, pass/fail QA. The judgment slots.
- **A script (extend `encode.sh`):** gen-output → spec-encoded AV1+H.264+poster.
  Deterministic; runs local (ffmpeg already installed).
- **CC:** the encode-script hardening (if we want it productionized beyond the
  current `encode.sh`), and the Stage-4 slot-in. Both clean, scoped, copy-paste prompts.

## Next concrete step

Lock **Decision 1 (mobile aspect ratio)** — it's the only one that changes what you
generate, so it has to be settled before the first Higgsfield roll. Then compose the
prompt for **transition 1 (street → door)** as the pipeline's first end-to-end test:
gen a few takes → encode the chosen one through the (real-input) encode stage → QA it
on the Pro iPhone you have now (partial pass) → slot it into station 2 and watch a
real clip play in the engine. One clip all the way through proves the whole pipeline
before committing to all five.
