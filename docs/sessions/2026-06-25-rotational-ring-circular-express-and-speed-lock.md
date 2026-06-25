# Session — 2026-06-25 — rotational ring + circular express + 1.0s speed-lock

Continues from 2026-06-24 (four walls complete + reverse-returns engine). That session
completed the four-walls store on real footage and ended pointed at the **deferred
hub-polish batch as one pass**, with the Vibes clean-still re-gen as the optional parallel.
THIS session ran the hub-polish batch, then — driven by Al B reframing the navigation model
mid-session — built out **rotational navigation**: the two ring edges that connect the side
walls to Vibes, then a **circular chained express** so counter↔Vibes no longer crosses
straight through the middle, then a **global 1.0s speed-lock** on every hub rotation. The
store now circles. The navigation model mapped out since the 2026-06-23 scroll-kill is
complete: entry sequence → four walls → rotational ring → circular express, every edge real
footage, every hub trip a uniform 1.0s.

## Decisions

- **Hub-polish batch shipped — but TWO of the deferred "fixes" were correctly REJECTED on
  inspection (the diagnostic-first discipline overturning stale plan assumptions).**
  - **poster = LAST frame: REJECTED, kept first-frame.** The four prior logs flagged
    "poster=first-frame" as a bug (poster shows the room you LEFT, not the wall you land on).
    Wrong: the poster is the PRE-ROLL frame, and every clip plays from `currentTime=0`, so
    frame 0 IS the start room → first-frame poster → video-frame-0 is a seamless handoff with
    no jump. Last-frame poster would show the destination then JUMP BACKWARD to the start when
    the clip plays. The held "you are here" view is the video's own held last frame (never the
    poster, because in click-nav every arrival is a gesture so the clip always plays). CC
    rejected the deferred fix in `asset-pipeline-spec.md` too (correct doc-sync, not scope
    creep). The stale fix was in the prompt; surfaced and resolved before any re-encode.
  - **Graph-aware video preloader (decode-warming): REJECTED, not needed.** The "poster-warm
    insufficient" verdict from 2026-06-24 was reached under Slow-3G THROTTLE — a download-gap
    stand-in that does NOT exercise the decode gap. Verified at FULL localhost speed: Crate/
    Vibes cold-mount decode gaps were 123ms / 87ms, and a readyState-0 probe proved Chrome
    paints the cached poster (not black) through that gap. `2bd851b`'s poster-warm is
    sufficient; built no decode-warmer. Bought back an engine change we didn't need.
    (Caveat banked: desktop-verified; iOS decode gaps run longer, but the poster-covers-gap
    MECHANISM is platform-independent — only the gap LENGTH is what the on-device gauntlet
    would confirm. Stays in the hardware-blocked thread.)

- **Navigation reframed mid-session to a fully ROTATIONAL ring — the room circles.** Al B's
  intent crystallized: think of each navigation as a quarter-turn, the shop as a compass
  (counter=N, Mixes=W, Crate=E, Vibes=S), visitor rotating in the center. Adjacent walls are
  one quarter apart; Vibes (opposite counter) is a half = two quarters. Consequence: add the
  two missing ring edges (Mixes↔Vibes, Crate↔Vibes) so every wall reaches its neighbors, and
  the counter↔Vibes trip travels AROUND the room (through a side wall) rather than straight
  across. This completes the "stand in a room and rotate to look around" Flash/SWF feel that
  was the load-bearing north star.

- **Ring clips need ZERO new stills — pivot recipe is start-frame + end-frame, all frames
  already exist.** Mixes→Vibes = (held Mixes frame → Vibes still); Crate→Vibes = (held Crate
  frame → Vibes still). The Higgsfield top-up bought only the two Cinema Studio tweens, no
  Meshy. Reconfirmed: Cinema Studio prompts are near-INERT for direction — the two pinned
  frames determine the arc, prose is mood. (Proven hard this session, see Asset notes.)

