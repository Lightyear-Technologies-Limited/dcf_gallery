#!/usr/bin/env node
/**
 * Import curation order from dcf-curation.csv back into curation.json.
 * Reads row order to determine artist order, collection order within artist,
 * and piece order within collection.
 *
 * Usage: node scripts/import-curation.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const csvPath = resolve(ROOT, "dcf-curation.csv");
const csv = readFileSync(csvPath, "utf-8");

// Parse CSV
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\r") { /* skip */ }
      else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const rows = parseCSV(csv);
const header = rows[0];
const data = rows.slice(1).filter((r) => r.length >= 5 && r[4]); // need piece slug

// Resolve column indices
const slugIdx = header.findIndex((h) => h.trim().toLowerCase() === "piece slug");
if (slugIdx < 0) {
  console.error("Could not find 'Piece Slug' column in CSV header");
  process.exit(1);
}

// Need to look up artist + collection per piece — read from data.ts
const dataText = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf-8");
const piecesMatch = dataText.match(/export const pieces[\s\S]*?\];\n/);
const pieceBlocks = piecesMatch[0].match(/\{[^}]+\}/g) || [];
const pieceLookup = {}; // slug -> { artistSlug, collectionSlug }
for (const block of pieceBlocks) {
  const slug = block.match(/slug:\s*'([^']+)'/)?.[1];
  const artistSlug = block.match(/artistSlug:\s*'([^']+)'/)?.[1];
  const collectionSlug = block.match(/collectionSlug:\s*'([^']+)'/)?.[1];
  if (slug) pieceLookup[slug] = { artistSlug, collectionSlug };
}

const MERGE_INTO = { "tyler-hobbs-and-dandelion-wist": "tyler-hobbs" };
const primaryArtist = (slug) => MERGE_INTO[slug] || slug;

// Walk rows in order, build artist/collection/piece order
const artistOrder = [];
const collectionOrder = {}; // artistSlug -> [collectionSlug, ...]
const pieceOrder = {}; // collectionSlug -> [pieceSlug, ...]
const seen = new Set();

for (const row of data) {
  const pieceSlug = row[slugIdx]?.trim();
  if (!pieceSlug || seen.has(pieceSlug)) continue;
  seen.add(pieceSlug);

  const meta = pieceLookup[pieceSlug];
  if (!meta) {
    console.warn(`Unknown piece slug: ${pieceSlug}`);
    continue;
  }

  const aSlug = primaryArtist(meta.artistSlug);
  const cSlug = meta.collectionSlug;

  if (!artistOrder.includes(aSlug)) artistOrder.push(aSlug);
  if (!collectionOrder[aSlug]) collectionOrder[aSlug] = [];
  if (!collectionOrder[aSlug].includes(cSlug)) collectionOrder[aSlug].push(cSlug);
  if (!pieceOrder[cSlug]) pieceOrder[cSlug] = [];
  pieceOrder[cSlug].push(pieceSlug);
}

// Read curation, update, write back
const curationPath = resolve(ROOT, "src/lib/curation.json");
const curation = JSON.parse(readFileSync(curationPath, "utf-8"));

// Preserve _comment if present
const orderOut = curation.collectionOrder?._comment
  ? { _comment: curation.collectionOrder._comment }
  : {};
for (const a of artistOrder) orderOut[a] = collectionOrder[a];

curation.collectionOrder = orderOut;
curation.pieceOrder = pieceOrder;

// Also store artist order for the homepage
curation.artistOrder = artistOrder;

writeFileSync(curationPath, JSON.stringify(curation, null, 2) + "\n");
console.log(`Imported ${seen.size} pieces.`);
console.log(`  Artists: ${artistOrder.length}`);
console.log(`  Collections: ${Object.keys(pieceOrder).length}`);
console.log(`\nRefresh the site to see your new order.`);
