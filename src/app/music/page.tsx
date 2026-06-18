import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  MIXTAPES,
  PLAYLISTS,
  RELEASES,
  UPDATES,
  type Mixtape,
  type Playlist,
  type Release,
  type Update,
  type UpdateKind,
} from "@/data/inventory";

/**
 * The escape hatch — a first-class route, not an afterthought.
 *
 * Plain, server-rendered DOM with NO video dependency. This is the SEO/accessibility
 * surface: the whole catalogue, reachable and readable without the visit. It renders the
 * real inventory by content category (genre is still empty — a later curation pass), with
 * working Spotify / SoundCloud embeds, Beatport purchase CTAs, and the news log.
 *
 * Keep it video-free and server-rendered — see CLAUDE.md "Never do this".
 */
export const metadata: Metadata = {
  title: "The music — chunkylabs",
  description:
    "The full chunkylabs catalogue as plain text: SoundCloud mixtapes, the Vibes playlist series, Spotify playlists, Beatport releases, and news. No video required.",
};

// --- Embed URL builders (reconstructed from the bare ids stored in inventory.ts) ----------

const spotifyEmbedSrc = (playlistId: string) =>
  `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;

/** SoundCloud widget player, matching the old site's known-good embed format. */
const soundcloudEmbedSrc = (playlistId: string) =>
  `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A${playlistId}&color=%23141721&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;

// --- Per-kind flyer styling for updates (cheap: a coloured dot + label) -------------------

const KIND_STYLES: Record<UpdateKind, { label: string; dot: string }> = {
  gig: { label: "Gig", dot: "bg-amber-400" },
  release: { label: "Release", dot: "bg-emerald-400" },
  announcement: { label: "Announcement", dot: "bg-sky-400" },
  press: { label: "Press", dot: "bg-violet-400" },
};

// --- Presentational pieces (all server-rendered, no client JS) ----------------------------

function SectionHeading({
  id,
  title,
  count,
  blurb,
}: {
  id: string;
  title: string;
  count: number;
  blurb: string;
}) {
  return (
    <header className="mb-6">
      <h2
        id={`${id}-heading`}
        className="text-xl font-medium tracking-tight sm:text-2xl"
      >
        {title}{" "}
        <span className="text-base font-normal text-white/30">({count})</span>
      </h2>
      <p className="mt-1 text-sm text-white/50">{blurb}</p>
    </header>
  );
}

