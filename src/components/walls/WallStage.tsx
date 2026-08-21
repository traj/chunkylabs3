"use client";

import { useRef, type ReactNode } from "react";
import { useCoverBox, MASTER_WIDTH, MASTER_HEIGHT } from "@/components/stations/useCoverBox";

/**
 * Pins a fixed 1920×1080 canvas onto the scene's measured object-cover box and scales it to fit,
 * so wall content authored in raw DESIGN-SPACE px (the Pen numbers) lands exactly on the held
 * video frame at any window aspect — the same mapping StationHotspots uses.
 *
 * The host + canvas are pointer-events:none; interactive children re-enable pointer-events on
 * themselves, so empty wall areas stay click-through (the exit CTAs behind keep working).
 */
export function WallStage({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { cover } = useCoverBox(hostRef);

  return (
    <div ref={hostRef} className="pointer-events-none absolute inset-0 z-20">
      {cover ? (
        <div
          className="pointer-events-none absolute"
          style={{ left: cover.left, top: cover.top, width: cover.width, height: cover.height }}
        >
          <div
            className="pointer-events-none absolute left-0 top-0"
            style={{
              width: MASTER_WIDTH,
              height: MASTER_HEIGHT,
              transform: `scale(${cover.scale})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
