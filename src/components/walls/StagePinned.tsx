"use client";

import type { CSSProperties, ReactNode } from "react";
import { computeCover, useViewport } from "@/components/stations/useStage";

/**
 * Pins a chrome element to the 1920×1080 stage (the object-cover box), scaled with the picture —
 * then CLAMPS it so it never leaves a `margin`px gutter from the viewport edge when the cover box
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
  margin?: number;
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
    // Keep a margin gutter; if the element is larger than the available span, pin to top-left.
    const maxLeft = vw - boxW - margin;
    const maxTop = vh - boxH - margin;
    left = maxLeft < margin ? margin : Math.max(margin, Math.min(left, maxLeft));
    top = maxTop < margin ? margin : Math.max(margin, Math.min(top, maxTop));
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
