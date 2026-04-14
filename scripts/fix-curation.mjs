#!/usr/bin/env node
/**
 * Validate and format curation.json.
 *
 * Supports inline row tags after piece slugs to group pieces into rows:
 *
 *   "ringers": [
 *     "ringers-13000273-d270", (1)
 *     "ringers-13000708-d270", (1)
 *     "ringers-13000117-d270", (2)
 *     "ringers-13000014-d270",
 *     "ringers-13000025-d270"
 *   ]
 *
 * Idempotent — running repeatedly gives the same result.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const curationPath = resolve(ROOT, "src/lib/curation.json");

// ---------------------------------------------------------------------------
// 1. Read raw text and extract (N) row tags per line
// ---------------------------------------------------------------------------
const raw = readFileSync(curationPath, "utf-8");

// Parse line-by-line to find piece slugs with (N) tags, tracking which
// collection we're in. Much more robust than complex regexes.
const rowMap = {}; // { collectionSlug: { pieceSlug: rowNum } }

const lines = raw.split("\n");
let inPieceOrder = false;
let pieceOrderDepth = 0;
let currentCollection = null;

for (const line of lines) {
  if (line.includes('"pieceOrder"')) inPieceOrder = true;
  if (!inPieceOrder) continue;

  // Track brace depth to know when we leave pieceOrder
  for (const ch of line) {
    if (ch === "{") pieceOrderDepth++;
    if (ch === "}") pieceOrderDepth--;
  }
  if (pieceOrderDepth === 0 && inPieceOrder && line.includes("}")) {
    inPieceOrder = false;
    continue;
  }

  // Collection key line: "collection-slug": [
  const colMatch = line.match(/^\s*"([a-z0-9-]+)"\s*:\s*\[/);
  if (colMatch && !colMatch[1].startsWith("_")) {
    currentCollection = colMatch[1];
    continue;
  }

  // End of collection array
  if (line.match(/^\s*\]/)) {
    currentCollection = null;
    continue;
  }

  // Piece line — may have (N) tag
  if (currentCollection) {
    const pieceMatch = line.match(/"([^"]+)"\s*,?\s*\((\d+)\)/);
    if (pieceMatch) {
      if (!rowMap[currentCollection]) rowMap[currentCollection] = {};
      rowMap[currentCollection][pieceMatch[1]] = parseInt(pieceMatch[2], 10);
    }
  }
}

// Strip all (N) and empty () placeholder tags to get valid JSON
const stripped = raw.replace(/\s*\(\d*\)/g, "");

// ---------------------------------------------------------------------------
// 2. Parse JSON
// ---------------------------------------------------------------------------
let curation;
try {
  curation = JSON.parse(stripped);
} catch (e) {
  console.error("\n❌ curation.json is not valid JSON after stripping (N) tags:\n");
  console.error(`   ${e.message}\n`);
  const srcLines = stripped.split("\n");
  const pm = e.message.match(/position (\d+)/);
  if (pm) {
    const pos = parseInt(pm[1], 10);
    let lineNum = 0, charCount = 0;
    for (let i = 0; i < srcLines.length; i++) {
      if (charCount + srcLines[i].length >= pos) { lineNum = i + 1; break; }
      charCount += srcLines[i].length + 1;
    }
    console.error(`   Look around line ${lineNum}:`);
    const start = Math.max(0, lineNum - 3);
    const end = Math.min(srcLines.length, lineNum + 2);
    for (let i = start; i < end; i++) {
      const marker = i + 1 === lineNum ? " → " : "   ";
      console.error(`${marker}${String(i + 1).padStart(4)}: ${srcLines[i]}`);
    }
  }
  console.error("\nCommon fixes: missing comma, trailing comma, unclosed bracket.\n");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 3. Load data.ts references
// ---------------------------------------------------------------------------
const dataText = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf-8");

function parseObjects(arrayName) {
  const re = new RegExp(`export const ${arrayName}[^=]*=\\s*\\[([\\s\\S]*?)\\n\\];`);
  const m = dataText.match(re);
  if (!m) return [];
  const blocks = m[1].match(/\{[^}]*\}/g) || [];
  return blocks.map((b) => {
    const obj = {};
    for (const line of b.split(",")) {
      const kv = line.match(/(\w+):\s*'([^']*)'/);
      if (kv) obj[kv[1]] = kv[2];
    }
    return obj;
  });
}

const artists = parseObjects("artists");
const collections = parseObjects("collections");
const pieces = parseObjects("pieces");
const artistSlugs = new Set(artists.map((a) => a.slug));
const collectionSlugs = new Set(collections.map((c) => c.slug));
const pieceSlugs = new Set(pieces.map((p) => p.slug));
const pieceToCollection = {};
for (const p of pieces) pieceToCollection[p.slug] = p.collectionSlug;

// ---------------------------------------------------------------------------
// 4. Validate and clean
// ---------------------------------------------------------------------------
const warnings = [];

for (const slug of Object.keys(curation.artistNames || {})) {
  if (!artistSlugs.has(slug)) warnings.push(`artistNames: unknown artist slug "${slug}"`);
}
for (const slug of Object.keys(curation.collectionOrder || {})) {
  if (slug.startsWith("_")) continue;
  if (!artistSlugs.has(slug)) warnings.push(`collectionOrder: unknown artist slug "${slug}"`);
}
for (const slug of Object.keys(curation.collectionNames || {})) {
  if (!collectionSlugs.has(slug)) warnings.push(`collectionNames: unknown collection slug "${slug}"`);
}
for (const slug of curation.hideCollections || []) {
  if (!collectionSlugs.has(slug)) warnings.push(`hideCollections: unknown collection slug "${slug}"`);
}

// Clean pieceOrder: dedupe, validate
const cleanPieceOrder = {};
for (const [colSlug, pieceList] of Object.entries(curation.pieceOrder || {})) {
  if (colSlug.startsWith("_")) continue;
  if (!collectionSlugs.has(colSlug)) {
    warnings.push(`pieceOrder: unknown collection slug "${colSlug}"`);
    continue;
  }
  if (!Array.isArray(pieceList)) continue;
  const seen = new Set();
  const cleaned = [];
  for (const p of pieceList) {
    if (typeof p !== "string" || seen.has(p)) continue;
    if (!pieceSlugs.has(p)) {
      warnings.push(`pieceOrder.${colSlug}: unknown piece slug "${p}"`);
      continue;
    }
    if (pieceToCollection[p] !== colSlug) {
      warnings.push(`pieceOrder.${colSlug}: piece "${p}" belongs to "${pieceToCollection[p]}"`);
      continue;
    }
    seen.add(p);
    cleaned.push(p);
  }
  cleanPieceOrder[colSlug] = cleaned;
}

// Clean rowMap
const cleanRowMap = {};
for (const [colSlug, rows] of Object.entries(rowMap)) {
  const validRows = {};
  for (const [piece, row] of Object.entries(rows)) {
    if (pieceSlugs.has(piece) && pieceToCollection[piece] === colSlug) {
      validRows[piece] = row;
    }
  }
  if (Object.keys(validRows).length > 0) cleanRowMap[colSlug] = validRows;
}

// ---------------------------------------------------------------------------
// 5. Reorder pieceOrder keys to match site display order
// ---------------------------------------------------------------------------
const MERGE_INTO = { "tyler-hobbs-and-dandelion-wist": "tyler-hobbs" };
const hidden = new Set(curation.hideCollections || []);
const primaryArtists = artists.filter((a) => !MERGE_INTO[a.slug]);
const curatedArtistOrder = curation.artistOrder || [];

function artistName(slug) {
  return curation.artistNames?.[slug] || artists.find((a) => a.slug === slug)?.name || slug;
}

const sortedArtists = [
  ...curatedArtistOrder.map((s) => primaryArtists.find((a) => a.slug === s)).filter(Boolean),
  ...primaryArtists
    .filter((a) => !curatedArtistOrder.includes(a.slug))
    .sort((a, b) => artistName(a.slug).localeCompare(artistName(b.slug))),
];

const orderedCollectionSlugs = [];
for (const artist of sortedArtists) {
  const merged = Object.entries(MERGE_INTO).filter(([, p]) => p === artist.slug).map(([c]) => c);
  const allSlugs = [artist.slug, ...merged];
  const cols = collections.filter((c) => allSlugs.includes(c.artistSlug) && !hidden.has(c.slug));
  const colOrder = curation.collectionOrder?.[artist.slug] || [];
  const sortedCols = [
    ...colOrder.map((s) => cols.find((c) => c.slug === s)).filter(Boolean),
    ...cols.filter((c) => !colOrder.includes(c.slug)),
  ];
  for (const c of sortedCols) orderedCollectionSlugs.push(c.slug);
}

const reorderedPieceOrder = {};
for (const slug of orderedCollectionSlugs) {
  if (cleanPieceOrder[slug]) reorderedPieceOrder[slug] = cleanPieceOrder[slug];
}
for (const [k, v] of Object.entries(cleanPieceOrder)) {
  if (!reorderedPieceOrder[k]) reorderedPieceOrder[k] = v;
}

curation.pieceOrder = reorderedPieceOrder;
curation.pieceRows = cleanRowMap;

// ---------------------------------------------------------------------------
// 6. Write back. Manually serialize pieceOrder to include (N) tags inline.
// ---------------------------------------------------------------------------
// Serialize the rest normally
const pieceOrderBackup = curation.pieceOrder;
delete curation.pieceOrder;
let outHead = JSON.stringify(curation, null, 2);
curation.pieceOrder = pieceOrderBackup;

// Remove closing brace to inject pieceOrder before it
const lastBrace = outHead.lastIndexOf("}");
outHead = outHead.substring(0, lastBrace).trimEnd();
if (outHead.endsWith(",")) outHead = outHead.slice(0, -1);

// Build pieceOrder block with inline (N) tags
const pieceOrderLines = ['  "pieceOrder": {'];
const colKeys = Object.keys(pieceOrderBackup);
colKeys.forEach((colSlug, ci) => {
  pieceOrderLines.push(`    "${colSlug}": [`);
  const piecesList = pieceOrderBackup[colSlug];
  const colRows = cleanRowMap[colSlug] || {};
  piecesList.forEach((piece, pi) => {
    const isLast = pi === piecesList.length - 1;
    const comma = isLast ? "" : ",";
    const tag = typeof colRows[piece] === "number" ? ` (${colRows[piece]})` : " ()";
    pieceOrderLines.push(`      "${piece}"${comma}${tag}`);
  });
  pieceOrderLines.push(`    ]${ci === colKeys.length - 1 ? "" : ","}`);
});
pieceOrderLines.push("  }");

const out = outHead + ",\n" + pieceOrderLines.join("\n") + "\n}\n";

writeFileSync(curationPath, out);

// Also write a clean JSON (no (N) tags) for the app to import
const cleanJsonPath = resolve(ROOT, "src/lib/curation.data.json");
writeFileSync(cleanJsonPath, JSON.stringify(curation, null, 2) + "\n");

if (warnings.length > 0) {
  console.log(`⚠  ${warnings.length} issue(s):`);
  for (const w of warnings) console.log(`   - ${w}`);
  console.log();
}
console.log(`✓ curation.json validated and formatted.`);
console.log(`  Collections: ${Object.keys(reorderedPieceOrder).length}`);
console.log(`  Pieces: ${Object.values(reorderedPieceOrder).reduce((s, a) => s + a.length, 0)}`);
if (Object.keys(cleanRowMap).length > 0) {
  const tagged = Object.values(cleanRowMap).reduce((s, r) => s + Object.keys(r).length, 0);
  console.log(`  Row tags: ${tagged} pieces across ${Object.keys(cleanRowMap).length} collection(s)`);
}
