# Session — 2026-06-27 — counter back-exit + entry-sequence storefront redesign

Continues from 2026-06-25 (rotational ring + circular express + 1.0s speed-lock), which
left navigation structurally DONE and pointed at cutover / counter-content as the next
phase. THIS session was billed as "a few small nav/site changes before digging in deep."
We shipped one small nav change (the counter back-exit), then the second "small" change —
fixing the black opening — expanded into a full **entry-sequence redesign**: a new
canonical storefront, the OG storefront retired, and a new walk-up clip generated, picked,
encoded, and wired. The entry redesign is now DONE and verified (7d42f3b); the root splash
is the storefront title card (d1e666d). Most of the session was CD-side creative direction +
Meshy/Higgsfield asset generation.

## Decisions

- **Counter back-exit: reversed door-arrival video REPLACED with a fade out to the street.**
  At the counter, "← Back to the door" played the door→counter clip REVERSED (a
  backward-playing video) to land at the door. Al B wanted that gone: the counter's back
  exit now goes straight OUT to the street as a ~450ms opacity crossfade, reusing the
  existing `CROSSFADE_EDGES` mechanism (the same path as door→street, no video). The door
  is skipped on the way out; it's still reachable on the way IN (street→door→counter).
  - **TASK 0.3 verdict (why it was safe):** localized addition, no windowing surgery —
    street is the active station so it mounts automatically; only change is one
    `CROSSFADE_EDGES` entry + the CTA repoint. The one thing the localized path CAN'T do:
    because counter (idx 2) is two from street (idx 0), outside the active±1 mount window,
    the OUTGOING counter frame doesn't dissolve — instead the video-less street fades IN. A
    true counter-held-frame cross-dissolve would need both mount windows widened (out of
    scope, documented in-code). Al B checked it: "looks good." Meets done-when; the
    fade-up-vs-cross-dissolve nuance is cosmetic and accepted.

- **The site's black opening is NOT a poster bug to patch — it became the trigger for the
  whole entry redesign.** The street station has `transitionIn: null` (it's the only
  station with no inbound clip) and no poster/bg, so it paints pure black with DOM on top.
  The cheap fix (wire street to a storefront still) was on the table, but Al B used it to
  reopen the entry as a real three-beat sequence.

