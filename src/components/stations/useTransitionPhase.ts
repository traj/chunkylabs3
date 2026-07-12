"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Where a station's inbound clip is in its play-once-hold lifecycle.
 *
 *  - `none`    — the station has no clip at all (the street: it rests on a still).
 *  - `idle`    — mounted but not playing: parked on frame 0 as a preloading neighbour, or
 *                rewound at the start of an activation.
 *  - `playing` — the transition is running. The facade is MOVING, so any element overlay
 *                pinned to a fixed frame is wrong and must be off.
 *  - `ended`   — THE HOLD. The clip has played through once and rests on its final frame:
 *                the arrival scene is now a still, and the crisp overlay can land on it.
 *
 * WHY A DOM OBSERVER: StationTransition is the play-through engine and is deliberately
 * off-limits (no engine changes), so it exposes no ended/hold callback. Rather than reach
 * into it, we observe the <video> it owns from the outside — the element is a descendant of
 * the same station <section>, and its native media events already say everything we need.
 * Nothing here drives playback; it only listens.
 *
 * `seeking` is what resets the phase: the engine re-arms a revisited scene by setting
 * currentTime = 0 and calling play() again, so a stale `ended` must not survive into the
 * replay (it would flash the crisp overlay over a moving facade).
 */
export type TransitionPhase = "none" | "idle" | "playing" | "ended";

export function useTransitionPhase(
  scopeRef: RefObject<HTMLElement | null>,
): TransitionPhase {
  const [phase, setPhase] = useState<TransitionPhase>("none");

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    let video: HTMLVideoElement | null = null;
    const onPlaying = () => setPhase("playing");
    const onEnded = () => setPhase("ended");
    // Any (re)arm or source swap drops us back to idle: rewind-to-0 (`seeking`), a fresh
    // load, or the engine dropping <source>s when the clip leaves the decoder window.
    const onReset = () => setPhase("idle");

    const bind = (v: HTMLVideoElement) => {
      video = v;
      v.addEventListener("playing", onPlaying);
      v.addEventListener("ended", onEnded);
      v.addEventListener("seeking", onReset);
      v.addEventListener("loadstart", onReset);
      v.addEventListener("emptied", onReset);
      // Adopt the element's CURRENT state — it may already have ended before we bound (a
      // fast clip, or a re-render mid-hold), and a missed `ended` would strand the overlay.
      setPhase(v.ended ? "ended" : v.paused ? "idle" : "playing");
    };

    const found = scope.querySelector("video");
    if (found) {
      bind(found);
    } else {
      setPhase("none");
    }

    return () => {
      if (!video) return;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeking", onReset);
      video.removeEventListener("loadstart", onReset);
      video.removeEventListener("emptied", onReset);
    };
    // Re-bind whenever the station's clip identity changes: the engine hands a windowed
    // <video> a DIFFERENT clip in place (edge-keying), and the element itself may be reused.
  }, [scopeRef]);

  return phase;
}
