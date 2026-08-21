"use client";

import { C, FONT } from "./ui";

/**
 * Static wall HUD chrome (walls only — entry stations stay HUD-free). Constant across ALL states.
 *  - wordmark TR: 196w, insets 58 right / 44 top, 45% opacity.
 *  - nav pad BL: compass-rose graphic at (58,922), 45% — STATIC IMAGE ONLY (no nav; the functional
 *    puck is a separate task). Current wall lit pink, others dim, portal centre names STREET.
 *  - room title under the pad at (58,1030): Archivo Black 12, white, 100%.
 * Authored in 1920×1080 design px (rendered inside WallStage). Non-interactive.
 */

// current wall → which compass arm is "here" (pink).
const CUR_DIR: Record<"mixes" | "vibes" | "crate", "left" | "right" | "down"> = {
  mixes: "left",
  crate: "right",
  vibes: "down",
};

function Arrow({
  dir,
  cur,
}: {
  dir: "up" | "down" | "left" | "right";
  cur: boolean;
}) {
  const fill = cur ? C.pink : C.cream;
  const opacity = cur ? 0.6 : 0.55;
  const pos: Record<string, React.CSSProperties> = {
    up: { left: 26, top: 0, width: 48, height: 22 },
    down: { left: 26, top: 78, width: 48, height: 22 },
    left: { left: 0, top: 26, width: 22, height: 48 },
    right: { left: 78, top: 26, width: 22, height: 48 },
  };
  const vb: Record<string, string> = {
    up: "0 0 48 22",
    down: "0 0 48 22",
    left: "0 0 22 48",
    right: "0 0 22 48",
  };
  const poly: Record<string, string> = {
    up: "0,22 48,22 24,0",
    down: "0,0 48,0 24,22",
    left: "22,0 22,48 0,24",
    right: "0,0 22,24 0,48",
  };
  return (
    <div style={{ position: "absolute", ...pos[dir], opacity }}>
      <svg viewBox={vb[dir]} style={{ display: "block", width: "100%", height: "100%" }}>
        <polygon points={poly[dir]} fill={fill} />
      </svg>
    </div>
  );
}

export function WallHud({
  roomTitle,
  navCurrent,
}: {
  roomTitle: string;
  navCurrent: "mixes" | "vibes" | "crate";
}) {
  const cur = CUR_DIR[navCurrent];
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }}>
      {/* wordmark TR (1512×160 native → 196×20.7), 45% */}
      <img
        src="/hud/chunky-wordmark.png"
        alt="chunkylabs"
        style={{
          position: "absolute",
          top: 44,
          right: 58,
          width: 196,
          height: "auto",
          opacity: 0.45,
        }}
      />

      {/* nav pad BL — static compass rose (58,922), 45% */}
      <div style={{ position: "absolute", left: 58, top: 922, width: 100, height: 100, opacity: 0.45 }}>
        <Arrow dir="up" cur={false} />
        <Arrow dir="down" cur={cur === "down"} />
        <Arrow dir="left" cur={cur === "left"} />
        <Arrow dir="right" cur={cur === "right"} />
        {/* centre portal — names its destination (STREET, from inside a wall) */}
        <div
          style={{
            position: "absolute",
            left: 26,
            top: 26,
            width: 48,
            height: 48,
            border: "1px solid rgba(255,255,255,.55)",
            background: "rgba(22,13,8,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: C.cream,
              font: `500 9px ${FONT.body}`,
              letterSpacing: ".16em",
              textTransform: "uppercase",
            }}
          >
            STREET
          </span>
        </div>
      </div>

      {/* room title under the pad (58,1030) — Archivo Black 12, white, 100%, all states */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 1030,
          color: "#fff",
          font: `400 12px ${FONT.display}`,
          letterSpacing: ".02em",
          textTransform: "uppercase",
        }}
      >
        {roomTitle}
      </div>
    </div>
  );
}
