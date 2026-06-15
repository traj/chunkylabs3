import type { Metadata } from "next";
import Link from "next/link";
import { BINS, getRecordsByBin, MIXTAPES } from "@/data/inventory";

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
    "Everything in the store as a plain list — no video required. Records and mixtapes.",
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

      <section aria-labelledby="records-heading" className="mb-12">
        <h2 id="records-heading" className="mb-4 text-xl font-medium">
          Records
        </h2>
        {BINS.map((bin) => (
          <div key={bin.id} className="mb-6">
            <h3 className="text-sm uppercase tracking-widest text-white/40">
              {bin.label}
            </h3>
            <p className="text-sm text-white/40">{bin.description}</p>
            <ul className="mt-2 space-y-1">
              {getRecordsByBin(bin.id).map((record) => (
                <li key={record.id}>
                  <span className="font-medium">{record.title}</span>{" "}
                  <span className="text-white/60">— {record.artist}</span>
                  {record.year ? (
                    <span className="text-white/40"> ({record.year})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="mixtapes-heading">
        <h2 id="mixtapes-heading" className="mb-4 text-xl font-medium">
          Mixtapes
        </h2>
        <ul className="space-y-2">
          {MIXTAPES.map((mixtape) => (
            <li key={mixtape.id}>
              <span className="font-medium">{mixtape.title}</span>{" "}
              <span className="text-white/60">— {mixtape.description}</span>{" "}
              <span className="text-white/40">({mixtape.trackCount} tracks)</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
