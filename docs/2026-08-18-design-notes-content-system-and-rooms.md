# chunkylabs3 — Content & Interaction Design Notes

_2026-08-18. High-level design pass, all rooms + navigation. Locked "at altitude" — details
get decided per-section as each is built. Supersedes parts of the 2026-07-10 PRD (1.2/1.3)
and the 2026-06-23 four-walls content map; supersessions listed at the end. Session log:
`docs/sessions/2026-08-18-design-pass-content-system-rooms-nav-clerk.md`._

---

## The system (cross-cutting, applies everywhere)

1. **Fade-in/out contract.** All content-layer objects are DOM. They fade in AFTER atRest
   (staggered ~150ms, the "shop wakes up" beat) and dissolve out BEFORE any tween starts.
   Video therefore always runs against the clean pins that already exist. Consequence:
   **zero pin-matching, zero reshoots, zero video work for the entire content layer.**
   The pin-matching contract still governs anything baked into stills (door layer model) —
   but nothing in this pass is baked.

2. **Insert shots — views, not places.** A section can open as a full-screen cinematic cut:
   gen'd close-up plate (Meshy, prompt-driven, judged for WORLD match — warm pink-amber /
   brick / neon DNA — not pixel continuity) with legible DOM content composited over it.
   Dissolve in/out. No station, no StationId, no resolver edges, no engine involvement.
   One insert-shot component (plate + content + dissolve chrome), reskinned per section.

3. **Chrome language.** Thin-white-border treatment as the unifying motif — photographic
   (die-cut sticker edge, baked into gen'd PNGs) when over the frame; CSS when in UI
   (bubbles, cards, tray chrome). Collage energy. Glow/lift on hover. One language across
   counter sections, wall trays, inserts, and the nav puck.

4. **Appearance law unchanged (07-12).** Anything over the photoreal frame comes from a
   photographic process (gen on flat dark ground → bg-remove → photometric harmonization:
   measured blur/grade/grain match into the frame). UI layers (trays, inserts' content,
   modals, HUD) are honest interface and free to be as animated/magical as wanted.

5. **Legible text is allowed on all fade-in objects and insert plates** — they never enter
   video, so the no-baked-text rule doesn't apply. First legible in-world text in the site.

6. **Slot model for featured objects.** Hand-pick fixed positions (anchored in image space
   via the hardened cover-box math; sized to slightly overhang any baked twin so warped
   edges never peek). Content swaps INTO slots — composition designed once, never gambled.
   ≥2 slots per surface must survive the portrait center column (or get per-viewport
   anchors). 2–3 hero objects per wall max.

7. **Semantics honesty.** A click target must visually resemble what it opens. Per-item
   glow only where the mapping is 1:1 (real DOM sleeves/tapes). Zone glow may loosely
   follow baked record clusters (feels object-aware) but always opens the zone's real
   inventory — never pretends a baked sleeve maps to a specific item.

8. **One-section proof first.** Full chain (gen → harmonize → fade → hover → insert/modal)
   on one section before authoring any full set. Same discipline as transition-1.

---

## The content remap (supersedes the June four-walls map)

| Surface | Identity | Content |
|---|---|---|
| **Counter** | Reception | Clerk + sticker-wall index (news / contact / stickers / flyers). **No commerce.** |
| **Mixes (left)** | What you play | Tapes tier = SoundCloud mixes + live sessions. Bins tier = misc Spotify playlists (salsa / piragua / etc. move here). |
| **Crate (right)** | What you make | Beatport releases (heroes, buy CTAs — the ONLY commerce in the store) + SoundCloud edits (the dig). |
| **Vibes (ahead)** | The gallery | 18–19 Vibes covers. Featured slots + full-list browse. |

- **Deliberate reversal of the 2026-06-23 decision** "productions live behind the counter":
  with edits + productions joining the 2–3 releases, the catalog CAN anchor a wall.
  Counter gets cleaner (pure identity), Crate becomes the artist wall. Endorsed, eyes open.
- Productions that aren't Beatport releases **collapse into Edits for v1** (split later if
  the catalog justifies — same "data change later" posture as tier splits).
