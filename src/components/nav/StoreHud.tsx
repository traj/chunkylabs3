"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StationId } from "@/data/stations";
import { StagePinned } from "@/components/walls/StagePinned";
import { C, FONT } from "@/components/walls/ui";
import { DIR_TO_STATION, NavPuck } from "./NavPuck";

/**
 * Store-level interior HUD: white wordmark (TR), the functional nav puck (BL), the room title
 * (under the puck, current station name), and the one-time key hint. Rendered by StoreWalkthrough
 * for interior stations only (never street/door). Persists across counter↔walls; idle-fades the
 * puck+title after 4s; owns the arrow/WASD movement keys (ignored while a wall state is open).
 */

const ROOM_TITLE: Partial<Record<StationId, string>> = {
  counter: "COUNTER",
  "left-bins": "MIXES",
  "right-bins": "CRATE",
  "mixtape-shelf": "VIBES",
};

type Dir = "up" | "down" | "left" | "right";
const KEY_TO_DIR: Record<string, Dir> = {
  arrowup: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  a: "left",
  arrowright: "right",
  d: "right",
};

export function StoreHud({
  currentId,
  reachable,
  onMove,
  movementLocked,
  keyHintDismissed,
  onDismissKeyHint,
}: {
  currentId: StationId;
  reachable: ReadonlySet<StationId>;
  onMove: (to: StationId) => void;
  /** True while a wall BROWSE/DETAIL panel is open — movement keys are ignored (Esc still walks). */
  movementLocked: boolean;
  keyHintDismissed: boolean;
  onDismissKeyHint: () => void;
}) {
  const [idle, setIdle] = useState(false);
  const lastActivityRef = useRef(0);

  // Any pointer/key activity (or a station change) resets the idle clock.
  const bump = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIdle(false);
  }, []);

  // Mark activity on mount and whenever the station changes (a move IS activity).
  useEffect(() => {
    bump();
  }, [bump, currentId]);

  // ONE ticking check — robust to re-renders: idle after 4s without activity.
  useEffect(() => {
    const iv = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 4000) setIdle(true);
    }, 500);
    return () => clearInterval(iv);
  }, []);

  // Any pointer move or keypress counts as activity → restore the puck+title to full.
  useEffect(() => {
    const onAct = () => bump();
    window.addEventListener("pointermove", onAct, { passive: true });
    window.addEventListener("keydown", onAct);
    return () => {
      window.removeEventListener("pointermove", onAct);
      window.removeEventListener("keydown", onAct);
    };
  }, [bump]);

  const move = useCallback(
    (to: StationId) => {
      if (movementLocked) return; // suspended while a wall BROWSE/DETAIL panel is open
      onDismissKeyHint();
      bump();
      onMove(to);
    },
    [onMove, onDismissKeyHint, bump, movementLocked],
  );

  // Arrow / WASD movement keys (ignored while a wall state is open; Esc is the wall walk, elsewhere).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (movementLocked) return;
      const dir = KEY_TO_DIR[e.key.toLowerCase()];
      if (!dir) return;
      const target = DIR_TO_STATION[dir];
      if (target !== currentId && reachable.has(target)) {
        e.preventDefault();
        move(target);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [movementLocked, reachable, currentId, move]);

  const dim = idle ? 0.45 : 1;
  const showHint = !keyHintDismissed;

  return (
    <>
      {/* Wordmark TR — white @ 45% (recolour the pink source via filter). Not idle-affected. */}
      <StagePinned x={1666} y={44} w={196} h={21} z={30}>
        <img
          src="/hud/chunky-wordmark.png"
          alt="chunkylabs"
          style={{
            display: "block",
            width: 196,
            height: "auto",
            opacity: 0.45,
            filter: "brightness(0) invert(1)",
          }}
        />
      </StagePinned>

      {/* Nav puck BL — idle-fades; any pointer activity over it restores. */}
      <StagePinned x={58} y={922} w={100} h={100} z={31} style={{ pointerEvents: "auto" }}>
        <div
          onMouseEnter={bump}
          onMouseMove={bump}
          style={{ opacity: dim, transition: "opacity .5s ease" }}
        >
          <NavPuck currentId={currentId} reachable={reachable} onMove={move} />
        </div>
      </StagePinned>

      {/* Room title under the puck — Archivo Black 12, white; idle-fades with the puck. */}
      <StagePinned x={58} y={1030} w={220} h={20} z={31}>
        <div
          style={{
            color: "#fff",
            font: `400 12px ${FONT.display}`,
            letterSpacing: ".02em",
            textTransform: "uppercase",
            opacity: dim,
            transition: "opacity .5s ease",
            whiteSpace: "nowrap",
          }}
        >
          {ROOM_TITLE[currentId] ?? ""}
        </div>
      </StagePinned>

      {/* One-time key hint, to the right of the puck; gone after the first move, that session. */}
      {showHint ? (
        <StagePinned x={172} y={958} w={200} h={16} z={31}>
          <div
            style={{
              color: C.muted,
              font: `400 11px ${FONT.mono}`,
              letterSpacing: ".16em",
              whiteSpace: "nowrap",
            }}
          >
            ARROWS / WASD TO MOVE
          </div>
        </StagePinned>
      ) : null}
    </>
  );
}
