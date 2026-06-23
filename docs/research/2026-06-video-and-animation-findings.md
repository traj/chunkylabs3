# Video & Animation Findings — chunkylabs rebuild

**Date:** 2026-06-12
**Author:** research pass (read-only; no code/scaffolding produced)
**Purpose:** Verify the video and animation fundamentals the new chunkylabs design depends on *before* scaffolding. The new site is an "interactive record store visit": fixed camera stations (street → door push-in → counter → record bins → mixtape shelf) connected by pre-rendered video transitions, with live DOM layers (text, music embeds, CTAs) composited over the video.

**Stack (decided elsewhere):** Next.js (App Router) + Tailwind + GSAP + Lenis, on Vercel.
**Audience:** majority mobile, iOS-heavy. iOS Safari is treated as the constraint that decides the architecture.

**Scope note:** This document contains *recommendations only*. Final calls happen outside this task. Where primary sources are thin, stale, or in conflict, that is flagged inline rather than smoothed over. A few load-bearing facts were independently re-verified by the author; those are marked **[verified 2026-06-12]**.

> **BUILD DELTAS (added 2026-06-23 — findings below are unchanged; these are the design
> calls the build made *on top of* this research, where they diverge from the literal
> recommendation):**
> - **No `loop`.** This doc recommends `autoplay loop muted playsinline` as the iOS-stable
>   pattern (Q2). The build ships the iOS-critical attributes (`muted playsInline autoplay`
>   + JS-mirrored `muted`) but **drops `loop`**: transitions play once and **hold their final
>   frame** (a transition is an arrival, not an ambient loop). Engine decision, commit
>   `9fb0417`; see CLAUDE.md "Never do this" §3.
> - **Click-to-navigate, not scroll-into-view.** The Q2/Q3 recommendation triggers
>   play-through on "tap or scroll-into-view (IntersectionObserver-gated)". `/store` is now a
>   **zero-scroll, click-navigated four-walls hub** — playback is gated by a click that sets a
>   scene active, and the IntersectionObserver advance was removed (Fork B, commit `84e9914`).
>   The "never bind `currentTime` to scroll" / play-through-over-scrub findings are unchanged
>   and still load-bearing.
> - **Decoder management** is done by mounting only an **active±1 window** (out-of-window
>   clips drop their `<source>`s + `.load()`), realising this doc's "keep concurrent videos
>   low / null src on finished clips" guidance (Q2.5).

---

## How the four questions hang together (read this first)

The four topics are not independent — iOS Safari (Q2) is the gravity well the other three orbit:

- **Q2 (iOS autoplay)** sets the hard rules: muted + `playsinline`, no guaranteed autoplay, undetectable Low Power Mode, decode-pipeline limits, and music-with-sound requires a tap.
- **Q3 (scrub vs play-through)** is decided largely *by* Q2: scrubbing `currentTime` is the fragile path on mobile Safari, so the design leans play-through — which also makes Q2's autoplay rules easier to satisfy (a tap unlocks playback).
- **Q1 (codecs)** must serve the same iOS reality: no software AV1 decoder on iOS means H.264/MP4 is the non-negotiable floor.
- **Q4 (GSAP/Next.js)** is the DOM-layer machinery sitting *on top of* the video — and the recommendation is explicitly to let GSAP/Lenis own the DOM compositing and station pinning, **not** to bind `video.currentTime` to scroll.

Net architectural lean that falls out of all four: **fixed stations with play-through video transitions triggered by user action, H.264/MP4 as the universal floor (AV1 as a progressive upgrade), GSAP/Lenis driving DOM layers only, and a tap-to-play fallback everywhere because iOS autoplay can never be assumed.**

---

## Q1 — Web video delivery in 2026: codec strategy for short (2–6s) transition clips

### 1.1 Codec support — browsers AND devices (the device half is where it bites)

A recurring theme: **caniuse "global %" overstates real playback**, because it counts Safari/Chrome as "supported" while those engines gate decode on the device's *hardware*. The gap between "browser supports the codec" and "this phone can actually decode it" is the single most important caveat in this section.

**AV1**
- caniuse reports ~93% global (≈79% full + ≈14% partial). Chrome 70+, Firefox 67+, Edge 121+, Opera, Samsung Internet "full"; **Safari 17+ is "partial"** and that word is doing heavy lifting. — https://caniuse.com/av1
- **iOS reality is hardware-only.** Safari added AV1 to MediaCapabilities in Safari 17 / iOS 17 (Sept 2023) *"for devices with hardware support"* — Apple ships **no system-wide software AV1 decoder**. — https://webkit.org/blog/14445/webkit-features-in-safari-17-0/ , https://bitmovin.com/blog/apple-av1-support/
  - iPhones that decode AV1: **iPhone 15 Pro / 15 Pro Max (A17 Pro) only**, then **all iPhone 16 (A18)**. Standard iPhone 15 / 15 Plus and everything older (14, SE, …) **cannot decode AV1 at all** in Safari. Macs: M3+. iPad: M4 iPad Pro+. — https://bitmovin.com/blog/apple-av1-support/ , https://scientiamobile.com/what-the-iphone-15-means-for-av1-video/
- **Android has a software fallback (unlike iOS):** Chrome on Android plays AV1 via the **dav1d** software decoder, and Android 12+ got a system-wide dav1d via a 2024 Play system update. **But** software decode warms the device and drains battery — YouTube reportedly *reverted* dav1d on hardware-less phones for this reason. Relevant for autoplay loops. — https://9to5google.com/2024/04/19/android-av1-software-decoder/
- **Real hardware-decode penetration ≪ caniuse %:** WURFL/ScientiaMobile measured **~9.76% of smartphones with AV1 hardware decode in Q2 2024**. It has grown since (iPhone 16 line, more Android flagships), but the truth sits well below "93%." — https://scientiamobile.com/av1-codec-hardware-decode-adoption/

