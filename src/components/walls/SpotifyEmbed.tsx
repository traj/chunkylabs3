"use client";

import { C, FONT } from "./ui";

/**
 * The official Spotify embed, framed by OUR chrome (1px border + mono label). The embed's own
 * controls own playback — the BR transport NEVER claims Spotify. `allow` keeps `encrypted-media`
 * intact (LAW): dropping it silently breaks Spotify playback.
 */
export function SpotifyEmbed({
  embedUrl,
  height = 152,
}: {
  embedUrl: string;
  height?: number;
}) {
  // Dark, compact theme; leave the harvested query (utm_source) untouched, just ensure theme=0.
  const url = embedUrl.includes("theme=") ? embedUrl : `${embedUrl}&theme=0`;
  return (
    <div
      style={{
        border: `1px solid ${C.white}`,
        padding: 11,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ font: `400 11px ${FONT.mono}`, letterSpacing: ".2em", color: C.muted }}>
        SPOTIFY
      </div>
      <iframe
        title="Spotify player"
        src={url}
        width="100%"
        height={height}
        style={{ border: 0, display: "block", borderRadius: 0 }}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  );
}