- **Entry model (Al B's authoritative framing): the existing storefront shifts UP a level,
  a new closer DOOR asset is inserted, and a new walk-up video connects them.** Verbatim
  intent: "the street would take what is currently the door. we generate a new meshy asset
  for the door which is closer to the store. then make video that goes from the street to
  the door." So the entry goes from two beats to **three: street (arrive outside) → door
  (at the door) → counter (inside)** — inserting the actual approach instead of teleporting
  from wide-storefront to counter. (An earlier "street = the walk-up, holds on the close
  frame" phrasing of mine was Al B-corrected — the two-station street→door model is the
  locked one, and it's what shipped in 7d42f3b.)

- **Mobile: ship landscape + `object-cover` everywhere for now; revisit per-screen portrait
  later.** Al B has doubts about how elegant mobile comes out at all, so rather than
  speculatively double gen on bespoke portrait assets, we ship object-cover and make custom
  screens ONLY for the ones that "truly suck" once real mobile is in hand. The per-screen
  portrait override remains a known, low-risk tool (opt-in viewport branch; engine cost
  trivial, gen cost is the doubling) for the eventual mobile pass. This RESOLVES the
  long-open option-1 vs option-2 vs option-3 aspect decision in the asset-pipeline spec —
  **option 1 (landscape + object-cover), revisit per-screen once there's real mobile to judge.**
  - **Gen-time consequence:** new exterior composed LANDSCAPE, but with the door + entry CTA
    in the portrait-safe CENTER column so it's as good as object-cover gets on mobile for
    free.

- **Adopt a NEW centered storefront as the canonical exterior; the OG asymmetric storefront
  is RETIRED entirely.** This was the session's big creative pivot. The OG (door in the
  right third, window-left, brick+shutter-right) and a centered storefront CANNOT coexist:
  any push-in from OG → centered would morph one facade into the other mid-move (a glitch).
  Al B's call: "if we use the centered images, the original storefront has to go." So the
  centered storefront is now the ONLY exterior the entry sequence knows about. Not a loss —
  one canonical face, nothing to reconcile.

- **Continuity is WORLD, not GEOMETRY — and "multiple rooms" retroactively legalizes the
  seam.** The objection "the new storefront doesn't map to the interior" was dissolved by
  Al B's own observations: (1) the interior never mapped to the OG exterior either —
  the shop has been a compass-ring abstraction since the four-walls hub, with mutually
  inconsistent invented wedges kept because you never see two at once; (2) the interior
  brick "can be there but hidden"; (3) seeing record shelves through the centered door
  implies a FIRST ROOM, with the counter further in — so the shop is canonically
  multi-room, same fiction as the invented wedges. What actually holds the place together
  is the warm pink-amber / wet-brick / neon / records WORLD, which the new storefront passes
  completely (it's generated from the same shop's DNA). The exterior is the cheap,
  replaceable layer; the interior is the expensive, finished, untouched one — so a new face
  risks nothing already banked.

- **The one load-bearing seam: door→counter (the single hard exterior→interior cut).** A CC
  read-only diagnostic measured the interior door-surround: the entrance door sits on the
  LEFT of the interior view, flanked by exposed brick (heavy wall left, pier right), tucked
  toward the front-left corner, shop opening right. The OG exterior AGREES under the
  walk-through flip (outer-right brick → inner-left). The new centered storefront is
  window-on-BOTH-sides, so it does NOT carry that brick flank — we're accepting that, with
  "multiple rooms" doing the work at the door→counter cut. **Banked: the door→counter seam
  is now load-bearing; watch it when door→counter is revisited.** (door→counter is NOT
  touched this redesign — the existing clip stays; the seam is now out1 → interior.)

- **Winner exterior = out1.png** (renamed from the Meshy hash). Centered wooden glass door,
  windows both sides, abstract pink neon, no baked text. Al B's pick reason: the **smaller,
  more-defined windows + heavier brick framing** best match the interior's counter-window
  glazing AND carry more visible brick beside the door — the strongest inside/outside
  continuity of the batch.

## Assets generated this session (now ENCODED + COMMITTED in 7d42f3b)

- **out0.png** — wide establishing storefront. The walk-up's **start pin** / new STREET
  rest frame. Committed as the street-door poster (`= street-door.poster.jpg`), also
  serves as `street.still` AND the root splash backdrop.
- **out1.png** — close centered storefront. The **canonical exterior** and the walk-up's
  **end pin** / the DOOR station's held rest frame (the walk-up holds here at 4/4).
- **Walk-up clip (Take A)** — `hf_20260627_141025_...mp4` (gentle min-motion Cinema Studio,
  start=out0, end=out1). Encoded to the `street-door` trio (4s, original pace). The
  near-identical-named overshoot Take B was NOT used. (Raws still on Desktop.)

## Shipped (committed)

- **c019fbf** — counter back-exit: `stations.ts` CTA `{label:"← Back to the door", to:"door"}`
  → `{label:"← Back to the street", to:"street"}` (kept `direction:"back"`, same top-left
  zone); `REVERSE_EDGES["counter->door"]` marked DEAD (left in place + asset on disk,
  cleanup deferred); `"counter->street"` added to `CROSSFADE_EDGES` in
  StoreWalkthrough.tsx with the windowing caveat noted in-code. Verified at FULL localhost
  speed: only door.av1 + counter.av1 ever play (the entry push-ins, unchanged); back-to-street
  click produces ZERO play events, street section shows `transition: opacity 0.45s`. No
  backward video. Build clean (Next 16.2.9, 5/5 static).

- **7d42f3b** — ENTRY SEQUENCE REWIRED to the centered storefront + new walk-up; black
  opening fixed.
  - **TASK 0 gate passed:** confirmed the two-station street→door→counter structure.
    street→door falls through to `door.transitionIn` (the repoint target); door→counter
    falls through to the untouched `counter.*` clip whose first frame is the INTERIOR (the
    load-bearing seam, accepted via "multiple rooms").
  - **Encode:** walk-up (Take A) trimmed to 4s at ORIGINAL pace (`encode.sh --real`, TRIM=4)
    into `public/transitions/street-door/`. **The 4s trim does double duty (MEASURED, not
    eyeballed):** out1's framing lands at t≈3–4s and the clip pushes PAST out1 by t=8 — so
    4s catches the gentle-phase hold and amputates the overshoot in one cut. Codecs
    byte-for-byte the OG class (av01.0.08M.08 / avc1.4D4028) so the engine's hardcoded
    `<source>` types match.
  - **Wire:** `door.transitionIn` → the new walk-up (OG `/transitions/door/door.*` now dead
    on disk). New OPTIONAL `Station.still` field; `street.still` = the walk-up's poster
    (= out0 = frame 0) → opening paints the storefront and the swap into the walk-up is
    seamless (same frame). StationFrame's no-clip branch paints `station.still` full-bleed
    (bg-cover) when present — trivial DOM, no engine change. **`Station.still` is now a
    reusable primitive** for any no-inbound-clip station, not a one-off. door→counter
    UNCHANGED; door→street back-out = existing opacity crossfade to the out0 still (static,
    no reverse video).
  - **Verified live (instrumented, full speed):** opening paints out0 (`streetShowsBlack
    Placeholder: false`); "Come in →" plays street-door.av1 once and HOLDS at currentTime
    4/4 on out1 (door centered, no overshoot); OG door clip never played; door→counter
    plays counter.av1 unchanged; `reverseClipEverPlayed: []` (no backward video anywhere);
    build clean.

- **d1e666d** — ROOT SPLASH (`/`, `src/app/page.tsx`) backed with the storefront instead of
  black. **Diagnosis (matters):** the "black" was never a `bg-black` to swap — the page set
  NO background, so the global `body { #0a0a0a }` showed through a transparent `<main>`.
  Also confirmed the "/store still black" scare was a RED HERRING — the street-door trio is
  committed and in HEAD; that black was this root splash all along, never the street
  station. Reused the committed `street-door.poster.jpg` (= out0) full-bleed + a `bg-black/70`
  scrim under the text + z-10/text-shadow lift for legibility. Copy/links/routes
  byte-identical ("Enter the store →" → /store; "Skip intro" → /music). Build clean.
  - **Scrim parked as a taste tweak:** `/70` is legible + storefront-visible; one-token
    change (`bg-black/NN`) if Al B wants it brighter/darker. Not a correctness issue.

- **NOTE — the stack is 3 commits ahead of a healthy `origin/main`** (c019fbf + 7d42f3b +
  d1e666d). **Correction (verified from live git state at session close):** the `upstream is
  gone` scare was RESOLVED on 2026-06-25 and is still resolved — `origin` =
  `github.com/traj/chunkylabs3`, `main` tracks `origin/main`, and the 2026-06-25 pile is
  already pushed. So cutover's first domino is now just **`git push`** (then Vercel/domain),
  NOT an upstream repair — no `--unset-upstream`, no remote setup. (The draft of this log
  mis-carried the old "upstream gone" framing; corrected here against `git status`.)

## Asset-pipeline lessons (hard-won this session — all bankable)

- **Meshy prompt box hard-caps at 800 characters and SILENTLY TRUNCATES.** Counted exactly
  — prompts were getting guillotined mid-instruction at ~800. Rule: **load-bearing
  instructions go in the first ~600 chars; decorative details (rain, grain) trail**, so a
  cut only costs fluff. (Added to current-state recipes.)
- **Ref-faithfulness is a tool that cuts both ways. It FIGHTS "recompose," works FOR
  "extend / pull back."** Every "center the door / move it" prompt LOST to the ref (the
  model protects the reference layout — it gave back the OG composition almost untouched).
  But "keep this exact facade, pull the camera back wider" (out0) and "same facade, closer"
  worked first try. When you need the model to PRESERVE a look at a new distance, lean on
  the ref; when you need it to RE-LAY-OUT, the ref will sabotage you.
- **The REAL shop reference is what finally produced the soul.** Text-only and generic
  neon-noir refs gave generic stock storefronts (all rejected as "not this shop"). Feeding
  the actual current storefront frame as the ref is what carried the warm pink-amber
  character. Reaffirms: live/real reference beats invented description for continuity.
- **"Center the door" + "faithful single-window shop" are in DIRECT CONFLICT** — you can't
  have both without either black side-padding (rejected) or a fake symmetric second window
  (rejected for breaking the interior brick flank). The model isn't failing; the spec was
  internally contradictory. Resolved by adopting the centered face wholesale + retiring OG.
- **"Extend the wall rightward" → the model centered-on-BLACK instead of generating new
  wall.** Abstract "extend" punts to empty margin. Naming the failure as a prohibition (NO
  dark margins/black/grey) AND handing it a concrete object to build (a second lit window)
  is what got it to paint instead of pad. (We ultimately didn't need the extend — adopted
  the symmetric centered gen — but the lesson holds.)
- **Cinema Studio push-ins OVERSHOOT their own end pin — gentle motion + a WIDE end pin
  beats a tight end pin for making the camera STOP.** First walk-up roll blew through the
  door glass into the window crates (camera travels THROUGH the end frame, doesn't stop at
  it). A tight close-crop end pin (Take B) did NOT hard-stop it — it over-traveled anyway,
  nose-to-the-door. The fix that worked (Take A): keep the WIDE end pin (out1) and dial
  motion to MINIMUM so it settles rather than lunges. Same failure class as the Vibes
  push-in overshoot. **Banked: under-drive push-in motion; the end pin doesn't brake the
  camera, low motion does.** Corollary banked at ENCODE: trimming an entry push-in, the
  end-pin framing lands BEFORE the clip's own last frame, so a measured TRIM (out1 at t≈4s
  of an 8s clip) both lands the hold AND amputates the overshoot in one cut.
