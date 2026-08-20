// Harvest v2 — enumerate the INDIVIDUAL tracks inside the 4 SoundCloud sets
// that v1 captured as art-less containers. The store browses tracks, each with
// its own cover / duration / date, so we deepen the harvest one level.
//
// Route (public data, our own catalog, no auth):
//   1. Extract a client_id from SoundCloud's own JS bundles.
//   2. GET api-v2.soundcloud.com/playlists/<id> — the same object embedded in
//      the public page's window.__sc_hydration; gives the ordered track list
//      (first ~5 full, the rest id-only stubs). We only have the numeric id
//      from v1's manifest (not the public page URL), so this is the natural
//      equivalent of scraping hydration.
//   3. Resolve the stubs with GET api-v2.soundcloud.com/tracks?ids=<csv>.
//
// ANTI-SPIN: if the client_id can't be found, or a playlist / stub-resolution
// call fails twice, STOP and report — no third scraping route is attempted.
//
// Idempotent: strips any prior type:"track" soundcloud rows and wipes
// art/tracks/ before re-adding. v1 (harvest-content.mjs) is left untouched.
//
// Run: node scripts/harvest-tracks.mjs

import { writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(ROOT, "content", "harvest");
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const TRACK_ART_DIR = path.join(OUT_DIR, "art", "tracks");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const HEADERS = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// The 4 art-less sets to expand, keyed by their SoundCloud playlist id.
// wall mapping per the task; parentSet links a track to its v1 set entry.
const TARGET_SETS = [
  { scId: "497097", wall: "mixes", parentSet: "Mixes by al b" },
  { scId: "1526138", wall: "mixes", parentSet: "Live Records by al b" },
  { scId: "2059410711", wall: "crate", parentSet: "Edits by al b" },
  { scId: "1096372", wall: "crate", parentSet: "Remixes/Production by al b" },
];

// ── HTTP helpers (native fetch, 2 attempts) ─────────────────────────────────

async function fetchWithRetry(url, opts = {}, attempts = 2) {
  let lastErr = "unreachable";
  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const res = await fetch(url, {
        redirect: "follow",
        ...opts,
        headers: { ...HEADERS, ...(opts.headers || {}) },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = String(err.message || err);
    }
  }
  return { ok: false, error: lastErr };
}
async function fetchText(url) {
  const res = await fetchWithRetry(url);
  return res.ok === false ? null : res.text();
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

// ── client_id extraction ────────────────────────────────────────────────────

async function getClientId() {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const home = await fetchText("https://soundcloud.com/");
    if (home) {
      const scripts = [
        ...new Set(
          (home.match(/https:\/\/[a-z0-9.-]+\/assets\/[^"']+\.js/g) || []).filter((u) =>
            u.includes("sndcdn.com")
          )
        ),
      ];
      for (const u of scripts) {
        const body = await fetchText(u);
        if (!body) continue;
        const m =
          body.match(/client_id\s*[:=]\s*["']([A-Za-z0-9]{32})["']/) ||
          body.match(/client_id=([A-Za-z0-9]{32})/);
        if (m) return m[1];
      }
    }
    console.error(`  client_id not found (attempt ${attempt}/2)`);
  }
  return null;
}

// ── metadata helpers ────────────────────────────────────────────────────────

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
  const slug = slugify(base) || slugify(fallback) || "track";
  let candidate = slug;
  let n = 2;
  while (usedSlugs.has(candidate)) candidate = `${slug}-${n++}`;
  usedSlugs.add(candidate);
  return candidate;
}
// Upgrade a SoundCloud artwork_url to the -t500x500 variant; keep extension.
function upgradeArtwork(url) {
  if (!url) return null;
  return url.replace(
    /-(t\d+x\d+|large|badge|small|tiny|mini|original|crop)\.(jpe?g|png)/i,
    "-t500x500.$2"
  );
}
function extFromResponse(url, ct) {
  if (ct?.includes("png")) return "png";
  if (ct?.includes("webp")) return "webp";
  if (ct?.includes("jpeg") || ct?.includes("jpg")) return "jpg";
  const m = String(url).match(/\.(jpe?g|png|webp)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}
async function downloadArt(url, slug) {
  const res = await fetchWithRetry(url);
  if (res.ok === false) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 512) return null;
  const file = `${slug}.${extFromResponse(url, res.headers.get("content-type"))}`;
  await writeFile(path.join(TRACK_ART_DIR, file), buf);
  return `art/tracks/${file}`;
}

// ── stub resolution ─────────────────────────────────────────────────────────

async function resolveTracks(ids, clientId) {
  // api-v2 tracks?ids caps around 50 ids/request; chunk defensively.
  const byId = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const csv = ids.slice(i, i + 50).join(",");
    const arr = await fetchJson(
      `https://api-v2.soundcloud.com/tracks?ids=${csv}&client_id=${clientId}`
    );
    if (!Array.isArray(arr)) return null; // fail signal
    for (const t of arr) if (t && t.id != null) byId.set(t.id, t);
  }
  return byId;
}

// ── main ─────────────────────────────────────────────────────────────────────

function stop(msg, findings) {
  console.error(`\n=== STOPPED (anti-spin) ===\n${msg}`);
  for (const f of findings || []) console.error(`  - ${f}`);
  process.exit(2);
}

async function main() {
  const manifest = JSON.parse(await readFileUtf8(MANIFEST));

  console.log("Extracting client_id from SoundCloud bundles…");
  const clientId = await getClientId();
  if (!clientId) {
    stop("Could not extract a SoundCloud client_id after 2 attempts.", [
      "Route 1 (hydration/api-v2) is unreachable without a client_id.",
    ]);
  }
  console.log(`  client_id = ${clientId}`);

  const trackRows = [];
  const perSet = [];
  const failures = [];

  for (const set of TARGET_SETS) {
    const pl = await fetchJson(
      `https://api-v2.soundcloud.com/playlists/${set.scId}?client_id=${clientId}`
    );
    if (!pl || !Array.isArray(pl.tracks)) {
      stop(`Playlist ${set.scId} (${set.parentSet}) failed to fetch/parse twice.`, [
        "api-v2 playlist call returned no track array.",
      ]);
    }
    const ordered = pl.tracks; // preserves set order
    const full = new Map();
    const stubIds = [];
    for (const t of ordered) {
      if (t.title) full.set(t.id, t);
      else stubIds.push(t.id);
    }
    let resolved = new Map();
    if (stubIds.length) {
      resolved = await resolveTracks(stubIds, clientId);
      if (resolved === null) {
        stop(`Stub resolution failed twice for set ${set.parentSet} (${set.scId}).`, [
          `tracks?ids returned a non-array for ${stubIds.length} stubs.`,
        ]);
      }
    }

    let art = 0;
    let missingMeta = 0;
    for (const t of ordered) {
      const track = t.title ? t : resolved.get(t.id);
      if (!track || !track.title) {
        missingMeta++;
        failures.push(`[${set.parentSet}] track id ${t.id} unresolved (private/deleted?)`);
        continue;
      }
      const slug = uniqueSlug(track.title, `sc-${track.id}`);
      let artPath = null;
      const upgraded = upgradeArtwork(track.artwork_url);
      if (upgraded) {
        artPath = await downloadArt(upgraded, slug);
        if (!artPath) failures.push(`[${set.parentSet}] "${track.title}" art download failed`);
      }
      if (artPath) art++;
      trackRows.push({
        wall: set.wall,
        source: "soundcloud",
        type: "track",
        parentSet: set.parentSet,
        title: track.title,
        canonicalUrl: track.permalink_url,
        embedUrl: null,
        art: artPath,
        duration: track.duration != null ? Math.round(track.duration / 1000) : null,
        date: track.display_date || track.created_at || null,
        trackCount: null,
        genre: track.genre ? track.genre : null,
      });
    }
    perSet.push({
      set: set.parentSet,
      wall: set.wall,
      tracks: ordered.length,
      resolvedArt: art,
      missing: missingMeta,
    });
    console.log(
      `  [${set.wall}] ${set.parentSet}: ${ordered.length} tracks, ${art} with art` +
        (missingMeta ? `, ${missingMeta} unresolved` : "")
    );
  }

  // Idempotent merge: drop prior soundcloud tracks, keep everything else.
  const base = manifest.filter((m) => !(m.type === "track" && m.source === "soundcloud"));
  const next = [...base, ...trackRows];
  await writeFile(MANIFEST, JSON.stringify(next, null, 2) + "\n", "utf8");

  // ── summary ──
  console.log("\n=== SUMMARY: tracks per set ===");
  console.log("set                         wall     tracks   with-art   unresolved");
  let tT = 0,
    tA = 0,
    tM = 0;
  for (const p of perSet) {
    tT += p.tracks;
    tA += p.resolvedArt;
    tM += p.missing;
    console.log(
      `${p.set.padEnd(27)} ${p.wall.padEnd(8)} ${String(p.tracks).padStart(6)}   ${String(
        p.resolvedArt
      ).padStart(8)}   ${String(p.missing).padStart(10)}`
    );
  }
  console.log(
    `${"TOTAL".padEnd(27)} ${"".padEnd(8)} ${String(tT).padStart(6)}   ${String(tA).padStart(
      8
    )}   ${String(tM).padStart(10)}`
  );
  console.log(`\nManifest now: ${next.length} items (${trackRows.length} tracks added).`);
  if (failures.length) {
    console.log(`\nNotes / failures (${failures.length}):`);
    for (const f of failures) console.log(`  - ${f}`);
  } else {
    console.log("\nNo failures.");
  }
}

async function readFileUtf8(p) {
  const { readFile } = await import("node:fs/promises");
  return readFile(p, "utf8");
}

async function boot() {
  await rm(TRACK_ART_DIR, { recursive: true, force: true });
  await mkdir(TRACK_ART_DIR, { recursive: true });
  await main();
}

boot().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