**HEVC / H.265**
- caniuse ~91.6% global (≈17% full + ≈75% partial). — https://caniuse.com/hevc
- **Safari (macOS/iOS): first-class and oldest** — HEVC since iOS 11 / Safari 11 (2017), broadly hardware-accelerated across Apple's lineup. — https://caniuse.com/hevc
- **Chrome/Edge: supported since Chrome 107 (2022) but HARDWARE-DECODE-ONLY** — no software HEVC decoder; plays only if the OS/GPU exposes one. On Windows, Edge also needs the paid Microsoft HEVC Video Extension (~$1); Chrome uses D3D11VA directly. — https://github.com/StaZhu/enable-chromium-hevc-hardware-decoding , https://streaminglearningcenter.com/codecs/google-chrome-plays-hevc-what-does-it-mean.html
- **Firefox:** disabled by default through v136; partial, OS-dependent support from v137 (2025). Treat as unreliable. — https://caniuse.com/hevc
- **Not royalty-free** (patent-pool encumbered) — the reason Chrome resisted it for years. — https://caniuse.com/hevc

**H.264 / AVC**
- The universal baseline: hardware-decoded on essentially every browser/device of the last ~15 years, every iPhone, every Android. MDN's `<video>` guidance treats MP4/H.264 as the guaranteed-compatibility tier. — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
- Cost: ~30–50% larger files than AV1 at equal quality (see 1.2).

> **Conflict flagged:** An older Streaming Learning Center piece ("HEVC passes AV1 on caniuse") cites HEVC 83.39% vs AV1 73.1% and claims "Apple has not adopted HEVC." That Apple claim is **wrong** (Safari has supported HEVC since 2017) and its percentages are superseded by current caniuse figures. Disregard its numbers; its only durable point is that HEVC's *shipped-hardware* base matured earlier than AV1's. — https://streaminglearningcenter.com/codecs/hevc-passes-av1-on-caniuse.html

### 1.2 File-size tradeoffs at SHORT clip lengths (2–6s) — evidence is thin here

Headline efficiency (for *normal-length* content): AV1 ≈ 30–50% smaller than H.264, ≈ ~30% smaller than HEVC (growing to ~40% at higher res/bitrate). — https://liveapi.com/blog/av1-vs-h264/ , https://www.gumlet.com/learn/av1-vs-hevc/ , https://developer.nvidia.com/blog/improving-video-quality-and-performance-with-av1-and-nvidia-ada-lovelace-architecture/

