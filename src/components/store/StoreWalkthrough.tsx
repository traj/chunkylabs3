"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { STATIONS } from "@/data/stations";
import { StationFrame } from "@/components/stations/StationFrame";
import { ScrollProgressBar } from "@/components/store/ScrollProgressBar";

/**
 * Composes the stations in order and makes the visit navigable.
 *
 * STATIONS is the single source of order — order, prev/next, and the indicator all derive
 * from it. Navigation is play-through-friendly: native scroll OR prev/next buttons that
 * Lenis-scroll to the adjacent station's anchor.
 *
 * Active-station tracking uses IntersectionObserver (not scroll-scrubbing) — the same
 * gate the real build will use to trigger a station's play-through video on enter.
 */
export function StoreWalkthrough() {
  const lenis = useLenis();
  const [active, setActive] = useState(0);
  const total = STATIONS.length;

  useEffect(() => {
    const sections = STATIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = STATIONS.findIndex((s) => s.id === entry.target.id);
          if (idx !== -1) setActive(idx);
        }
      },
      { threshold: 0.5 },
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(total - 1, index));
    const target = STATIONS[clamped];
    if (lenis) {
      lenis.scrollTo(`#${target.id}`);
    } else {
      document.getElementById(target.id)?.scrollIntoView({ behavior: "smooth" });
    }
    setActive(clamped);
  }

  return (
    <>
      <ScrollProgressBar />

      <main>
        {STATIONS.map((station, i) => (
          <StationFrame
            key={station.id}
            station={station}
            index={i}
            total={total}
          />
        ))}
      </main>

      <nav
        aria-label="Walk-through navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-4 border-t border-white/10 bg-black/60 px-4 py-3 backdrop-blur"
      >
        <button
          type="button"
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm disabled:opacity-30"
        >
          ← Prev
        </button>
        <span className="min-w-40 text-center text-xs uppercase tracking-widest text-white/60">
          {active + 1} / {total} · {STATIONS[active].label}
        </span>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          disabled={active === total - 1}
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm disabled:opacity-30"
        >
          Next →
        </button>
      </nav>
    </>
  );
}
