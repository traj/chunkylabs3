# CLAUDE.md

Guidance for working in this repo. Read it before touching video, scroll, or animation code.

## What this is

**chunkylabs** — a music showcase site built as an *interactive record store visit*. The
visitor moves through fixed camera stations (street → door push-in → counter/clerk →
left bins → right bins → mixtape shelf) connected by pre-rendered, **play-through** video
transitions, with live DOM layers (text, music embeds, CTAs) composited over the video.

This repo is currently the **foundation scaffold**: the app stands, the station/data model
is in place, placeholder stations are navigable in order, and the escape hatch works.
There is intentionally **no real video, no transition engine, and no real catalog yet** —
those are later tasks.

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
- `/store` — the walk-through (placeholder stations, navigable by scroll or prev/next).
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
      StationFrame.tsx           One station placeholder: empty transition layer + DOM layer.
    store/
      StoreWalkthrough.tsx       Composes STATIONS in order; prev/next; active tracking.
      ScrollProgressBar.tsx      Plumbing smoke-test (ScrollTrigger↔Lenis). Deletable.
  lib/
    gsap.ts                 The ONLY place GSAP plugins are registered (window-guarded).
  data/
    stations.ts             STATIONS = the single source of walk-through order + types.
    inventory.ts            Records / bins / mixtapes / clerk lines — types + PLACEHOLDERS.
```

**Data flow / source of truth.** `src/data/stations.ts` `STATIONS` is authoritative for
order. Navigation, prev/next, the progress indicator, and the rendered sequence all derive
from it — never hard-code station order anywhere else. `src/data/inventory.ts` is the data
behind `/music` and (later) the bins/mixtape stations; it is pure data with no browser or
video dependency, so it stays server-renderable.

**Scroll/animation plumbing (already wired — extend, don't re-invent):**

- `lib/gsap.ts` registers `ScrollTrigger` (and the `useGSAP` hook) exactly once, guarded by
  `typeof window !== "undefined"`. Import GSAP from here, not directly, in client code.
- `SmoothScrollProvider` mounts `<ReactLenis root options={{ autoRaf: false }}>` and drives
  `lenis.raf` from a **single** `gsap.ticker.add(update)` loop (seconds → milliseconds),
  with `lenis.on("scroll", ScrollTrigger.update)` and `gsap.ticker.lagSmoothing(0)`. One rAF
  loop, no double-RAF.
- All animation lives in `"use client"` components using `useGSAP()` with `{ scope }`.

The transition engine, real video playback, and actual transition animations are **not
built yet** — `StationFrame` leaves an empty, labeled transition layer where the
play-through `<video>` will later mount.

## Conventions

- **TypeScript everywhere**, `strict` on. Model new domain data in `src/data/*` as typed,
  `as const` modules — not inline JSX content.
- **`@/*` path alias** maps to `src/*`.
- **Client vs server:** default to server components. Add `"use client"` only where you use
  hooks / GSAP / Lenis / browser APIs. Keep `/music` and other content/SEO surfaces as
  server components.
- **Animations:** always `useGSAP()` with `{ scope: ref }`; use `contextSafe` for
  event-/timeout-created animations so Strict Mode cleanup reverts them.
- **Placeholders are labeled as placeholders.** Don't quietly promote a stand-in to real
  content; real catalog and real video are separate, deliberate tasks.
- **After loading async content** (video/images/fonts), call `ScrollTrigger.refresh()` so
  trigger positions stay correct.

## Never do this

These are non-negotiable, drawn directly from the research doc. Do not relax them without
an explicit decision recorded in `docs/research/`.

1. **Never bind `video.currentTime` to scroll.** Transitions are **play-through**, triggered
   by a tap or scroll-into-view (IntersectionObserver-gated `.play()`). Scrubbing a video's
   currentTime is the worst-performing path on mobile Safari — don't do it. (Scrubbing DOM
   transforms with scroll via GSAP/Lenis is fine and expected; only *video* must never be
   scrubbed.)
2. **H.264/MP4 is the mandatory floor; never ship AV1-only.** Use ordered `<source>`
   elements: AV1 (Profile 0, 8-bit) → H.264, each with the **full `codecs` string**. iOS has
   no software AV1 decoder, so AV1-only silently fails on most iPhones.
3. **Never assume autoplay succeeded.** Always `video.play().catch(() => …)` → fall back to
   tap-to-play. Treat **Low Power Mode as undetectable** (no JS API) — design a graceful
   paused first frame. **Audio/music is tap-gated** (it never autoplays with sound). **Null
   the `src`** on finished/offscreen clips so paused layers don't hold decode pipelines.
   Always set `muted playsInline autoplay loop` (and mirror `muted` in JS).
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
- **Don't expand scope.** This is a scaffold. Don't build the transition engine, real video,
  real catalog, clerk interactivity, audio pipeline, backend/DB/auth/CMS, or Vercel/deploy
  config unless the task explicitly asks. Each is its own task.
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