- Handedness, stations, engine: **untouched.** This is a pure content remap.

---

## Per-room sketches

### Counter — reception / the index
- **Zones:** sticker wall (the one content trigger), clerk, shelf-behind stays baked
  texture (possible cross-promo nod later, unscoped).
- **Sticker wall section** = updates + contact + flyers + stickers, one home. Trigger:
  harmonized gen'd sticker/flyer cluster fades in near the window/wall (does double duty
  covering any baked gibberish there). Opens an **insert**: closer view of the wall and/or
  birds-eye of the turntables (plate choice open) with legible content over it — each
  surviving UPDATE styled as a flyer (torn paper / tape / pins; news-as-artifact), stickers
  as texture + CTAs, **contact as ONE distinctive flyer** (different paper/color).
- UPDATES cull: cap ~6–8 of the 16 (curation 3.4 now blocks this section's final content).
- Clerk: see the clerk addendum below + PRD Phase 6.
- "Index feel": the counter is the store's table of contents — each zone cuts to its
  closer look.

### Mixes — what you play
- **The baked two-tier composition IS the taxonomy:** tapes up top = mixed stuff (mixes +
  live sessions, one identity, as cassettes), bins below = playlists (as records).
- Featured tapes fade in on the top tier with **legible spines/labels**; optionally one
  leaned record on the lower tier. Catalog is "quite a lot" → featured slots + full browse
  (the Vibes treatment), sectioned Mixed / Playlists (or Mixes / Live / Playlists).
- **Deck insert as the player:** click a tape → birds-eye cassette-deck plate, player UI
  living in the deck. One plate gen, N payloads. Tape-label-swap on the seated cassette =
  nice-to-have, not a gate (fallback: static deck + title in chrome).
- Genre-divider tab idea moves here with the playlists.

### Crate — what you make (the artist wall)
- **Releases = hero objects.** 2–3 Beatport records fade in (leaned / face-out), real cover
  art, the only price tags in the shop. Click → its moment: cover large, listen, **buy CTA
  out to Beatport**. Most reverent treatment in the store; scarcity is the point.
- **Edits = the dig.** Click the bins → **overhead crate insert** (birds-eye looking down
  into the crate, sleeves in a row) → flip through the edits in that view. The digging
  metaphor is 1:1 here. Tabs (Edits / Remixes or chronology) decided with curation.
- **Affordance note:** commerce now lives one wall deep — Crate's hub-facing trigger wants
  slightly stronger presence (glint / hover language) so buyability is sensed from the
  counter. Design detail for the nav/affordance pass, not a problem.

### Vibes — the gallery
- 18–19 finished covers → **3–4 fixed featured SLOTS** over the baked face-out records;
  randomize which covers fill them **per visit (stable within the visit)** — return later,
  the shop's been restocked. On-wall versions get harmonization; clean flat art lives in
  the browse view.
- Featured click = **in-place bloom** (expand + play right there, zero friction).
- Full list: **OPEN DECISION** — insert shot (cut to a close-up face-out wall where every
  sleeve is real and legible; most cinematic; costs one plate gen) vs. bottom-sheet tray
  grid (no new plate, conventional). Lean: insert.
- Diegetic browse trigger lean: one slot is always a hand-made "VIEW ALL" divider card.
- Ordering gesture for the grid (chronological / loose curation) rides with curation.
- Bonus: the crisp DOM layer sits over the accepted baked speckle — the wall's
  best-looking layer is now the content.

### Street — the approach
- **Strip the old scene copy + the massive CTA entirely** (retires the copy-overlap bug
  for this station).
- **Main CTA = "CROSS THE STREET"** — diegetic: storefront region of out0 is the hotspot,
  hover-glow on the shop, small hand-made label/scrawl (gen'd, not typeset UI).
- **Easter eggs (1–2, silent — NO idle tell):** hotspot over the baked sticker-on-box;
  hover = small reveal (brighten / tag flip: "unreleased — take it"); click = download of
  an unreleased track (track pick + whether download gets a styled beat: open). Second
  egg slot open, stays empty until something earns it.
- **Cost discipline:** tier-1 (hotspots over baked) and tier-2 (DOM fade-ins) ONLY.
  Nothing gets baked into the street composition — that would reopen pins + Cinema Studio.
  The 07-12 reshoot stays closed.

### Door — as built (07-12)
- Placard ("Come in / WE'RE OPEN") = the CTA into the store (existing hotspot).
- **Shade bumper sticker → hotspot → shade site, new tab** (door station only; too small
  at street distance).
- Flyer clickability: optional later.
- Entry chain reads diegetically end-to-end: **cross the street → WE'RE OPEN → inside.**

---

## Navigation — the record-puck HUD + keys

- **One fixed nav cluster, game-HUD model:** the world changes, controls never move.
  Replaces ALL per-station directional CTAs (retires "plain CTAs no restyle" + the
  copy-overlap bug across the board). HUD owns MOVEMENT; the world owns CONTENT (objects,
  tapes, eggs, clerk are always in-world, never in the HUD).
- **Form: a vinyl record puck** (bottom-center or corner). Label art = you-are-here;
  four positions around the disc = directions; disc rotates with facing. Position icons
  gen'd in the sticker style (tape = Mixes, price-tagged sleeve = Crate, face-out cover =
  Vibes, bell/clerk mark = Counter) — even the HUD obeys the appearance law. Wall labels
  on hover/tap of positions.
- **Appears at first counter arrival** (entry path stays fully diegetic, HUD-free — no
  HUD in the cutscene). **Idle fade** after a few seconds, wakes on input.
- **Keys (desktop): WASD + arrows, discrete** (Myst / dungeon-crawler model — matches the
  station engine 1:1). A/← Mixes · D/→ Crate · W/↑ ahead/advance · S/↓ back.
  **Esc** closes tray/insert · **Enter/Space** activates focus. Gating: keys live at
  atRest; during tweens **queue exactly one press** (lean); suspended while tray/insert
  open except Esc. Accessibility credit comes free.
- **Key-hint onboarding:** small key glyphs on the puck positions, fade permanently after
  first uses.
- **Mobile:** puck only, thumb-reachable, sits above the bottom-sheet layer.
- **Z/interaction contract (decide at build):** lean = HUD dims during inserts, hides or
  spins during tweens.
- v1 = static disc + four tap zones + facing indicator; rotation animation = polish.
- Konami-style typed-word egg = v2 garnish, unscoped.

---

## Open decisions (running list)

1. **Vibes full-list:** insert shot vs. bottom-sheet tray. (Lean: insert.)
2. **Mixes player:** deck insert vs. in-place expand — decide WITH #1 (shared component).
3. **Audio persistence:** stop-on-navigate (lean, v1) vs. mini-player follows.
4. **Contact content:** what contact IS (email / booking / socials).
5. **Clerk:** modality + NPC model now LOCKED (see addendum); remaining = ref-photo
   session, master-still rolls, line-set drafting, one-clip proof.
6. **Curation now blocks final content in EVERY section — rising priority.**
   Existing 3.1–3.4, PLUS new items: Mixes tape-label art (does it exist or is it a design
   task?), Vibes grid ordering, the edits catalog list, unreleased-track pick for the
   street egg, second-egg concept.
7. **Sticker-wall insert plate:** closer wall vs. birds-eye turntables vs. both.
8. **Nav build details:** queue-one confirm, HUD-during-tween behavior, puck placement.
9. **Productions tier:** collapsed into Edits for v1 (revisit if catalog grows).

---

## PRD supersessions (edit at next PRD touch)

- **1.2 Counter:** now reception-only — clerk + sticker-wall section. Productions shelf +
  Beatport releases MOVE to Crate (1.3). Corkboard → the sticker-wall section (absorbs
  contact; contact-card line item merges in).
- **1.3 Walls:** zone → tray → player survives as the underlying/fallback pattern, but the
  primary model is now **fade-in featured objects + insert shots**; the Vibes face-out
  "exception" generalized into the slot system. Per-wall content per the remap table.
- **CTA visual design pass** → replaced by the nav HUD + diegetic entry chain.
- **2026-06-23 four-walls content map** → superseded by the remap table above (structure/
  handedness unchanged).
- **Phase 6 clerk:** output-modality TBD → LOCKED bubbles-always/voice-on-click; v1 =
  canned NPC (see addendum).

---

## Tooling posture (from this session's opening discussion)

- **Pencil = geometry source of truth.** What ships gets built there (.pen in repo,
  MCP-wired to CC, warts documented).
- **Claude Design = exploration layer, TRIAL PENDING.** First brief: the counter
  sticker-wall insert (collage-over-plate layout + bubble chrome). Judge exploration
  value; if mid, drop it, Pencil alone continues.

---

## ADDENDUM (same session, post-compile) — Clerk (Phase 6) concept locked

- **Modality LOCKED: bubbles-always / voice-on-click.** Browser autoplay policy forces
  it (unmuted audio needs a gesture): on-arrival greeting = bubble + idle; click the
  clerk = line plays aloud with its clip. Mute-safe by default, diegetic on engagement.
  This un-TBDs Phase 6 scope.
- **NPC model LOCKED: canned lines, no agent in v1** (agent = v2 into the same data
  slot). Liveliness = writing + selection, not intelligence: context-keyed line pools
  (first arrival / returning / came-from-which-wall), no-repeat rotation, one rare
  1-in-20 line, everything written in Al B's actual voice. **Line budget 8–12.** Lines
  double as the index's human layer (wall-pointers = the nav tutorial nobody reads as
  a tutorial).
