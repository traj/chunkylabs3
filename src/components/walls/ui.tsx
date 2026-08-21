"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import type { WallItem } from "@/data/catalog";

/**
 * Shared wall-UI tokens + primitives. Palette / type scale cribbed verbatim from the v5 reference
 * (docs/reference/mixes-player-detail-v5-figma.html). Zero radius + zero shadow on UI chrome; the
 * in-world cover objects keep the locked rest-shadow treatment (see CoverFrame).
 */

// --- palette (v5) -----------------------------------------------------------------------------
export const C = {
  pink: "#ff4d63", // PLAYING STATE ONLY — nowhere else
  pinkMeta: "#ff8b98",
  cream: "#f7efe2",
  offwhite: "#fff6ea",
  muted: "#d9c3a5",
  gold: "#f0b45c",
  desc: "#e8dbc8",
  ink: "#1a0b06",
  white: "#ffffff",
  panelBrowse: "rgba(36,22,14,.68)",
  panelDetail: "rgba(36,22,14,.72)",
  mini: "rgba(26,16,10,.74)",
  btnDark: "rgba(20,12,8,.6)",
  hair: "rgba(255,255,255,.16)",
  hairStrong: "rgba(255,255,255,.55)",
  tabDim: "rgba(217,195,165,.5)",
} as const;

// --- fonts (next/font CSS vars from layout.tsx) -----------------------------------------------
export const FONT = {
  display: "var(--font-archivo-black), sans-serif",
  body: "var(--font-instrument-sans), sans-serif",
  mono: "var(--font-space-mono), monospace",
} as const;

// --- locked rest treatment for in-world covers -----------------------------------------------
// border 2px solid #fff (OUTSIDE, via inset-less box-shadow ring) + drop shadow + radius 0.
const REST_RING = "0 0 0 2px #fff";
const REST_SHADOW = "0 4px 14px 3px rgba(36,18,0,.7)";
// hover: glow bloom outside the stroke + deeper shadow (rest stays quiet).
const HOVER_SHADOW =
  "0 0 0 2px #fff, 0 0 20px 5px rgba(255,181,92,.34), 0 9px 22px 6px rgba(28,14,0,.82)";

/**
 * An in-world featured cover — the locked rest treatment, with the hover bloom + lift.
 * Used for Mixes (104²), Vibes (172² slot / 164² sleeve), Crate spine (125²).
 */
export function CoverFrame({
  src,
  alt,
  size,
  sleeveInset = 0,
  rot = 0,
  onClick,
  title,
}: {
  src: string;
  alt: string;
  size: number;
  /** Vibes: slot is `size`, sleeve renders `size - 2*inset`. */
  sleeveInset?: number;
  rot?: number;
  onClick?: () => void;
  title?: string;
}) {
  const [hover, setHover] = useState(false);
  const sleeve = size - 2 * sleeveInset;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      title={title}
      aria-label={title ?? alt}
      style={{
        position: "absolute",
        left: sleeveInset,
        top: sleeveInset,
        width: sleeve,
        height: sleeve,
        padding: 0,
        border: 0,
        borderRadius: 0,
        background: "transparent",
        cursor: "pointer",
        transform: `rotate(${rot}deg) translateY(${hover ? -2.5 : 0}px)`,
        transformOrigin: "center",
        transition: "transform .18s ease, box-shadow .18s ease",
        boxShadow: hover ? HOVER_SHADOW : `${REST_RING}, ${REST_SHADOW}`,
      }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
      />
    </button>
  );
}

/**
 * A Crate binclip cover: seated into a bin, bottom clipped at the lip. The clipping FRAME hides
 * the bottom edge (so the bottom stroke never shows by construction); the cover sits inset by the
 * shadow margin so its side/top ring + drop shadow aren't clipped.
 */
