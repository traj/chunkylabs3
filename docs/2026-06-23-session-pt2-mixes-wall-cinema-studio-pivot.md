# Session — 2026-06-23 (pt.2) — Mixes-wall pivot: Cinema Studio recipe proven

Continues from 2026-06-23 (navigation pivot + four-walls map). That session killed
scroll, established the click-navigated four-walls hub, and collapsed scope to four
outbound clips (door→counter done as a push-in earlier; door→counter real clip
shipped). THIS session generated the FIRST counter→wall transition — counter→Mixes
(left) — and in doing so proved the entire wall-pivot recipe end to end, after the
pan fought us hard enough to force a tool change. Door→counter was also shipped real
this session as the lead-in (committed 789ef95).

## Decisions

- **The counter→wall PIVOT recipe is Cinema Studio (Higgsfield) with start+end
  frames — LOCKED.** This is the session's big unlock. Prompted panning failed
  repeatedly (see below); the working recipe is: **start frame = the counter's held
  final frame** (extracted from the counter clip via `ffmpeg -sseof`), **end frame =
  the destination wall still** (Meshy NBP), Cinema Studio tweens between the two
  pinned images. Pinning both ends is what kills the off-frame hallucination that
  prompted pans suffered. This recipe now applies to the remaining wall pivots
  (Crate-right) — Vibes (ahead) is a push-in, not a pivot, so it's easier still.
  Cost: ~80 cr/clip in Cinema Studio (vs ~12 Veo / ~7.5 Kling) — justified on a
  four-clip project; stop paying 7.5cr for "meh" repeatedly and pay once for control.

- **Prompted panning does NOT work for this content — three escalating failures
  before the tool change.** The anti-spin trail: (1) **Veo 3.1 Lite + prompted pan**
  → total "Inception" melt, shelves liquefied (dense parallel lines + faked camera
  rotation = geometry collapse). (2) **Kling 3.0 + prompted pan** → held geometry
  (Kling is the camera-polish model) BUT invented a sunny window that doesn't exist
  in the still, and over-lit the scene. (3) **Kling + dim/subtle prompt** → "slightly
  better," still inventing off-frame content. Each fix gave diminishing returns →
  the signal to change APPROACH, not keep tuning the prompt. Root cause: **panning
  reveals off-frame area and the model invents what's there**; no prompt fully
  controls invention. Fix = pin the destination (Cinema Studio end frame).

- **Higgsfield camera "presets" are NOT what we assumed — they're content/genre
  style templates (Baseball Game, Neon City, etc.), not camera-motion presets.** On
  the Create Video screen, camera motion is PROMPT-DRIVEN regardless of model (Veo
  only offers "GENERAL"). This finally explains the door/counter push-ins: they were
  Veo + GENERAL + prompted camera language ("slow forward push-in…"), never a "Dolly
  In preset" — that was shorthand in the notes. Real per-shot camera control lives in
  **Cinema Studio** (start/end frames, optical settings), which is the tool we ended
  up needing anyway.

- **Mixes-wall still: a TWO-TIER composition (crates of records below, shelves of
  cassette tapes above).** This was the breakthrough on the still after ~3 batches of
  failures. Earlier attempts were uniform floor-to-ceiling tape walls → read as
  overwhelming "wall of books" with no focal point. The fix came from Al B's read of
  the storefront image: real record walls have ZONES (lower = crate-dive you flip
  through, upper = shelved/displayed). The two-tier split gives the eye a reading
  order. Composed square-on, full-frame, warm world, illegible spines.

- **Text-on-spines lesson: the target is ILLEGIBILITY, not BLANKNESS.** Over-hard
  "COMPLETELY BLANK, no letters anywhere" prompting swung too far → sterile empty-case
  showroom renders. Real walls have color/texture/abstract artwork, just no readable
  WORDS. Reframing the no-text rule as "blurred, smudged, illegible — texture and
  color but no readable words" got lived-in shelves that are still warp/crop-safe.
  Positive-state framing ("varied faded colors, worn spines") beat negation again.

