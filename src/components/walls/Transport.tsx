"use client";

import { useSoundCloud } from "./soundcloud";
import { C, FONT, fmtTime } from "./ui";

/**
 * BR mini-player — the ONLY visible player for SC surfaces (mixes/live/tapes/edits). v5 mini
 * anatomy × 1.2, corner-doctrine BR slot. Reads the SC engine; appears once a track is loaded.
 *
 * ⚠️ The scrubber fill + elapsed readout come from the SC Widget's live position, which is
 * unverified in this environment (see soundcloud.tsx) — eye-verify in a real browser.
 */
export function Transport() {
  const sc = useSoundCloud();
  const item = sc.current;
  if (!item) return null;

  const pct = sc.durationMs > 0 ? Math.min(100, (sc.positionMs / sc.durationMs) * 100) : 0;

  return (
    <div
      className="pointer-events-auto absolute"
      style={{
        right: 91,
        bottom: 91,
        width: 485,
        boxSizing: "border-box",
        border: `1px solid ${C.white}`,
        background: C.mini,
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        overflow: "hidden",
        zIndex: 45,
      }}
    >
      {/* meta row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "16px 17px",
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
            borderRadius: 0,
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
  );
}
