"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSoundCloud } from "@/components/walls/soundcloud";
import { C, FONT, fmtTime } from "@/components/walls/ui";
import { computeCover, useViewport } from "@/components/stations/useStage";

/**
 * The persistent music player — CHROME (like the wordmark/HUD): constant, floating above the video
 * at ALL times while a track is loaded (playing or paused), through transitions, at every station
 * including street/door. It does NOT dissolve around tweens (the fade-in contract governs
 * wall-pinned content, not this). It only leaves when the user hits its ✕ (→ stop) or the track
 * ends. Spawns bottom-left beside the puck, draggable by the left-edge grip (clamped to a 16px
 * viewport gutter), position persists for the session.
 *
 * v5 mini-player anatomy × 1.2, authored in stage px and scaled to the object-cover box.
 */

const GRIP = 20; // stage px — the drag handle strip on the left
const PLAYER = 485; // stage px — the mini-player body (v5 404 × 1.2)
const W = GRIP + PLAYER;
const H = 152; // stage px — the two rows fully (meta 85 + hair + transport 64 + border), for clamp

export function StorePlayer() {
  const sc = useSoundCloud();
  const { vw, vh } = useViewport();
  // Spawn bottom-left beside the puck; position persists for the session (survives navigation).
  const [pos, setPos] = useState({ x: 200, y: 924 });
  const onDrag = setPos;
  const dragRef = useRef<{ cx: number; cy: number; px: number; py: number; scale: number } | null>(
    null,
  );

  // Clamp a stage position so the whole unit stays within a 16px viewport gutter.
  const clampToStage = useCallback(
    (sx: number, sy: number, cover: ReturnType<typeof computeCover>) => {
      const boxW = W * cover.scale;
      const boxH = H * cover.scale;
      const vX = Math.max(16, Math.min(cover.left + sx * cover.scale, Math.max(16, vw - boxW - 16)));
      const vY = Math.max(16, Math.min(cover.top + sy * cover.scale, Math.max(16, vh - boxH - 16)));
      return { x: (vX - cover.left) / cover.scale, y: (vY - cover.top) / cover.scale };
    },
    [vw, vh],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !vw) return;
      const cover = computeCover(vw, vh);
      const nx = d.px + (e.clientX - d.cx) / d.scale;
      const ny = d.py + (e.clientY - d.cy) / d.scale;
      onDrag(clampToStage(nx, ny, cover));
    },
    [vw, vh, onDrag, clampToStage],
  );
  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }, [onPointerMove]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const item = sc.current;
  if (!item || !vw) return null;

  const cover = computeCover(vw, vh);
  const clamped = clampToStage(pos.x, pos.y, cover);
  const left = cover.left + clamped.x * cover.scale;
  const top = cover.top + clamped.y * cover.scale;
  const pct = sc.durationMs > 0 ? Math.min(100, (sc.positionMs / sc.durationMs) * 100) : 0;

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current = { cx: e.clientX, cy: e.clientY, px: clamped.x, py: clamped.y, scale: cover.scale };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: W,
        // Height sizes to the two rows (no fixed height → the play button is never clipped).
        transform: `scale(${cover.scale})`,
        transformOrigin: "top left",
        pointerEvents: "auto",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* drag grip — vertical dots on the left edge */}
      <button
        type="button"
        aria-label="Move player"
        onPointerDown={startDrag}
        style={{
          width: GRIP,
          flex: "none",
          border: `1px solid ${C.white}`,
          borderRight: 0,
          background: C.mini,
          cursor: "grab",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: 0,
          touchAction: "none",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(247,239,226,.55)" }}
          />
        ))}
      </button>

      {/* mini-player body */}
      <div
        style={{
          position: "relative",
          width: PLAYER,
          boxSizing: "border-box",
          border: `1px solid ${C.white}`,
          background: C.mini,
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          overflow: "hidden",
        }}
      >
        {/* INTERIM close ✕ */}
        <button
          type="button"
          onClick={() => sc.stop()}
          aria-label="Close player"
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            padding: 0,
            border: 0,
            background: "transparent",
            color: C.cream,
            opacity: 0.7,
            cursor: "pointer",
            font: `400 16px ${FONT.mono}`,
            lineHeight: "22px",
            zIndex: 2,
          }}
        >
          ✕
        </button>

        {/* meta row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 40px 16px 17px",
            borderBottom: "1px solid rgba(255,255,255,.28)",
          }}
        >
          <span
            style={{
              width: 53,
              height: 53,
              flex: "none",
              border: `1px solid ${C.white}`,
              overflow: "hidden",
              display: "block",
            }}
          >
            <img
              src={item.artPath}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </span>
          <div
            style={{
              flex: 1,
              font: `600 17px ${FONT.body}`,
              color: C.offwhite,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.title}
          </div>
          {sc.isPlaying ? (
            <span
              style={{
                border: `1px solid ${C.white}`,
                background: C.pink,
                padding: "4px 8px",
                font: `700 9px ${FONT.mono}`,
                letterSpacing: ".12em",
                color: C.ink,
              }}
            >
              NOW PLAYING
            </span>
          ) : null}
        </div>

        {/* transport row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 17px" }}>
          <button
            type="button"
            onClick={() => sc.toggle()}
            aria-label={sc.isPlaying ? "Pause" : "Play"}
            style={{
              width: 41,
              height: 36,
              flex: "none",
              border: `1px solid ${C.white}`,
              background: C.pink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {sc.isPlaying ? (
              <>
                <span style={{ width: 5, height: 16, background: C.ink, display: "block" }} />
                <span style={{ width: 5, height: 16, background: C.ink, display: "block" }} />
              </>
            ) : (
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderLeft: `13px solid ${C.ink}`,
                  display: "block",
                }}
              />
            )}
          </button>
          <div style={{ font: `700 13px ${FONT.mono}`, color: C.offwhite }}>{fmtTime(sc.positionMs)}</div>
          <div style={{ flex: 1, height: 1, background: "rgba(232,222,208,.32)", position: "relative" }}>
            <div
              style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: C.pink }}
            />
            <div
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: -3,
                width: 8,
                height: 8,
                marginLeft: -4,
                background: C.white,
              }}
            />
          </div>
          <div style={{ font: `400 13px ${FONT.mono}`, color: C.muted }}>{fmtTime(sc.durationMs)}</div>
        </div>
      </div>
    </div>
  );
}