- **The Mixes pivot SHIPS WITH invented in-between room — and that's a feature.**
  Cinema Studio's tween travels left through invented shop geometry (brick wall, a
  door, bins not in either pinned frame) rather than pivoting perfectly in place. Al
  B's call: it reads as the shop being DEEPER than the storefront implies (bigger
  inside than it looks) — a good surprise, not a bug. **CONSEQUENCE / RULE BANKED:
  the invented left-wedge room is now canon.** Further transitions must not
  contradict it. Each wall pivot invents the wedge between counter and that wall;
  wedges must not overlap or imply each other. Left (Mixes) wedge = built. Right
  (Crate) wedge must read as a distinct right-side space. Ahead (Vibes) is a push-in
  → invents less (moves into known space).

- **Pivot direction (counter→Mixes) is CORRECT, not backwards.** Visitor stands at
  the counter hub, clicks to travel OUT to the Mixes wall → outbound clip starts at
  counter, ends at wall. Returns are NOT separate clips (see the correction below).

- **Speed pass: pivots get a 2× speedup at encode — LOCKED as the standard.** The
  raw 8s Cinema Studio pivot felt slow for a click-hub. 2× (→~4s) via ffmpeg
  `setpts=PTS/2.0` (drops dup frames cleanly, no judder confirmed on the encoded
  output). Snappier suits click-navigation; the "deeper shop" character survives.
  This 2× pass becomes standard for the wall pivots. NOTE the encode then uses the
  DEFAULT TRIM=4 (no sed override) since the 2× clip is ~4s.

## Shipped (all committed, build clean throughout — Next 16.2.9, all routes static)

- **789ef95** — real door→counter push-in clip live; door→counter forward exit
  enabled. CC coupled-decision: swapped the counter's pre-existing →left-bins
  (synthetic) forward exit for a ←back-to-door exit so no placeholder wall became
  reachable. (Upward deviation, endorsed.)
- **91b7a1a** — real counter→Mixes pivot clip live on the `left-bins` station
  (TASK 0 read-only confirmed: LEFT/Mixes wall = station id `left-bins`, order 4,
  not renamed). Un-parked the counter→Mixes forward exit ("← To the mixes", left
  CTA); counter retains ←back-to-door; Mixes has ←back-to-counter. Codec strings
  matched again (av01.0.08M.08 / avc1.4D4028 — third confirmation the encoder is
  consistent on real input).
- **49b0c11** — mixes clip re-encoded at 2× (~4s); durationSec 8→4. CC correctly
  committed the overwritten binaries ALONGSIDE the data change (the in-place
  re-encode had left uncommitted 4s binaries; committing durationSec:4 alone would
  have paired 4s metadata with the old 8s committed files — incoherent). Upward
  deviation, endorsed.
- Reachable graph now: **street ↔ door ↔ counter ↔ Mixes(left-bins)** — every
  reachable station on REAL footage. right-bins + mixtape-shelf remain islanded on
  synthetic placeholders (correct — not yet built).

## Asset pipeline notes (this session's reps)

- **Counter still:** Meshy NBP, warm interior (deliberate warm/cold contrast vs the
  cold neon storefront — "stepped in out of the rain"), counter dead-center with
  clean empty operator gap for the v2 clerk, rainy window behind = warm/cold split
  baked into the frame. x4.png was the pick. CLERK DECISION: the clerk (Al B) is NOT
  baked into the still — it's a v2 DOM/composite layer (generated from Al B's ref
  image later), same discipline as brand text. The still is composed with a
  clerk-shaped negative space behind the counter for that layer to drop into.
- **Counter clip:** Higgsfield Veo + Dolly In (prompted push-in) + "rain has just
  stopped" positive-state framing. Kept full 8s (a background car at 5-7s is part of
  the arrival beat; back end still has motion so no dead tail to trim). Encoded with
  TRIM=8 override.
- **Mixes still:** Meshy NBP, prompt-only (NO reference image — x4 would have dragged
  counter geometry in; warm-world continuity carried by prompt language alone). Took
  ~4 batches; the two-tier crate/shelf composition was the breakthrough. h1 was the
  pick (`mixes-still.png`).
- **Mixes clip:** Cinema Studio 3.5, start=counter-endframe.png (extracted via
  `ffmpeg -sseof -0.1` from counter-raw.mp4), end=mixes-still.png, minimal
  motion-intent prompt, Camera/Lens/Aperture on Auto. Then 2× speed pass + encode.

## Open threads

