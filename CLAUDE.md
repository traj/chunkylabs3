# CLAUDE.md

Guidance for working in this repo. Read it before touching video, scroll, or animation code.

## What this is

**chunkylabs** — a music showcase site built as an *interactive record store visit*. It is a
**click-navigated, zero-scroll four-walls hub** (Flash/SWF style): the visitor is placed in
one full-viewport scene and moves by clicking on-screen directional CTAs. From the **counter
hub** they turn to the **Mixes** wall (left), **Crate** wall (right), and **Vibes** wall
(ahead), reached via the **street → door → counter** lead-in. Movement is driven by
pre-rendered, **play-through** video transitions that play once and **hold their final
frame**, with live DOM layers (text, music embeds, CTAs) composited over the video.

The **play-through transition engine is built and the store is FULLY FILMED on real footage.**
Every edge is real: the entry lead-in (**street → door → counter**), all three walls off the
counter hub (**Mixes** left, **Crate** right, **Vibes** ahead), and the **rotational ring**
between the walls (Mixes ↔ Vibes ↔ Crate) — so the room can be circled either direction.
counter↔Vibes is a **chained circular express** (it travels around the ring via a random side
wall, never straight across); every hub rotation is a uniform snappy **1.0s**. No synthetic
"DO NOT SHIP" placeholder is reachable anywhere (the `_placeholder/` set stays only as the
encode fixture). The **entry is a three-beat sequence**: the street rests on a storefront
still (out0) — no longer a black screen — then **street → door is a walk-up clip** onto the
canonical **centered storefront** (out1), then door → counter (the one hard exterior→interior
seam, held together by the "multiple rooms" fiction). The OG asymmetric storefront is RETIRED
(dead on disk). The real catalog is ported into `src/data/inventory.ts`. Stations still carry
their scaffold ids (`street/door/counter/left-bins/right-bins/mixtape-shelf`); the id→wall
rename (e.g. `left-bins` *is* the Mixes wall) is a deferred design thread. The dated session
logs in `docs/sessions/` and `docs/asset-pipeline-spec.md` carry the build history and the
asset recipe.

The audience is **majority mobile, iOS-heavy**. iOS Safari is the constraint that decides
the architecture. Every video/animation decision traces back to the research in
`docs/research/2026-06-video-and-animation-findings.md` — that doc is the standing
reference; this file is the enforced summary.

## Stack