- **Trim can't fix a crooked PATH** — only over-travel along a correct path. A walk drifting
  toward the window instead of straight to the door needs a reroll, not a shorter trim.
- **Read the PICTURE, not the filename (recurring, bit us again).** The two walk-up takes
  are near-identical timestamp-hash filenames; confirmed the winner (Take A) by re-pulling
  its end frame and looking, not by trusting the hash. Same rule as every prior file
  shuffle.

## Open threads

- **DOM door layer (deferred, now with a second job):** the held storefront frame has
  AI-gibberish posters (scrambled letterforms flanking the door). The already-parked DOM
  sticker layer (brand stickers: Shade, etc.) now ALSO covers the worst gibberish. Same
  machinery as edge CTAs (absolutely-positioned DOM over the held frame, zero engine risk),
  no re-gen. Rides with the sticker pass.
- **Entry-CTA affordance/wording (parked):** the "way in" is a CTA over the door region of
  out1's held frame (no literal knob needed — Al B confirmed). Give it some tell
  (hover-glow desktop / subtle cue mobile). Author when the DOM door layer is built.
- **Push the stack — origin is healthy, main is 3 ahead.** The `upstream is gone` thread was
  resolved 2026-06-25; verified again this session: `origin` = `github.com/traj/chunkylabs3`,
  `main` tracks `origin/main`, ahead 3 (c019fbf, 7d42f3b, d1e666d). Just needs **`git push`** —
  NO `--unset-upstream`, no remote setup. First domino of Vercel/domain cutover.