- **RETURN BEHAVIOR — corrected this session, now an open design question.** CC
  flagged (correctly) that the engine's play-once-hold re-arms PER ACTIVATION
  (decision 9fb0417) — so returning to the counter from Mixes **REPLAYS the
  door→counter arrival clip from the start**, it does NOT snap-cut to the held frame.
  The planning assumption "returns are free instant snap-cuts" was WRONG about the
  feel (the outbound-only GEN plan still holds — no return clips needed — but returns
  REPLAY, they don't cut). Al B's reaction: the replay felt "just normal," and wants
  the return to instead **play the pivot REVERSED** (Mixes→counter = turning back,
  spatially correct vs. re-walking-in-from-the-door). **Reversed-clip returns are an
  ENGINE CHANGE** (engine must know "this is a return" + pick a reversed asset
  variant) — deferred, next decision. This is the first real engine change proposed
  since the navigation pivot. NOT YET ACTIONED — Al B paused after speed, return is
  the next tackle.
- **Poster = first-frame mismatch, now SHARPER on pivots.** encode.sh grabs the FIRST
  frame as poster. For the Mixes pivot, frame 1 = the COUNTER (start of the pan), so
  `mixes.poster.jpg` shows the counter, not the Mixes wall you land on. On a pan this
  is more visibly wrong than on push-ins (where first/last frame were the same room).
  Still non-blocking (engine plays on gesture + holds end frame), but a stronger
  argument for the encode-hardening "poster = LAST frame for held-arrival clips" fix.
- **`left-bins` naming.** Station id + DOM copy/label still say "Left Bins / Dig
  through the crates" but it's now the MIXES wall. CC correctly scoped the
  id/label/copy rename into the deferred DOM/design thread — only retargeted asset +
  nav this pass. On the design-polish list.
- **encode.sh hardening** still pending: SVT-AV1 retune, vertical crop branch
  (option-3 mobile), file-accurate codec self-test, the poster=last-frame fix, and
  now possibly a built-in 2× speed flag for pivots. Deferred; `--real` works.
- **On-device gauntlet** — still the only outstanding ENGINE verification.
  Hardware-blocked (non-AV1 iPhone + LPM). Al B has only a Pro iPhone.
- **`upstream is gone`** — local main tracks a dead remote; wants
  `git branch --unset-upstream` + proper remote BEFORE Vercel/domain cutover.
- **Curation pass** (parallel, editorial): genre worksheet, SoundCloud + Various
  titles, Beatport confirm, update culling.
- **Carried:** Vercel project / domain cutover; clerk interactivity (v2, now with a
  composed negative-space slot waiting for it); phase-2 agent layer.

## Process notes

- **In-place re-encodes make "data-only" prompts incoherent.** When an encode
  overwrites TRACKED binaries in place, those binaries are part of the next commit
  whether the prompt mentions them or not. A durationSec tweak after an in-place
  re-encode is never actually data-only — the binaries must commit alongside or the
  repo pairs new metadata with old committed assets. Bank for the other walls'
  speed passes.
- **Tool-hunting was the session's time-sink.** Spent significant back-and-forth
  hunting for a "Pan Left preset" that doesn't exist as imagined (Higgsfield presets
  are style/genre, not camera-motion; camera motion is prompted or Cinema-Studio). The
  CD-side fix: when a UI hunt loops more than ~2 rounds, STOP and either web-research
  the actual tool layout or fall to the known-working method (prompted camera on the
  proven screen), rather than clicking blind.
- **Live screenshots beat stale research again** (the recurring lesson): the preset
  picker contents, the model menu, and Cinema Studio's start/end-frame slot were all
  ground-truthed from Al B's screen, correcting assumptions from web research.
- **CC path-staging discipline held:** stage real paths via `git status`, don't type
  from CC's report.

## Next step

**Decide the RETURN behavior** (the open design question) before genning more walls —
because reversed-clip returns are an engine change that would set the pattern for ALL
returns, and it's cheaper to settle it once than retrofit. Options: (a) accept
replay-arrival as-is, (b) reversed-clip returns (engine change + reversed encode per
pivot), (c) true instant snap-cut (engine change, but Al B wants motion on return so
probably not). THEN roll the next wall on the proven recipe: **Crate wall (RIGHT)** —
counter→Crate pivot, Cinema Studio (counter-endframe → crate-wall Meshy still), RIGHT
direction, inventing a DISTINCT right-side wedge (per the "don't add more rooms" rule),
then 2× speed + encode + slot-in. After Crate: **Vibes wall (AHEAD)** — a push-in (not
a pivot), the easiest of the three. Two walls left to a fully navigable store.
