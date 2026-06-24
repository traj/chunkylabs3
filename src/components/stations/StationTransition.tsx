"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import type { TransitionAsset } from "@/data/stations";
import { usePlaybackUnlock } from "./PlaybackUnlock";

/**
 * The play-through transition engine. Mounts a real <video> into StationFrame's reserved
 * transition layer. Built strictly to CLAUDE.md "Never do this" + research §Q1–Q3:
 *
 *  - Ordered <source>: AV1 first, H.264 last, each with the FULL codecs string. Never AV1-only.
 *  - Attributes: muted playsInline autoplay preload="auto" + poster. `muted` is also
 *    mirrored in JS before play() (iOS). NOT looped — see below.
 *  - Play-once-hold: the clip plays through exactly ONCE on becoming active, then rests on
 *    its final frame (the arrival scene) until the visitor navigates away. Re-activating a
 *    scene rewinds and plays it once more from the start (per-activation, not once-ever).
 *  - Plays on becoming active (passed down as `activeIndex`) — driven by .play() (not the
 *    autoplay attribute alone) so rejection is catchable.
 *  - ALWAYS .play().catch() → render a real tap-to-play overlay. This is also the
 *    Low-Power-Mode path (LPM is undetectable). The first successful gesture unlocks the
 *    session for the other clips (see PlaybackUnlock).
 *  - Decoder management: clips outside the active±1 window have their <source>s dropped and
 *    .load() called so paused layers don't hold decode pipelines (~3 concurrent max).
 *  - ScrollTrigger.refresh() after a clip loads so trigger positions stay correct.
 *
 * NOTE: currentTime is NEVER bound to scroll. Play-through only.
 */

// Exact RFC6381 strings for the placeholder encodes (parsed from the av1C/avcC boxes).
// AV1: Profile 0, 8-bit, level 4.0, Main tier. H.264: Main profile, level 4.0.
// Real assets may carry their own strings later; keep them file-accurate.
const AV1_TYPE = 'video/mp4; codecs="av01.0.08M.08"';
const H264_TYPE = 'video/mp4; codecs="avc1.4D4028"';

// Keep sources mounted only for the active clip and its immediate neighbors. Everything
// else releases its decoder. active±1 = up to 3 concurrent decode contexts (budget ~3–4).
const KEEP_WINDOW = 1;

export function StationTransition({
  asset,
  index,
  activeIndex,
}: {
  asset: TransitionAsset;
  index: number;
  activeIndex: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // The clip URL currently LOADED into the media element (null when sources are dropped).
  // Replaces a plain "has loaded" boolean: edge-keying means a windowed station can be handed
  // a DIFFERENT clip in place (e.g. the counter switching from crate-counter to mixes-counter),
  // and mutating a <source> `src` without calling load() is a no-op — the element would replay
  // its stale clip. Reloading only when this identity changes fixes that while leaving an
  // unchanged src warm (no reload-thrash, preserves the neighbour→active smooth handoff).
  const loadedSrcRef = useRef<string | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [forceTap, setForceTap] = useState(false);
  const { unlocked, markUnlocked } = usePlaybackUnlock();

  const keepSrc = Math.abs(index - activeIndex) <= KEEP_WINDOW;
  const isActive = index === activeIndex;
  // Identity of the clip the <source>s point at (H.264 is the mandatory floor, always present;
  // av1 fallback for completeness). Both encodings change together per asset, so this is a
  // stable per-clip key for the reload-on-change check below.
  const desiredSrc = asset.h264Src ?? asset.av1Src ?? null;

  // Debug aid: ?forceTapToPlay=1 simulates a rejected autoplay so the overlay is testable
  // without having to coax the browser into blocking autoplay. Client-only (no SSR mismatch).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).has("forceTapToPlay")) {
      setForceTap(true);
    }
  }, []);

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; // mirror muted in JS before play() — iOS requirement
    // Play-through is ONCE, but per-activation: rewind to the start before playing so a
    // scene revisited later plays again from frame 0 — never resumed mid-clip, never stuck
    // on the held final frame left over from its previous visit. (This is the only entry
    // point that starts the clip, so the reset lives here for all callers.)
    v.currentTime = 0;
    const p = v.play();
    if (p !== undefined) {
      p.then(() => {
        setNeedsTap(false);
        markUnlocked();
      }).catch(() => {
        // NotAllowedError (autoplay blocked / Low Power Mode) → fall back to tap-to-play.
        setNeedsTap(true);
      });
    }
  }, [markUnlocked]);

  // Decoder + playback management.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (!keepSrc) {
      // Release the decode pipeline — drop sources + load(), don't merely pause.
      // React has already unmounted the <source> children at this point.
      v.pause();
      v.removeAttribute("src");
      v.load();
      loadedSrcRef.current = null;
      setNeedsTap(false);
      return;
    }

    // (Re)load when the sources were dropped and re-mounted, OR the active asset changed in
    // place (edge-keying hands a windowed element a different clip — changing <source> src
    // without load() would replay the stale clip). An UNCHANGED src must NOT reload, so the
    // neighbour that already preloaded this clip stays warm and the handoff is seamless.
    if (loadedSrcRef.current !== desiredSrc) {
      v.load();
      loadedSrcRef.current = desiredSrc;
    }

    if (isActive) {
      if (forceTap) {
        // Debug (?forceTapToPlay=1): simulate a rejected autoplay so the tap-to-play
        // overlay is testable. Gate the overlay on `needsTap` state ONLY — do not mutate
        // v.autoplay (that would leave the property false: a latent footgun if forceTap
        // ever becomes dynamic). The real (non-debug) path below is unchanged.
        v.pause();
        setNeedsTap(true);
        return;
      }
      tryPlay();
    } else {
      v.pause();
    }
  }, [keepSrc, isActive, forceTap, tryPlay, desiredSrc]);

  // Reuse the first successful gesture: once the session is unlocked, retry a blocked clip.
  useEffect(() => {
    if (unlocked && needsTap && isActive && !forceTap) tryPlay();
  }, [unlocked, needsTap, isActive, forceTap, tryPlay]);

  return (
    <div className="absolute inset-0">
      {/* No `loop`: a transition is an ARRIVAL. It plays through ONCE on activation, then
          holds on its final decoded frame as the still "you are here" scene until the
          visitor clicks an exit. (Holding is the default no-loop behaviour — the element
          pauses on the last frame at `ended`; we deliberately add NO onEnded reset/hide.) */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        playsInline
        autoPlay
        preload="auto"
        poster={asset.poster}
        onLoadedData={() => {
          // Clip dimensions are known now — keep ScrollTrigger positions correct.
          ScrollTrigger.refresh();
        }}
      >
        {/* Ordered most-efficient → most-compatible. H.264 is the mandatory floor. */}
        {keepSrc && asset.av1Src ? <source src={asset.av1Src} type={AV1_TYPE} /> : null}
        {keepSrc && asset.h264Src ? <source src={asset.h264Src} type={H264_TYPE} /> : null}
      </video>

      {needsTap ? (
        <button
          type="button"
          aria-label="Tap to play this transition"
          onClick={() => {
            markUnlocked();
            tryPlay();
          }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70 backdrop-blur-sm"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/80">
            <span className="ml-1 h-0 w-0 border-y-8 border-l-[14px] border-y-transparent border-l-white" />
          </span>
          <span className="text-sm uppercase tracking-[0.2em] text-white/90">Tap to enter</span>
          <span className="text-xs text-white/50">Autoplay blocked (e.g. Low Power Mode)</span>
        </button>
      ) : null}
    </div>
  );
}
