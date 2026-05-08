#!/usr/bin/env node
/**
 * Adds inline trait + position annotations to curation.json pieceOrder entries.
 *   "fidenza-145-d270", ()  →  "fidenza-145-d270", () // [7/30] Baked, Uniform
 *
 * Format: [position/total] trait summary
 *   - position = 1-based index within the collection's current order
 *   - total    = total pieces in that collection
 *
 * Annotations are stripped by fix-curation.mjs, so they're purely for the
 * human editor's benefit. Run this AFTER fix-curation.mjs to re-annotate.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const curationPath = resolve(__dirname, "..", "src/lib/curation.json");
const traitMapPath = resolve(__dirname, "trait-map.json");

const traits = JSON.parse(readFileSync(traitMapPath, "utf-8"));
const curation = readFileSync(curationPath, "utf-8");

// First pass: walk through pieceOrder and build a position map per collection.
// Tracks which collection each piece slug belongs to AND its index (1-based).
const lines = curation.split("\n");
const positions = {}; // { slug: "[n/total]" }
let inPieceOrder = false;
let depth = 0;
let currentCol = null;
let collected = []; // accumulator for current collection

// Scan once to count totals per collection so we can format [n/total]
const collectionSlugs = [];
const collectionPieces = {};
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
    if (currentCol) collectionPieces[currentCol] = collected;
    currentCol = colMatch[1];
    collected = [];
    collectionSlugs.push(currentCol);
    continue;
  }
  if (line.match(/^\s*\]/)) {
    if (currentCol) collectionPieces[currentCol] = collected;
    currentCol = null;
    collected = [];
    continue;
  }
  if (currentCol) {
    const pm = line.match(/^\s*"([^"]+)"/);
    if (pm) collected.push(pm[1]);
  }
}

// Build position strings
for (const col of collectionSlugs) {
  const pieces = collectionPieces[col] || [];
  const total = pieces.length;
  pieces.forEach((slug, i) => {
    positions[slug] = `[${i + 1}/${total}]`;
  });
}

// Second pass: annotate each line with [n/total] + trait
const annotated = lines.map((line) => {
  const m = line.match(/^(\s*"([^"]+)"\s*,?\s*\(\d*\))\s*(\/\/.*)?$/);
  if (!m) return line;
  const slug = m[2];
  const prefix = m[1];
  const pos = positions[slug];
  const trait = traits[slug];
  if (!pos && !trait) return line;
  const comment = [pos, trait].filter(Boolean).join(" ");
  return `${prefix} // ${comment}`;
});

writeFileSync(curationPath, annotated.join("\n"));
const count = annotated.filter((l) => l.match(/\/\/ \[\d+\/\d+\]/)).length;
console.log(`Annotated ${count} lines with [position/total] + trait.`);
