"use client";

import { useState } from "react";
import { SOUNDCLOUD_ARTIST_URL, type WallItem } from "@/data/catalog";
import { useSoundCloud } from "./soundcloud";
import { C, CloseButton, FONT, Tag, metaText } from "./ui";
import type { WallConfig, WallTab } from "./wallConfig";

// v5 panel anatomy × 1.2 → design-space px. Size only; StagePinned places it at (1265,91).
export const PANEL = { x: 1265, y: 91, w: 530, h: 754 };

function Row({
  item,
  playing,
  onClick,
}: {
  item: WallItem;
  playing: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const meta = metaText(item);
  // pink NOW PLAYING state ONLY while actually playing; hover shows PLAY; else default.
  const bg = playing ? "rgba(74,17,24,.5)" : hover ? "rgba(44,27,18,.72)" : "transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        gap: 17,
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        padding: playing ? "16px 26px 16px 23px" : "16px 26px",
        background: bg,
        border: 0,
        borderBottom: `1px solid ${C.hair}`,
        borderTop: hover && !playing ? `1px solid ${C.white}` : "1px solid transparent",
        borderLeft: playing ? `3px solid ${C.pink}` : "3px solid transparent",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 67,
          height: 67,
          flex: "none",
          border: `1px solid ${playing ? C.white : "#e8ded0"}`,
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
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <span
          style={{
            font: `600 18px ${FONT.body}`,
            color: playing ? C.offwhite : C.cream,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.title}
        </span>
        {meta ? (
          <span style={{ font: `400 13px ${FONT.mono}`, color: playing ? C.pinkMeta : C.muted }}>
            {meta}
          </span>
        ) : null}
      </span>
      {/* PLAY hover tag only for transport-playable (SoundCloud) items — never on Spotify/Beatport
          rows (they open an embed / a buy link, not the transport). */}
      {playing ? (
        <Tag variant="nowplaying">NOW PLAYING</Tag>
      ) : hover && item.scUrl ? (
        <Tag variant="play">PLAY</Tag>
      ) : null}
    </button>
  );
}

export function BrowsePanel({
  config,
  activeTabId,
  onTabChange,
  onSelectItem,
  onClose,
}: {
  config: WallConfig;
  activeTabId: string | null;
  onTabChange: (id: string) => void;
  onSelectItem: (item: WallItem) => void;
  onClose: () => void;
}) {
  const sc = useSoundCloud();
  const tabs: readonly WallTab[] | undefined = config.tabs;
  const activeTab = tabs?.find((t) => t.id === activeTabId) ?? tabs?.[0];
  const items = activeTab ? activeTab.items : config.singleList?.items ?? [];
  const title = activeTab?.label ?? config.roomTitle;
  const grammar = activeTab?.grammar ?? config.singleList?.grammar ?? "spotify";

  // Summary: ≤2 tabs → all counts ("36 EDITS · 2 RELEASES"); else the active tab's count.
  const summary =
    tabs && tabs.length <= 2
      ? tabs.map((t) => `${t.items.length} ${t.label}`).join(" · ")
      : `${items.length} ${title}`;

  return (
    <div
      style={{
        pointerEvents: "auto",
        width: PANEL.w,
        height: PANEL.h,
        border: `1px solid ${C.white}`,
        background: C.panelBrowse,
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <CloseButton onClick={onClose} />

      {/* header */}
      <div
        style={{
          padding: "31px 29px 22px",
          borderBottom: `1px solid ${C.hairStrong}`,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            font: `400 48px ${FONT.display}`,
            textTransform: "uppercase",
            lineHeight: 1,
            letterSpacing: "-.01em",
            color: C.cream,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ font: `400 13px ${FONT.mono}`, letterSpacing: ".14em", color: C.muted }}>
            {summary}
          </div>
          {grammar === "transport" ? (
            <a
              href={SOUNDCLOUD_ARTIST_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                border: `1px solid ${C.white}`,
                background: C.btnDark,
                padding: "8px 13px",
                font: `700 11px ${FONT.mono}`,
                letterSpacing: ".16em",
                color: C.cream,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              OPEN IN SOUNDCLOUD
            </a>
          ) : null}
        </div>
      </div>

      {/* tabs */}
      {tabs ? (
        <div
          style={{
            padding: "19px 29px",
            borderBottom: "1px solid rgba(255,255,255,.4)",
            display: "flex",
            gap: 22,
            font: `700 13px ${FONT.mono}`,
            letterSpacing: ".22em",
          }}
        >
          {tabs.map((t) => {
            const active = t.id === (activeTab?.id ?? null);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onTabChange(t.id)}
                style={{
                  background: "transparent",
                  border: 0,
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                  letterSpacing: "inherit",
                  color: active ? C.pink : C.tabDim,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* rows */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            playing={sc.current?.id === item.id && sc.isPlaying}
            onClick={() => onSelectItem(item)}
          />
        ))}
      </div>
    </div>
  );
}