- **Counter content surface (net-new design, deferred):** productions, 2 Beatport buy CTAs,
  corkboard (re-home parked UPDATES from inventory.ts), NEW contact card. Clerk
  negative-space slot already composed into the counter still for v2.
- **id→wall refactor (deferred, deliberate):** ids still `left-bins`/`right-bins`/
  `mixtape-shelf` (labels are Mixes/Crate/Vibes). Separate pass; rides with curation.
- **On-device gauntlet** — only outstanding ENGINE verification, hardware-blocked (non-AV1
  iPhone + LPM; Al B has only a Pro iPhone).
- **Curation pass** (parallel, editorial, Al B-led): genre worksheet, SoundCloud + Various
  titles, Beatport confirm, update culling.
- **Dead-on-disk cleanup (whenever):** the dead `REVERSE_EDGES["counter->door"]` +
  `counter-door.*`, and the retired OG storefront `/transitions/door/door.*` (now that the
  entry is rewired to street-door.*).
- **Carried:** Vercel project / domain cutover; clerk v2; phase-2 agent layer.

## Process notes

- **A "small nav change" expanded into a redesign — correctly.** The black-opening fix could
  have been a one-line poster wire; Al B chose to reopen the entry properly instead. Worth
  flagging that "small change" framing didn't hold, and that was the right call, not scope
  creep — the diagnostic surfaced that the existing landing frame wasn't portrait-safe and
  the entry was worth doing right.
