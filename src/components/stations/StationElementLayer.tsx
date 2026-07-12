"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DOOR_LAYER_ELEMENTS,
  MASTER_ASPECT,
  placementFor,
  shadowFor,
  type ElementPlacementSet,
} from "@/data/doorLayer";

/**
 * The crisp DOM element overlay for the entry stations (the door-layer marks).
 *
 * WHY IT EXISTS: the walk-up clip was generated FROM sticker-composited pins, so it carries
 * SOFT, slightly warped BAKED TWINS of these five marks — the gen degraded the small type
 * (the OPEN sign's "Come in" script garbles; the wordmark softens). This layer lands the
 * crisp originals on top at the hold, exactly covering their twins. That only works because
 * the bake and this overlay share one geometry source (design/door-layer.pen → doorLayer.ts):
 * every baked element sits within 6.5px of its .pen footprint at 1920 scale.
 *
 * THE COVER BOX (the whole trick). The scene paints its <video>/still with `object-cover`, so
 * the 1920x1080 master is scaled to COVER the viewport and the overflow is cropped — the frame
 * is NOT the viewport. Positioning the marks against the viewport would slide them off the
 * facade the moment the aspect changed. So we measure the cover rect ourselves and position a
 * box on exactly it; the marks then sit at percentages INSIDE that box and stay glued to the
 * facade at any aspect. This mirrors what `object-cover` does — it must not be approximated.
 *
 * The layer is inert (`pointer-events: none`) except the OPEN sign, which is the door's
 * diegetic CTA (see the .pen note "entry CTA — hover: glow intensifies").
 */

/** The object-cover rect of a 1920x1080 master inside a box — in the box's own px. */
type CoverBox = { left: number; top: number; width: number; height: number; scale: number };

function computeCover(w: number, h: number): CoverBox {
  // object-cover: scale so the master covers the box, then centre and crop the overflow.
  const scale = Math.max(w / 1920, h / 1080);
  const width = 1920 * scale;
  const height = 1080 * scale;
  return { left: (w - width) / 2, top: (h - height) / 2, width, height, scale };
}

export function StationElementLayer({
  set,
  visible,
  fadeMs,
  onSignClick,
}: {
  /** Which station framing the marks are placed on: the close door frame, or the wide street. */
  set: ElementPlacementSet;
  visible: boolean;
  fadeMs: number;
  /**
   * Door station only: the OPEN sign becomes a clickable CTA firing the same action as the
   * "To the counter" button. Omitted (street) => the sign is inert decoration.
   */
  onSignClick?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [cover, setCover] = useState<CoverBox | null>(null);
  // Portrait = viewport taller than the master => object-cover crops the SIDES, and only a
  // centre column survives. The wordmark lives outside it, so it takes its .pen-noted override.
  const [portrait, setPortrait] = useState(false);

  // Measure the host (which is inset-0 over the same box the video covers) and derive the
  // cover rect. ResizeObserver catches rotation, resize, and the mobile URL-bar reflow.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const measure = () => {
      const { width, height } = host.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setCover(computeCover(width, height));
      setPortrait(width / height < MASTER_ASPECT);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // Preload the crisp assets so the overlay never fades in half-painted at the hold.
  useEffect(() => {
    for (const el of DOOR_LAYER_ELEMENTS) {
      const img = new Image();
      img.src = el.asset;
    }
  }, []);

  return (
    <div
      ref={hostRef}
      data-element-layer={set}
      // NO z-index: the layer must stay BELOW the scrim (which follows it in DOM order) so the
      // crisp marks take the same darkening as the baked twins under them. Lift it above the
      // scrim and they'd read brighter than the scene — popping as decals, which is exactly the
      // mismatch the pins' photometric harmonization existed to kill.
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${fadeMs}ms ease-out`,
      }}
    >
      {cover ? (
        // The cover box — the master frame's real on-screen rect. Everything inside is a
        // percentage of it, so the marks track the facade, not the window.
        <div
          className="absolute"
          style={{
            left: cover.left,
            top: cover.top,
            width: cover.width,
            height: cover.height,
          }}
        >
          {DOOR_LAYER_ELEMENTS.map((el) => {
            const p = placementFor(el, set, portrait);
            const sh = shadowFor(el, set);
            // Shadow px are authored at the 1920 master scale — scale them with the cover so
            // the shadow stays proportional instead of growing/shrinking against the mark.
            const filter = sh
              ? `drop-shadow(${sh.dx * cover.scale}px ${sh.dy * cover.scale}px ${
                  sh.blur * cover.scale
                }px ${sh.color})`
              : undefined;

            const geometry: React.CSSProperties = {
              position: "absolute",
              left: `${p.xPct}%`,
              top: `${p.yPct}%`,
              width: `${p.wPct}%`,
              height: `${p.hPct}%`,
              // Pencil anchors the PRE-rotation top-left at (x, y) and rotates about that
              // corner. `cssRotation` is already CSS-signed; origin 0 0 reproduces the bake.
              transformOrigin: "0 0",
              transform: `rotate(${p.cssRotation}deg)`,
              opacity: el.opacity,
            };

            // The OPEN sign at the door: a real, clickable diegetic CTA. Hover lifts its
            // brightness and blooms a warm glow (.pen: "entry CTA — hover: glow intensifies").
            if (el.isCta && onSignClick) {
              return (
                <button
                  key={el.id}
                  type="button"
                  onClick={onSignClick}
                  aria-label={el.alt || "Come in"}
                  style={geometry}
                  className="group pointer-events-auto cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-200/80"
                >
                  <img
                    src={el.asset}
                    alt=""
                    draggable={false}
                    className="h-full w-full select-none transition-[filter] duration-200 ease-out group-hover:brightness-125 group-hover:[filter:drop-shadow(0_0_10px_rgba(255,205,130,0.75))_drop-shadow(0_0_26px_rgba(255,170,90,0.45))] group-focus-visible:brightness-125"
                  />
                </button>
              );
            }

            return (
              <img
                key={el.id}
                src={el.asset}
                alt={el.alt}
                aria-hidden={el.alt === "" ? true : undefined}
                draggable={false}
                style={{ ...geometry, filter }}
                className="select-none"
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
