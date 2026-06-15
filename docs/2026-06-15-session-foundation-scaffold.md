# Session log — 2026-06-15 — Foundation scaffold

## Context

Continuation of the chunkylabs rebuild (interactive record-store visit). The prior session
(2026-06-12) speced direction and ran Prompt 0 (video/animation research). This session:
verified repo state, ran Prompt 1 (foundation scaffold), reviewed the output, and confirmed
CLAUDE.md.

## Model / orchestration note

Fable 5 is shut down (government order, indefinite). The original kickoff direction (new
repo, Next/React) and the Prompt 0 research both originated in Fable sessions. That direction
was re-evaluated cold on Opus 4.8 and holds on its own merits — Fable's loss forces no
rethink.

The kickoff log's "switch to Fable for hard sessions" guidance is now dead: **Opus 4.8 @
xhigh is both the everyday and the hard-session model.** Prompt 0's research collapsed the
hardest piece — the transition engine — from scroll-scrubbed compositing down to
Opus-tractable play-through, so the capability Fable was budgeted for is largely no longer
required.

## Shipped (commit c8991e7)

- Next.js (App Router) + TypeScript + Tailwind scaffold at repo root; `npm run build` passes
  clean; `/`, `/store`, `/music` prerender static.
- Pinned exactly: `gsap@3.15.0`, `@gsap/react@2.1.2`, `lenis@1.3.23` (public npm).
- Scroll/animation plumbing only (no transitions): `src/lib/gsap.ts` (single guarded plugin
  registration), `SmoothScrollProvider` (Lenis ⇄ GSAP single-rAF wiring), and a deletable
  `ScrollProgressBar` smoke-test.
- Data model: `src/data/stations.ts` (`STATIONS` = single source of order) +
  `src/data/inventory.ts` (typed placeholders).
- Placeholder stations navigable in order via `/store`; IntersectionObserver active-tracking
  (the same gate the real video will use).
- Escape hatch `/music`: server-rendered, video-free plain-DOM inventory, as a first-class
  route.
- CLAUDE.md written and verified: all five non-negotiables hard-coded and traced to the
  research doc. (Adds a carve-out: scrubbing DOM transforms with scroll is fine — only video
  `currentTime` must never be scrubbed.)

## Decisions (reviewed — all sound)

- Manual scaffold instead of `create-next-app` (the latter refuses to run with `.claude/`
  present, which is out of scope to touch).
- Dropped the `gsap.core.globals()` double-registration guard from the research snippet — it
  isn't in gsap 3.15.0's TS types and broke the build. Replaced with ES-module singleton +
  `typeof window` guard + idempotent `registerPlugin` (same guarantee, type-clean, no
  `@ts-ignore`).
- `.claude/` left untracked/uncommitted, consistent with Prompt 0.

## Watch-items (carried forward — NOT blockers)

- **Next 16 / React 19 / Tailwind v4 currency:** `@latest` resolved to Next 16; the research
  doc only verified the GSAP/Lenis trio against Next 14/15 + React 18/19. The pinned packages
  declare `react >=17` and the build is clean, but "builds today" ≠ "GSAP/Lenis/ScrollTrigger
  sound on Next 16 App Router under load." Re-verify in the transition-engine session.
- **`bypassPermissions` is conditional, not permanent:** fine now (greenfield, git is
  rollback); revisit once CC spends real compute (Higgsfield/ComfyUI) or touches anything near
  the live domain at cutover.
- **Asset pipeline needs an explicit encode/QA stage:** gen output isn't "done" until encoded
  right (SVT-AV1 not libaom, H.264 floor, exact codecs strings) and tested on a real older
  iPhone + mid-tier Android. Spec this into the asset track, not discovered at integration.
- **Git "upstream is gone":** the local branch tracks a remote that no longer exists. Harmless
  for building; wants a clean `--set-upstream` before Vercel/domain cutover.

## Open threads

- Repo name / final Vercel project + domain cutover plan.
- Content inventory: which mixes/playlists/releases carry over, mapped to bins/mixtapes.
- Clerk interactivity depth (looping video + triggered ElevenLabs vs. conversational). Parked.
- Agent / autonomous-orchestration layer — explicitly deferred to phase 2.

## Next step

**Prompt 2 — transition engine** (its own session, the genuinely hard one): real play-through
`<video>` in `StationFrame`'s reserved layer, codec fallback chain (AV1 → H.264 ordered
sources), `.play().catch()` → tap-to-play, IntersectionObserver-gated play/pause, null-`src`
decoder management. Re-verify the GSAP/Lenis stack on Next 16 here. On-device iOS testing
(incl. Instagram/TikTok WKWebViews, Low Power Mode) is part of "done."
