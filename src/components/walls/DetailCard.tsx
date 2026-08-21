"use client";

import type { WallItem } from "@/data/catalog";
import { useSoundCloud } from "./soundcloud";
import { SpotifyEmbed } from "./SpotifyEmbed";
import { C, CloseButton, FONT, Tag, metaText } from "./ui";

const CARD_W = 624; // v5 520 × 1.2
const POS_5B = { x: 610, y: 216 };
const POS_5C = { x: 610, y: 150 };

/** Stage placement (design px) for a detail card, by surface type — StagePinned positions it.
 *  Heights are approximate (content-driven) and only feed the off-ratio clamp. */
export function detailCardStage(item: WallItem): { x: number; y: number; w: number; h: number } {
  const isSpotify = item.kind === "playlist" || item.kind === "vibe";
  return isSpotify
    ? { ...POS_5C, w: CARD_W, h: 560 }
    : { ...POS_5B, w: CARD_W, h: 430 };
}

function ActionPrimary({
  label,
  onClick,
  href,
  neutral,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  neutral?: boolean;
}) {
  const style: React.CSSProperties = {
    border: `1px solid ${C.white}`,
    background: neutral ? C.btnDark : C.pink,
    padding: "14px 36px",
    font: `700 16px ${FONT.body}`,
    letterSpacing: ".02em",
    color: neutral ? C.cream : C.ink,
    borderRadius: 0,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  };
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {label}
      </a>
    );
  return (
    <button type="button" onClick={onClick} style={style}>
      {label}
    </button>
  );
}

function ActionSecondary({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        border: `1px solid ${C.white}`,
        background: C.btnDark,
        padding: "14px 26px",
        font: `600 16px ${FONT.body}`,
        color: C.cream,
        borderRadius: 0,
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {label}
    </a>
  );
}

export function DetailCard({
  item,
  onClose,
}: {
  item: WallItem;
  onClose: () => void;
}) {
  const sc = useSoundCloud();
  const isSpotify = item.kind === "playlist" || item.kind === "vibe";
  const isRelease = item.kind === "release";
  const isSC = !isSpotify && !isRelease;
  const playingThis = sc.current?.id === item.id && sc.isPlaying;

  const coverSize = isSpotify ? 178 : 192;
  const titleSize = isSpotify ? 36 : 38;
  const meta = metaText(item);

  return (
    <div
      style={{
        pointerEvents: "auto",
        width: CARD_W,
        border: `1px solid ${C.white}`,
        background: C.panelDetail,
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        overflow: "hidden",
      }}
    >
      <CloseButton onClick={onClose} />
      <div style={{ padding: 29, display: "flex", flexDirection: "column", gap: 22 }}>
        {/* head */}
        <div style={{ display: "flex", gap: 24 }}>
          <span
            style={{
              width: coverSize,
              height: coverSize,
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
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 11, minWidth: 0 }}>
            {isSpotify ? (
              <Tag variant="playlist">PLAYLIST</Tag>
            ) : isRelease ? (
              <Tag variant="release">RELEASE</Tag>
            ) : playingThis ? (
              <Tag variant="nowplaying">NOW PLAYING</Tag>
            ) : null}
            <div
              style={{
                font: `400 ${titleSize}px ${FONT.display}`,
                lineHeight: 0.96,
                textTransform: "uppercase",
                letterSpacing: "-.01em",
                color: C.offwhite,
              }}
            >
              {item.title}
            </div>
            {meta ? (
              <div
                style={{
                  font: `400 13px ${FONT.mono}`,
                  letterSpacing: ".08em",
                  color: playingThis ? C.pinkMeta : C.muted,
                }}
              >
                {meta}
              </div>
            ) : null}
          </div>
        </div>

        {/* description (INTERIM draft copy) */}
        <div style={{ font: `400 18px ${FONT.body}`, lineHeight: 1.5, color: C.desc }}>
          {item.blurb}
        </div>

        {/* Spotify embed (5c) */}
        {isSpotify && item.spotifyEmbedUrl ? (
          <SpotifyEmbed embedUrl={item.spotifyEmbedUrl} />
        ) : null}

        {/* actions */}
        <div style={{ display: "flex", gap: 12 }}>
          {isSC ? (
            <>
              {playingThis ? (
                <ActionPrimary label="PAUSE" onClick={() => sc.pause()} />
              ) : (
                <ActionPrimary label="PLAY" onClick={() => sc.playItem(item)} />
              )}
              <ActionSecondary label="OPEN IN SOUNDCLOUD" href={item.externalUrl} />
            </>
          ) : isRelease ? (
            <ActionPrimary label="BUY ON BEATPORT" href={item.externalUrl} neutral />
          ) : (
            <ActionSecondary label="OPEN IN SPOTIFY" href={item.externalUrl} />
          )}
        </div>
      </div>
    </div>
  );
}
