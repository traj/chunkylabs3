"use client";

import { useRef } from "react";
import type { StationHotspot, StationId } from "@/data/stations";
import { useCoverBox } from "./useCoverBox";

/**
 * Transparent, percentage-anchored click regions over the scene — the imagemap model.
 *
 * The entry stations used to render the five door-layer marks as real DOM <img>s so they could be
 * crisp and clickable. The composited stills now carry those marks (sharper, and free of the
 * bake-vs-overlay alignment problem entirely), so the DOM's only remaining job here is
 * INTERACTION: invisible regions you can click, sitting exactly on the thing they represent.
 *
 * Rects are percentages of the 1920x1080 master and are positioned inside the measured
 * object-cover box (useCoverBox), NOT the viewport — so a hotspot stays welded to the door at any
 * window aspect, including the wildly non-16:9 ones where the master overflows the window.
 *
 * Data-driven on purpose: `Station.hotspots` is just a list of rects + targets, so the walls can
 * take the same component for the zone→tray model without touching this file.
 *
 * Additive, never a replacement: the button CTAs stay exactly as they are. A hotspot is a second,
 * diegetic way to trigger an exit the visitor can already take — so it must never be the ONLY way
 * (that would strand keyboard users on an invisible region and hide the nav from screen readers).
 */
export function StationHotspots({
  hotspots,
  onNavigate,
  interactive,
}: {
  hotspots: readonly StationHotspot[];
  onNavigate: (to: StationId) => void;
  /** Only the resting, active scene takes clicks — never a neighbour or a moving facade. */
  interactive: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { cover } = useCoverBox(hostRef);

  return (
    <div
      ref={hostRef}
      data-hotspot-layer
      className="pointer-events-none absolute inset-0 z-[5]"
      // Hidden from the a11y tree AND from pointers unless the scene is at rest: a hotspot over a
      // playing transition would let you click a facade that isn't there yet.
      aria-hidden={!interactive}
    >
      {cover ? (
        <div
          className="absolute"
          style={{
            left: cover.left,
            top: cover.top,
            width: cover.width,
            height: cover.height,
          }}
        >
          {hotspots.map((h) => (
            <button
              key={h.id}
              type="button"
              tabIndex={-1}
              aria-hidden
              // The real <button> CTA is the accessible path; this is the diegetic double, so it
              // stays out of the tab order rather than duplicating every exit for keyboard users.
              onClick={() => interactive && onNavigate(h.to)}
              title={h.label}
              style={{
                position: "absolute",
                left: `${h.rect.xPct}%`,
                top: `${h.rect.yPct}%`,
                width: `${h.rect.wPct}%`,
                height: `${h.rect.hPct}%`,
              }}
              className={`rounded-[6px] border border-transparent bg-transparent transition-[background-color,box-shadow,border-color] duration-300 ease-out ${
                interactive
                  ? "pointer-events-auto cursor-pointer hover:border-amber-100/20 hover:bg-amber-50/[0.06] hover:shadow-[inset_0_0_60px_rgba(255,205,130,0.14),0_0_28px_rgba(255,190,110,0.10)]"
                  : "pointer-events-none"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