- **Next.js (App Router) + TypeScript** — resolved to Next 16, React 19. No custom server.
  Vercel-targeted (deploy is configured outside this repo; don't set it up here).
- **Tailwind CSS v4** — CSS-first (`@import "tailwindcss"` in `src/app/globals.css`,
  `@tailwindcss/postcss` in `postcss.config.mjs`). No `tailwind.config` — v4 auto-detects.
- **GSAP + ScrollTrigger** — DOM animation. All bonus plugins are free on public npm.
- **Lenis** — smooth scroll. Lenis only; **never** GSAP ScrollSmoother.

**Pinned exactly (do not bump without a deliberate task):**

| Package        | Version  |
| -------------- | -------- |
| `gsap`         | `3.15.0` |
| `@gsap/react`  | `2.1.2`  |
| `lenis`        | `1.3.23` |

Install from public npm with no auth token. Never use `gsap-trial` or
`@studio-freight/lenis` (both deprecated).

## How to run

```bash
npm install      # public npm, no token required
npm run dev      # dev server at http://localhost:3000
npm run build    # production build — must pass clean
npm run start    # serve the production build
```

Key routes:

- `/` — entry screen (two first-class paths: *Enter the store* and *Skip intro → music*).
- `/store` — the click-navigated four-walls hub (zero-scroll; on-screen directional CTAs;
  real footage on every reachable edge — entry, all four walls, and the rotational ring).
- `/music` — the escape hatch: plain, server-rendered inventory. No video dependency.

## Architecture & layout

```
docs/research/2026-06-video-and-animation-findings.md   ← standing reference (the "why")
src/
  app/
    layout.tsx              Root layout; wraps children in <SmoothScrollProvider>.
    globals.css             Tailwind v4 import + base styles.
    page.tsx                Entry screen.
    store/page.tsx          Renders <StoreWalkthrough/>.
    music/page.tsx          Escape hatch — server component, plain DOM, no video.
  components/
    providers/
      SmoothScrollProvider.tsx   Lenis ⇄ GSAP wiring (single rAF loop). THE scroll plumbing.
    stations/
      StationFrame.tsx           One full-viewport scene: transition <video> + DOM layer +
                                 directional exit CTAs. Active scene visible; ±1 neighbours
                                 mounted (decoder window) but hidden + inert.
      StationTransition.tsx      THE play-through engine: ordered AV1→H.264 <video>, play-once-
                                 hold, decoder windowing (active±1), tap-to-play fallback.
      PlaybackUnlock.tsx         Session media-unlock context (first gesture unlocks autoplay).
    store/
      StoreWalkthrough.tsx       Click-nav controller: goToId() sets active; renders only the
                                 active±1 window; locks scroll on /store (Lenis stays global).
  lib/
    gsap.ts                 The ONLY place GSAP plugins are registered (window-guarded).
  data/
    stations.ts             STATIONS = single source of station set + types + exits (nav graph).
    inventory.ts            Releases / playlists / mixtapes / updates / clerk lines — REAL
                            (ported) data + types. Server-renderable; no video/browser deps.
```

**Data flow / source of truth.** `src/data/stations.ts` `STATIONS` is authoritative for the
station set and each station's `exits` (the click-nav graph). Navigation (`goToId`), the
active scene, the decoder window, and which scene renders all derive from it — never
hard-code station order or routes anywhere else. INVARIANT: an exit must never target a scene
whose transition clip doesn't exist (it would walk visitors into a "DO NOT SHIP" test pattern).
Every wall is currently filmed, so this is now a guard for any future unfilmed scene, not an
active constraint. `src/data/inventory.ts` is the data behind `/music` and
(later) the wall content surfaces; it is pure data with no browser or video dependency, so it
stays server-renderable.

**Scroll/animation plumbing (already wired — extend, don't re-invent):**

- `lib/gsap.ts` registers `ScrollTrigger` (and the `useGSAP` hook) exactly once, guarded by
  `typeof window !== "undefined"`. Import GSAP from here, not directly, in client code.
- `SmoothScrollProvider` mounts `<ReactLenis root options={{ autoRaf: false }}>` and drives
  `lenis.raf` from a **single** `gsap.ticker.add(update)` loop (seconds → milliseconds),
  with `lenis.on("scroll", ScrollTrigger.update)` and `gsap.ticker.lagSmoothing(0)`. One rAF
  loop, no double-RAF.
- All animation lives in `"use client"` components using `useGSAP()` with `{ scope }`.

The transition engine is **built** (`StationTransition.tsx`): it mounts the ordered
AV1→H.264 `<video>`, plays it once on becoming active and **holds the final frame**, manages
the active±1 decoder window (clips outside it drop their `<source>`s + `.load()`), and falls
back to tap-to-play. `/store` navigation is **click-only** (`goToId` → set active → swap scene
in place); the old scroll/IntersectionObserver advance and the prev/next nav were removed
(Fork B). The Lenis/GSAP scroll plumbing above still drives `/music` and any DOM scrub
animation — it is **not** what advances the store.

## Conventions

- **TypeScript everywhere**, `strict` on. Model new domain data in `src/data/*` as typed,
  `as const` modules — not inline JSX content.
- **`@/*` path alias** maps to `src/*`.
- **Client vs server:** default to server components. Add `"use client"` only where you use
  hooks / GSAP / Lenis / browser APIs. Keep `/music` and other content/SEO surfaces as
  server components.
- **Animations:** always `useGSAP()` with `{ scope: ref }`; use `contextSafe` for
  event-/timeout-created animations so Strict Mode cleanup reverts them.
- **Placeholders are labeled as placeholders.** Every wall now ships real footage; the
  `_placeholder/` "DO NOT SHIP" set remains only as the encode/regression fixture. Keep the
  discipline: don't quietly promote a stand-in, and don't route an exit into a scene whose
  real clip doesn't exist yet.
- **After loading async content** (video/images/fonts), call `ScrollTrigger.refresh()` so
  trigger positions stay correct.

## Never do this

These are non-negotiable, drawn directly from the research doc. Do not relax them without
an explicit decision recorded in `docs/research/`.

1. **Never bind `video.currentTime` to scroll.** Transitions are **play-through**, triggered
   by a click-to-navigate gesture (`goToId` sets the scene active → `.play()`). Scrubbing a
   video's currentTime is the worst-performing path on mobile Safari — don't do it. (Scrubbing
   DOM transforms with scroll via GSAP/Lenis is fine and expected; only *video* must never be
   scrubbed.)
2. **H.264/MP4 is the mandatory floor; never ship AV1-only.** Use ordered `<source>`
   elements: AV1 (Profile 0, 8-bit) → H.264, each with the **full `codecs` string**. iOS has
   no software AV1 decoder, so AV1-only silently fails on most iPhones.
3. **Never assume autoplay succeeded.** Always `video.play().catch(() => …)` → fall back to
   tap-to-play. Treat **Low Power Mode as undetectable** (no JS API) — design a graceful
   paused first frame. **Audio/music is tap-gated** (it never autoplays with sound). **Drop
   the `<source>`s + `.load()`** on clips outside the active±1 window so paused layers don't
   hold decode pipelines. Set `muted playsInline autoplay` (and mirror `muted` in JS).
   **Transitions play once and HOLD their final frame — NOT `loop`** (a transition is an
   *arrival*; looping reads as "video playing", not "arrived, room still"). Re-arm is
   per-activation: rewind to 0 + `play()` when a scene becomes active again (engine decision,
   commit `9fb0417`).
4. **Lenis only — never also enable GSAP ScrollSmoother.** Both smooth-scroll; running both
   double-lerps. Keep the single-rAF wiring in `SmoothScrollProvider`. `useGSAP()` is used in
   `"use client"` components only.
5. **Keep the escape-hatch DOM path (`/music`) working as a first-class route**, not an
   afterthought. It must stay plain, server-rendered, video-free DOM — it's the
   SEO/accessibility surface. Don't introduce a video/runtime dependency into it.

## Anti-spin

- **The research doc is the source of truth** for every iOS/video/animation rule. When a
  decision touches codecs, autoplay, scrubbing, or scroll, cite the relevant section rather
  than re-deriving or guessing. If reality conflicts with the doc, update the doc in the same
  change — don't silently diverge.
- **Don't expand scope.** The engine, click-nav, the fully-filmed rotational store, and the
  entry sequence now all exist. Don't build the id→wall rename, the counter content surface,
  the DOM sticker/door-CTA layer, clerk interactivity, audio pipeline, backend/DB/auth/CMS, or
  Vercel/deploy config unless the task explicitly asks. Each is its own task. (The wall clips
  and reversed-clip returns are DONE — no longer pending.)
- **Don't thrash on tooling.** Versions are pinned deliberately; `npm run build` must pass
  clean before you commit. If the build breaks, fix the cause — don't paper over it with
  `// @ts-ignore`, `ignoreDuringBuilds`, or loosened types.
- **If you're stuck or sources conflict irreconcilably, stop and report** with what you found
  rather than guessing. If a change would require touching something out of scope (e.g.
  `.claude/settings.json`, deploy config), stop and flag it.

## Standing reference

`docs/research/2026-06-video-and-animation-findings.md` — the verified video & animation
findings (codecs, iOS autoplay, scrub-vs-play-through, GSAP/Next integration) behind every
rule above. Read it before changing anything in those areas.
