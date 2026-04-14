#!/usr/bin/env node
/**
 * Export curation to an editable CSV.
 * Open in Excel, drag rows up/down to reorder, save, then run import-curation.mjs.
 *
 * CSV columns:
 *   Order (just for reference - position in file = display order)
 *   Artist
 *   Collection
 *   Piece Title
 *   Piece Slug   (the unique ID — don't edit this)
 *   Token ID
 *
 * To reorder pieces: drag rows in Excel.
 * To reorder collections: collections are sorted by where their first piece appears.
 * To reorder artists: artists are sorted by where their first piece appears.
 *
 * Usage: node scripts/export-curation.mjs
 *        Output: dcf-curation.csv (in project root)
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const curation = JSON.parse(readFileSync(resolve(ROOT, "src/lib/curation.json"), "utf-8"));
const dataText = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf-8");

// Parse data.ts
function extractObjects(arrayName) {
  const re = new RegExp(`export const ${arrayName}[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`);
  const m = dataText.match(re);
  if (!m) return [];
  const body = m[1];
  const blocks = body.match(/\{[^}]*\}/g) || [];
  return blocks.map((b) => {
    const obj = {};
    for (const line of b.split(",")) {
      const kv = line.match(/(\w+):\s*'([^']*)'/);
      if (kv) obj[kv[1]] = kv[2];
    }
    return obj;
  });
}

const artists = extractObjects("artists");
const collections = extractObjects("collections");
const pieces = extractObjects("pieces");

const artistName = (slug) => {
  const override = curation.artistNames?.[slug];
  if (override) return override;
  const a = artists.find((x) => x.slug === slug);
  return a?.name || slug;
};

const collectionName = (slug) => {
  const override = curation.collectionNames?.[slug];
  if (override) return override;
  const c = collections.find((x) => x.slug === slug);
  return c?.name || slug;
};

const hidden = new Set(curation.hideCollections || []);
const MERGE_INTO = { "tyler-hobbs-and-dandelion-wist": "tyler-hobbs" };

// Apply existing pieceOrder + collectionOrder
const artistOrder = []; // ordered list of artist slugs
const collectionOrder = {}; // artistSlug -> array of collection slugs in order
const pieceOrder = {}; // collectionSlug -> array of piece slugs in order

// Build artist order based on existing collectionOrder keys, then alphabetical for the rest
const orderedArtistSlugs = Object.keys(curation.collectionOrder || {}).filter((k) => !k.startsWith("_"));
const allArtistSlugs = [...new Set(artists.map((a) => a.slug).filter((s) => !MERGE_INTO[s]))];
const remaining = allArtistSlugs.filter((s) => !orderedArtistSlugs.includes(s));
remaining.sort((a, b) => artistName(a).localeCompare(artistName(b)));
artistOrder.push(...orderedArtistSlugs, ...remaining);

for (const aSlug of artistOrder) {
  const merged = Object.entries(MERGE_INTO).filter(([_, p]) => p === aSlug).map(([c]) => c);
  const allSlugs = [aSlug, ...merged];
  const cols = collections
    .filter((c) => allSlugs.includes(c.artistSlug) && !hidden.has(c.slug))
    .map((c) => c.slug);

  // Apply curation collectionOrder
  const order = curation.collectionOrder?.[aSlug] || [];
  const ordered = order.filter((s) => cols.includes(s));
  const rest = cols.filter((s) => !ordered.includes(s));
  collectionOrder[aSlug] = [...ordered, ...rest];

  for (const cSlug of collectionOrder[aSlug]) {
    const colPieces = pieces.filter((p) => p.collectionSlug === cSlug);
    const order = curation.pieceOrder?.[cSlug] || [];
    const orderedPieces = order.map((s) => colPieces.find((p) => p.slug === s)).filter(Boolean);
    const restPieces = colPieces.filter((p) => !order.includes(p.slug));
    pieceOrder[cSlug] = [...orderedPieces, ...restPieces];
  }
}

// Generate CSV
function csvEscape(s) {
  if (s == null) return "";
  const str = String(s);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const rows = ["Order,Artist,Collection,Piece Title,Piece Slug,Token ID"];
let order = 1;
for (const aSlug of artistOrder) {
  for (const cSlug of collectionOrder[aSlug]) {
    for (const piece of pieceOrder[cSlug]) {
      rows.push([
        order++,
        artistName(aSlug),
        collectionName(cSlug),
        piece.title,
        piece.slug,
        piece.tokenId,
      ].map(csvEscape).join(","));
    }
  }
}

const outPath = resolve(ROOT, "dcf-curation.csv");
writeFileSync(outPath, rows.join("\r\n"));
console.log(`Exported ${rows.length - 1} pieces to dcf-curation.csv`);
console.log(`\nOpen in Excel, rearrange rows (just drag them up/down), save as CSV.`);
console.log(`Then run: node scripts/import-curation.mjs`);
