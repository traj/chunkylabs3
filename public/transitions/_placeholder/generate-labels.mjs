// Dependency-free label-image generator for the SYNTHETIC placeholder transitions.
//
// Renders one 1920x1080 RGBA PNG per station transition: a distinct color tint (so each
// clip is instantly recognizable), an opaque panel with the transition name burned in
// (5x7 bitmap font), and "PLACEHOLDER - DO NOT SHIP". encode.sh overlays this PNG over an
// animated testsrc2 so motion (= play-through) is obvious. No npm deps — uses only Node
// built-ins (zlib) so it runs anywhere ffmpeg does.
//
// Usage: node generate-labels.mjs <outDir>

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const W = 1920;
const H = 1080;

// 5x7 bitmap font — only the glyphs used by the labels below.
const FONT = {
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  "E": ["#####", "#....", "#....", "###..", "#....", "#....", "#####"],
  "F": ["#####", "#....", "#....", "###..", "#....", "#....", "#...."],
  "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".####"],
  "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "I": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  "N": ["#...#", "##..#", "#.#.#", "#.#.#", "#..##", "#...#", "#...#"],
  "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  ">": ["#....", ".#...", "..#..", "...#.", "..#..", ".#...", "#...."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "..##.", ".#...", "#....", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["#...#", "#...#", "#...#", "#####", "....#", "....#", "....#"],
  "5": ["#####", "#....", "#....", "####.", "....#", "....#", "####."],
};

function glyph(ch) {
  return FONT[ch] || FONT[" "];
}

function fillRect(px, x, y, w, h, r, g, b, a) {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 4;
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = a;
    }
  }
}

// (6n - 1) font-pixels wide at the given scale: 5 per glyph + 1 spacing, minus trailing.
function textWidth(str, scale) {
  return (str.length * 6 - 1) * scale;
}

function drawText(px, str, centerX, topY, scale, r, g, b) {
  let x = Math.round(centerX - textWidth(str, scale) / 2);
  for (const ch of str) {
    const g7 = glyph(ch);
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (g7[row][col] === "#") {
          fillRect(px, x + col * scale, topY + row * scale, scale, scale, r, g, b, 255);
        }
      }
    }
    x += 6 * scale;
  }
}

function fitScale(str, maxWidth, maxScale) {
  const s = Math.floor((maxWidth + str.length) / (str.length * 6));
  return Math.max(1, Math.min(maxScale, s));
}

// --- minimal PNG encoder (RGBA, 8-bit, no deps) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function writePNG(path, px) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = compression, filter, interlace = 0
  const stride = W * 4;
  const raw = Buffer.alloc(H * (1 + stride));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + stride)] = 0; // filter: none
    px.copy(raw, y * (1 + stride) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

// --- transitions (must match STATIONS order in src/data/stations.ts) ---
const TRANSITIONS = [
  { dest: "door", title: "STREET > DOOR", color: [179, 38, 30] },
  { dest: "counter", title: "DOOR > COUNTER", color: [194, 65, 12] },
  { dest: "left-bins", title: "COUNTER > LEFT BINS", color: [21, 128, 61] },
  { dest: "right-bins", title: "LEFT BINS > RIGHT BINS", color: [29, 78, 216] },
  { dest: "mixtape-shelf", title: "RIGHT BINS > MIXTAPE", color: [109, 40, 217] },
];

const outDir = process.argv[2] || ".";
mkdirSync(outDir, { recursive: true });

for (let i = 0; i < TRANSITIONS.length; i++) {
  const { dest, title, color } = TRANSITIONS[i];
  const px = Buffer.alloc(W * H * 4);

  // Full-frame color tint at alpha 180 — testsrc2 motion shows through everywhere.
  fillRect(px, 0, 0, W, H, color[0], color[1], color[2], 180);
  // Opaque dark panel behind the text for legibility.
  fillRect(px, 0, 360, W, 360, 12, 12, 16, 235);

  const titleScale = fitScale(title, 1760, 18);
  drawText(px, title, W / 2, 430, titleScale, 255, 255, 255);
  drawText(px, "PLACEHOLDER - DO NOT SHIP", W / 2, 600, 7, 235, 235, 235);
  drawText(px, `CLIP ${i + 1} OF 5`, W / 2, 670, 6, 180, 180, 190);

  const file = join(outDir, `${dest}.label.png`);
  writePNG(file, px);
  console.log(`wrote ${file} (${title})`);
}
