import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function createPNG(width, height, r, g, b, accentR, accentG, accentB) {
  // A clean minimalist PNG generator with centered circular badge and ৳ symbol styling
  const rowBytes = width * 4 + 1;
  const rawData = Buffer.alloc(rowBytes * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width * 0.42;
      const innerRing = width * 0.35;

      let pr = r, pg = g, pb = b, pa = 255;

      // Outer squircle or circular emblem
      if (dist < radius) {
        if (Math.abs(dist - innerRing) < width * 0.03) {
          // Emerald glowing ring
          pr = accentR;
          pg = accentG;
          pb = accentB;
        } else if (dist < innerRing * 0.6) {
          // Central emblem background
          pr = 15;
          pg = 23;
          pb = 42;
          
          // Stylized vertical bar for ৳
          if (Math.abs(dx) < width * 0.04 && Math.abs(dy) < height * 0.22) {
            pr = 255; pg = 255; pb = 255;
          }
          // Horizontal crossbar
          if (Math.abs(dy) < width * 0.03 && Math.abs(dx) < height * 0.14) {
            pr = accentR; pg = accentG; pb = accentB;
          }
          // Dot
          if (Math.sqrt(dx * dx + (dy - height * 0.2) * (dy - height * 0.2)) < width * 0.035) {
            pr = accentR; pg = accentG; pb = accentB;
          }
        }
      } else {
        // Dark outer corner background
        pr = 15; pg = 23; pb = 42;
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
      rawData[pxOffset + 3] = pa;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  // PNG Signature (0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n')
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

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', deflated);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC-32 table implementation
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

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPNG(192, 192, 30, 41, 59, 16, 185, 129));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPNG(512, 512, 30, 41, 59, 16, 185, 129));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 15, 23, 42, 16, 185, 129));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPNG(180, 180, 15, 23, 42, 16, 185, 129));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), createPNG(64, 64, 15, 23, 42, 16, 185, 129));

console.log('PWA PNG assets successfully written to /public!');
