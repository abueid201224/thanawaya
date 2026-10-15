import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import fastPng from 'fast-png';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'installer-assets');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const width = 512;
const height = 512;
const data = new Uint8Array(width * height * 4);

function distToSegmentSquared(px, py, vx, vy, wx, wy) {
  const l2 = (vx - wx) * (vx - wx) + (vy - wy) * (vy - wy);
  if (l2 === 0) return (px - vx) * (px - vx) + (py - vy) * (py - vy);
  let t = ((px - vx) * (wx - vx) + (py - vy) * (wy - wy)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = vx + t * (wx - vx);
  const projY = vy + t * (wy - vy);
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

const points = [
  [120, 380],
  [180, 140],
  [240, 320],
  [300, 200],
  [380, 380]
];

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const cornerR = 112;
    let inside = true;
    if (x < cornerR && y < cornerR) {
      if ((x - cornerR) ** 2 + (y - cornerR) ** 2 > cornerR ** 2) inside = false;
    } else if (x > width - cornerR && y < cornerR) {
      if ((x - (width - cornerR)) ** 2 + (y - cornerR) ** 2 > cornerR ** 2) inside = false;
    } else if (x < cornerR && y > height - cornerR) {
      if ((x - cornerR) ** 2 + (y - (height - cornerR)) ** 2 > cornerR ** 2) inside = false;
    } else if (x > width - cornerR && y > height - cornerR) {
      if ((x - (width - cornerR)) ** 2 + (y - (height - cornerR)) ** 2 > cornerR ** 2) inside = false;
    }

    if (!inside) {
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 0;
      continue;
    }

    const t = (x + y) / (width + height);
    let r = Math.round(30 + t * (2 - 30));
    let g = Math.round(58 + t * (132 - 58));
    let b = Math.round(138 + t * (199 - 138));

    let minD2 = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
      const d2 = distToSegmentSquared(x, y, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
      if (d2 < minD2) minD2 = d2;
    }

    if (minD2 <= 18 * 18) {
      r = 255; g = 255; b = 255;
    }

    const n1 = (x - 180) ** 2 + (y - 140) ** 2;
    if (n1 <= 22 * 22) { r = 56; g = 189; b = 248; }

    const n2 = (x - 240) ** 2 + (y - 320) ** 2;
    if (n2 <= 18 * 18) { r = 250; g = 204; b = 21; }

    const n3 = (x - 300) ** 2 + (y - 200) ** 2;
    if (n3 <= 22 * 22) { r = 74; g = 222; b = 128; }

    data[idx] = r;
    data[idx + 1] = g;
    data[idx + 2] = b;
    data[idx + 3] = 255;
  }
}

const pngBuffer = Buffer.from(fastPng.encode({ width, height, data }));
fs.writeFileSync(path.join(outDir, 'icon.png'), pngBuffer);

function resizeBuffer(srcData, srcW, srcH, dstW, dstH) {
  const dst = new Uint8Array(dstW * dstH * 4);
  for (let y = 0; y < dstH; y++) {
    const srcY = Math.floor((y * srcH) / dstH);
    for (let x = 0; x < dstW; x++) {
      const srcX = Math.floor((x * srcW) / dstW);
      const srcIdx = (srcY * srcW + srcX) * 4;
      const dstIdx = (y * dstW + x) * 4;
      dst[dstIdx] = srcData[srcIdx];
      dst[dstIdx + 1] = srcData[srcIdx + 1];
      dst[dstIdx + 2] = srcData[srcIdx + 2];
      dst[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }
  return dst;
}

const sizes = [256, 128, 64, 48, 32, 16];
const pngEntries = sizes.map((s) => {
  const sData = resizeBuffer(data, width, height, s, s);
  const pBuf = Buffer.from(fastPng.encode({ width: s, height: s, data: sData }));
  return { size: s, buffer: pBuf };
});

const count = pngEntries.length;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(count, 4);

let offset = 6 + count * 16;
const dirEntries = [];
const imageBuffers = [];

for (const entry of pngEntries) {
  const dir = Buffer.alloc(16);
  dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 0);
  dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, 1);
  dir.writeUInt8(0, 2);
  dir.writeUInt8(0, 3);
  dir.writeUInt16LE(1, 4);
  dir.writeUInt16LE(32, 6);
  dir.writeUInt32LE(entry.buffer.length, 8);
  dir.writeUInt32LE(offset, 12);
  offset += entry.buffer.length;
  dirEntries.push(dir);
  imageBuffers.push(entry.buffer);
}

const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers]);
fs.writeFileSync(path.join(outDir, 'icon.ico'), icoBuffer);
console.log('✅ Generated installer-assets/icon.png and installer-assets/icon.ico successfully');
