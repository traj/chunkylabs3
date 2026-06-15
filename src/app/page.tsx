import Link from "next/link";
import { FIRST_STATION, STATIONS } from "@/data/stations";

/**
 * Entry screen. Two first-class paths:
 *  - Enter the store → the video walk-through (/store).
 *  - Skip intro → the plain-DOM music list (/music). This is a deliberate, equal path,
 *    not a bailout — it's also the SEO/accessibility surface.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          chunkylabs
        </h1>
        <p className="mt-3 text-white/50">An interactive record store visit.</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <Link
          href="/store"
          className="rounded-full bg-white px-8 py-3 text-base font-medium text-black transition-opacity hover:opacity-90"
        >
          Enter the store →
        </Link>
        <Link
          href="/music"
          className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline"
        >
          Skip intro — just show me the music
        </Link>
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-white/30">
        {STATIONS.length} stations · starts at {FIRST_STATION.label}
      </p>
    </main>
  );
}
