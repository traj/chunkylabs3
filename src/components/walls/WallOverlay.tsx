"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Station } from "@/data/stations";
import type { WallItem } from "@/data/catalog";
import { getWallConfig, type WallConfig } from "./wallConfig";
import { WallStage } from "./WallStage";
import { StagePinned } from "./StagePinned";
import { RestLayer } from "./RestLayer";
import { BrowsePanel, PANEL } from "./BrowsePanel";
import { DetailCard, detailCardStage } from "./DetailCard";

type Mode = "rest" | "browse" | "detail";

/** Fade group for the fade-in contract: enters ~staggered AFTER atRest, dissolves fast before a tween. */
function Fade({
  shown,
  delay,
  children,
}: {
  shown: boolean;
  delay: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transition: shown ? `opacity 300ms ease ${delay}ms` : "opacity 120ms ease 0ms",
      }}
    >
      {children}
    </div>
  );
}

function tabIdForItem(config: WallConfig, item: WallItem): string | null {
  if (!config.tabs) return null;
  const tab = config.tabs.find((t) => t.items.some((i) => i.id === item.id));
  return tab?.id ?? config.defaultTabId ?? config.tabs[0]?.id ?? null;
}

/**
 * Content-layer host for ONE content wall (Mixes / Vibes / Crate). Rendered by StationFrame over
 * the held frame + scrim. The SoundCloud engine + the player live at the STORE level now (the
 * player is a persistent music object, not per-wall), so this only owns the wall's REST→BROWSE→
 * DETAIL content.
 *
 * REST content (featured covers) stays MOUNTED in every state — the panel/card sits OVER it
 * (smoked-glass premise). Everything dissolves only for tweens (fade-in contract); on leaving a
 * wall the panels fade out rather than vanish, and the wall resets to REST on the next arrival.
 */
export function WallOverlay({
  station,
  isActive,
  atRest,
}: {
  station: Station;
  isActive: boolean;
  atRest: boolean;
}) {
  const config = getWallConfig(station.id);
  const [mode, setMode] = useState<Mode>("rest");
  const [activeTabId, setActiveTabId] = useState<string | null>(config?.defaultTabId ?? null);
  const [selected, setSelected] = useState<WallItem | null>(null);
  // Where the open DETAIL was launched from — a featured-cover detail skips browse (Esc → rest).
  const [detailFrom, setDetailFrom] = useState<"rest" | "browse">("browse");

  const shown = isActive && atRest;

  // Reset to REST on ARRIVAL (not on leave) so the outgoing panels dissolve rather than vanish.
  const wasActive = useRef(isActive);
  useEffect(() => {
    if (!wasActive.current && isActive) {
      setMode("rest");
      setSelected(null);
      setActiveTabId(config?.defaultTabId ?? null);
    }
    wasActive.current = isActive;
  }, [isActive, config?.defaultTabId]);

  const openDetail = useCallback(
    (item: WallItem, from: "rest" | "browse") => {
      if (!config) return;
      setSelected(item);
      const t = tabIdForItem(config, item);
      if (t) setActiveTabId(t);
      setDetailFrom(from);
      setMode("detail");
    },
    [config],
  );

  const back = useCallback(() => {
    setMode((m) => (m === "detail" ? (detailFrom === "browse" ? "browse" : "rest") : "rest"));
  }, [detailFrom]);

  // Esc walks DETAIL → BROWSE → REST (back out without moving). Direction keys navigate (StoreHud).
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, back]);

  if (!config) return null;

  const panelShown = mode === "browse" || (mode === "detail" && detailFrom === "browse");

  return (
    <>
      {/* REST covers — EXACT stage pin, MOUNTED in every state (panel/card sits over them). The
          canonical rest still is the BOTTOM of the stack: it fades in WITH the covers (same group)
          and dissolves with them before any tween, so the covers occlude an identical background on
          every arrival route while transitions still play against the clean video. */}
      <WallStage>
        <Fade shown={shown} delay={120}>
          <img
            src={config.restStill}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0"
            style={{ width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
          />
          <RestLayer
            config={config}
            onSelectItem={(item) => openDetail(item, "rest")}
            onViewAll={() => setMode("browse")}
          />
        </Fade>
      </WallStage>

      {/* Chrome — CLAMP-aware stage pin. */}
      {panelShown ? (
        <StagePinned x={PANEL.x} y={PANEL.y} w={PANEL.w} h={PANEL.h} z={30}>
          <Fade shown={shown} delay={120}>
            <BrowsePanel
              config={config}
              activeTabId={activeTabId}
              onTabChange={setActiveTabId}
              onSelectItem={(item) => openDetail(item, "browse")}
              onClose={() => setMode("rest")}
            />
          </Fade>
        </StagePinned>
      ) : null}

      {mode === "detail" && selected ? (
        <StagePinned {...detailCardStage(selected)} z={40}>
          <Fade shown={shown} delay={180}>
            <DetailCard item={selected} onClose={back} />
          </Fade>
        </StagePinned>
      ) : null}
    </>
  );
}