- **Diagnose-before-fix paid out twice** (the street-black diagnostic; the interior-surround
  diagnostic that measured the door's brick flank and de-risked the seam). Read-only first,
  every time something touched the verified engine or a real continuity question. A third
  time at close: the "/store still black" panic was diagnosed read-only to the root splash,
  not a missing asset — saved a wrong "re-commit the binaries" fix.
- **Al B's reframes did the heavy lifting on the hard call** (world-not-geometry, brick
  hidden, multiple-rooms). The CD job was naming the contradiction (centered vs faithful)
  and pricing the seam, not picking the look — Al B vetoed his way to out1.

## Next step

The entry sequence is **DONE and verified** (7d42f3b) and the root splash is the storefront
title card (d1e666d). Both are on the unpushed-but-tracked stack (main ahead 3 of a healthy
origin/main). The hard creative spine of the entry redesign is finished; what remains is
deferred polish + the long-overdue cutover groundwork. Natural next moves (no particular
order, none is "finish the entry"):

- **`git push` the 3-ahead stack to origin/main** (verified healthy — origin =
  github.com/traj/chunkylabs3, main tracks it). Plain push; the old "upstream gone" framing
  was a stale carry-over (resolved 2026-06-25). First domino of Vercel/domain cutover.
- **DOM door layer (deferred, one pass, zero gen, zero engine risk):** entry-CTA affordance
  on out1's door region (hover-glow desktop / cue mobile); brand stickers (Shade etc.);
  cover the AI-gibberish posters on the held door frame. Same machinery as edge CTAs.
- **Optional taste tweak:** the root-splash scrim (`bg-black/70`) — nudge brighter/darker
  if Al B's eye wants it. One token.
- **Dead-on-disk cleanup sweep** (whenever): OG `/transitions/door/door.*`,
  `REVERSE_EDGES["counter->door"]` + `counter-door.*`.
- **Carried:** counter content surface; id→wall refactor; on-device gauntlet; curation;
  clerk v2; phase-2 agent.

---

### ARCHIVE — the encode+wire prompt that produced 7d42f3b (kept for reference; already run)

This was the embedded ready-to-run prompt from the original closer. It was executed and
produced 7d42f3b — recorded here so the log shows what shaped that commit. **Do not re-run.**

