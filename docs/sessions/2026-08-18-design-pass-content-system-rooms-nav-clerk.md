# Session log — 2026-08-18 — Design pass: content system, all rooms, nav HUD, clerk concept

_CD-only design session (no CC work, no commits prior to this closer). Produced the
content/interaction design system for the whole site, a content remap of the walls, the
navigation HUD concept, and the full clerk (Phase 6) production concept. Canonical design
doc: `docs/2026-08-18-design-notes-content-system-and-rooms.md` (written this closer,
same content as the project-folder copy + the clerk addendum)._

## Decisions made (and why)

1. **Tooling posture: Pencil stays geometry source of truth; Claude Design adopted as a
   TRIAL exploration layer only.** Claude Design (Anthropic Labs, research preview) is
   strong at cheap wide exploration and can ingest the repo, but is preview-stability,
   out-of-repo, and its output would be adapted anyway. First trial brief: the counter
   sticker-wall insert. Judge exploration value; drop if mid.

2. **THE FADE-IN CONTRACT (the session's structural win).** All content-layer objects are
   DOM; they fade in AFTER atRest and dissolve out BEFORE any tween. Video always runs
   against the existing clean pins → **zero pin-matching, zero reshoots, zero video work
   for the entire content layer.** This retired the "DOM sleeves are expensive" objection
   that shaped the 07-10 wall model.

3. **Insert shots = views, not places.** Sections open as full-screen cinematic cuts:
   prompt-driven Meshy close-up plate (world-match, not pixel continuity) + legible DOM
   content over it. No stations, no resolver edges, no engine. One shared component
   (plate + content + dissolve chrome), reskinned per section.

4. **Semantics honesty rule.** Click targets must resemble what they open. Per-item glow
   only where mapping is 1:1 (real DOM sleeves/tapes). Zone glow may loosely follow baked
   clusters but always opens real inventory. (Baked-record glow is now technically
   possible via the hardened cover-box math — rejected as primary because the semantic
   promise would be false, not because it can't track.)

5. **CONTENT REMAP (supersedes the 2026-06-23 four-walls map — deliberate reversal,
   endorsed with eyes open):**
   - **Counter = reception.** Clerk + sticker-wall index ONLY. Commerce moves OFF the
     counter (reverses "productions behind the counter with dignity").
   - **Mixes (left) = what you play.** Tapes tier = SoundCloud mixes + live sessions;
     bins tier = misc Spotify playlists (salsa/piragua move here). The baked two-tier
     composition IS the taxonomy — no re-gen.
   - **Crate (right) = what you make.** Beatport releases as hero objects (the ONLY
     commerce in the store) + SoundCloud edits as the dig. Productions collapse into
     Edits for v1.
   - **Vibes (ahead) = the gallery.** 18–19 finished covers (Al B has the art); 3–4
     fixed featured SLOTS over the baked face-outs, covers randomized per visit (stable
     within visit); full-list browse.
   - Handedness/stations/engine untouched — pure content remap.

6. **Counter sticker-wall section** absorbs updates + contact + flyers + stickers (one
   home; contact = one distinctive flyer). Opens an insert (closer wall and/or birds-eye
   turntables — plate choice open). UPDATES cull capped ~6–8 of 16. This gives the
   counter the "index feel" — each zone cuts to its closer look.

7. **Street redo:** strip old scene copy + massive CTA entirely; main CTA = diegetic
   "CROSS THE STREET" (storefront hotspot, hover-glow, small hand-made label). 1–2
   SILENT easter eggs (no idle tell): baked sticker-on-box → hover reveal → unreleased
   track download. **Cost discipline: tier-1 (hotspots over baked) + tier-2 (DOM
   fade-ins) ONLY — nothing new gets baked into street pins; the 07-12 reshoot stays
   closed.** Door as built; shade bumper → shade site (new tab, door station only).
   Entry chain fully diegetic: cross the street → WE'RE OPEN → inside.

8. **NAVIGATION: one fixed game-HUD, the record-puck compass.** Replaces ALL per-station
   directional CTAs (retires "plain CTAs" + the copy-overlap bug wholesale). HUD owns
   MOVEMENT; world owns CONTENT. Vinyl-disc puck: label = you-are-here, four positions =
   directions, rotates with facing, position icons gen'd in sticker style (appearance
   law applies to the HUD too). Appears at first counter arrival (entry stays HUD-free);
   idle-fades. **Keys: WASD + arrows, discrete (Myst/dungeon-crawler model — matches the
   station engine 1:1).** A/←=Mixes, D/→=Crate, W/↑=ahead/advance, S/↓=back. Esc closes
   tray/insert; Enter/Space activates. Gating: keys live at atRest; queue exactly one
   press during tweens (lean); suspended in trays except Esc. Key-hint glyphs on the puck
   fade after first uses. Mobile: puck only. v1 = static disc + tap zones + facing
   indicator; rotation anim = polish. Accessibility credit comes free with keys.

9. **CLERK (Phase 6) — concept completed, two former TBDs LOCKED:**
   - **Modality LOCKED: bubbles-always / voice-on-click.** Forced by browser autoplay
     policy (unmuted audio requires a gesture): on-arrival greeting = bubble + idle/
     silent gesture; click-the-clerk = line plays aloud with its clip (the click IS the
     unlock). Not a compromise — the only shape that works. Un-TBDs Phase 6 scope: full
     lip-sync pipeline, audio always gesture-gated.
   - **NPC model LOCKED: canned lines, no agent in v1** (agent stays v2 into the same
     data slot). "Not dull" is writing + selection: context-keyed pools (first arrival /
     returning / came-from-wall — one conditional each), no-repeat rotation, one rare
     1-in-20 line, lines written in Al B's actual voice. **Line budget: 8–12 short
     lines** (greeting pool, context lines, wall-pointers = the index's human layer,
     one rare).
   - **Production chain verified feasible (fresh research, no new subscriptions):**
     (1) real ref photos of Al B (front-facing, waist-up, well-lit) → (2) Meshy refgen
     master still on FLAT GREEN with counter-matched warm light (roll for likeness —
     Al B is the gate; fallback = real photo on green sheet) → (3) master still = v1a
     PNG + Kling input + pose anchor, judged once, hard → (4) ElevenLabs INSTANT clone
     (2–3 min clean audio; upgrade path = record more, nothing downstream changes) →
     render line audio files → (5) Higgsfield Lip-Sync Studio, Kling AI Avatar, master
     still + line audio per run (~1 min/run cap, 1080p/48fps), prompt pins every run:
     STATIC CAMERA + GREEN BACKGROUND UNCHANGED; **idle loop is NOT avatar-tool** (it's
     audio-driven — silence confuses it): plain i2v gen on the same still ("subtle
     breathing, blinking, static camera"), loop seam via trim-to-similar-frames or
     self-crossfade → (6) ffmpeg chromakey + despill → VP9-alpha WebM; ProRes 4444 →
     HEVC-alpha via macOS (`encode.sh --alpha`, avconvert scriptability = CC verify) →
     (7) composite over counter held frame, judged ON THE COMPOSITE.
   - **Seam design:** every clip STARTS at rest pose by construction (same source
     still); EXIT seam = ~300ms alpha-domain crossfade back into idle (dissolve eats
     wherever Kling's gesture landed).
   - **Watch-items:** tooling guidance skews close-up, ours is a medium shot (supported
     per prompt examples — exactly what the one-clip proof tests); hair edges on the
     key; model relighting the green; idle loop = continuous second decoder (battery
     line-item on gauntlet; insurance = swap to static PNG after ~60s idle). Credit
     math: 8–12 clips fits inside a normal Higgsfield cycle.
   - **One-clip end-to-end proof before authoring the set** (photos → still → 3-min
     voice recording → one line → one clip → key → composite) — one afternoon,
     exercises every risk.

## Shipped this session

- `docs/2026-08-18-design-notes-content-system-and-rooms.md` — the canonical design doc
  (system + remap + per-room + nav + clerk addendum). CD-written this closer.
- This session log.
- (Project folder: design-notes copy + refreshed continuity MD, delivered directly.)

## Open decisions (running — full list in the design notes)

Vibes full-list insert vs tray (lean: insert) · Mixes deck-insert vs in-place (decide
with Vibes, shared component) · audio persistence (lean: stop-on-navigate v1) · contact
content · sticker-wall insert plate choice · nav build details (queue-one, HUD-in-tween,
puck placement) · **curation now blocks final content in EVERY section — rising
priority** (3.1–3.4 + new: Mixes tape-label art, Vibes ordering, edits list, egg track
pick, second egg) · clerk ref-photo session + line-set drafting when Phase 6 nears.

## Locked, do not relitigate

Fade-in contract · insert = view not place · semantics honesty · content remap · counter
= reception · record-puck HUD replaces station CTAs · WASD/arrows discrete · clerk
modality bubbles-always/voice-on-click · clerk = canned NPC v1 · tier-1/2 only on street
· Pencil ships, Claude Design explores (trial pending).

## Next step

Cut the design notes into tasks. Proving-ground lean: **counter sticker-wall section
first** (exercises the full new chain; doubles as the Claude Design trial brief).
**Phase 0 (unstick upstream + push the stack + Vercel preview) remains the most overdue
item in the project — now two months of unpushed work; do it as the warm-up.**
