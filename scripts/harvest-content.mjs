// Harvest the chunkylabs catalog (cover art + metadata) from the OLD live site's
// repo (chunkylabsnyc2, SvelteKit) so design work runs against real content.
//
// Source of truth: four hardcoded arrays in chunkylabsnyc2/src/components/
//   SoundCloudSpot.svelte   -> wall "mixes"     (SoundCloud playlists)
//   SpotifyVarious.svelte   -> wall "playlists" (Spotify playlists)
//   SpotifyVibes.svelte     -> wall "vibes"     (Spotify playlists)
//   DigitalDownloads.svelte -> wall "crate"     (Beatport tracks)
//
// The embed URLs below were extracted verbatim from those arrays. Output:
//   content/harvest/manifest.json  (flat array)
//   content/harvest/art/<slug>.<ext>
//
// Native fetch only, no npm deps. READ-ONLY w.r.t. chunkylabsnyc2 (we only copy
// its local cover PNGs out; we never write there).
//
// Run: node scripts/harvest-content.mjs

import { writeFile, mkdir, copyFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(ROOT, "content", "harvest");
const ART_DIR = path.join(OUT_DIR, "art");
const OLD_REPO = "/Users/al_b/Desktop/projects/chunkylabsnyc2";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const BASE_HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// ── Source data, extracted verbatim from the four component arrays ──────────

// SoundCloudSpot.svelte — {id, src}. Numeric playlist id parsed from the
// URL-encoded api.soundcloud.com resource in the player src.
const SOUNDCLOUD = [
  { scId: "2059410711", src: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A2059410711&color=%23141721&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" },
  { scId: "497097",     src: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A497097&color=%23141721&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" },
  { scId: "1526138",    src: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A1526138&color=%23141721&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" },
  { scId: "1096372",    src: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A1096372&color=%23141721&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" },
  { scId: "2058781242", src: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A2058781242&color=%23141721&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true" },
];

// SpotifyVarious.svelte — {id, src, link}. embed src -> id.
const SPOTIFY_VARIOUS = [
  { spId: "4Y2QDVRBrlGCJ9SGeDwuGq", src: "https://open.spotify.com/embed/playlist/4Y2QDVRBrlGCJ9SGeDwuGq?utm_source=generator" },
  { spId: "7eSRm40kcExqyggV6dbpvK", src: "https://open.spotify.com/embed/playlist/7eSRm40kcExqyggV6dbpvK?utm_source=generator" },
  { spId: "4LtK2bI7FBoHro1JdsoxdQ", src: "https://open.spotify.com/embed/playlist/4LtK2bI7FBoHro1JdsoxdQ?utm_source=generator" },
  { spId: "3TEUnudIE8nTH9TkFHDBX1", src: "https://open.spotify.com/embed/playlist/3TEUnudIE8nTH9TkFHDBX1?utm_source=generator" },
  { spId: "0n3716q0T1PJSENPSYIevj", src: "https://open.spotify.com/embed/playlist/0n3716q0T1PJSENPSYIevj?utm_source=generator" },
];

// SpotifyVibes.svelte — {id, src, link}. embed src -> id. (18 items)
const SPOTIFY_VIBES = [
  { spId: "1a3ZlBowVT2CMfWjzm4hvT", src: "https://open.spotify.com/embed/playlist/1a3ZlBowVT2CMfWjzm4hvT?si=47713d6ce17f4a37" },
  { spId: "5cQWRRQwpwpezJY5RTfd2x", src: "https://open.spotify.com/embed/playlist/5cQWRRQwpwpezJY5RTfd2x?utm_source=generator" },
  { spId: "0cm55dvJAy7rO7NJZi2cLI", src: "https://open.spotify.com/embed/playlist/0cm55dvJAy7rO7NJZi2cLI?utm_source=generator" },
  { spId: "4NfaOvb8dMjjQ6BWHdxjGO", src: "https://open.spotify.com/embed/playlist/4NfaOvb8dMjjQ6BWHdxjGO?utm_source=generator" },
  { spId: "31wRFBzKyvTX5MqSCwYb2E", src: "https://open.spotify.com/embed/playlist/31wRFBzKyvTX5MqSCwYb2E?utm_source=generator" },
  { spId: "5QiRuB5rg8eD4BHDJ6p4d3", src: "https://open.spotify.com/embed/playlist/5QiRuB5rg8eD4BHDJ6p4d3?utm_source=generator" },
  { spId: "1KzTWI74Qoe0fyiFAegVPD", src: "https://open.spotify.com/embed/playlist/1KzTWI74Qoe0fyiFAegVPD?utm_source=generator" },
  { spId: "3XapXTfikXL9QOqvptA9xK", src: "https://open.spotify.com/embed/playlist/3XapXTfikXL9QOqvptA9xK?utm_source=generator" },
  { spId: "4EMKuW0DsLcDegIhkAgfrI", src: "https://open.spotify.com/embed/playlist/4EMKuW0DsLcDegIhkAgfrI?utm_source=generator" },
  { spId: "36BHFD4ZpyWrnIkCBpfmIB", src: "https://open.spotify.com/embed/playlist/36BHFD4ZpyWrnIkCBpfmIB?utm_source=generator" },
  { spId: "7t1WxoMe6MZBlJaEnPgsD3", src: "https://open.spotify.com/embed/playlist/7t1WxoMe6MZBlJaEnPgsD3?utm_source=generator" },
  { spId: "6vviA7YBVzCsOFTnksXkV7", src: "https://open.spotify.com/embed/playlist/6vviA7YBVzCsOFTnksXkV7?utm_source=generator" },
  { spId: "07A467fclpwLLzHTVWvpDk", src: "https://open.spotify.com/embed/playlist/07A467fclpwLLzHTVWvpDk?utm_source=generator" },
  { spId: "2hzZ8LhvYg4fzuoYMIUosR", src: "https://open.spotify.com/embed/playlist/2hzZ8LhvYg4fzuoYMIUosR?utm_source=generator" },
  { spId: "60YEbsjUfOuGjF5qaM0bRU", src: "https://open.spotify.com/embed/playlist/60YEbsjUfOuGjF5qaM0bRU?utm_source=generator" },
  { spId: "52FlFupiggMZc2FcQSNbj4", src: "https://open.spotify.com/embed/playlist/52FlFupiggMZc2FcQSNbj4?utm_source=generator" },
  { spId: "7tDW9oOgzjHvT6oABqaZom", src: "https://open.spotify.com/embed/playlist/7tDW9oOgzjHvT6oABqaZom?utm_source=generator" },
  { spId: "067gebWfQgzosIHrdOc0Jj", src: "https://open.spotify.com/embed/playlist/067gebWfQgzosIHrdOc0Jj?utm_source=generator" },
];

// DigitalDownloads.svelte — {id, content, link}. content img -> local asset.
const BEATPORT = [
  { link: "https://www.beatport.com/track/house-like-this/8323955", localAsset: "carry.png" },
  { link: "https://www.beatport.com/track/nocturning/2757165", localAsset: "escandalo.png" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const usedSlugs = new Set();
function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
function uniqueSlug(base, fallback) {
  let slug = slugify(base) || slugify(fallback) || "item";
  let candidate = slug;
  let n = 2;
  while (usedSlugs.has(candidate)) candidate = `${slug}-${n++}`;
  usedSlugs.add(candidate);
  return candidate;
}
function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
function cleanBeatportTitle(raw) {
  // og:title is the full page title; drop the boilerplate marketing suffix.
  return decodeEntities(raw)
    .replace(/\s*\|\s*Music (&|and) Downloads on Beatport\s*$/i, "")
    .trim();
}
function titleFromSlug(urlSlug) {
  return urlSlug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fetchWithRetry(url, opts = {}, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        ...opts,
        headers: { ...BASE_HEADERS, ...(opts.headers || {}) },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (i === attempts - 1) return { ok: false, error: String(err.message || err) };
    }
  }
  return { ok: false, error: "unreachable" };
}

async function fetchJson(url) {
  const res = await fetchWithRetry(url);
  if (res.ok === false) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchHtml(url) {
  const res = await fetchWithRetry(url);
  if (res.ok === false) return null;
  try {
    return await res.text();
  } catch {
    return null;
  }
}

function extExtFromUrlOrType(url, contentType) {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  const m = String(url).match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

async function downloadArt(url, slug) {
  const res = await fetchWithRetry(url);
  if (res.ok === false) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 512) return null; // reject empty/placeholder-tiny bodies
  const ext = extExtFromUrlOrType(url, res.headers.get("content-type"));
  const file = `${slug}.${ext}`;
  await writeFile(path.join(ART_DIR, file), buf);
  return `art/${file}`;
}

async function copyLocalArt(localAsset, slug) {
  const src = path.join(OLD_REPO, "static", "assets", localAsset);
  try {
    await access(src, FS.R_OK);
  } catch {
    return null;
  }
  const ext = path.extname(localAsset).slice(1).toLowerCase() || "png";
  const file = `${slug}.${ext}`;
  await copyFile(src, path.join(ART_DIR, file));
  return `art/${file}`;
}

// SoundCloud thumbnail: skip fb_placeholder, upgrade real artwork to -t500x500.
function upgradeScThumb(thumb) {
  if (!thumb || thumb.includes("fb_placeholder")) return null;
  return thumb.replace(
    /-(t\d+x\d+|large|badge|small|tiny|mini|original|crop)\.(jpe?g|png)/i,
    "-t500x500.$2"
  );
}

// ── Harvest ──────────────────────────────────────────────────────────────────

const manifest = [];
const failures = [];

async function harvestSoundcloud() {
  for (const { scId, src } of SOUNDCLOUD) {
    const canonicalUrl = `https://api.soundcloud.com/playlists/${scId}`;
    const oembed = await fetchJson(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(canonicalUrl)}`
    );
    const title = oembed?.title ?? `SoundCloud playlist ${scId}`;
    const slug = uniqueSlug(title, `soundcloud-${scId}`);
    let art = null;
    const upgraded = upgradeScThumb(oembed?.thumbnail_url);
    if (upgraded) {
      art = await downloadArt(upgraded, slug);
      if (!art) failures.push({ wall: "mixes", canonicalUrl, reason: "art download failed" });
    } else {
      failures.push({
        wall: "mixes",
        canonicalUrl,
        reason: oembed ? "no cover art (SoundCloud fb_placeholder)" : "oEmbed fetch failed",
      });
    }
    manifest.push({
      wall: "mixes",
      source: "soundcloud",
      type: "playlist",
      title,
      canonicalUrl,
      embedUrl: src,
      art,
      duration: null,
      date: null,
      trackCount: null,
    });
    console.log(`  [mixes] ${scId} — "${title}" — art:${art ? "yes" : "none"}`);
  }
}

async function harvestSpotify(items, wall) {
  for (const { spId, src } of items) {
    const canonicalUrl = `https://open.spotify.com/playlist/${spId}`;
    const oembed = await fetchJson(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`
    );
    const title = oembed?.title ?? `Spotify playlist ${spId}`;
    const slug = uniqueSlug(title, `spotify-${spId}`);
    let art = null;
    if (oembed?.thumbnail_url) {
      art = await downloadArt(oembed.thumbnail_url, slug);
      if (!art) failures.push({ wall, canonicalUrl, reason: "art download failed" });
    } else {
      failures.push({
        wall,
        canonicalUrl,
        reason: oembed ? "no thumbnail in oEmbed" : "oEmbed fetch failed",
      });
    }
    manifest.push({
      wall,
      source: "spotify",
      type: "playlist",
      title,
      canonicalUrl,
      embedUrl: src,
      art,
      duration: null,
      date: null,
      trackCount: null,
    });
    console.log(`  [${wall}] ${spId} — "${title}" — art:${art ? "yes" : "none"}`);
  }
}

async function harvestBeatport() {
  for (const { link, localAsset } of BEATPORT) {
    const urlSlug = link.split("/track/")[1]?.split("/")[0] ?? "";
    const html = await fetchHtml(link);
    let ogTitle = null;
    let ogImage = null;
    if (html) {
      ogTitle =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)?.[1] ??
        null;
      ogImage =
        html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ??
        null;
    }
    const title = ogTitle ? cleanBeatportTitle(ogTitle) : titleFromSlug(urlSlug);
    const slug = uniqueSlug(title, urlSlug || "beatport-track");
    let art = null;
    let artSource = null;
    if (ogImage) {
      art = await downloadArt(ogImage, slug);
      if (art) artSource = "beatport og:image";
    }
    if (!art) {
      art = await copyLocalArt(localAsset, slug);
      if (art) artSource = "old-repo local asset";
    }
    if (!html) {
      failures.push({
        wall: "crate",
        canonicalUrl: link,
        reason: `Beatport page fetch failed (403/bot-block); title from URL slug, art from ${artSource ?? "none"}`,
      });
    } else if (!ogImage) {
      failures.push({
        wall: "crate",
        canonicalUrl: link,
        reason: `Beatport page fetched but no og:image; art from ${artSource ?? "none"}`,
      });
    }
    manifest.push({
      wall: "crate",
      source: "beatport",
      type: "track",
      title,
      canonicalUrl: link,
      embedUrl: null,
      art,
      duration: null,
      date: null,
      trackCount: null,
    });
    console.log(`  [crate] ${urlSlug} — "${title}" — art:${art ? artSource : "none"}`);
  }
}

async function main() {
  await mkdir(ART_DIR, { recursive: true });
  console.log("Harvesting SoundCloud (mixes)…");
  await harvestSoundcloud();
  console.log("Harvesting Spotify Various (playlists)…");
  await harvestSpotify(SPOTIFY_VARIOUS, "playlists");
  console.log("Harvesting Spotify Vibes (vibes)…");
  await harvestSpotify(SPOTIFY_VIBES, "vibes");
  console.log("Harvesting Beatport (crate)…");
  await harvestBeatport();

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );

  // Summary
  const walls = ["mixes", "playlists", "vibes", "crate"];
  const counts = Object.fromEntries(walls.map((w) => [w, { total: 0, art: 0 }]));
  for (const it of manifest) {
    counts[it.wall].total++;
    if (it.art) counts[it.wall].art++;
  }
  console.log("\n=== SUMMARY ===");
  console.log("wall        items   with-art");
  for (const w of walls) {
    console.log(
      `${w.padEnd(11)} ${String(counts[w].total).padStart(5)}   ${String(counts[w].art).padStart(8)}`
    );
  }
  console.log(`TOTAL       ${String(manifest.length).padStart(5)}   ${String(manifest.filter((m) => m.art).length).padStart(8)}`);
  console.log(`\nManifest items: ${manifest.length} (expected 30)`);
  console.log(`Failures / notes: ${failures.length}`);
  for (const f of failures) console.log(`  - [${f.wall}] ${f.canonicalUrl} :: ${f.reason}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
