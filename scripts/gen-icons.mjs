// Generates the PWA app icons as PNGs with zero external dependencies.
// Run with: node scripts/gen-icons.mjs
// Design: dark theme background with an ascending 3-bar chart (amber/blue/green)
// echoing the dashboard accent palette — a "tracker / command center" glyph.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public");
mkdirSync(OUT, { recursive: true });

const BG = [13, 15, 20, 255]; // --bg #0d0f14
const BARS = [
  [245, 185, 66, 255], // amber  (short)
  [91, 156, 246, 255], // blue   (medium)
  [61, 255, 160, 255], // green  (tall)
];

// CRC32 for PNG chunks.
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

function encodePng(size, pixels) {
  // pixels: Uint8Array length size*size*4 (RGBA)
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  // raw scanlines with filter byte 0
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0 (none)
    raw.set(pixels.subarray(y * stride, y * stride + stride), y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function draw(size, marginRatio) {
  const px = new Uint8Array(size * size * 4);
  // fill background
  for (let i = 0; i < size * size; i++) {
    px[i * 4] = BG[0];
    px[i * 4 + 1] = BG[1];
    px[i * 4 + 2] = BG[2];
    px[i * 4 + 3] = BG[3];
  }
  const fillRect = (x0, y0, w, h, color) => {
    const x1 = Math.round(x0 + w);
    const y1 = Math.round(y0 + h);
    for (let y = Math.round(y0); y < y1; y++) {
      if (y < 0 || y >= size) continue;
      for (let x = Math.round(x0); x < x1; x++) {
        if (x < 0 || x >= size) continue;
        const i = (y * size + x) * 4;
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
        px[i + 3] = color[3];
      }
    }
  };

  const m = size * marginRatio;
  const cw = size - 2 * m; // content box
  const ch = size - 2 * m;
  const left = m;
  const baseline = m + ch;

  const barW = cw * 0.22;
  const gap = cw * 0.11;
  const totalW = barW * 3 + gap * 2;
  const startX = left + (cw - totalW) / 2;
  const heights = [0.45, 0.7, 1.0];

  for (let b = 0; b < 3; b++) {
    const h = ch * heights[b];
    const x = startX + b * (barW + gap);
    fillRect(x, baseline - h, barW, h, BARS[b]);
  }
  return px;
}

const targets = [
  { name: "icon-192.png", size: 192, margin: 0.16 },
  { name: "icon-512.png", size: 512, margin: 0.16 },
  { name: "icon-maskable.png", size: 512, margin: 0.26 },
  { name: "apple-touch-icon.png", size: 180, margin: 0.14 },
];

for (const t of targets) {
  const png = encodePng(t.size, draw(t.size, t.margin));
  writeFileSync(join(OUT, t.name), png);
  console.log(`wrote public/${t.name} (${t.size}x${t.size}, ${png.length} bytes)`);
}