- **Vibes speckle debt RETIRED for free by going rotational.** The baked shrink-wrap speckle
  on the Vibes still only ever bit because the counter→Vibes PUSH-IN magnified it as the
  camera moved toward the wall. A pivot/turn lands on Vibes at normal scale (like every wall's
  illegible-spine texture) → speckle never magnified. The clean-still re-gen flagged on
  2026-06-24 is no longer needed. The push-in (the only place speckle was exposed) is now
  retired by the express.

- **Counter→Vibes is a CHAINED express, not a dedicated half-turn gen.** A half = two
  quarters we already have. counter→Vibes = counter→Mixes ⌢ Mixes→Vibes (or via Crate),
  played continuous. Rejected genning a dedicated 180° clip (a long Cinema Studio tween would
  invent an entire side wall it passes through — exactly the off-frame hallucination pinning
  was meant to avoid). Chain reuses existing footage and dodges the risky long gen.

- **CTA stays put; only the PLAYBACK changes.** Al B's clarification: keep the counter→Vibes
  CTA where it is (bottom), but instead of going straight there, it travels one side of the
  room. So the direct push-in CLIP retires; the CTA repoints to a chained path. Smaller,
  cleaner change than retiring the exit.

- **"Clean by construction" seam assumption was WRONG — express needs a crossfade.** The plan
  assumed counter→Mixes's last frame == Mixes→Vibes's first frame (same wall) so a hard-cut
  chain would be seamless. CC MEASURED it: PSNR 14–18 dB with structured/geometric difference
  — the two clips were independently-generated tweens of the same wall, different exact pixels
  → a hard cut would visibly JUMP. Fix: pre-concatenate the two quarters into ONE express file
  per side with a ~6-frame cross-dissolve at the join (same approach as the door→street
  crossfade), then compress to target duration. To the engine these are ORDINARY SINGLE CLIPS
  — no double-buffer, no runtime chaining, no playbackRate, no engine rework. The entire
  problem stays in the deterministic offline encode; the verified engine is untouched.
  (Rejected runtime double-buffer + crossfade: moves a fixable-offline problem into the
  fragile runtime path, more iOS surface, against project discipline. Rejected hard-cut: ships
  the visible PSNR-14 jump.)

- **50/50 side routing, fresh per trip — the "circle the room" feel.** Each express fire picks
  Mixes-side or Crate-side 50/50, outbound and return rolling independently (out via Mixes may
  return via Crate). The pure resolver stays DETERMINISTIC; only the click-time roll in
  `goToId` is random. Intermediate wall flashes past — never a resting/clickable station.

