"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DOOR_LAYER_ELEMENTS,
  MASTER_HEIGHT,
  MASTER_WIDTH,
  isPortrait,
  placementFor,
  shadowFor,
  type ElementPlacementSet,
} from "@/data/doorLayer";

/**
 * The crisp DOM element overlay for the entry stations (the door-layer marks).
 *
 * WHY IT EXISTS: the walk-up clip was generated FROM sticker-composited pins, so it carries
 * SOFT, slightly warped BAKED TWINS of these five marks — the gen degraded the small type (the
 * OPEN sign's "Come in" script garbles; the wordmark softens). This layer lands the crisp
 * originals on top at the hold, exactly covering their twins. That only works because the bake
 * and this overlay share one geometry source (design/door-layer.pen → doorLayer.ts): every baked
 * element sits within 6.5px of its .pen footprint at 1920 scale.
 *
 * THE COVER BOX (the whole trick). The scene paints its media with `object-cover` /
 * `background-size: cover`, so the 1920x1080 master is scaled to COVER the box and the overflow
 * is cropped — the master's on-screen rect is NOT the viewport, and at most aspects it is
 * literally wider than the window. Position the marks against the viewport and they slide off
 * the facade the moment the aspect changes. So we measure the MEDIA ELEMENT ITSELF (the <video>,
 * or the still's backing div), reproduce what cover does to it, and lay a box on exactly that
 * rect. The marks then sit at percentages INSIDE that box and stay welded to the facade — and to
 * their baked twins — at ANY aspect.
 *
 * Measuring the media rather than this host matters even though they currently coincide: the
 * host is `inset-0` of the station <section> and so is the transition layer, but that is a
 * layout coincidence, not a contract. Anything that ever insets or letterboxes the media (a
 * safe-area inset, a chrome bar, a future frame) would silently peel every mark off its twin.
 * Deriving from the media element is the version that cannot drift.
 *
 * The layer is inert (`pointer-events: none`) except the OPEN sign, the door's diegetic CTA.
 */

/** The object-cover rect of the master inside the media box, in the HOST's coordinate space. */
type CoverBox = { left: number; top: number; width: number; height: number; scale: number };

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
  // GENUINELY portrait (taller than wide) — never "narrower than 16:9". See isPortrait().
  const [portrait, setPortrait] = useState(false);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const section = host.closest("section");
    if (!section) return;

    const measure = () => {
      // The element the master is actually painted into: the clip's <video>, or — on the street,
      // which has no clip — the still's cover-background div.
      const media =
        section.querySelector("video") ??
        section.querySelector<HTMLElement>("[data-transition-layer]");
      if (!media) return;

      const hostBox = host.getBoundingClientRect();
      const mediaBox = media.getBoundingClientRect();
      if (mediaBox.width === 0 || mediaBox.height === 0) return;

      // Intrinsic size of the master. Prefer what the decoder actually reports; fall back to the
      // authored 1920x1080 before metadata lands (and for the still, which has no intrinsic API).
      const video = media instanceof HTMLVideoElement ? media : null;
      const iw = video?.videoWidth || MASTER_WIDTH;
      const ih = video?.videoHeight || MASTER_HEIGHT;

      // Reproduce object-fit: cover — scale to cover the media box, centre, let it overflow.
      const scale = Math.max(mediaBox.width / iw, mediaBox.height / ih);
      const width = iw * scale;
      const height = ih * scale;

      setCover({
        // Media box is relative to the viewport; re-express in the host's own space so the
        // absolutely-positioned box lands right even if the two ever stop coinciding.
        left: mediaBox.left - hostBox.left + (mediaBox.width - width) / 2,
        top: mediaBox.top - hostBox.top + (mediaBox.height - height) / 2,
        width,
        height,
        scale,
      });
      setPortrait(isPortrait(mediaBox.width, mediaBox.height));
    };

    measure();

    // Watch the host AND the media: resize, rotation, and the mobile URL-bar reflow.
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    const media =
      section.querySelector("video") ??
      section.querySelector<HTMLElement>("[data-transition-layer]");
    if (media) ro.observe(media);

    // The intrinsic size only becomes known at `loadedmetadata` — remeasure so a cold mount that
    // fell back to 1920x1080 is corrected the instant the decoder reports the real dimensions.
    const video = section.querySelector("video");
    video?.addEventListener("loadedmetadata", measure);

    return () => {
      ro.disconnect();
      video?.removeEventListener("loadedmetadata", measure);
    };
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
      data-portrait={portrait ? "true" : "false"}
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
            // Shadow px are authored at the 1920 master scale — scale them with the cover so the
            // shadow stays proportional instead of growing/shrinking against the mark.
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
              // Pencil anchors the PRE-rotation top-left at (x, y) and rotates about that corner.
              // `cssRotation` is already CSS-signed; origin 0 0 reproduces the bake.
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
