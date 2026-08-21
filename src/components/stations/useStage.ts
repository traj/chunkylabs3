"use client";

import { useEffect, useState } from "react";
import { MASTER_HEIGHT, MASTER_WIDTH } from "./useCoverBox";

/**
 * The object-cover box of the 1920×1080 master, computed from the VIEWPORT alone.
 *
 * Every transition clip and still is a 1920×1080 master painted object-cover, so the on-screen
 * box is deterministic from the window size — no per-element measurement needed. This is the
 * same mapping `useCoverBox` derives by measuring the <video> (it falls back to 1920×1080 for
 * intrinsic size), so chrome pinned via this hook lands exactly on the wall content pinned via
 * WallStage. Used for store-level HUD/nav that lives outside any single station <section>.
 */
export interface StageCover {
  scale: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export function computeCover(vw: number, vh: number): StageCover {
  const scale = Math.max(vw / MASTER_WIDTH, vh / MASTER_HEIGHT);
  const width = MASTER_WIDTH * scale;
  const height = MASTER_HEIGHT * scale;
  return { scale, width, height, left: (vw - width) / 2, top: (vh - height) / 2 };
}

/** Live viewport size (0×0 until mounted, so callers can gate their first paint). */
export function useViewport(): { vw: number; vh: number } {
  const [vp, setVp] = useState({ vw: 0, vh: 0 });
  useEffect(() => {
    const measure = () => setVp({ vw: window.innerWidth, vh: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return vp;
}
