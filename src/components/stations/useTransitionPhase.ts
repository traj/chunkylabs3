"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Where a station's inbound clip is in its play-once-hold lifecycle.
 *
 *  - `none`    — the station has NO clip on this edge, so there is nothing to wait for: it is
 *                already at rest. The street is arrived at this way (door→street and
 *                counter→street are clip-less crossfade edges), so its overlay must show
 *                immediately rather than waiting for an `ended` that will never come.
 *  - `idle`    — has a clip, not playing: parked on frame 0 as a preloading neighbour, or
 *                freshly re-armed at the start of an activation.
 *  - `playing` — the transition is running. The facade is MOVING, so any overlay pinned to a
 *                fixed frame is wrong and must be off.
 *  - `ended`   — THE HOLD. The clip played through once and rests on its final frame: the
 *                arrival scene is a still, and the crisp overlay can land on it.
 *
 * WHY A DOM OBSERVER: StationTransition is the play-through engine and is off-limits (no engine
 * changes), so it exposes no ended/hold callback. We observe the <video> it owns from the
 * outside — native media events only. Nothing here drives playback; it only listens.
 *
 * THE STALE-`ended` BUG (fixed here). Leaving the door does NOT re-arm its video: door→street is
 * a clip-less crossfade, so the door's <video> just sits there, `ended`, holding its last frame.
 * Come back in and the overlay rendered ALREADY VISIBLE — crisp, door-scale marks painted over a
 * walk-up that had started moving — until `seeking` finally fired and faded them out. Measured:
 * the door layer was still at opacity 0.25 at t=0.09s of every RE-entry (the first entry was
 * always clean, which is why it hid so well).
 *
 * The fix has to land BEFORE paint, so it is a render-phase reset (React's documented
 * derived-state pattern), not an effect: an effect runs after the browser has already had a
 * chance to show the stale frame. On the transition into active, a station WITH a clip drops
 * straight back to `idle` — the engine is about to rewind it to 0 and play it anyway.
 */
export type TransitionPhase = "none" | "idle" | "playing" | "ended";

export function useTransitionPhase(
  scopeRef: RefObject<HTMLElement | null>,
  { isActive, hasClip }: { isActive: boolean; hasClip: boolean },
): TransitionPhase {
  const [phase, setPhase] = useState<TransitionPhase>(hasClip ? "idle" : "none");
  const [wasActive, setWasActive] = useState(isActive);

  // Render-phase reset — see "THE STALE-`ended` BUG" above. Becoming active re-arms the clip, so
  // any `ended` left over from a PREVIOUS visit is void. Doing this during render means the
  // overlay never gets a chance to paint stale-visible over the moving clip.
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (isActive && hasClip && phase === "ended") setPhase("idle");
  }

  // A clip-less edge is at rest the moment it arrives; a clipped one must earn its hold.
  if (!hasClip && phase !== "none") setPhase("none");

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !hasClip) return;

    const video = scope.querySelector("video");
    if (!video) return;

    const onPlaying = () => setPhase("playing");
    const onEnded = () => setPhase("ended");
    // Any (re)arm or source swap drops back to idle: the engine's rewind-to-0 (`seeking`), a
    // fresh load, or it dropping <source>s when the clip leaves the decoder window.
    const onReset = () => setPhase("idle");

    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnded);
    video.addEventListener("seeking", onReset);
    video.addEventListener("loadstart", onReset);
    video.addEventListener("emptied", onReset);

    // Adopt the element's CURRENT state — it may have ended before we bound (a fast clip, or a
    // re-render mid-hold), and a missed `ended` would strand the overlay off forever.
    if (video.ended) setPhase("ended");

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeking", onReset);
      video.removeEventListener("loadstart", onReset);
      video.removeEventListener("emptied", onReset);
    };
  }, [scopeRef, hasClip]);

  return phase;
}
