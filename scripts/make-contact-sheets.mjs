// Contact sheets for design reference — one JPEG per wall, a labeled grid of
// that wall's cover art straight from content/harvest/manifest.json.
//
// This is a REFERENCE artifact (mono labels, plain grid), not a design surface.
// Uses sharp, which is already present in node_modules (Next.js ships it) — no
// new dependency is added.
//
// Output: content/harvest/sheets/<wall>.jpg  for wall in mixes|playlists|vibes|crate
// Re-runnable: overwrites the four sheets each run.
//
// Run: node scripts/make-contact-sheets.mjs

import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(ROOT, "content", "harvest");
const SHEET_DIR = path.join(OUT_DIR, "sheets");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

const WALLS = ["mixes", "playlists", "vibes", "crate"];

// Layout (px)
const COLS = 6;
const CELL = 200; // cover edge
const GUT = 12; // gutter between cells
const PAD = 24; // outer padding
const LABEL_H = 54; // label band under each cover
const HEADER_H = 44; // sheet title band height (below top pad)
const cellH = CELL + LABEL_H;
const CANVAS_W = PAD * 2 + COLS * CELL + (COLS - 1) * GUT;
const GRID_TOP = PAD + HEADER_H;
const BG = { r: 255, g: 255, b: 255 };

// ── text helpers ─────────────────────────────────────────────────────────────

function xmlEsc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function wrap(s, max, maxLines) {
  const words = String(s).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const cand = cur ? `${cur} ${w}` : w;
    if (cand.length <= max) {
      cur = cand;
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  const shown = lines.join(" ");
  let out = lines.slice(0, maxLines).map((l) => (l.length > max ? l.slice(0, max - 1) + "…" : l));
  if (shown.length < String(s).replace(/\s+/g, " ").trim().length && out.length) {
    const last = out[out.length - 1];
    out[out.length - 1] = (last.length > max - 1 ? last.slice(0, max - 1) : last).replace(/…?$/, "…");
  }
  return out;
}
function fmtDur(sec) {
  if (sec == null) return "";
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

function labelSvg(title, durSec) {
  const lines = wrap(title, 30, 2);
  let body = "";
  lines.forEach((ln, i) => {
    body += `<text x="3" y="${15 + i * 14}" font-family="Menlo, 'Courier New', monospace" font-size="11" fill="#141414">${xmlEsc(ln)}</text>`;
  });
  const dur = fmtDur(durSec);
  if (dur) {
    body += `<text x="3" y="${LABEL_H - 7}" font-family="Menlo, 'Courier New', monospace" font-size="11" fill="#8a8a8a">${dur}</text>`;
  }
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${LABEL_H}">${body}</svg>`
  );
}
function headerSvg(wall, n) {
  const title = `chunkylabs · ${wall.toUpperCase()} — ${n} cover${n === 1 ? "" : "s"}`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${GRID_TOP}">` +
      `<text x="${PAD}" y="${GRID_TOP - 15}" font-family="Menlo, 'Courier New', monospace" font-size="20" font-weight="bold" fill="#111111">${xmlEsc(title)}</text>` +
      `</svg>`
  );
}
// gray placeholder cell if a cover ever fails to load
function placeholderCover() {
  return sharp({
    create: { width: CELL, height: CELL, channels: 3, background: { r: 226, g: 226, b: 226 } },
  })
    .png()
    .toBuffer();
}

// ── build one sheet ──────────────────────────────────────────────────────────

async function buildSheet(wall, items) {
  const rows = Math.ceil(items.length / COLS);
  const canvasH = GRID_TOP + rows * cellH + (rows - 1) * GUT + PAD;
  const layers = [{ input: headerSvg(wall, items.length), top: 0, left: 0 }];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * (CELL + GUT);
    const y = GRID_TOP + row * (cellH + GUT);
    let cover;
    try {
      cover = await sharp(path.join(OUT_DIR, it.art))
        .resize(CELL, CELL, { fit: "cover", position: "centre" })
        .toBuffer();
    } catch {
      cover = await placeholderCover();
    }
    layers.push({ input: cover, top: y, left: x });
    layers.push({ input: labelSvg(it.title, it.duration), top: y + CELL, left: x });
  }

  const out = path.join(SHEET_DIR, `${wall}.jpg`);
  await sharp({ create: { width: CANVAS_W, height: canvasH, channels: 3, background: BG } })
    .composite(layers)
    .jpeg({ quality: 82, chromaSubsampling: "4:4:4" })
    .toFile(out);
  return { wall, count: items.length, rows, dims: `${CANVAS_W}x${canvasH}`, out };
}

async function main() {
  await mkdir(SHEET_DIR, { recursive: true });
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));

  console.log("Building contact sheets…");
  console.log("wall        covers   grid        image");
  const results = [];
  for (const wall of WALLS) {
    const items = manifest.filter((m) => m.wall === wall && m.art);
    if (!items.length) {
      console.log(`${wall.padEnd(11)} (no covers — skipped)`);
      continue;
    }
    const r = await buildSheet(wall, items);
    results.push(r);
    console.log(
      `${r.wall.padEnd(11)} ${String(r.count).padStart(6)}   ${(`${COLS}×${r.rows}`).padEnd(9)}   ${r.dims}`
    );
  }
  console.log(`\n${results.length} sheets written to content/harvest/sheets/`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
