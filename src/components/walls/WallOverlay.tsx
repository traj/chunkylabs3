"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Station } from "@/data/stations";
import type { WallItem } from "@/data/catalog";
import { SoundCloudProvider, useSoundCloud } from "./soundcloud";
import { getWallConfig, type WallConfig } from "./wallConfig";
import { WallStage } from "./WallStage";
import { StagePinned } from "./StagePinned";
import { RestLayer } from "./RestLayer";
import { BrowsePanel, PANEL } from "./BrowsePanel";
import { DetailCard, detailCardStage } from "./DetailCard";
import { Transport, TRANSPORT_STAGE } from "./Transport";

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
        transition: shown
          ? `opacity 300ms ease ${delay}ms`
          : "opacity 120ms ease 0ms",
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

function WallContent({
  config,
  isActive,
  atRest,
  onModeChange,
}: {
  config: WallConfig;
  isActive: boolean;
  atRest: boolean;
  onModeChange?: (mode: Mode) => void;
}) {
  const sc = useSoundCloud();
  const [mode, setMode] = useState<Mode>("rest");
  const [activeTabId, setActiveTabId] = useState<string | null>(config.defaultTabId ?? null);
  const [selected, setSelected] = useState<WallItem | null>(null);
  // Where the open DETAIL was launched from. A featured-cover detail "skips browse" (card only,
  // Esc → rest); a browse-row detail keeps the panel behind it (v5 5b, Esc → browse).
  const [detailFrom, setDetailFrom] = useState<"rest" | "browse">("browse");

  // fade-in contract: content appears only once the scene is at rest.
  const shown = isActive && atRest;

  // Report mode up so StationFrame can gate the functional exit CTAs (hidden in browse/detail).
  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  // Stop audio + reset to REST when the wall goes inactive (navigated away). Playback thus
  // survives every state change WITHIN the wall, but never crosses out of it.
  const wasActive = useRef(isActive);
  useEffect(() => {
    if (wasActive.current && !isActive) {
      sc.stop();
      setMode("rest");
      setSelected(null);
      setActiveTabId(config.defaultTabId ?? null);
    }
    wasActive.current = isActive;
  }, [isActive, sc, config.defaultTabId]);

  const openDetail = useCallback(
    (item: WallItem, from: "rest" | "browse") => {
      setSelected(item);
      const t = tabIdForItem(config, item);
      if (t) setActiveTabId(t);
      setDetailFrom(from);
      setMode("detail");
    },
    [config],
  );

  // Esc / card ✕ walks back one step. From a browse-launched detail → browse; from a featured
  // (rest-launched) detail → straight back to rest ("skips browse"). From browse → rest.
  const back = useCallback(() => {
    setMode((m) => (m === "detail" ? (detailFrom === "browse" ? "browse" : "rest") : "rest"));
  }, [detailFrom]);

  // Esc walks DETAIL → BROWSE → REST (only on the active wall).
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isActive, back]);

  const panelShown = mode === "browse" || (mode === "detail" && detailFrom === "browse");

  return (
    <>
      {/* Diegetic covers — EXACT stage pin (track the picture on the shelf), no clamp. */}
      <WallStage>
        <Fade shown={shown} delay={120}>
          {mode === "rest" ? (
            <RestLayer
              config={config}
              onSelectItem={(item) => openDetail(item, "rest")}
              onViewAll={() => setMode("browse")}
            />
          ) : null}
        </Fade>
      </WallStage>

      {/* Chrome — CLAMP-aware stage pin (tracks the picture but never leaves the viewport). */}
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

      <StagePinned x={TRANSPORT_STAGE.x} y={TRANSPORT_STAGE.y} w={TRANSPORT_STAGE.w} h={TRANSPORT_STAGE.h} z={45}>
        <Fade shown={shown} delay={240}>
          <Transport />
        </Fade>
      </StagePinned>
    </>
  );
}

/**
 * Content-layer host for ONE content wall (Mixes / Vibes / Crate). Rendered by StationFrame for
 * wall stations, over the held video frame + scrim. Wraps the wall in its own SoundCloud engine so
 * playback is scoped to the wall (stops on leave). Non-wall stations render nothing here.
 */
export function WallOverlay({
  station,
  isActive,
  atRest,
  onModeChange,
}: {
  station: Station;
  isActive: boolean;
  atRest: boolean;
  onModeChange?: (mode: Mode) => void;
}) {
  const config = getWallConfig(station.id);
  if (!config) return null;

  // Warm the SC widget on the first transport-playable item of the wall (paused primer).
  const primeUrl =
    config.tabs?.flatMap((t) => t.items).find((i) => i.scUrl)?.scUrl ??
    config.singleList?.items.find((i) => i.scUrl)?.scUrl;

  return (
    <SoundCloudProvider primeUrl={primeUrl}>
      <WallContent
        config={config}
        isActive={isActive}
        atRest={atRest}
        onModeChange={onModeChange}
      />
    </SoundCloudProvider>
  );
}
