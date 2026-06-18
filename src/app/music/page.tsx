import type { Metadata } from "next";
import Link from "next/link";
import { PLAYLISTS, MIXTAPES } from "@/data/inventory";

/**
 * The escape hatch — a first-class route, not an afterthought.
 *
 * Plain, server-rendered DOM with NO video dependency. This is the SEO/accessibility
 * surface: everything in the store, reachable and readable without the visit.
 * Keep it that way — see CLAUDE.md "Never do this".
 */
export const metadata: Metadata = {
  title: "The music — chunkylabs",
  description:
    "Everything in the store as a plain list — no video required. Playlists and mixtapes.",
};

export default function MusicPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          chunkylabs — the music
        </h1>
        <p className="mt-2 text-white/50">
          Skip the visit. Everything, as plain text. No video required.
        </p>
        <p className="mt-4 flex gap-4 text-sm">
          <Link href="/" className="text-white/70 hover:text-white">
            ← back to the entrance
          </Link>
          <Link href="/store" className="text-white/70 hover:text-white">
            take the full visit instead →
          </Link>
        </p>
      </header>

      {/*
        Bins hold playlists; the shelf holds mixtapes. Releases (counter) and updates
        (corkboard) now have shapes too — they'll list here once the content port fills them.
        Which playlist sits in which bin is genre-driven curation, not stored, so the escape
        hatch lists by content type rather than by station.
      */}
      <section aria-labelledby="playlists-heading" className="mb-12">
        <h2 id="playlists-heading" className="mb-4 text-xl font-medium">
          Playlists
        </h2>
        <ul className="space-y-1">
          {PLAYLISTS.map((playlist) => (
            <li key={playlist.id}>
              <span className="font-medium">{playlist.title}</span>
              {playlist.series ? (
                <span className="text-white/40">
                  {" "}
                  ({playlist.series.name} {playlist.series.index})
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mixtapes-heading">
        <h2 id="mixtapes-heading" className="mb-4 text-xl font-medium">
          Mixtapes
        </h2>
        <ul className="space-y-2">
          {MIXTAPES.map((mixtape) => (
            <li key={mixtape.id}>
              <span className="font-medium">{mixtape.title}</span>
              {mixtape.description ? (
                <span className="text-white/60"> — {mixtape.description}</span>
              ) : null}
              {typeof mixtape.trackCount === "number" ? (
                <span className="text-white/40"> ({mixtape.trackCount} tracks)</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