```
TASK — Encode the entry walk-up clip and rewire the entry sequence to the new centered
storefront. The repo is the source of truth; standing context is in CLAUDE.md — don't
restate it.

ASSETS (Al B will place these; identify the clip by its END FRAME = wide centered
storefront, NOT by filename — a near-identically-named overshoot take exists, do not use it):
  - out0.png  — wide establishing storefront (walk-up START frame / new STREET rest frame)
  - out1.png  — close centered storefront (CANONICAL exterior / new DOOR rest frame)
  - walk-up raw — the gentle push-in that starts on out0 and SETTLES on out1 (8s/1080p)

TASK 0 — READ-ONLY, REPORT INLINE FIRST (change nothing yet):
  1. Confirm the current entry wiring: STREET and DOOR stations, the street→door transition
     edge and which asset it resolves to (currently the OG storefront push-in), and the
     door station's current rest/held frame (currently the OG storefront).
  2. Confirm door→counter's asset and its FIRST frame (this is the OG door — the one
     load-bearing seam; we are NOT changing door→counter, just confirming what it expects).
  3. Confirm the street-station black-fix location (the StationFrame else-branch + where a
     still/background field would live on the street station in stations.ts).
  → If the entry is NOT a two-station street→door→counter structure as assumed, STOP and
    report before editing.

TASK 1 — ENCODE the walk-up:
  - Trim to ~4s at ORIGINAL speed — this is an ENTRY push-in, NOT a hub rotation, so it is
    NOT sped to 1.0s (entry push-ins stay at their walking-in pace, per the speed-lock
    decision). Same encode class as the original door/counter push-ins: trim, no 2x pass.
  - Run through encode.sh --real (SVT-AV1 + libx264 floor, +faststart, file-accurate codec
    strings). Poster = FIRST frame (locked rule — frame 0 = out0, the pre-roll).
  - Output the standard trio (.av1.mp4 / .h264.mp4 / .poster.jpg) for the street→door edge.

TASK 2 — WIRE the entry (repoint existing stations; do NOT add a new station):
  - STREET station: set its still/background to out0 so it paints the wide storefront
    instead of BLACK (this is the black-opening fix — the diagnostic's identified
    StationFrame else-branch + a still field on street in stations.ts).
  - street→door transition: point at the newly-encoded walk-up (Take A). Its poster (=out0,
    first frame) gives a seamless pre-roll from the street's out0 still into the playing clip.
  - DOOR station now rests on out1 automatically (the walk-up's held last frame). Confirm it
    holds cleanly.
  - door→counter: UNCHANGED. (The exterior→interior seam rides on "multiple rooms" — leave it.)
  - Back-out (door→street): STATIC, no reverse video (per Al B — reverse is posters/static
    only for the entry). If a crossfade is trivially the same as the counter→street pattern,
    fine; otherwise a static hold to the street's out0 frame is acceptable.

EXCLUSIONS:
  - Do NOT touch door→counter, the counter, or any wall/ring/express edge.
  - Do NOT speed the walk-up to 1.0s (it is NOT a hub rotation).
  - Do NOT build a portrait/mobile variant (object-cover everywhere for now).
  - Do NOT build the DOM sticker/poster layer this pass (deferred — separate work).
  - The OG storefront assets + REVERSE_EDGES["counter->door"] become dead on disk — leave
    them (cleanup is a later pass); just note them dead in your report.

DONE WHEN:
  - Page load shows the wide storefront (out0), NOT black. Verify at FULL localhost speed.
  - Clicking the street's approach/come-in CTA plays the walk-up ONCE and HOLDS on out1
    (the centered storefront), door prominent and centered. No overshoot, no backward video.
  - door→counter still works unchanged; back-out to street is static (no reverse video).
  - rm -rf .next && npm run build is clean (kill zombie port first: lsof -ti:3000 | xargs kill -9).
  - Commit (binaries ALONGSIDE the data/metadata change) and REPORT THE COMMIT HASH.
```
