"use client";

import type { CSSProperties } from "react";
import type { StationId } from "@/data/stations";
import { C } from "@/components/walls/ui";

/**
 * The record-puck compass — the site's interior MOVEMENT control. A neutral 100×100 pad (NO baked
 * station name; the room title lives beside it): a fixed top-down room map — up=counter, left=Mixes,
 * right=Crate, down=Vibes, centre=exit to street. The CURRENT station's arm is pink; arms that name
 * a directly-reachable station (per stations.ts exits) are lit + clickable; the rest are dim.
 * Clicking triggers exactly the same nav as before (goToId via the controller's requestMove).
 */

type Dir = "up" | "down" | "left" | "right";

// Fixed room map (matches nav-pad v9). Reachability decides which are live, from the graph.
export const DIR_TO_STATION: Record<Dir, StationId> = {
  up: "counter",
  down: "mixtape-shelf",
  left: "left-bins",
  right: "right-bins",
};
export const PORTAL_STATION: StationId = "street";

const ARROW: Record<Dir, { pos: CSSProperties; vb: string; poly: string }> = {
  up: { pos: { left: 26, top: 0, width: 48, height: 22 }, vb: "0 0 48 22", poly: "0,22 48,22 24,0" },
  down: { pos: { left: 26, top: 78, width: 48, height: 22 }, vb: "0 0 48 22", poly: "0,0 48,0 24,22" },
  left: { pos: { left: 0, top: 26, width: 22, height: 48 }, vb: "0 0 22 48", poly: "22,0 22,48 0,24" },
  right: { pos: { left: 78, top: 26, width: 22, height: 48 }, vb: "0 0 22 48", poly: "0,0 22,24 0,48" },
};

export function NavPuck({
  currentId,
  reachable,
  onMove,
}: {
  currentId: StationId;
  reachable: ReadonlySet<StationId>;
  onMove: (to: StationId) => void;
}) {
  return (
    <div style={{ position: "relative", width: 100, height: 100 }}>
      {(Object.keys(ARROW) as Dir[]).map((dir) => {
        const target = DIR_TO_STATION[dir];
        const isSelf = target === currentId;
        const isAvail = reachable.has(target);
        const clickable = isAvail && !isSelf;
        const g = ARROW[dir];
        return (
          <button
            key={dir}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onMove(target)}
            aria-label={`Go ${dir}`}
            style={{
              position: "absolute",
              ...g.pos,
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: clickable ? "pointer" : "default",
              opacity: isSelf ? 0.85 : isAvail ? 1 : 0.12,
              transition: "opacity .2s ease",
            }}
          >
            <svg viewBox={g.vb} style={{ display: "block", width: "100%", height: "100%" }}>
              <polygon points={g.poly} fill={isSelf ? C.pink : C.cream} />
            </svg>
          </button>
        );
      })}

      {/* centre portal → exit to street. Live only where street is a direct edge (the counter). */}
      {(() => {
        const clickable = reachable.has(PORTAL_STATION);
        return (
          <button
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onMove(PORTAL_STATION)}
            aria-label="Exit to the street"
            style={{
              position: "absolute",
              left: 26,
              top: 26,
              width: 48,
              height: 48,
              border: `1px solid ${clickable ? "rgba(255,255,255,.55)" : "rgba(255,255,255,.15)"}`,
              background: "rgba(22,13,8,.55)",
              cursor: clickable ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* neutral centre — a record spindle dot, never a station name */}
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: `1px solid ${clickable ? C.cream : "rgba(247,239,226,.35)"}`,
              }}
            />
          </button>
        );
      })()}
    </div>
  );
}
