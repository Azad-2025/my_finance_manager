import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

// Helper: Point in polygon using ray casting algorithm
function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function createGrowthMarkPNG(width, height, isMaskable = false) {
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  // Scaling & safe-margin factor
  // For maskable icons, keep everything in the inner 70% safe zone
  const scale = isMaskable ? width * 0.007 : width * 0.0082;
  const offsetX = (width - 100 * scale) / 2;
  const offsetY = (height - 100 * scale) / 2;

  // Shapes in 100x100 space
  // Pillar 1: [14, 50] to [30, 84] with rounded base
  // Pillar 2: [42, 54] to [58, 84] with rounded base
  // Pillar 3: [70, 42] to [86, 84] with rounded base
  const polyPillar1 = [[14, 50], [30, 36], [30, 84], [14, 84]];
  const polyPillar2 = [[42, 54], [58, 40], [58, 84], [42, 84]];
  const polyPillar3 = [[70, 42], [86, 28], [86, 84], [70, 84]];

  // Ascending crest path
  const polyArrow = [
    [14, 46],
    [34, 24],
    [51, 41],
    [76, 16],
    [67, 16],
    [67, 10],
    [92, 10],
    [92, 35],
    [86, 35],
    [86, 26],
    [51, 61],
    [34, 44],
    [14, 64]
  ];

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter 0

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Deep Navy Background #0F172A
      let pr = 15;
      let pg = 23;
      let pb = 42;
      let pa = 255;

      // Transform pixel to 100x100 space
      const sx = (x - offsetX) / scale;
      const sy = (y - offsetY) / scale;

      let isMark = false;

      if (sx >= 0 && sx <= 100 && sy >= 0 && sy <= 100) {
        if (
          pointInPoly(sx, sy, polyArrow) ||
          pointInPoly(sx, sy, polyPillar1) ||
          pointInPoly(sx, sy, polyPillar2) ||
          pointInPoly(sx, sy, polyPillar3)
        ) {
          isMark = true;
        }
      }

      if (isMark) {
        // Emerald Gradient #059669 -> #10B981
        const t = Math.max(0, Math.min(1, (sx + (100 - sy)) / 140));
        pr = Math.round(5 + (16 - 5) * t);
        pg = Math.round(150 + (185 - 150) * t);
        pb = Math.round(105 + (129 - 105) * t);
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
      rawData[pxOffset + 3] = pa;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature: 89 50 4E 47 0D 0A 1A 0A
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC-32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) | 0;
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

// 1. icon-192x192.png & icon-512x512.png
const buf192 = createGrowthMarkPNG(192, 192, false);
const buf512 = createGrowthMarkPNG(512, 512, false);
fs.writeFileSync(path.join(pubDir, 'icon-192x192.png'), buf192);
fs.writeFileSync(path.join(pubDir, 'icon-512x512.png'), buf512);

// Backward-compat aliases
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), buf192);
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), buf512);

// 2. maskable-192x192.png & maskable-512x512.png
const maskBuf192 = createGrowthMarkPNG(192, 192, true);
const maskBuf512 = createGrowthMarkPNG(512, 512, true);
fs.writeFileSync(path.join(pubDir, 'maskable-192x192.png'), maskBuf192);
fs.writeFileSync(path.join(pubDir, 'maskable-512x512.png'), maskBuf512);
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), maskBuf512);

// 3. apple-touch-icon.png (180x180)
const appleBuf = createGrowthMarkPNG(180, 180, false);
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), appleBuf);

// 4. favicon.ico (64x64)
const favBuf = createGrowthMarkPNG(64, 64, false);
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), favBuf);

console.log('Complete PWA icon system successfully generated in /public!');
