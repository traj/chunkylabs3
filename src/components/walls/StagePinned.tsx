"use client";

import type { CSSProperties, ReactNode } from "react";
import { computeCover, useViewport } from "@/components/stations/useStage";

/** Per-edge clamp floor, in DESIGN-SPACE (stage) px. A number applies to all four edges; an object
 *  overrides per side (unspecified sides fall back to 16). These are DESIGNED STAGE INSETS, not a
 *  raw screen gutter: the puck floors at 58 from the left, the wordmark at 58 from the right, so
 *  off-16:9 windows stop jamming chrome against the glass. They scale WITH the picture, so at true
 *  16:9 the floor equals the pin exactly (nothing moves) and off-ratio it holds the same inset. */
type Margin = number | { left?: number; right?: number; top?: number; bottom?: number };

function edges(margin: Margin): { l: number; r: number; t: number; b: number } {
  if (typeof margin === "number") return { l: margin, r: margin, t: margin, b: margin };
  return { l: margin.left ?? 16, r: margin.right ?? 16, t: margin.top ?? 16, b: margin.bottom ?? 16 };
}

/**
 * Pins a chrome element to the 1920×1080 stage (the object-cover box), scaled with the picture —
 * then CLAMPS it so it never leaves a per-edge floor from the viewport edge when the cover box
 * overflows (off-16:9 windows). Pin wins on 16:9 (the box equals the viewport, so no clamp fires);
 * clamp wins off-ratio. Diegetic wall content (covers) does NOT use this — it tracks the picture
 * exactly via WallStage, clamp or no clamp.
 *
 * `x,y,w,h` are DESIGN-SPACE px (top-left anchor). Children author at natural stage px; this scales
 * the whole box by cover.scale.
 */
export function StagePinned({
  x,
  y,
  w,
  h,
  z,
  clamp = true,
  margin = 16,
  style,
  children,
}: {
  x: number;
  y: number;
  w: number;
  /** Stage-space height, used for clamping against the bottom edge (approximate is fine). */
  h: number;
  z?: number;
  clamp?: boolean;
  margin?: Margin;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const { vw, vh } = useViewport();
  if (!vw) return null;

  const cover = computeCover(vw, vh);
  const boxW = w * cover.scale;
  const boxH = h * cover.scale;

  let left = cover.left + x * cover.scale;
  let top = cover.top + y * cover.scale;
  if (clamp) {
    // Keep each edge's designed floor; if the element is larger than the available span, pin to the
    // left/top floor. Floors are per-edge (the puck's left inset ≠ the wordmark's right inset) and
    // scale with the picture, so at true 16:9 the floor equals the pin and nothing moves.
    const e = edges(margin);
    const mL = e.l * cover.scale;
    const mR = e.r * cover.scale;
    const mT = e.t * cover.scale;
    const mB = e.b * cover.scale;
    const maxLeft = vw - boxW - mR;
    const maxTop = vh - boxH - mB;
    left = maxLeft < mL ? mL : Math.max(mL, Math.min(left, maxLeft));
    top = maxTop < mT ? mT : Math.max(mT, Math.min(top, maxTop));
  }

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: w,
        height: h,
        transform: `scale(${cover.scale})`,
        transformOrigin: "top left",
        zIndex: z,
        // Chrome wrappers are click-through by default; interactive children (panel/card/transport/
        // puck) re-enable pointer events on themselves or via the `style` override.
        pointerEvents: "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
