"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

/**
 * The on-screen rect of the 1920x1080 master frame inside a station scene — i.e. what
 * `object-fit: cover` actually does to the media, measured rather than assumed.
 *
 * WHY THIS EXISTS. Every scene paints its media (the <video>, or a still) with cover: the master
 * is scaled UP until it covers the box, centred, and the overflow is cropped. At most aspects the
 * master is therefore literally WIDER than the window. Anything anchored in master coordinates —
 * a hotspot rect, an overlay mark — must be positioned against THIS box, never the viewport, or
 * it slides off the facade the moment the aspect changes.
 *
 * It measures the MEDIA ELEMENT ITSELF, not the host: the host is `inset-0` of the <section> and
 * so is the transition layer, so today they coincide — but that is a layout coincidence, not a
 * contract. Anything that ever insets or letterboxes the media (a safe-area inset, a chrome bar,
 * a future frame) would silently peel every anchored thing off its target. Deriving from the
 * media is the version that cannot drift.
 *
 * (Kept from the element-overlay pass, 967d60c, where it was proven to land marks 0.0px on their
 * baked twins at 16:9, 1161x1015 and 390x844. The rendered marks are gone — the composited stills
 * carry them now — but the hotspots still need exactly this mapping.)
 */

export const MASTER_WIDTH = 1920;
export const MASTER_HEIGHT = 1080;

export type CoverBox = {
  /** In the HOST's coordinate space, so it can be used directly for absolute positioning. */
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
};

/** True only when GENUINELY portrait — taller than wide. Never "narrower than 16:9". */
export function isPortrait(width: number, height: number): boolean {
  return height > width;
}

export function useCoverBox(hostRef: RefObject<HTMLElement | null>): {
  cover: CoverBox | null;
  portrait: boolean;
} {
  const [cover, setCover] = useState<CoverBox | null>(null);
  const [portrait, setPortrait] = useState(false);
  const roRef = useRef<ResizeObserver | null>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const section = host.closest("section");
    if (!section) return;

    const findMedia = () =>
      section.querySelector("video") ??
      section.querySelector<HTMLElement>("[data-transition-layer]");

    const measure = () => {
      const media = findMedia();
      if (!media) return;

      const hostBox = host.getBoundingClientRect();
      const mediaBox = media.getBoundingClientRect();
      if (mediaBox.width === 0 || mediaBox.height === 0) return;

      // Prefer what the decoder reports; fall back to the authored master before metadata lands
      // (and for a still, which has no intrinsic-size API).
      const video = media instanceof HTMLVideoElement ? media : null;
      const iw = video?.videoWidth || MASTER_WIDTH;
      const ih = video?.videoHeight || MASTER_HEIGHT;

      const scale = Math.max(mediaBox.width / iw, mediaBox.height / ih);
      const width = iw * scale;
      const height = ih * scale;

      setCover({
        left: mediaBox.left - hostBox.left + (mediaBox.width - width) / 2,
        top: mediaBox.top - hostBox.top + (mediaBox.height - height) / 2,
        width,
        height,
        scale,
      });
      setPortrait(isPortrait(mediaBox.width, mediaBox.height));
    };

    measure();

    const ro = new ResizeObserver(measure);
    roRef.current = ro;
    ro.observe(host);
    const media = findMedia();
    if (media) ro.observe(media);

    // Intrinsic size is only known at `loadedmetadata` — remeasure so a cold mount that fell back
    // to 1920x1080 is corrected the instant the decoder reports real dimensions.
    const video = section.querySelector("video");
    video?.addEventListener("loadedmetadata", measure);

    return () => {
      ro.disconnect();
      roRef.current = null;
      video?.removeEventListener("loadedmetadata", measure);
    };
  }, [hostRef]);

  return { cover, portrait };
}
