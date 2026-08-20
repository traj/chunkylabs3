# Session Log — 2026-08-20 — Design Day: Mixes System, Harvest, Figma HQ

CD-authored, repo-bound. This was the largest design session of the project: Phase 0 closed, full catalog harvested, playback architecture verified, the Mixes interface designed to approval through five DD rounds, the design system canonized in Figma, and the tooling doctrine rewritten (rev D).

---

## 1. Phase 0 — DONE

- 19-commit unpushed stack pushed to origin/main (upstream needed no fix; branch was simply ahead). Subsequent commits b52019f (harvest v1), 31da790 (harvest v2), 0f4d407 (harvest v2.1) all pushed.
- Local `npm run build` green (Next.js 16.2.9, routes /, /music, /store prerendered).
- **OPEN:** Vercel preview URL never visually confirmed — Vercel posts no signals to the GitHub repo and CC has no Vercel CLI auth. Al B to eyeball the Vercel dashboard. Per CLAUDE.md, deploy config stays out of the repo.

## 2. Content harvest — DONE (141-item manifest)

- Source of truth: the OLD live site repo (`chunkylabsnyc2`, SvelteKit — NOT `chunkylabs2`), read-only. Embed URLs extracted from SoundCloudSpot / SpotifyVarious / SpotifyVibes / DigitalDownloads component arrays.
- v1: 30 top-level items (5 SC sets, 5 Spotify playlists, 18 Vibes playlists, 2 Beatport releases). Beatport 403s curl but not Node fetch. SoundCloud canonical = api.soundcloud.com/playlists/<numericId> (URN form fails oEmbed).
- v2/v2.1: all 5 SoundCloud sets expanded to tracks via public client_id + api-v2 (both techniques worked first try; anti-spin path never hit). **111 tracks, 111 with art (500×500), durations, dates, genres — zero failures.**
  - Mixes 30 · Live Records 22 · Tapes 23 (old mixes, some from radio) · Edits 27 · Remixes/Production 9.
- Contact sheets per wall at `content/harvest/sheets/` (sharp was already vendored via Next.js; no package.json change).
- Scripts re-runnable: `harvest-content.mjs`, `harvest-tracks.mjs` (idempotent, self-healing client_id), `make-contact-sheets.mjs`.
- Genre field auto-fills much of curation 3.1 (verify-not-author).
- Declined: container set entries borrowing first-track art (they are tab data, not cards).

## 3. Playback architecture — APPROVED (research-verified)

- **One transport, SoundCloud-only under the hood.** SC Widget API (hidden iframes) drives full custom chrome: play/pause/seek/volume/position events. Covers mixes, live, tapes, and later Crate edits.
- **Spotify playlists = official embed framed by our chrome** + OPEN IN SPOTIFY. Custom Spotify chrome rejected on verified grounds: anonymous visitors get 30s previews; open May-2026 bug where iFrame API play() triggers preview mode even for logged-in Premium; API has broken for weeks at a time historically; Web Playback SDK needs visitor OAuth+Premium.
- CC law: the embed's `allow="encrypted-media"` attribute must survive untouched.
- Audio persists within-wall browsing; stop-on-navigate applies to leaving the wall. Full spec: `2026-08-20-spec-mixes-flow-and-playback-architecture.md` (project folder).

## 4. Mixes design — APPROVED at v5

Journey: v2 smoked-glass kit (surface language locked) → v3 three-state tray (structure rejected: any horizontal panel fights the cinematic frame) → v4 rail (docked = app-read, rejected) → **v4r2/v5 floating objects (APPROVED)**.

**The approved model — floating objects in the room, never docked chrome:**
- Browse panel 440px floating left-of-center; detail panel 520px unfolds gatefold-right with 28px breath; mini-player 404px bottom-right (QuickTime energy: thumb/title/tag row + play-pause/elapsed/hairline-scrubber-with-square-dot/total row; no volume/prev/next in v1). Photo reads around all objects.
- Tabs: quiet letterspaced mono row — MIXES · LIVE · TAPES · PLAYLISTS (30/22/23/5; Tapes promoted to own tab). Active pink. Crate later: EDITS · REMIXES (27/9). **Crate-divider tab treatment RETIRED** (flopped in comps; restraint won).
- v5 source-true values (screenshot sampling was JPEG-shifted; source wins): pink **#FF4D63** (light #FF8B98), cream #F7EFE2, hairline pure #FFFFFF, ink #120C08, amber #C9954F, dim #9A8570.
- **Graduated smoke recipe (the craft find):** browse rgba(30,18,11,.40)+blur(4px) · detail rgba(30,18,11,.46)+blur(5px) · player rgba(22,13,8,.50)+blur(6px), each with saturate(.9) brightness(~.9) — the glass darkens/desaturates the shop (smoke), never tints over it (frost). + feTurbulence grain. Zero radius, zero shadows throughout.
- Type lock: **Instrument Sans is THE canonical body face** (General Sans unavailable in Figma). Archivo Black display, Space Mono all data.
- State 0 (wall at rest): OURS, not DD's — 3–4 gen'd photoreal cassettes with alpha + typeset DOM labels (honest: typed labels on mixtapes are in-world), VIEW ALL divider card fully gen'd, sleeve-pull hover. Pencil geometry + Meshy chain. Awaiting Al B's featured-title picks.
- Playlist detail: framed 360×152 SPOTIFY EMBED slot + OPEN IN SPOTIFY, tag-playlist in amber #F0B45C. Honest about the foreign element.
- Reference files in `docs/reference/`: `mixes-player-detail-v5.offline.html` (as-rendered bundle), `mixes-player-detail-v5-figma.html` (import twin), `FIGMA-EXPORT.md` (standing checklist), `wall.png`, archived .h2d.

