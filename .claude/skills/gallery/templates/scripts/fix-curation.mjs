#!/usr/bin/env node
/**
 * Parse curation.json (which supports inline `(N)` row tags and `//` trait
 * comments after piece slugs) into strict JSON at curation.data.json.
 *
 * Row tag example (Fidenza layout, 4 rows):
 *   "fidenza": [
 *     "fidenza-456", (1)
 *     "fidenza-91",  (1)
 *     "fidenza-100", (2)
 *     "fidenza-233"
 *   ]
 *
 * Idempotent — running repeatedly gives the same result.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const curationPath = resolve(ROOT, "src/lib/curation.json");
const outputPath = resolve(ROOT, "src/lib/curation.data.json");

const raw = readFileSync(curationPath, "utf-8");

// Extract (N) row tags per line while tracking which collection we're in.
const rowMap = {};
const lines = raw.split("\n");
let inPieceOrder = false;
let depth = 0;
let currentCollection = null;

for (const line of lines) {
  if (line.includes('"pieceOrder"')) inPieceOrder = true;
  if (!inPieceOrder) continue;

  for (const ch of line) {
    if (ch === "{") depth++;
    if (ch === "}") depth--;
  }
  if (depth === 0 && inPieceOrder && line.includes("}")) {
    inPieceOrder = false;
    continue;
  }

  const colMatch = line.match(/^\s*"([a-z0-9-]+)"\s*:\s*\[/);
  if (colMatch && !colMatch[1].startsWith("_")) {
    currentCollection = colMatch[1];
    continue;
  }
  if (line.match(/^\s*\]/)) {
    currentCollection = null;
    continue;
  }
  if (currentCollection) {
    const m = line.match(/"([^"]+)"\s*,?\s*\((\d+)\)/);
    if (m) {
      if (!rowMap[currentCollection]) rowMap[currentCollection] = {};
      rowMap[currentCollection][m[1]] = parseInt(m[2], 10);
    }
  }
}

// Strip `// trait...` comments AFTER (N) tags on piece lines, then strip
// the tags themselves to get valid JSON.
const stripped = raw
  .replace(/\(\d*\)\s*\/\/[^\n]*/g, (m) => m.match(/\(\d*\)/)[0])
  .replace(/\s*\(\d*\)/g, "");

let curation;
try {
  curation = JSON.parse(stripped);
} catch (e) {
  console.error(`\n✗ curation.json is not valid JSON after stripping (N) tags:\n  ${e.message}\n`);
  process.exit(1);
}

// Attach row map as pieceRows sidecar
if (Object.keys(rowMap).length > 0) {
  curation.pieceRows = rowMap;
}

// Drop `_note`-prefixed keys (authoring hints)
for (const k of Object.keys(curation)) {
  if (k.startsWith("_")) delete curation[k];
}

writeFileSync(outputPath, JSON.stringify(curation, null, 2) + "\n");

const collectionCount = Object.keys(curation.collectionNames || {}).length;
const pieceCount = Object.values(curation.pieceOrder || {}).reduce((s, arr) => s + arr.length, 0);
const rowTagCount = Object.values(rowMap).reduce((s, o) => s + Object.keys(o).length, 0);
console.log(`✓ curation.json validated and formatted.`);
console.log(`  Collections: ${collectionCount}`);
console.log(`  Pieces: ${pieceCount}`);
if (rowTagCount) console.log(`  Row tags: ${rowTagCount} pieces across ${Object.keys(rowMap).length} collection(s)`);
