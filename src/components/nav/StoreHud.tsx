"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StationId } from "@/data/stations";
import { StagePinned } from "@/components/walls/StagePinned";
import { usePlaybackUnlock } from "@/components/stations/PlaybackUnlock";
import { C, FONT } from "@/components/walls/ui";
import { NavPuck, type Dir, type PuckConfig } from "./NavPuck";

/**
 * Store-level HUD — travels to EVERY station: the nav puck (BL), the room title (centred under the
 * puck), the one-time key hint, and the interior-only wordmark (TR). Two puck variants:
 *
 *  - INTERIOR (counter/mixes/vibes/crate): the room-map compass + centre-exit to the street.
 *  - ENTRY (street/door): vertical-only — up/down walk the entry chain; horizontals hidden.
 *
 * The wordmark is ABSENT on the entry scenes (the storefront's baked brand carries it); only the
 * puck + title travel outside. Persists across navigation; idle-fades the puck+title after 4s; owns
 * the arrow/WASD movement keys (+ E for the interior street-exit).
 */

const ROOM_TITLE: Partial<Record<StationId, string>> = {
  street: "STREET",
  door: "DOOR",
  counter: "COUNTER",
  "left-bins": "MIXES",
  "right-bins": "CRATE",
  "mixtape-shelf": "VIBES",
};

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

const NONE = { target: null } as const;

/** The puck's arm/centre map for a station — variant-aware. */
function puckConfigFor(currentId: StationId): PuckConfig {
  // ENTRY (street/door): the chain runs on up/down; horizontals + centre are inert.
  if (currentId === "street") {
    return { variant: "entry", up: { target: "door" }, down: NONE, left: NONE, right: NONE, center: NONE };
  }
  if (currentId === "door") {
    return {
      variant: "entry",
      up: { target: "counter" },
      down: { target: "street" },
      left: NONE,
      right: NONE,
      center: NONE,
    };
  }
  // INTERIOR: the fixed room map; current room is pink; centre exits to the street.
  return {
    variant: "interior",
    up: { target: "counter", isSelf: currentId === "counter" },
    down: { target: "mixtape-shelf", isSelf: currentId === "mixtape-shelf" },
    left: { target: "left-bins", isSelf: currentId === "left-bins" },
    right: { target: "right-bins", isSelf: currentId === "right-bins" },
    center: { target: "street" },
  };
}

export function StoreHud({
  currentId,
  onMove,
  keyHintDismissed,
  onDismissKeyHint,
}: {
  currentId: StationId;
  onMove: (to: StationId) => void;
  keyHintDismissed: boolean;
  onDismissKeyHint: () => void;
}) {
  const [idle, setIdle] = useState(false);
  const lastActivityRef = useRef(0);
  const { markUnlocked } = usePlaybackUnlock();

  const config = useMemo(() => puckConfigFor(currentId), [currentId]);
  const isEntry = config.variant === "entry";

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
      markUnlocked(); // the puck can be the first gesture on the street — prime media autoplay
      onDismissKeyHint();
      bump();
      onMove(to);
    },
    [onMove, onDismissKeyHint, bump, markUnlocked],
  );

  // Keyboard mirrors every puck mapping: arrows/WASD → arm targets; E → the interior street-exit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "e") {
        const c = config.center.target;
        if (c) {
          e.preventDefault();
          move(c);
        }
        return;
      }
      const dir = KEY_TO_DIR[key];
      if (!dir) return;
      const arm = config[dir];
      if (arm.target && !arm.isSelf) {
        e.preventDefault();
        move(arm.target);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config, move]);

  const dim = idle ? 0.45 : 1;
  const showHint = !keyHintDismissed;

  return (
    <>
      {/* Wordmark TR — INTERIOR ONLY (the storefront's baked brand carries the entry scenes).
          Off-16:9 it floors 58px from the RIGHT (its designed inset), not jammed to the glass. */}
      {!isEntry ? (
        <StagePinned x={1666} y={44} w={196} h={21} z={30} margin={{ right: 58 }}>
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
      ) : null}

      {/* Nav puck BL — idle-fades; any pointer activity over it restores. Off-16:9 it floors 58px
          from the LEFT (its designed inset), not jammed to the glass. */}
      <StagePinned
        x={58}
        y={922}
        w={100}
        h={100}
        z={31}
        margin={{ left: 58 }}
        style={{ pointerEvents: "auto" }}
      >
        <div
          onMouseEnter={bump}
          onMouseMove={bump}
          style={{ opacity: dim, transition: "opacity .5s ease" }}
        >
          <NavPuck config={config} onMove={move} />
        </div>
      </StagePinned>

      {/* Room title under the puck — centred on the puck's vertical axis; follows the puck's left
          floor so it stays under it off-16:9. */}
      <StagePinned x={58} y={1030} w={100} h={20} z={31} margin={{ left: 58 }}>
        <div
          style={{
            color: "#fff",
            font: `400 12px ${FONT.display}`,
            letterSpacing: ".02em",
            textTransform: "uppercase",
            textAlign: "center",
            width: "100%",
            opacity: dim,
            transition: "opacity .5s ease",
            whiteSpace: "nowrap",
          }}
        >
          {ROOM_TITLE[currentId] ?? ""}
        </div>
      </StagePinned>

      {/* One-time key hint, to the right of the puck; gone after the first move, that session.
          Floors at its own left inset (172) so it never slides under the puck off-16:9. */}
      {showHint ? (
        <StagePinned x={172} y={958} w={200} h={16} z={31} margin={{ left: 172 }}>
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