- **Persistent "back to counter" home button kept as chrome, SEPARATE from spatial exits.**
  Side walls got spatially-correct directional CTAs (Mixes facing W: counter=right, Vibes=left;
  Crate facing E: counter=left, Vibes=right) so a full loop is consistent directional turns
  (counterclockwise = all left turns; clockwise = all right). The top "← back to counter"
  stays on every station as a home/hub convenience, intentionally separate from the diegetic
  directional CTAs (commented so it's not "deduped" as redundant). Two exits to counter from
  each side wall (home + spatial) → keyed exits on `to:direction` not `to` alone (React
  duplicate-key fix).

- **GLOBAL speed-lock: all hub rotations 2.0s → 1.0s (single quarters AND chained express).**
  Both must move together or "every trip the same duration regardless of distance" breaks.
  Built from the RAWS at the new rate (single clean setpts=PTS/8.0), NOT by re-speeding the
  processed 2.0s files (stacking judders + crushes the express dissolve into a cut). The
  express dissolve is kept LONGER-than-proportional on purpose (proportional ~1.5f would
  collapse to a cut; held at 6f to stay a blend — hiding the PSNR-14 seam beats exact
  symmetry).
  - **Entry sequence (door/counter push-ins) deliberately LEFT at original speed** (door=4s,
    counter=8s). "Speed up all" was in the context of hub ROTATION; arriving INTO the shop
    (street→door→counter) is a different beat — walking in, not snapping in. Hub rotation is
    now snappy 1.0s; the entry walk keeps its deliberate pace. (Flag if the door/counter
    push-ins were meant to speed too — quick same-recipe follow-up.)

- **Rain-front / sun-wedge: parked-RESOLVED — reads fine at 1.0s speed.** The counter still's
  baked "just-stopped-rain" window propagates into every counter-originating pivot (inherited
  artifact, same class as the speckle — in frame 1 before the model animates). The invented
  sunny-window wedge on Crate→Vibes is model invention at its prompt-control ceiling. Both
  live in fast mid-turn frames; at 1.0s they're a blink. Al B confirmed they read fine in
  motion. NOT chasing the dry-counter re-gen (the domino chain: re-gen counter still →
  re-roll counter→Mixes/Crate → re-extract endframes → re-roll the ring pivots that start on
  them — "most of the shop's footage"). The deliberate "don't chase dry" call from the
  transition-1 session still holds.

## Shipped (all committed, build clean throughout — Next 16.2.9, all routes static)

- **Hub-polish batch (TASK 1 verify / 2 reject / 3–5 build):**
  - `f5e7f5e` — data+docs: first-frame posters kept (verified, last-frame fix rejected) +
    wall display renames (left-bins→"Mixes", right-bins→"Crate", mixtape-shelf→"Vibes" across
    labels/CTAs; internal ids UNCHANGED — id≠label commented intentional-for-now; the id
    refactor is a separate deliberate pass).
  - `f91193d` — store: door→street ~450ms opacity crossfade (gated `CROSSFADE_EDGES`, every
    video edge still byte-identical snap) + shared safe-zone layout (copy bound to
    height-clamped lower-left block; CTAs pinned by direction; no copy/CTA overlap, desktop +
    portrait). Cold-mount flash: verified NO decode-warmer needed (poster-warm sufficient at
    full speed).

- **Track 1 — counter-pivot speed pass + endframe export:**
  - `25494c5` — counter↔Mixes + counter↔Crate (+ reverses) re-encoded 4.0s → **2.0s** via
    single clean `setpts=PTS/4.0` from the RAWS (raws found by content match: Mixes=
    `~/Desktop/mixes-raw.mp4`, Crate=`~/Downloads/hf_20260624_174609…`). 48/48 distinct
    frames, no judder, reverses derived from new forwards. durationSec→2 on all four; 12
    binaries committed alongside metadata.
  - `2aa36cd` — `docs/frames/mixes-endframe.png` + `crate-endframe.png` (held end frames,
    extracted via `ffmpeg -sseof`).

- **Ring edges (the two wall-to-wall pivots, real footage):**
  - `a704d7e` — Mixes↔Vibes + Crate↔Vibes on real footage, forward + reverse, 2.0s. Resolver
    nuance: Vibes now has THREE inbound forward arrivals (counter, Mixes, Crate) so the
    `dest.transitionIn` fall-through can't disambiguate → added a `FORWARD_EDGES` override map
    checked before fall-through; ring reverses into `REVERSE_EDGES`. Purely additive — every
    pre-existing edge byte-identical. Wall-to-wall CTAs exposed; shared safe-zone layout
    absorbed them (Vibes = 3 new CTAs, no overlap). Cold-mount (Mixes↔Vibes non-adjacent)
    covered by existing poster-warm.

- **Spatial CTA consistency on side walls:**
  - `e9d7633` — Mixes: added `Counter →` (right); Crate: added `← Counter` (left). Persistent
    top home button kept on all stations (separate chrome, commented). Exits keyed on
    `to:direction` (React dup-key fix). Full loop now consistent directional turns (CCW = all
    left, CW = all right). DOM/CTA only — no resolver/encode change.

- **Circular chained express (counter↔Vibes no longer crosses the middle):**
  - `9ed67a8` — 4 express files (cv-mixes, cv-crate, vc-mixes, vc-crate), each two quarters
    joined by a 6-frame cross-dissolve (masking the PSNR-14 geometric seam) then compressed to
    2.0s. To the engine they're ordinary single clips (no engine rework). `EXPRESS_EDGES` map
    (resolver checks first, returns `side[0]` as poster-warm representative + deterministic
    fallback); `goToId` rolls 50/50 → `expressAsset` at click time. Direct push-in removed
    from active path (files kept on disk as fallback). Verified: continuous sweep, no mid-trip
    stop (active station = Vibes throughout, intermediate wall never mounted/clickable), 50/50
    both directions, `directPushInEverSeen: false`.

- **Global 1.0s speed-lock:**
  - `cdae8c5` — all 12 hub clips (8 quarters/reverses + 4 express) re-encoded from the RAWS to
    **1.0s** (single `setpts=PTS/8.0`, 24f/1.0s; reverses re-derived; express rebuilt from raws
    with xfade, NOT re-sped). 24/24 distinct on all 12, no judder, express seam still a blend.
    50/50 intact. durationSec→1 on all 12 affected edges; 36 re-encoded binaries committed
    alongside metadata + spec note (standard now 8×→1.0s for quarters and express). Entry
    push-ins (door=4, counter=8) and retired vibes push-in (2.6) left untouched (out of scope).

**Reachable graph (ALL REAL FOOTAGE, fully rotational, all hub trips 1.0s):**
`street ↔ door ↔ counter`; `counter ↔ Mixes`, `counter ↔ Crate`, `counter ↔ Vibes`
(circular express via a random side wall); ring `Mixes ↔ Vibes ↔ Crate`. The room can be
circled in either direction; no edge crosses straight through the middle; no synthetic
placeholder reachable anywhere.

## Asset pipeline notes (this session's reps)

- **Cinema Studio direction is frame-driven, NOT prompt-driven — confirmed across 5 rolls of
  Crate→Vibes.** The "turn right" prose was inert; the clip went LEFT twice with the word
  "right" in the prompt. Direction is set by the pinned frames' geometry. Banked:
  **Mixes→Vibes turns left, Crate→Vibes turns right** (compass: from W wall, counter is right
  / Vibes is left; mirror at E).
- **Prompt lesson — motion verbs on FURNITURE get rendered literally.** "slides out to the
  left" → a literal sliding shelf; "moves off frame" → furniture moving. Fix: attach ALL
  motion to the camera, pin fixtures as static ("only the camera moves — every shelf/crate
  fixed and motionless, bolted in place"). Positive-state again.
- **Prompt lesson — negation lost AGAIN; positive corner-surface description finally moved
  invention on-brand.** "no windows/no sun" never killed the sunny-window wedge across 4
  rolls. "One corner of bare warm-toned plaster… single small enclosed room, windowless,
  night, dim lamplight throughout, no daylight" got the wedge from a sunny open room down to a
  plaster pillar with a faint far-edge window trace — usable. Same lesson as rain and blank
  spines: describe the desired POSITIVE state, don't forbid the bad one.
- **Anti-spin: stopped the Crate→Vibes reroll at 5.** Each prompt fix traded one invented-
  corner failure for another (left turn → shelf-morph → sunny window → plaster pillar) —
  diminishing returns = the lever isn't biting. Root cause is structural (the tween invents
  unpinned corner space; no prompt fully controls invention). Accepted the best take ("usable"
  + speed hides the rest) rather than roll six. CD-side spin too: fabricating a right-biased
  end-pin produced a mirror-seam artifact — pulled up, didn't ship the engineering.
- **Mixes→Vibes (kept):** roll 1 (`162355`), left turn, clean, invented SW wedge = a daylight
  window (on-brand "shop is deeper than it looks"). Crate→Vibes (kept): roll 5 (`170222`),
  right turn, invented SE wedge = a night-lit plaster pillar/corner. Wedges are distinct
  (different invented objects) — each route reads as its own corner. Banked: the shop now has
  a daytime window (Mixes SW), a brick-wall-and-door (counter→Mixes left wedge), and a
  night-lit corner (Crate SE) — lighting inconsistent across wedges (day/night) but NEVER seen
  back-to-back (one wall at a time, out-and-back), so it costs nothing in the actual
  experience.
- **The express crossfade is the door→street crossfade's second use** — the ~6-frame opacity
  dissolve is the project's standard tool for masking an abrupt/mismatched join.

## Process lessons

- **Diagnostic-first overturned the plan TWICE this session and was right both times**
  (poster=last-frame rejected; decode-warmer rejected; "clean-by-construction" seam measured
  and disproven). The read-only pass before touching the verified engine keeps paying for
  itself. CC measuring PSNR rather than trusting the CD's "same wall = same frame" claim is
  the load-bearing instance.
- **Throttle masks the real condition (recurring).** The cold-mount-flash verdict that drove a
  whole planned engine change was a Slow-3G artifact. Verified at FULL localhost speed it
  evaporated. "Test at the speed the user actually hits" — again.
- **Read the PICTURE, not the filename (recurring).** Confirmed the two ring stills (Mixes =
  tapes-up-top two-tier; Vibes = ambient face-out sleeves) by image, after the desktop file
  shuffle made filenames unreliable. Al B confirmed they were the original Meshy refs.
- **"Speed up all" needed a scope check.** CC correctly read it as hub-rotation only and left
  the entry push-ins alone — but flagged the boundary explicitly rather than silently. Confirm
  intent rather than assume "all" is literal.
- **Build-from-raws, never re-speed processed files.** Stacking setpts judders AND (for the
  express) crushes the seam dissolve into a cut. Every speed change this session re-encoded
  from the 8s raws with a single clean setpts.

## Open threads

- **`upstream` — RESOLVED this session.** The long-carried "upstream is gone" / dead-remote
  thread is closed: local main tracks a healthy `origin/main`, all session commits pushed.
  (Confirmed via `git status`: up to date, working tree clean.) No `--unset-upstream` needed.
- **Entry-push-in speed — confirm intent.** door=4s / counter=8s left at original pace
  (deliberate: entry walk ≠ hub rotation). If Al B wanted those snappier too, quick same-recipe
  follow-up.
- **Counter content surface (net-new design, deferred):** productions, 2 Beatport releases
  (buy CTAs), corkboard (re-home the parked UPDATES from inventory.ts), NEW contact card/flyer
  (contact doesn't exist in the codebase yet). The clerk negative-space slot is already
  composed into the counter still for v2.
- **id→wall refactor (deferred, deliberate):** station ids still `left-bins`/`right-bins`/
  `mixtape-shelf` (labels are Mixes/Crate/Vibes). Renaming ids ripples through the StationId
  union, resolver edges, and asset paths — its own pass. `inventory.ts` BINS still carries
  "Left Bins"/"Right Bins" labels (unused, not rendered) — should ride along with this refactor
  + the curation pass.
- **On-device gauntlet** — still the only outstanding ENGINE verification. Hardware-blocked
  (non-AV1 iPhone + LPM). Al B has only a Pro iPhone. (Poster-covers-gap mechanism is
  platform-independent; only the decode-gap LENGTH wants real-iOS confirmation.)
- **Curation pass** (parallel, editorial, Al B-led): genre worksheet, SoundCloud + Various
  titles, Beatport title/artist confirm, update culling.
- **Carried:** Vercel project / domain cutover; clerk interactivity (v2, negative-space slot
  waiting in the counter still); phase-2 agent layer.
- **Optional / parked-resolved:** Vibes clean-still re-gen (no longer needed — rotational
  retired the speckle exposure); rain-front dry-counter re-gen (deliberately not chased —
  reads fine at 1.0s, domino chain too large); Crate↔Vibes 47/48 near-still (imperceptible,
  confirmed smooth).

## Next step

The navigation build is **DONE** — entry sequence → four walls → rotational ring → circular
express, every hub trip a uniform snappy 1.0s, every edge real footage, the room circles both
directions, nothing crosses the middle. The hard creative+engine spine (everything since the
2026-06-12 scroll-kill) is finished. What remains is a DIFFERENT PHASE: (1) **cutover** —
upstream now resolved, so next is Vercel project + domain; (2) **counter content** — the DOM
surface (productions, Beatport buy CTAs, re-homed UPDATES, net-new contact card); (3)
**curation** (editorial, Al B's input); (4) **clerk v2** into the composed negative-space slot.
None of these is "finish the nav." Natural next session: Vercel/domain cutover groundwork
and/or start the counter content surface.
