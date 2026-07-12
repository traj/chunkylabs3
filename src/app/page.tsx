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
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Storefront title-card backdrop — the street station's REST FRAME (the crisp out0
          composite), the same file /store opens on. Deliberately NOT the clip's poster any more:
          that is the gen's soft, repainted rendering of this exact plate, so the wordmark and
          sign type were mush on the very first thing anyone sees. Full-bleed, object-cover. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/stills/entry-street.jpg)" }}
      />
      {/* Legibility scrim — leans dark on purpose: this is a title card, so the bright warm
          windows must not fight the white title block. Sits OVER the image, UNDER the content. */}
      <div aria-hidden className="absolute inset-0 bg-black/70" />

      {/* Content — lifted above the backdrop layers. Unchanged copy, links, and routes. */}
      <div className="relative z-10 flex flex-col items-center gap-10 [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            chunkylabs
          </h1>
          <p className="mt-3 text-white/70">An interactive record store visit.</p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Link
            href="/store"
            className="rounded-full bg-white px-8 py-3 text-base font-medium text-black [text-shadow:none] transition-opacity hover:opacity-90"
          >
            Enter the store →
          </Link>
          <Link
            href="/music"
            className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            Skip intro — just show me the music
          </Link>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          {STATIONS.length} stations · starts at {FIRST_STATION.label}
        </p>
      </div>
    </main>
  );
}