## 5. Corner doctrine — APPROVED

TL identity (CHUNKYLABS wordmark, whisper, click→counter=home) · TR dismiss (die-cut close sticker, only when something's open, +Esc) · BL movement (record-puck compass) · BR sound (mini-player, only while playing). At rest the frame is nearly empty. No nav bar, no header, ever. Open minor calls: wordmark idle-fade vs faint-persistent (CD lean: faint-persistent at launch); confirmed home=counter not street.

## 6. Signature set status

Landed: zero-radius law, letterspaced mono nav, floating-band lineage (MPR-RPM 2006 site mined as primary source). Retired: crate-divider tabs. Queued for flavor pass: ghost-title echo, tape-counter digits, fader volume, sleeve-pull hover (spec'd on ListRow), sticker-tag die-cut geometry, per-wall color world. Discipline: one metaphor per element; everything else ruthlessly plain.

## 7. Tooling doctrine — rev D (supersedes all prior)

**Two tracks, one per register:**
- **HONEST-UI → FIGMA IS HQ.** DD designs → on APPROVAL DD writes an import-safe `-figma.html` twin (semantic classes = layer names; no backdrop-filter/grain/transforms; per FIGMA-EXPORT.md) → committed to docs/reference/ → imported via html.to.design FILE tab (design file open, target page selected; layer-names + autolayout ON, styles/hover/hi-res OFF) → CD finishes via Figma MCP (graduated blur, plate/thumb image fills, style binding, component promotion) → decisions adjusted in Figma → CC implements FROM Figma (desktop MCP + CD-extracted values) → repo ships.
- **IN-WORLD/COLLAGE → PENCIL retained** (Al B veto on retirement): plates + Meshy assets + hotspot geometry; CC grabs coordinates directly. Approved layouts drop flat PNG snapshots into Figma for overview only.
- Export-on-approval only. docs/reference/ HTML = port source + rendered-values crib, not truth.
- **DD trial verdict: KEEP, with lane** — fast structural exploration from tight briefs; finals as static HTML. Known limits: cannot receive pasted/attached images reliably (contact sheets never landed all day — CC wires real covers at build); cannot write to the repo (describes its own sandbox as if it were disk — always verify on disk); h.t.d extension-capture path deprecated in favor of static-twin File imports.

## 8. Figma design system — BUILT

File: **chunkylabs3 — Design System** — https://www.figma.com/design/ffGlWMJ2GPhhYZyAiHQjJX (Al B drafts, "Al B's team").
- 00 Cover & Laws (ten laws + doctrine rev D) · 01 Tokens (variables + swatch board, v5 source-true; motion 150/300/600; radius/all=0 as law-bearing variable) · 02 Type (three voices) · 03 Components (Button×2, Tag, Nav/Tabs, ListRow default+nowplaying, Player/Mini, Panel/Browse — behavioral specs in descriptions) · 04 Corner Doctrine (annotated 1600×900) · 05 DD Finals (flat reference) · 06 Mixes screens & geometry (**v5 imported as native layers, finished**: plates rebuilt + wall.png filled via MCP, 10 thumbs filled, graduated blur applied, wrapper de-junked).
- Figma MCP gotchas learned: variable scopes reject ALL_FILLS+specific mix and WIDTH_AND_HEIGHT (use WIDTH_HEIGHT); resize() after sizing modes resets primary axis to FIXED; page backgrounds default light (wash out smoke) — set ink on every page; upload_assets + curl multipart works for image ingestion; cross-page work = one setCurrentPageAsync per call.

## 9. Next session (design continues)

1. Reconcile page-03 components against imported v5 layers; create + bind text styles (deferred deliberately).
2. State 0: Al B picks 3–4 featured titles → CD writes Meshy gen prompts + Pencil/CC composite plan.
3. CC build spec: Mixes panel system from Figma + v5 crib + harvest manifest; includes SC Widget smoke test (hidden iframe, autoplay policy, mobile Safari).
4. Al B: confirm Vercel preview URL from dashboard.
5. Then per remaining-work PRD: Crate release moment (inherits player+buttons), sticker-wall insert (parked, Al B has ideas), nav puck, clerk production.
