#!/usr/bin/env node
/**
 * Scaffold pieceOrder for every collection in curation.json.
 * Pre-fills with the current order so you can just rearrange.
 *
 * Usage: node scripts/scaffold-piece-order.mjs
 *
 * If pieceOrder for a collection already exists, it's kept as-is.
 * Hidden collections are skipped.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Load curation
const curationPath = resolve(ROOT, "src/lib/curation.json");
const curation = JSON.parse(readFileSync(curationPath, "utf-8"));
const hidden = new Set(curation.hideCollections || []);
const existingOrder = curation.pieceOrder || {};

// Parse data.ts to extract collections + their pieces
const dataText = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf-8");

// Find collections array bounds
const collectionsMatch = dataText.match(/export const collections[\s\S]*?\];\n/);
const piecesMatch = dataText.match(/export const pieces[\s\S]*?\];\n/);

if (!collectionsMatch || !piecesMatch) {
  console.error("Could not find collections or pieces in data.ts");
  process.exit(1);
}

// Extract collection slugs
const collectionSlugs = [...collectionsMatch[0].matchAll(/slug: '([^']+)'/g)].map((m) => m[1]);

// Extract pieces with their collection assignment
// Each piece is an object: { id: '...', slug: '...', ..., collectionSlug: '...' }
const pieceBlocks = piecesMatch[0].match(/\{[^}]+\}/g) || [];
const piecesByCollection = {};
for (const block of pieceBlocks) {
  const slugMatch = block.match(/slug:\s*'([^']+)'/);
  const colMatch = block.match(/collectionSlug:\s*'([^']+)'/);
  if (slugMatch && colMatch) {
    const colSlug = colMatch[1];
    if (!piecesByCollection[colSlug]) piecesByCollection[colSlug] = [];
    piecesByCollection[colSlug].push(slugMatch[1]);
  }
}

// Build new pieceOrder
const newOrder = {};
for (const colSlug of collectionSlugs) {
  if (hidden.has(colSlug)) continue;
  if (existingOrder[colSlug]) {
    // Preserve existing order, but append any new pieces
    const existing = existingOrder[colSlug];
    const all = piecesByCollection[colSlug] || [];
    const missing = all.filter((s) => !existing.includes(s));
    newOrder[colSlug] = [...existing, ...missing];
  } else {
    newOrder[colSlug] = piecesByCollection[colSlug] || [];
  }
}

// Write back
curation.pieceOrder = newOrder;

// Pretty-format JSON: each piece slug on its own line
let json = JSON.stringify(curation, null, 2);
writeFileSync(curationPath, json + "\n");

console.log(`Scaffolded pieceOrder for ${Object.keys(newOrder).length} collections.`);
console.log("Edit src/lib/curation.json to rearrange piece order within each collection.");
