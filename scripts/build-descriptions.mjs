#!/usr/bin/env node
/**
 * Build src/lib/descriptions.data.json from scripts/piece-metadata.json.
 *
 * Filters:
 * - Drop empty / placeholder descriptions
 * - Drop descriptions identical across >= 70% of a collection (boilerplate
 *   that repeats on every piece - those belong on the collection page, not
 *   the piece page)
 * - Trim trailing whitespace + collapse internal whitespace
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DATA = resolve(__dirname, "..", "src/lib/data.ts");
const META = resolve(__dirname, "piece-metadata.json");
const OUT = resolve(__dirname, "..", "src/lib/descriptions.data.json");

const meta = JSON.parse(readFileSync(META, "utf8"));

// Parse data.ts -> {slug -> collectionSlug}
const src = readFileSync(SRC_DATA, "utf8");
const piecesStart = src.indexOf("export const pieces: Piece[] = [");
const body = src.slice(piecesStart);
const blocks = body.split(/^  \{/m).slice(1);
const pieceCol = {};
for (const b of blocks) {
  const slug = b.match(/^\s*slug:\s*'([^']+)'/m)?.[1];
  const col = b.match(/^\s*collectionSlug:\s*'([^']+)'/m)?.[1];
  if (slug && col) pieceCol[slug] = col;
}

function clean(s) {
  if (!s || typeof s !== "string") return "";
  return s.replace(/\s+/g, " ").trim();
}

// Group descriptions by collection to detect boilerplate
const byCol = new Map();
for (const slug of Object.keys(meta)) {
  const col = pieceCol[slug];
  if (!col) continue;
  const d = clean(meta[slug]?.description);
  if (!d || d.length < 10) continue;
  if (!byCol.has(col)) byCol.set(col, []);
  byCol.get(col).push({ slug, d });
}

// For each collection, count description duplicates. If the most-common
// description appears in >= 70% of pieces, treat it as boilerplate and skip.
const boilerplate = new Set();
for (const [col, items] of byCol) {
  const counts = new Map();
  for (const { d } of items) counts.set(d, (counts.get(d) || 0) + 1);
  const total = items.length;
  for (const [d, n] of counts) {
    if (total >= 3 && n / total >= 0.7) {
      boilerplate.add(d);
      console.log(`[boilerplate] ${col}: "${d.slice(0, 60)}..." (${n}/${total})`);
    }
  }
}

const out = {};
let kept = 0;
let dropped = 0;
for (const slug of Object.keys(meta)) {
  const d = clean(meta[slug]?.description);
  if (!d) { dropped++; continue; }
  if (d.length < 10) { dropped++; continue; }
  if (boilerplate.has(d)) { dropped++; continue; }
  out[slug] = d;
  kept++;
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${OUT}: ${kept} kept, ${dropped} dropped`);
