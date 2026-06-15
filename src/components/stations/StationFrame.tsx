import Link from "next/link";
import type { Station } from "@/data/stations";
import { StationTransition } from "./StationTransition";

/**
 * Placeholder for ONE fixed camera station.
 *
 * Two layers, exactly as the real design composites them:
 *  1. Transition layer — when the station has a transition clip, the play-through <video>
 *     (StationTransition) mounts here. The first station (street) has no transition, so it
 *     shows the empty, labeled placeholder box instead.
 *  2. DOM layer — live text/CTAs composited over the scene.
 *
 * Renders a full-viewport <section id={station.id}> so the walk-through is navigable by
 * native scroll and by Lenis `scrollTo("#id")`.
 */
export function StationFrame({
  station,
  index,
  total,
  activeIndex,
}: {
  station: Station;
  index: number;
  total: number;
  activeIndex: number;
}) {
  const hasTransition = Boolean(station.transitionIn?.h264Src);

  return (
    <section
      id={station.id}
      data-station={station.id}
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden border-b border-white/5 px-6"
    >
      {/* 1. TRANSITION LAYER */}
      {hasTransition && station.transitionIn ? (
        <StationTransition
          asset={station.transitionIn}
          index={index}
          activeIndex={activeIndex}
        />
      ) : (
        <div
          data-transition-layer
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-white/25">
            transition layer
            <span className="mt-1 block normal-case tracking-normal text-white/15">
              first station — no transition plays in
            </span>
          </div>
        </div>
      )}

      {/* scrim so DOM text stays readable over the video */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40"
      />

      {/* 2. DOM LAYER — composited over the scene. */}
      <div className="relative z-10 max-w-xl text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-white/60">
          Station {index + 1} / {total}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight drop-shadow sm:text-4xl">
          STATION: {station.label}
        </h2>
        <p className="mt-3 text-sm text-white/70">{station.description}</p>

        {station.dom.heading && (
          <h3 className="mt-8 text-xl font-medium text-white">{station.dom.heading}</h3>
        )}
        {station.dom.body && (
          <p className="mt-2 text-base text-white/80">{station.dom.body}</p>
        )}
        {station.dom.cta && (
          <Link
            href={station.dom.cta.href}
            className="mt-6 inline-block rounded-full border border-white/30 bg-black/30 px-5 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            {station.dom.cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}