export function BinclipCover({
  src,
  alt,
  frameW,
  frameH,
  inset,
  sleeve,
  onClick,
  title,
}: {
  src: string;
  alt: string;
  frameW: number;
  frameH: number;
  inset: number;
  sleeve: number;
  onClick?: () => void;
  title?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      title={title}
      aria-label={title ?? alt}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: frameW,
        height: frameH,
        padding: 0,
        border: 0,
        background: "transparent",
        overflow: "hidden", // clips the cover bottom at the bin lip
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: inset,
          top: inset,
          width: sleeve,
          height: sleeve,
          borderRadius: 0,
          transform: `translateY(${hover ? -2.5 : 0}px)`,
          transition: "transform .18s ease, box-shadow .18s ease",
          boxShadow: hover ? HOVER_SHADOW : `${REST_RING}, ${REST_SHADOW}`,
          display: "block",
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
    </button>
  );
}

/**
 * INTERIM VIEW ALL card — cream card, mono label, same rest treatment as neighbouring covers.
 * Swapped at the sticker-wall pass.
 */
export function ViewAllCard({
  size,
  sleeveInset = 0,
  onClick,
}: {
  size: number;
  /** Slot is `size`; the card renders `size - 2*inset` (matches the sibling covers' sleeve). */
  sleeveInset?: number;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const sleeve = size - 2 * sleeveInset;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label="View all"
      style={{
        position: "absolute",
        left: sleeveInset,
        top: sleeveInset,
        width: sleeve,
        height: sleeve,
        border: 0,
        borderRadius: 0,
        // INTERIM gradient (final design belongs to the sticker-wall pass).
        background: "linear-gradient(135deg, #FF4D63 0%, #C9954F 45%, #4B2EA0 100%)",
        color: C.cream,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${hover ? -2.5 : 0}px)`,
        transition: "transform .18s ease, box-shadow .18s ease",
        boxShadow: hover ? HOVER_SHADOW : `${REST_RING}, ${REST_SHADOW}`,
        font: `700 ${Math.round(sleeve * 0.11)}px ${FONT.mono}`,
        letterSpacing: ".14em",
      }}
    >
      {/* INTERIM component */}
      VIEW ALL
    </button>
  );
}

/**
 * INTERIM Close ✕ — strokeless mono ✕ at 70%, 28×28, 8px corner inset of its panel/card.
 * Swapped at the sticker-wall pass.
 */
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        padding: 0,
        border: 0,
        background: "transparent",
        color: C.cream,
        opacity: 0.7,
        cursor: "pointer",
        font: `400 20px ${FONT.mono}`,
        lineHeight: "28px",
        textAlign: "center",
      }}
    >
      {/* INTERIM component */}
      ✕
    </button>
  );
}

// --- small tag chips (v5) ---------------------------------------------------------------------
export function Tag({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "nowplaying" | "play" | "playlist" | "release";
}) {
  const base: CSSProperties = {
    border: `1px solid ${C.white}`,
    padding: "4px 8px",
    font: `700 9px ${FONT.mono}`,
    letterSpacing: ".12em",
    alignSelf: "flex-start",
    borderRadius: 0,
  };
  if (variant === "nowplaying")
    return <span style={{ ...base, background: C.pink, color: C.ink }}>{children}</span>;
  if (variant === "play")
    return (
      <span style={{ ...base, padding: "5px 12px", letterSpacing: ".18em", color: C.offwhite }}>
        {children}
      </span>
    );
  if (variant === "playlist")
    return <span style={{ ...base, border: `1px solid ${C.gold}`, color: C.gold }}>{children}</span>;
  // release — neutral, no pink
  return <span style={{ ...base, color: C.muted, borderColor: C.muted }}>{children}</span>;
}

// --- formatters -------------------------------------------------------------------------------
/** ms → h:mm:ss or mm:ss (live durations from the SC widget). */
export function fmtTime(ms: number): string {
  if (!ms || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/**
 * Row/card mono meta. SoundCloud durations are junk → YEAR ONLY for SC items. Spotify/Beatport
 * carry no usable date → blank (the tag conveys the kind). Curation fills these in later.
 */
export function metaText(item: WallItem): string {
  if (item.source === "soundcloud") return item.year ? String(item.year) : "";
  return "";
}
