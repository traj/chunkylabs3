"use client";

/**
 * A crisp composited still, cross-dissolved over the station's video.
 *
 * THE STILL-REST MODEL. The gen'd clips are pure IN-BETWEENS: they carry the motion and nothing
 * else. What the visitor actually LOOKS at — the resting frame at either end — is a real
 * composited still (design/reshoot/compose_reshoot.py bakes the .pen door-layer marks onto the
 * plate), so the marks are sharp by construction instead of being re-drawn on top of a soft,
 * warped baked twin.
 *
 * WHY THE DISSOLVE IS THE POINT. Cinema Studio does not reproduce its start/end pins — it
 * REPAINTS them. Frame 0 differs from the out0 composite by MAD 17.3 (PSNR 19.2dB) and the held
 * last frame differs from the out1 composite by MAD 15.8: a whole-frame grade/texture delta, not
 * a misalignment. Hard-cutting between still and video would pop that delta straight in the
 * viewer's face. A ~250ms dissolve at each boundary is what makes it invisible — the still is not
 * a decoration over the clip, it is the clip's ENDPOINT, and the dissolve is the seam.
 *
 * POSITION STABILITY comes free: this is an <img> with `object-cover` and the same intrinsic
 * 1920x1080 as the <video> under it, inside the same box. CSS runs the identical cover algorithm
 * on both, so the still and the frame it dissolves into are registered to the pixel — with no JS
 * measurement that could lag a resize by a frame and misregister mid-dissolve. (The JS cover math
 * in useCoverBox is still needed for HOTSPOTS, which have no CSS equivalent to lean on.)
 */
export function StationStill({
  src,
  visible,
  fadeMs,
  priority,
}: {
  src: string;
  visible: boolean;
  fadeMs: number;
  /** The scene's resting frame — fetch it eagerly; it's what the visitor waits on. */
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      draggable={false}
      data-station-still={visible ? "visible" : "hidden"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      // Sits directly over the video and under the scrim, so it takes the same grading as every
      // other scene layer. No z-index — DOM order is the stack.
      className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${fadeMs}ms ease-out`,
      }}
    />
  );
}
