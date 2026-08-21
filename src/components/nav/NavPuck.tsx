"use client";

import { useState, type CSSProperties } from "react";
import type { StationId } from "@/data/stations";
import { C } from "@/components/walls/ui";

/**
 * The record-puck compass — the site's MOVEMENT control, present at EVERY station in one of two
 * variants (config-driven):
 *
 *  - INTERIOR (counter/mixes/vibes/crate): the fixed room map — up=counter, left=Mixes,
 *    right=Crate, down=Vibes; the current room is pink; the other arms are always live (direct or
 *    routed); the CENTRE exits to the street (routed via the counter from a wall). Subtle quiet
 *    exit affordance on centre hover.
 *  - ENTRY (street/door): VERTICAL-ONLY — the entry chain runs on up/down (Street: up=door; Door:
 *    up=counter, down=street). Horizontal arms are hidden; the centre is inert.
 *
 * Clicking triggers the same nav (requestMove) — no engine changes.
 */

export type Dir = "up" | "down" | "left" | "right";
export interface Arm {
  target: StationId | null;
  isSelf?: boolean;
}
export interface PuckConfig {
  variant: "interior" | "entry";
  up: Arm;
  down: Arm;
  left: Arm;
  right: Arm;
  center: Arm;
}

const ARROW: Record<Dir, { pos: CSSProperties; vb: string; poly: string }> = {
  up: { pos: { left: 26, top: 0, width: 48, height: 22 }, vb: "0 0 48 22", poly: "0,22 48,22 24,0" },
  down: { pos: { left: 26, top: 78, width: 48, height: 22 }, vb: "0 0 48 22", poly: "0,0 48,0 24,22" },
  left: { pos: { left: 0, top: 26, width: 22, height: 48 }, vb: "0 0 22 48", poly: "22,0 22,48 0,24" },
  right: { pos: { left: 78, top: 26, width: 22, height: 48 }, vb: "0 0 22 48", poly: "0,0 22,24 0,48" },
};

export function NavPuck({
  config,
  onMove,
}: {
  config: PuckConfig;
  onMove: (to: StationId) => void;
}) {
  const [centerHover, setCenterHover] = useState(false);
  const dirs: Dir[] = ["up", "down", "left", "right"];

  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      {dirs.map((dir) => {
        const arm = config[dir];
        // Entry variant hides its (target-less) horizontal arms entirely.
        if (config.variant === "entry" && (dir === "left" || dir === "right")) return null;
        const clickable = Boolean(arm.target) && !arm.isSelf;
        const g = ARROW[dir];
        return (
          <button
            key={dir}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onMove(arm.target!)}
            aria-label={`Go ${dir}`}
            style={{
              position: "absolute",
              ...g.pos,
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: clickable ? "pointer" : "default",
              opacity: arm.isSelf ? 0.85 : clickable ? 1 : 0.12,
              transition: "opacity .2s ease",
            }}
          >
            <svg viewBox={g.vb} style={{ display: "block", width: "100%", height: "100%" }}>
              <polygon points={g.poly} fill={arm.isSelf ? C.pink : C.cream} />
            </svg>
          </button>
        );
      })}

      {/* centre — interior: exit to street (subtle affordance on hover); entry: inert dot. */}
      {(() => {
        const arm = config.center;
        const clickable = Boolean(arm.target);
        return (
          <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onMove(arm.target!)}
            onMouseEnter={() => setCenterHover(true)}
            onMouseLeave={() => setCenterHover(false)}
            aria-label={clickable ? "Exit to the street" : "here"}
            style={{
              position: "absolute",
              left: 26,
              top: 26,
              width: 48,
              height: 48,
              border: `1px solid ${
                clickable && centerHover
                  ? "rgba(255,255,255,.9)"
                  : clickable
                    ? "rgba(255,255,255,.5)"
                    : "rgba(255,255,255,.15)"
              }`,
              background: "rgba(22,13,8,.55)",
              cursor: clickable ? "pointer" : "default",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              transition: "border-color .2s ease",
            }}
          >
            {/* record spindle dot */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: `1px solid ${clickable ? C.cream : "rgba(247,239,226,.35)"}`,
              }}
            />
            {/* quiet exit affordance (interim), revealed on hover for the interior centre */}
            {clickable ? (
              <span
                style={{
                  font: `700 6px var(--font-space-mono), monospace`,
                  letterSpacing: ".14em",
                  color: C.cream,
                  opacity: centerHover ? 0.7 : 0,
                  transition: "opacity .2s ease",
                }}
              >
                EXIT
              </span>
            ) : null}
          </button>
        );
      })()}
    </div>
  );
}