**The short-clip caveat — flagged as thin evidence:** No source found benchmarks 2–6s clips specifically; the codec-comparison literature uses long test sequences. The mechanistic argument: modern-codec gains come largely from *inter-frame* prediction across long GOPs. A 2–6s clip is dominated by its opening keyframe (an intra-coded still) — the regime where AV1/HEVC's edge over H.264 is *smallest*. Force more keyframes (for clean looping/seeking) and the per-clip fixed cost dominates further. Expect AV1's real saving on a 3s 1080p clip to land nearer **~20–30%** than the 50% headline, and **30% of a few-hundred-KB file is small absolute savings** — which can be outweighed by AV1 *software*-decode battery cost on non-flagship Android during autoplay loops. **Verify empirically with your own encodes.** (GOP/random-access reasoning: https://www.cambridge.org/core/journals/apsipa-transactions-on-signal-and-information-processing/article/compression-efficiency-analysis-of-av1-vvc-and-hevc-for-random-access-applications/D2345DDC3750055AB0AA3D24FCF743BE )

**Encode cost (your pipeline):** AV1 (libaom) is ~20–100× slower than x264, ~3× slower than HEVC. Acceptable since clips are pre-rendered once — but use **SVT-AV1**, not libaom, for sane build times. — https://liveapi.com/blog/av1-vs-h264/ , https://www.gumlet.com/learn/av1-vs-hevc/

### 1.3 Fallback chain, container, and source selection

**Fallback chain (most-efficient → most-compatible):**
```
1. AV1   in MP4   →  iPhone 15 Pro/16, M3+ Macs, Android flagships, modern desktop Chrome/FF/Edge
2. HEVC  in MP4   →  (optional middle tier) older/standard iPhones & Apple devices w/o AV1; Chrome/Edge w/ HEVC HW
3. H.264 in MP4   →  guaranteed floor; plays everywhere
```
Because iOS has **no software AV1 decoder**, AV1-only would silently fail on the large iPhone 14/13/SE/standard-15 base — **H.264 fallback is mandatory.** The HEVC middle tier is *optional and arguably skippable here*: its main beneficiary (non-AV1 iPhones) plays H.264 fine, and HEVC carries royalty/complexity baggage. (General two/three-tier guidance: https://evilmartians.com/chronicles/better-web-video-with-av1-codec , https://konvrt.dev/blog/av1-vs-hevc-vs-vp9-browser-video-2026 )

**Container — use MP4 for all three tiers.** Safari has supported WebM (VP8/VP9) since 14.1 / iOS 15 (so "Safari can't play WebM" is outdated), **but** Safari delivers AV1 and HEVC via the MP4 (`av01` / `hvc1`) path, not WebM. One container, three codecs avoids the WebM/MP4 fork entirely. Use `hvc1` (not `hev1`) for Apple. For 2–6s assets, serve **plain progressive MP4 from Vercel's CDN — no HLS/DASH/fMP4 needed.** — https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/ , https://evilmartians.com/chronicles/better-web-video-with-av1-codec

**Source selection — ordered `<source>` with full `codecs`, NOT UA sniffing.** The browser tries `<source>` elements in document order and plays the first it can decode, using the `type` (incl. `codecs`) to decide *without downloading*. Order AV1 first, H.264 last. The **full `codecs` string is mandatory** — a bare `type="video/mp4"` doesn't say AV1-vs-H.264, so a non-AV1 iPhone could match the AV1 file and fail; the discriminating codec string is exactly what makes it skip cleanly to H.264. — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video , https://jakearchibald.com/2022/html-codecs-parameter-for-av1/

```html
<video autoplay loop muted playsinline preload="auto" poster="…">
  <source src="t.av1.mp4"  type='video/mp4; codecs="av01.0.05M.08"'>
  <source src="t.h264.mp4" type='video/mp4; codecs="avc1.4D401E, mp4a.40.2"'>
</video>
```
- Encode AV1 as **Profile 0, 8-bit (`av01.0.x`) only** — high profile (yuv444) hits an Android Chrome HW-decode bug. — https://jakearchibald.com/2022/html-codecs-parameter-for-av1/
- UA sniffing is discouraged (can't read *hardware* decode capability from a UA string). If you need JS-driven selection, use **`navigator.mediaCapabilities.decodingInfo()`** (Safari 17 wired AV1 into it; reports `supported`/`smooth`/`powerEfficient`). No reliable `Accept:`-header video negotiation exists — skip it. — https://webkit.org/blog/14445/webkit-features-in-safari-17-0/

### Recommendation for chunkylabs
- **Ship everything in MP4. Ordered `<source>`: AV1 (`av01.0.05M.08`) → H.264 (`avc1…`), each with the full `codecs` string.** Platform-native, selects correctly today, and the precise codec strings are what make non-AV1 iPhones fall back cleanly.
- **H.264/MP4 is the mandatory floor — never ship AV1-only.** iOS has no software AV1 decoder; iPhone 14/13/SE/standard-15 and M1/M2 Macs would otherwise get nothing.
- **Skip HEVC** for v1. Its only beneficiary (non-AV1 iPhones) plays H.264 fine; add an HEVC lane later only if bandwidth telemetry justifies the extra encode/storage.
- **Don't over-invest in AV1's "50% smaller" promise at 2–6s** — the keyframe-dominated bitstream narrows the gain and the absolute KB saved is small, while AV1 software decode costs battery on non-flagship Android loops. Encode AV1 Profile 0 / 8-bit via SVT-AV1.
- **Serve progressive MP4 from Vercel's CDN** (no HLS/DASH). Always set `autoplay loop muted playsinline` (see Q2).
- **Verify with your own encodes before committing the AV1 lane** — no current source benchmarks 2–6s clips; test real KB + decode smoothness on a mid-tier Android and an older iPhone.

---

## Q2 — iOS Safari autoplay & inline playback rules (current state)

The base rule (muted + `playsinline` + `autoplay`) is documented by **primary WebKit/MDN sources and has not materially changed since iOS 10**. The *exceptions* (Low Power Mode, per-site preferences, in-app webviews, decode limits) are thinly or not documented by Apple and rest on developer-forum evidence — flagged individually.

### 2.1 Exact conditions for muted inline autoplay — **[verified 2026-06-12 against the WebKit primary source]**

From WebKit, *"New `<video>` Policies for iOS"* (https://webkit.org/blog/6784/new-video-policies-for-ios/), confirmed verbatim by the author:
> "`<video>` elements will be allowed to `play()` without a user gesture if their source media contains no audio tracks, or if their `muted` property is set to `true`."
> "If a `<video>` element gains an audio track or becomes un-muted without a user gesture, playback will pause."

MDN states the equivalent. — https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay

**Required attributes & interplay:**
- `muted` — satisfies the "no audible audio" gate. **Also set it in JS** (`video.muted = true`) before `play()`; the attribute alone has been reported flaky in React/SPA hydration. — https://medium.com/@BoltAssaults/autoplay-muted-html5-video-safari-ios-10-in-react-673ae50ba1f5
- `playsinline` — controls inline-vs-fullscreen only (see 2.2); does **not** itself enable autoplay.
- `autoplay` — with `muted` present, works without a gesture.
- `loop` — commonly needed for background/transition loops.

So **muted + playsinline (+ autoplay) still works gesture-free today**, subject to the gotchas below. iOS-version differences live in the *exceptions*, not the base rule. Critically: **you cannot guarantee autoplay** — always detect whether playback actually started.

### 2.2 What `playsinline` does, and what breaks it

From the same WebKit primary source — **[verified 2026-06-12]**:
> "On iPhone, `<video playsinline>` elements will now be allowed to play inline, and will not automatically enter fullscreen mode when playback begins."

So a **missing `playsinline` → fullscreen takeover on iPhone**. In React/JSX the prop is camelCase **`playsInline`** — lowercase gets stripped and the bug reappears. — https://css-tricks.com/what-does-playsinline-mean-in-web-video/

**WKWebView / social in-app browsers (critical — a music audience arrives from Instagram/TikTok/Facebook):** In-app browsers are **WKWebView, not Safari**, and the *host app* — not your page — controls the switches:
- `allowsInlineMediaPlayback` must be `true` or video forces native fullscreen.
- `mediaTypesRequiringUserActionForPlayback` must exclude video or autoplay is blocked.
- — https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/allowsinlinemediaplayback , https://www.thomasvisser.me/2018/06/26/wkwebview-media/ , https://developer.apple.com/forums/thread/739686

**Consequence:** even a perfectly-attributed clip can play fullscreen or refuse to autoplay inside a social webview, and **you cannot override it from the page.** Major social webviews generally configure these correctly today, but it's app-and-version dependent and *not guaranteed*. Sourcing on specific "Instagram/Facebook playsinline bugs" is **thin** — must be tested on-device per app.

**PWA / standalone:** runs on WKWebView but the PWA shell enables inline playback, so it generally behaves like Safari. **No primary Apple doc isolates this** — verify on-device.

### 2.3 Known gotchas

- **Low Power Mode — the single biggest risk, and undetectable.** With LPM on, muted video **does not autoplay**; iOS shows a play-button overlay and waits for a tap (reported on iPhone, and on macOS Safari on battery). **No JS API exposes LPM.** Consistent 2023–2026 community evidence incl. Apple's own forum, but **no official Apple documentation** of the rule. Workaround: tap-to-play fallback, or an animated image (reported to autoplay even in LPM). — https://developer.apple.com/forums/thread/709821 , https://wojtek.im/journal/safari-autoplay-not-working-in-low-power-mode , https://lesniakrafal.com/en/article/how-to-enable-autoplay-videos-in-low-power-mode-on-ios-and-macos/
- **Per-site Auto-Play preference (Settings → Safari):** Allow All / Stop Media with Sound (default) / Never. Apple says the default only gates *audible* media, so muted video *should* autoplay — **but conflicting evidence:** a 2025 secondary source claims muted needs "Allow All." No primary WebKit statement resolves the muted case. Net: muted *should* autoplay under default, **not airtight — rely on the fallback.** — https://support.apple.com/guide/safari/stop-autoplay-videos-ibrw29c6ecf8/mac , https://swarmify.com/blog/how-to-make-an-autoplaying-background-video/
- **Media-engagement heuristic (for your music embeds with sound):** WebKit blocks audible autoplay by default, gated by user activation / sticky activation. **Music embeds will NOT autoplay — they require a genuine tap.** On iOS the engagement heuristic is effectively weak for audible media; assume a tap is always needed for sound. — https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/ , https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- **Viewport throttling — attribute vs JS split [verified 2026-06-12]:** *"`<video autoplay>` elements will pause if they become non-visible, such as by being scrolled out of the viewport"* — **but** *"`<video>` elements will be allowed to `play()` when not visible on-screen or when out of the viewport."* So the `autoplay` *attribute* auto-pauses offscreen; a JS `.play()` is allowed to keep running. For scroll-driven transitions, drive playback with IntersectionObserver-gated `.play()/.pause()` rather than relying on the attribute. — https://webkit.org/blog/6784/new-video-policies-for-ios/
- **Low Data Mode:** can suppress preload/autoplay; no JS detection; evidence thin/secondary — same tap-to-play fallback covers it. — https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025
- **Reduce Motion:** **no evidence** it gates `<video>` autoplay. It's a `prefers-reduced-motion` CSS signal you should honor *yourself* (gate transition clips behind it); the OS does not enforce it on video.

### 2.4 Programmatic `play()`

- `play()` returns a **Promise** that **rejects** when blocked — most importantly `NotAllowedError`. WebKit explicitly recommends inspecting it. — https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay , https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
```js
const p = video.play();
if (p !== undefined) {
  p.then(() => {/* started */})
   .catch((err) => {
     if (err.name === "NotAllowedError") showTapToPlay(video); // LPM / blocked
   });
}
```
- The `autoplay` *attribute* gives no failure callback; **only `.play()` surfaces the rejection** — so it's the path that lets you detect failure and swap to poster/tap-to-play.
- **`navigator.getAutoplayPolicy()` is NOT supported in Safari/iOS** (all versions through 26.x; only Firefox supports it). Do **not** rely on it — use the `.play()` promise + `catch` instead. — https://caniuse.com/mdn-api_navigator_getautoplaypolicy , https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getAutoplayPolicy

### 2.5 Multiple simultaneous videos & decode limits

- **Multiple muted videos can autoplay simultaneously** on iOS since iOS 10.3.1 (WebKit bug 162366, fixed). — https://bugs.webkit.org/show_bug.cgi?id=162366
- The concurrency cap is **hardware-specific, not a documented number** (WebKit engineer: "Hardware specific"). Community numbers range ~4 (older hardware) up to ~16. **No official Apple figure — evidence thin/conflicting; budget conservatively (~3–4 on older iPhones).** — https://developer.apple.com/forums/thread/133475 , https://developer.apple.com/forums/thread/68511
- **A paused video still holds a decode pipeline.** To free hardware decoders you must **clear `src`**, not merely pause. Mount/unmount clips and null the `src` of finished layers. — https://bugs.webkit.org/show_bug.cgi?id=162366

### Recommendation for chunkylabs
- **Ship the full set on every transition clip *and* mirror it in JS:** `muted playsInline autoplay loop` + `preload="auto"`, and `video.muted = true` before `play()`. This is the documented, stable iOS path.
- **Never assume autoplay succeeded** — always run `.play()` + `.catch(NotAllowedError → tap-to-play)`. This one fallback covers Low Power Mode, Low Data Mode, and the per-site-preference edge cases at once. `getAutoplayPolicy()` is unavailable on iOS, so the promise is your only signal.
- **Treat Low Power Mode as an unavoidable, undetectable blocker.** Make a paused first frame look intentional; consider an animated-image fallback for the single most critical hero transition (autoplays even in LPM).
- **Music embeds require a real tap.** Gate audible playback behind an explicit "enter the store"/play control, and reuse that first gesture to unlock any audio you control for the session.
- **Manage decoder pressure:** keep concurrently-playing `<video>`s low (budget ~3–4 worst case), drive offscreen clips with IntersectionObserver `.play()/.pause()`, and **null `src` on finished clips** so paused layers don't hold pipelines.
- **Test inside the Instagram, Facebook/Messenger, and TikTok in-app browsers, not just Safari** — they're WKWebView and you can't override their config; the tap-to-play fallback is the safety net, and an "Open in Safari" affordance is worth offering.

---

## Q3 — Scroll-scrubbed video on mobile: viable, or play-through?

**Bottom line: scrubbing `video.currentTime` via scroll is technically possible but the *worst-performing* path on mobile Safari specifically. The animation library (GSAP/Lenis) is not the bottleneck — video decode-on-seek is.** For discrete station→station *transitions*, play-through is clearly more robust.

### 3.1 Failure modes of scroll-scrubbing on 2024–2026 mobile

- **No frame updates *during* active scroll on mobile** — frames resolve only once scroll settles, so it reads as frozen-then-jump. *Caveat: this widely-repeated claim surfaced in search of a Medium article but did not appear verbatim on direct fetch; it's corroborated in spirit by the sources below but the exact phrasing is not firmly sourced.* — https://medium.com/@chrislhow/scroll-to-scrub-videos-4664c29b4404
- **Decode-on-seek jank tied to keyframe density** — setting `currentTime` forces a seek to the nearest keyframe + decode-forward; sparse keyframes → stutter. This is the dominant jank cause, not the JS. — https://muffinman.io/blog/scrubbing-videos-using-javascript/ , https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
- **`<video>` can't natively drive `requestAnimationFrame`**, so naive `currentTime` scrubbing fights the render loop; canvas approaches exist specifically to regain rAF alignment. — https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
- **iOS priming requirement** — the element must be `muted` + `playsInline`, and commonly must be "primed" (set `autoplay`, wait for `loadeddata`, `pause()`, remove `autoplay`) before it will seek/display. Skip this and the ScrollTrigger animation looks broken on iPhone. — https://gsap.com/community/forums/topic/36208-scrolltrigger-video-animation-doesnt-work-on-ios/
- **Low Power Mode breaks it outright, no workaround** — the ScrollyVideo library explicitly documents "on iOS, ScrollyVideo will not work if battery saver mode is on." — https://github.com/dkaoster/scrolly-video , https://developer.apple.com/forums/thread/709821
- **Safari paused-seek quirks** — `currentTime` can lag a position behind on a paused video; seeking to a value with a single decimal digit has been used to fix odd iOS seeking. — https://github.com/videojs/video.js/issues/3672 , https://github.com/videojs/video.js/issues/1557

### 3.2 Keyframe interval (GOP) vs short clips — quantified

Scrub smoothness ∝ keyframe density, and density inflates size. From a same-source test (muffinman.io):
- Keyframe every **5 frames** → smooth; every **100** → choppy.
- ~**5× larger** file for dense keyframes: MP4 `keyint=100` = **146 KB** vs `keyint=5` = **845 KB**; WebM `g=100` = **195 KB** vs `g=5` = **1,038 KB**.
- ffmpeg controls: H.264 `-x264-params keyint=10:scenecut=0`; VP9 `-g 10`.
- — https://muffinman.io/blog/scrubbing-videos-using-javascript/

For guaranteed-smooth scrub, libraries recommend **keyframe = 1 (every frame an I-frame)**, which bloats size / drops quality further. — https://github.com/dkaoster/scrolly-video , https://gsap.com/community/forums/topic/38762-can-gsap-scrolltrigger-scrub-a-video-on-scroll/

**Trade vs 2–6s clips:** at ~30fps a clip is ~60–180 frames, so even a densely-keyframed clip stays at hundreds of KB to low single-digit MB — **size is affordable. The problem is that dense keyframes still don't fix iOS mid-scroll rendering or Low Power Mode.** You pay the size penalty and still get jank on the target platform. (For scale: CSS-Tricks measured a 3s/30fps video ≈1.92 MB still stuttering on mobile, vs a 90-image sequence ≈56 MB that was smooth.) — https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/

### 3.3 Alternatives and current standing

- **(a) Image sequence → `<canvas>` (the Apple technique):** rAF-aligned, hardware-accelerated, deterministic, **no codec seek-jank, no Low-Power-Mode autoplay restriction** (it's images). Best *visual smoothness* for true scroll-scrub. Cost: large total payload + needs preload and a static-frame fallback on slow connections — but tractable for short clips (~60–180 frames). — https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
- **(b) Play-through on user action:** `video.play()` once on enter/tap at native rate — the browser's *happy path*: sequential, hardware-accelerated, smooth on older devices, normal (small) encodes. Cost: no bidirectional scrub (`playbackRate` can't go negative). — https://github.com/dkaoster/scrolly-video , https://benfrain.com/automatically-play-and-pause-video-as-it-enters-and-leaves-the-viewport-screen/
- **(c) `requestVideoFrameCallback`:** broad support incl. **iOS Safari 15.4+ (~93% global)**; good for *syncing* canvas/state to displayed frames — **but web.dev warns it does NOT make `currentTime` seeking frame-accurate.** Pair it with play-through, not as a scrub fix. — https://caniuse.com/mdn-api_htmlvideoelement_requestvideoframecallback , https://web.dev/articles/requestvideoframecallback-rvfc
- **(d) WebCodecs → canvas:** most performant but **Chrome-only** in practice; not a mobile-Safari solution today. — https://github.com/dkaoster/scrolly-video

### 3.4 Scrub vs play-through, and GSAP's own guidance

Play-through is clearly more robust on mobile: sequential decode beats repeated seeks, no keyframe=1 requirement, and a **user tap reliably satisfies iOS autoplay/gesture rules and sidesteps Low Power Mode** (a gesture-initiated play is permitted where passive autoplay is not). For *transitions* — discrete A→B moves — you don't need bidirectional scrubbing; a clean one-shot is exactly what play-through does best. — https://muffinman.io/blog/scrubbing-videos-using-javascript/ , https://benfrain.com/automatically-play-and-pause-video-as-it-enters-and-leaves-the-viewport-screen/

**GSAP staff explicitly steer people away from hand-rolled video scrub** (the hard part is codec/encoding, not ScrollTrigger) and point to libraries like ScrollyVideo; they confirm the iOS "doesn't work" reports are iOS video constraints, not GSAP. It's a recurring, known pain point (multiple "ScrollTrigger video on iOS" threads; reported choppy even in Firefox). — https://gsap.com/community/forums/topic/38762-can-gsap-scrolltrigger-scrub-a-video-on-scroll/ , https://gsap.com/community/forums/topic/36208-scrolltrigger-video-animation-doesnt-work-on-ios/

**Conflict flagged:** sources disagree on which internal method ScrollyVideo uses for mobile Safari (one says it forces WebCodecs/canvas because seeking is slow; another says mobile Safari does better with `currentTime` seeking). The consistent takeaways across both: keyframe=1 for the seek method, and **LPM breaks it with no workaround.** Treat method-selection as uncertain. — https://github.com/dkaoster/scrolly-video , https://www.diplateevo.com/scrollyvideo/

### Recommendation for chunkylabs
- **Default to PLAY-THROUGH, not scrub, for station→station transitions.** They're discrete A→B moves, not timelines needing bidirectional scrub — and play-through is the hardware-accelerated happy path that survives older iPhones and Low Power Mode (when tap-initiated).
- **Trigger each transition with a user tap (or a debounced scroll-into-view), then `play()` once.** A gesture is the most reliable way to satisfy iOS rules and dodge LPM blocking; pair with `muted` + `playsInline` + IntersectionObserver.
- **Keep GSAP/Lenis for DOM composition + station pinning/parallax — do NOT bind `video.currentTime` to scroll on mobile.** GSAP staff themselves discourage it; the bottleneck (decode-on-seek) is something ScrollTrigger cannot fix.
- **If true scroll-velocity-linked scrubbing is genuinely required somewhere, use an image-sequence → canvas, not video seeking** — the only approach that's smooth and LPM-proof on iOS. Short clips keep the sequence payload manageable with preload + static-frame fallback.
- **Hybrid is the safe production stance:** play-through baseline on all devices; optional canvas image-sequence scrub only where scroll-linked motion really adds value; always ship a poster/first-frame fallback and *detect playback failure* → "tap to play."
- **Encoding:** play-through needs only normal encodes (small, high quality). Reserve dense keyframes / keyframe=1 for any seek-scrub path — and note that even then iOS mid-scroll rendering isn't fixed, which is itself a reason to prefer canvas sequences over video-seek scrub.

---

## Q4 — GSAP + Next.js App Router integration (2025–2026)

All package versions below were **[verified 2026-06-12]** against the live npm registry by the author.

### 4.1 GSAP is now 100% free, all plugins on public npm

Webflow (acquired GreenSock, fall 2024) made the entire GSAP toolset free — including the previously paid Club plugins (SplitText, ScrollSmoother, MorphSVG, DrawSVG, Inertia/Draggable throw, etc.) — and expanded the standard license to cover commercial use at no cost.
- Announcement April 30, 2025. — https://webflow.com/blog/gsap-becomes-free , https://gsap.com/resources/Webflow/
- **Took effect in gsap 3.13.0** (public npm, 2025-04-30); install is plain **`npm install gsap`** — no private registry, no auth token. — https://www.npmjs.com/package/gsap
- **`gsap-trial` is officially deprecated** — registry message **[verified]**: *"This package has been deprecated in favor of the standard 'gsap' package … which now includes all bonus plugins."* Do not use it; ignore "nulled-plugins" GitHub repos. — https://www.npmjs.com/package/gsap-trial
- Latest gsap **[verified]: 3.15.0**. (The npm `next` dist-tag points at a stale `3.0.0-beta` — ignore it; use `latest`.)

### 4.2 React 18/19 Strict Mode double-invocation → use `useGSAP()`

**Problem:** Strict Mode (default in Next.js App Router dev) mounts → unmounts → remounts, running effects twice → double-registered tweens/ScrollTriggers, and `.from()` tweens stuck at start values. — https://react.dev/reference/react/StrictMode , https://gsap.com/resources/React/

**Fix — `useGSAP()` from `@gsap/react`:** a drop-in `useLayoutEffect`/`useEffect` replacement that wraps your code in `gsap.context()` and **auto-reverts everything** (tweens, timelines, ScrollTriggers, Draggables, SplitText) on cleanup/unmount, so animations don't double-play under Strict Mode. It uses an isomorphic layout effect, which also suppresses the SSR `useLayoutEffect` warning. — https://gsap.com/resources/React/

```jsx
"use client";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

function Box() {
  const container = useRef(null);
  useGSAP(() => {
    gsap.to(".box", { x: 360 });           // selector scoped to `container`
  }, { scope: container });                 // deps default to []
  return <div ref={container}><div className="box" /></div>;
}
```
For animations created *after* the hook (event handlers, timeouts), wrap with **`contextSafe`** so they're tracked/cleaned up:
```jsx
const { contextSafe } = useGSAP({ scope: container });
const onClick = contextSafe(() => gsap.to(".box", { rotation: 180 }));
```
`useGSAP()` is essentially `useIsomorphicLayoutEffect` + `gsap.context()` + `ctx.revert()`. The **manual equivalent** works but emits the SSR warning unless you build your own isomorphic hook, lacks `contextSafe`, and is more boilerplate — docs recommend `useGSAP()`.
- **`@gsap/react` [verified]: 2.1.2.** Peer deps: `gsap ^3.12.5`, **`react >=17`** — i.e. **not pinned away from React 19**; no React-19-specific incompatibility documented, and the auto-revert is exactly what both React 18 and 19 Strict Mode need. — https://www.npmjs.com/package/@gsap/react

### 4.3 ScrollTrigger in Client Components / SSR pitfalls

- **`"use client"` is required** for any component using `useGSAP`, ScrollTrigger, or touching `window` — it won't run on the server. — https://gsap.com/resources/React/
- **Register plugins once, centrally,** guarded against SSR/double-registration:
  ```js
  if (typeof window !== "undefined" && !gsap.core.globals()["ScrollTrigger"]) {
    gsap.registerPlugin(ScrollTrigger);
  }
  ```
- **`window is not defined`:** register inside a guarded client module or the `useGSAP` callback so nothing touches `window` during SSR. There's a known Next.js render error when ScrollTrigger runs before the DOM is ready. — https://github.com/greensock/GSAP/issues/603
- **`useLayoutEffect` SSR warning:** avoided automatically by `useGSAP` (isomorphic). Manual path requires your own `useIsomorphicLayoutEffect`.
- **Refs / measurements:** `useGSAP` runs in a layout effect after render, so refs are populated; call **`ScrollTrigger.refresh()` after async content loads (images, fonts, video)** so trigger positions are correct — directly relevant to your video-transition layers.

### 4.4 Lenis + ScrollTrigger synchronization

**Package naming (sources initially conflicted — resolved & [verified]):** the current package is **`lenis`**; **`@studio-freight/lenis` is renamed/deprecated** (registry message: *"renamed to 'lenis'…"*; frozen at **1.0.42**). Latest **`lenis` [verified]: 1.3.23**. The React wrapper is a **subpath of the same package, `lenis/react`** (not a separate install). — https://github.com/darkroomengineering/lenis , https://www.npmjs.com/package/lenis

**Vanilla wiring (Lenis README):**
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);                  // keep ScrollTrigger synced
gsap.ticker.add((time) => { lenis.raf(time * 1000); });    // single RAF loop, sec→ms
gsap.ticker.lagSmoothing(0);                                // keep them in lockstep
```
**React wrapper (`lenis/react` README):**
```jsx
import { ReactLenis, useLenis } from "lenis/react";
// …
const lenisRef = useRef();
useEffect(() => {
  function update(time) { lenisRef.current?.lenis?.raf(time * 1000); }
  gsap.ticker.add(update);
  return () => gsap.ticker.remove(update);
}, []);                                                     // empty deps — see gotcha
return <ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />;
```
- **Set `autoRaf: false`** so Lenis doesn't run its own RAF — GSAP's ticker is the single source of truth. Running both is the classic double-RAF bug.
- **Do NOT run Lenis *and* GSAP ScrollSmoother** — both do smooth scroll; pick one. This stack uses Lenis, so leave ScrollSmoother off even though it's now free. Keep `lagSmoothing(0)`; don't double-lerp.

**Evidence caveat (thin / not GSAP-blessed):** GSAP forums note Lenis is third-party and *unofficial* to GSAP (they point to their own ScrollSmoother). The wiring above is the **Lenis-maintainer-recommended** pattern, corroborated by community threads. Two real gotchas flagged there: (a) a `useEffect` with **no dependency array** re-registers the ticker every render — always pass `[]`; (b) the `ReactLenis` wrapper has been reported **laggy on mobile/iOS**, with some devs preferring a manual Lenis instance + manual `lenis.on('scroll', ScrollTrigger.update)`. Given this is a mobile-majority site, watch this closely. — https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/ , https://github.com/darkroomengineering/lenis/discussions/431

### 4.5 Version constraints to pin — **[all verified 2026-06-12 via npm]**

| Package | Latest (verified) | Notes |
|---|---|---|
| `gsap` | **3.15.0** | All bonus plugins free since 3.13.0 (2025-04-30). Public npm, no token. |
| `@gsap/react` | **2.1.2** | peerDeps `gsap ^3.12.5`, `react >=17`. Provides `useGSAP`. |
| `lenis` | **1.3.23** | Use this, NOT `@studio-freight/lenis` (deprecated @1.0.42). React via `lenis/react`. |

Both `@gsap/react@2.1.2` and `lenis@1.3.x` declare `react >=17` → support React **18 and 19** and Next.js **14 and 15** (App Router). No documented React-19 incompatibility.

### Recommendation for chunkylabs
- **Install from public npm, no auth token:** `npm i gsap @gsap/react lenis`. Drop any `gsap-trial` / private-registry config (deprecated).
- **Pin:** `gsap@3.15.0`, `@gsap/react@2.1.2`, `lenis@1.3.23` (pin exact for reproducible Vercel builds; caret is acceptable — all stable with no breaking-change signals).
- **Animate via `useGSAP()` inside `"use client"` components**, with `{ scope: ref }` and `contextSafe` for event-driven animations — the Strict-Mode + cleanup safety net for the DOM layers over each station. Register ScrollTrigger **once, centrally,** guarded by `typeof window !== "undefined"`.
- **Smooth scroll: Lenis only — do NOT also enable GSAP ScrollSmoother.** Wire `<ReactLenis root options={{ autoRaf: false }}>`, drive `lenis.raf` from a single `gsap.ticker.add(update)` (empty-deps effect), `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.lagSmoothing(0)`.
- **Watch mobile/iOS:** if `ReactLenis` feels laggy with the video transitions, fall back to a manual Lenis instance + manual ScrollTrigger sync (community-reported issue). Call `ScrollTrigger.refresh()` after videos/fonts/images load so triggers measure correctly.

---

## Cross-cutting summary (the recommendations in one place)

| Topic | Recommendation |
|---|---|
| **Codec** | MP4 only; ordered `<source>` AV1 (Profile 0/8-bit) → H.264, full `codecs` strings. H.264 is the mandatory floor. Skip HEVC for v1. Progressive MP4 on Vercel CDN, no HLS. |
| **Autoplay** | `muted playsInline autoplay loop` + JS mirror; always `.play().catch()` → tap-to-play. LPM is undetectable — design for a graceful paused first frame. Music = tap-gated. Null `src` on finished clips. |
| **Scrub vs play-through** | **Play-through**, triggered by tap / scroll-into-view. GSAP/Lenis drive DOM only, never `video.currentTime`. Canvas image-sequence only if true scroll-scrub is genuinely needed somewhere. |
| **GSAP/Next** | `gsap@3.15.0` + `@gsap/react@2.1.2` + `lenis@1.3.23`, public npm. `useGSAP()` in `"use client"`. Lenis only (no ScrollSmoother), `autoRaf:false`, single ticker, `lagSmoothing(0)`. |

## Open items to validate empirically before / during build
- **Real AV1 vs H.264 KB + decode smoothness on a 2–6s clip**, tested on a mid-tier Android and an older (non-AV1) iPhone — decides whether the AV1 lane earns its place. No current source benchmarks clips this short.
- **In-app-browser behavior** (Instagram / TikTok / Facebook / Messenger WKWebViews) — playsinline + autoplay are host-app controlled; test on-device per app.
- **`ReactLenis` mobile/iOS smoothness** with real video layers — be ready to swap to a manual Lenis instance.
- **Default per-site Auto-Play preference vs muted video** — primary sources don't conclusively resolve the muted case; the tap-to-play fallback is the insurance.
- **Simultaneous-decode ceiling** on the oldest supported iPhone — no official number exists; profile the worst-case station with the most stacked video layers.

## Primary / key sources
- WebKit — New `<video>` Policies for iOS: https://webkit.org/blog/6784/new-video-policies-for-ios/
- WebKit — Auto-Play Policy Changes (macOS): https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
- WebKit — Safari 17 features (AV1, MediaCapabilities): https://webkit.org/blog/14445/webkit-features-in-safari-17-0/
- WebKit — Safari 14.1 features (WebM): https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/
- WebKit bug 162366 (multiple muted autoplay; decode pipelines): https://bugs.webkit.org/show_bug.cgi?id=162366
- MDN — Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- MDN — `<video>` element / source selection: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video
- MDN / caniuse — `getAutoplayPolicy` (unsupported in Safari): https://caniuse.com/mdn-api_navigator_getautoplaypolicy
- caniuse — AV1: https://caniuse.com/av1 · HEVC: https://caniuse.com/hevc · rVFC: https://caniuse.com/mdn-api_htmlvideoelement_requestvideoframecallback
- Bitmovin — Apple AV1 device support: https://bitmovin.com/blog/apple-av1-support/
- ScientiaMobile — AV1 hardware-decode adoption: https://scientiamobile.com/av1-codec-hardware-decode-adoption/
- Chrome HEVC hardware-only: https://github.com/StaZhu/enable-chromium-hevc-hardware-decoding
- Jake Archibald — AV1 codec strings: https://jakearchibald.com/2022/html-codecs-parameter-for-av1/
- Evil Martians — better web video with AV1: https://evilmartians.com/chronicles/better-web-video-with-av1-codec
- muffinman.io — scrubbing videos with JS (keyframe/size numbers): https://muffinman.io/blog/scrubbing-videos-using-javascript/
- CSS-Tricks — Apple-style scroll animations (canvas sequence): https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
- web.dev — requestVideoFrameCallback: https://web.dev/articles/requestvideoframecallback-rvfc
- ScrollyVideo (dkaoster): https://github.com/dkaoster/scrolly-video
- GSAP forum — can ScrollTrigger scrub a video on scroll: https://gsap.com/community/forums/topic/38762-can-gsap-scrolltrigger-scrub-a-video-on-scroll/
- GSAP forum — ScrollTrigger video on iOS: https://gsap.com/community/forums/topic/36208-scrolltrigger-video-animation-doesnt-work-on-ios/
- GSAP becomes free (Webflow): https://webflow.com/blog/gsap-becomes-free
- GSAP React docs (useGSAP): https://gsap.com/resources/React/
- Lenis (darkroomengineering): https://github.com/darkroomengineering/lenis
- GSAP forum — synchronizing ScrollTrigger + Lenis in React/Next: https://gsap.com/community/forums/topic/40426-patterns-for-synchronizing-scrolltrigger-and-lenis-in-reactnext/

*Apple developer doc pages relevant to Q2 (`delivering-video-content-for-safari`, `wkwebviewconfiguration/allowsInlineMediaPlayback`) are JS-rendered and could not be machine-extracted — open them manually to confirm WKWebView config details.*
