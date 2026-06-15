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
 *  - Attributes: muted playsInline autoplay loop preload="auto" + poster. `muted` is also
 *    mirrored in JS before play() (iOS).
 *  - Plays on station-enter via the EXISTING IntersectionObserver gate in StoreWalkthrough
 *    (passed down as `activeIndex`) — driven by .play() (not the autoplay attribute alone)
 *    so rejection is catchable.
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
  const hasLoadedRef = useRef(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [forceTap, setForceTap] = useState(false);
  const { unlocked, markUnlocked } = usePlaybackUnlock();

  const keepSrc = Math.abs(index - activeIndex) <= KEEP_WINDOW;
  const isActive = index === activeIndex;

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
      hasLoadedRef.current = false;
      setNeedsTap(false);
      return;
    }

    // (Re)load when sources were previously dropped and have just re-mounted.
    if (!hasLoadedRef.current) {
      v.load();
      hasLoadedRef.current = true;
    }

    if (isActive) {
      if (forceTap) {
        v.autoplay = false;
        v.pause();
        setNeedsTap(true);
        return;
      }
      tryPlay();
    } else {
      v.pause();
    }
  }, [keepSrc, isActive, forceTap, tryPlay]);

  // Reuse the first successful gesture: once the session is unlocked, retry a blocked clip.
  useEffect(() => {
    if (unlocked && needsTap && isActive && !forceTap) tryPlay();
  }, [unlocked, needsTap, isActive, forceTap, tryPlay]);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        muted
        playsInline
        autoPlay
        loop
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