- **Production chain (verified feasible 2026-08-18, existing subscriptions only):**
  1. Real ref photos of Al B — front-facing, waist-up, well-lit, no occlusions.
  2. Meshy refgen → **master still on flat green**, counter-matched warm key light,
     neutral pose. Roll for likeness; Al B is the sole gate. (Fallback: real photo on a
     green sheet, manual light match.)
  3. Master still = three things: v1a static PNG (keyed), Kling input image for every
     clip, and the rest pose all clips start from. Judge once, hard.
  4. ElevenLabs **Instant** clone (2–3 min clean audio) → line audio files. Upgrade
     path if flat: record more (Professional wants 30min+); nothing downstream changes.
  5. Higgsfield Lip-Sync Studio → Kling AI Avatar: master still + one line's audio per
     run (~1 min cap, 1080p/48fps). Prompt pins EVERY run: static camera + green
     background unchanged; subtle gestures, medium shot.
     **Idle loop ≠ avatar tool** (audio-driven; silence confuses it) → plain i2v gen on
     the same still ("subtle breathing, blinking, static camera"); loop seam via
     trim-to-similar-frames or self-crossfade.
  6. Key + encode: ffmpeg chromakey + despill → VP9-alpha WebM; ProRes 4444 →
     HEVC-alpha via macOS (`encode.sh --alpha` branch; CC verifies avconvert
     scriptability).
  7. Composite into the counter negative-space slot; judge ON THE COMPOSITE (hair
     edges + green relight = known failure points).
- **Seams:** entry seam ~solved by construction (all clips start from the same still);
  exit seam = ~300ms alpha crossfade back into idle (dissolve eats the landed gesture).
- **Watch-items:** medium-shot framing vs tooling's close-up bias (the proof clip's
  job); idle loop = continuous second decoder → battery line-item on the gauntlet;
  insurance = swap to static PNG after ~60s idle.
- **One-clip end-to-end proof before authoring the set** — one afternoon: photos →
  still → 3-min recording → one line → one clip → key → composite.

---

## Next

Cut this into tasks. Proving-ground lean: **counter sticker-wall section first** — most
forgiving content, exercises the full new chain (cluster gen → harmonize → fade →
insert plate → collage chrome), and doubles as the Claude Design trial brief.
Standing debt unchanged: **Phase 0 (push the stack + Vercel preview) remains the most
overdue item in the project.**
