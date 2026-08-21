"use client";

import { getItem, type WallItem } from "@/data/catalog";
import { BinclipCover, CoverFrame, ViewAllCard } from "./ui";
import type { WallConfig } from "./wallConfig";

/**
 * S0 REST — featured covers racked over the held wall frame (occluding the baked face-out
 * records). Positions are design-space px from the Pen frames. Cover click → DETAIL; VIEW ALL →
 * BROWSE. Interactive; sits inside WallStage's non-interactive canvas, so each slot re-enables
 * pointer events on itself.
 */
export function RestLayer({
  config,
  onSelectItem,
  onViewAll,
}: {
  config: WallConfig;
  onSelectItem: (item: WallItem) => void;
  onViewAll: () => void;
}) {
  const inset = config.sleeveInset ?? 0;
  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
      {/* featured covers (Mixes 104² / Vibes 172² slot / Crate spine 125²) */}
      {config.featured.map((slot) => {
        const item = getItem(slot.itemId);
        if (!item) return null;
        return (
          <div
            key={slot.itemId}
            className="pointer-events-auto absolute"
            style={{ left: slot.x, top: slot.y, width: slot.w, height: slot.h }}
          >
            <CoverFrame
              src={item.artPath}
              alt={item.title}
              title={item.title}
              size={slot.w}
              sleeveInset={inset}
              rot={slot.rot}
              onClick={() => onSelectItem(item)}
            />
          </div>
        );
      })}

      {/* Crate binclips (bottom clipped at the bin lip) */}
      {config.bins?.map((bin) => {
        const item = getItem(bin.itemId);
        if (!item) return null;
        return (
          <div
            key={bin.itemId}
            className="pointer-events-auto absolute"
            style={{ left: bin.frameX, top: bin.frameY, width: bin.frameW, height: bin.frameH }}
          >
            <BinclipCover
              src={item.artPath}
              alt={item.title}
              title={item.title}
              frameW={bin.frameW}
              frameH={bin.frameH}
              inset={bin.inset}
              sleeve={bin.sleeve}
              onClick={() => onSelectItem(item)}
            />
          </div>
        );
      })}

      {/* INTERIM VIEW ALL card */}
      <div
        className="pointer-events-auto absolute"
        style={{
          left: config.viewAll.x,
          top: config.viewAll.y,
          width: config.viewAll.w,
          height: config.viewAll.h,
        }}
      >
        <ViewAllCard size={config.viewAll.w} sleeveInset={inset} onClick={onViewAll} />
      </div>
    </div>
  );
}
