#!/usr/bin/env node
// Extract natural (width, height) for every optimized webp under
// public/art/optimized and write a lookup map keyed by `{contract}-{tokenId}`.
// Consumed at SSR time by PieceLayout so next/image can render the box at the
// real intrinsic aspect rather than the default 4:3 - which used to letterbox
// tall pieces inside an oversized 4:3 frame.

import fs from 'node:fs';
import path from 'node:path';

const ART_DIR = 'public/art/optimized';
const OUT = 'src/lib/aspects.data.json';

function getDims(buf) {
  // WebP (RIFF/VP8x)
  if (buf.slice(0, 4).toString() === 'RIFF') {
    const fourcc = buf.slice(12, 16).toString();
    if (fourcc === 'VP8X') {
      const w = (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1;
      const h = (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1;
      return [w, h];
    }
    if (fourcc === 'VP8 ') {
      const w = (buf[26] | (buf[27] << 8)) & 0x3fff;
      const h = (buf[28] | (buf[29] << 8)) & 0x3fff;
      return [w, h];
    }
    if (fourcc === 'VP8L') {
      const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
      const w = (b0 | ((b1 & 0x3f) << 8)) + 1;
      const h = (((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10))) + 1;
      return [w, h];
    }
    return null;
  }
  // PNG: \x89PNG\r\n\x1a\n then IHDR with big-endian uint32 width / height
  if (buf[0] === 0x89 && buf.slice(1, 4).toString() === 'PNG') {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return [w, h];
  }
  // SVG: scan first ~4KB for viewBox or width/height
  const head = buf.slice(0, Math.min(buf.length, 4096)).toString('utf8');
  if (head.includes('<svg') || head.trim().startsWith('<?xml')) {
    const vb = head.match(/viewBox\s*=\s*["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/);
    if (vb) return [parseFloat(vb[1]), parseFloat(vb[2])];
    const wm = head.match(/<svg[^>]*\bwidth\s*=\s*["']?([\d.]+)/);
    const hm = head.match(/<svg[^>]*\bheight\s*=\s*["']?([\d.]+)/);
    if (wm && hm) return [parseFloat(wm[1]), parseFloat(hm[1])];
  }
  return null;
}

if (!fs.existsSync(ART_DIR)) {
  console.error(`Missing ${ART_DIR}`);
  process.exit(1);
}

const map = {};
let total = 0;
let bad = 0;
for (const f of fs.readdirSync(ART_DIR)) {
  if (!f.endsWith('.webp')) continue;
  const buf = fs.readFileSync(path.join(ART_DIR, f));
  const dims = getDims(buf);
  if (!dims) { bad++; continue; }
  const key = f.replace(/\.webp$/, '').toLowerCase();
  map[key] = { w: dims[0], h: dims[1] };
  total++;
}

fs.writeFileSync(OUT, JSON.stringify(map, null, 2) + '\n');
console.log(`Wrote ${OUT}: ${total} entries (${bad} unparseable)`);