function SpotifyEmbed({
  playlistId,
  title,
}: {
  playlistId: string;
  title: string;
}) {
  return (
    <iframe
      src={spotifyEmbedSrc(playlistId)}
      title={`Spotify player — ${title}`}
      height={352}
      loading="lazy"
      className="w-full rounded-lg"
      style={{ border: 0 }}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}

function SoundCloudEmbed({
  playlistId,
  title,
}: {
  playlistId: string;
  title: string;
}) {
  return (
    <iframe
      src={soundcloudEmbedSrc(playlistId)}
      title={`SoundCloud player — ${title}`}
      height={300}
      loading="lazy"
      className="w-full rounded-lg"
      style={{ border: 0 }}
      allow="autoplay"
    />
  );
}

function EmbedCard({ children }: { children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-3">
      {children}
    </article>
  );
}

function PlaylistCard({ playlist }: { playlist: Playlist }) {
  return (
    <EmbedCard>
      <h3 className="mb-2 px-1 text-sm font-medium">
        {playlist.title}
        {playlist.series ? (
          <span className="ml-2 align-middle text-[10px] uppercase tracking-[0.2em] text-white/30">
            {playlist.series.name} series
          </span>
        ) : null}
      </h3>
      <SpotifyEmbed playlistId={playlist.embed.playlistId} title={playlist.title} />
    </EmbedCard>
  );
}

function MixtapeCard({ mixtape }: { mixtape: Mixtape }) {
  return (
    <EmbedCard>
      <h3 className="mb-2 px-1 text-sm font-medium">
        {mixtape.title}
        {mixtape.description ? (
          <span className="ml-2 text-white/40">— {mixtape.description}</span>
        ) : null}
      </h3>
      <SoundCloudEmbed playlistId={mixtape.embed.playlistId} title={mixtape.title} />
    </EmbedCard>
  );
}

function ReleaseCard({ release }: { release: Release }) {
  return (
    <article className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {release.artworkUrl ? (
        <Image
          src={release.artworkUrl}
          alt={`${release.title} — cover art`}
          width={400}
          height={400}
          sizes="(min-width: 640px) 14rem, 45vw"
          className="h-auto w-full"
        />
      ) : null}
      <div className="p-4">
        <h3 className="text-base font-medium">{release.title}</h3>
        {release.artist ? (
          <p className="mt-0.5 text-sm text-white/50">{release.artist}</p>
        ) : null}
        <a
          href={release.purchaseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Buy on {release.storefront ?? "Beatport"}
        </a>
      </div>
    </article>
  );
}

function UpdateCard({ update }: { update: Update }) {
  const style = KIND_STYLES[update.kind];
  const iso = /^upd-\d{4}-\d{2}-\d{2}$/.test(update.id)
    ? update.id.slice(4)
    : undefined;

  return (
    <li>
      <article className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <time dateTime={iso} className="font-mono text-white/40">
            {update.date}
          </time>
          <span className="inline-flex items-center gap-1.5 uppercase tracking-[0.2em] text-white/50">
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
            {style.label}
          </span>
        </div>
        <h3 className="text-base font-medium">{update.title}</h3>
        {update.body ? (
          <p className="mt-1 text-sm leading-relaxed text-white/70">{update.body}</p>
        ) : null}
        {update.link ? (
          <a
            href={update.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-white/80 underline-offset-4 hover:text-white hover:underline"
          >
            {update.link.label} →
          </a>
        ) : null}
      </article>
    </li>
  );
}

export default function MusicPage() {
  // Vibes vs Various split off the data itself (Vibes carry series identity; Various don't).
  const vibes = PLAYLISTS.filter((p) => p.series);
  const various = PLAYLISTS.filter((p) => !p.series);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">chunkylabs</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          The music
        </h1>
        <p className="mt-3 max-w-prose text-white/50">
          The whole shop as plain text — every mix, playlist and release in one place.
          No video required.
        </p>

        <nav
          aria-label="Jump to section"
          className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/60"
        >
          <a href="#mixtapes" className="hover:text-white">Mixtapes</a>
          <a href="#vibes" className="hover:text-white">Vibes</a>
          <a href="#various" className="hover:text-white">Various</a>
          <a href="#releases" className="hover:text-white">Releases</a>
          <a href="#updates" className="hover:text-white">Updates</a>
        </nav>

        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href="/" className="text-white/70 hover:text-white">
            ← entrance
          </Link>
          <Link href="/store" className="text-white/70 hover:text-white">
            take the full visit →
          </Link>
        </p>
      </header>

      <div className="space-y-16">
        {/* Mixtapes — SoundCloud sets */}
        <section
          id="mixtapes"
          aria-labelledby="mixtapes-heading"
          className="scroll-mt-6"
        >
          <SectionHeading
            id="mixtapes"
            title="Mixtapes"
            count={MIXTAPES.length}
            blurb="Long-form DJ sets on SoundCloud."
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {MIXTAPES.map((m) => (
              <MixtapeCard key={m.id} mixtape={m} />
            ))}
          </div>
        </section>

        {/* Vibes — the Spotify series */}
        <section id="vibes" aria-labelledby="vibes-heading" className="scroll-mt-6">
          <SectionHeading
            id="vibes"
            title="Vibes"
            count={vibes.length}
            blurb="The Vibes series — al b's running playlist series on Spotify, newest first."
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {vibes.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        </section>

        {/* Various — other Spotify playlists */}
        <section id="various" aria-labelledby="various-heading" className="scroll-mt-6">
          <SectionHeading
            id="various"
            title="Various playlists"
            count={various.length}
            blurb="Other playlists from the shop."
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {various.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        </section>

        {/* Releases — Beatport */}
        <section
          id="releases"
          aria-labelledby="releases-heading"
          className="scroll-mt-6"
        >
          <SectionHeading
            id="releases"
            title="Releases"
            count={RELEASES.length}
            blurb="Tracks to buy on Beatport."
          />
          <div className="grid max-w-md grid-cols-2 gap-4">
            {RELEASES.map((r) => (
              <ReleaseCard key={r.id} release={r} />
            ))}
          </div>
        </section>

        {/* Updates — the news log */}
        <section id="updates" aria-labelledby="updates-heading" className="scroll-mt-6">
          <SectionHeading
            id="updates"
            title="Updates"
            count={UPDATES.length}
            blurb="News from the shop — gigs, releases and press, newest first."
          />
          <ul className="space-y-4">
            {UPDATES.map((u) => (
              <UpdateCard key={u.id} update={u} />
            ))}
          </ul>
        </section>
      </div>

      <footer className="mt-20 border-t border-white/10 pt-8 text-sm text-white/40">
        <p>
          chunkylabs — al b.{" "}
          <Link href="/store" className="text-white/60 hover:text-white">
            Take the full visit →
          </Link>
        </p>
      </footer>
    </main>
  );
}
