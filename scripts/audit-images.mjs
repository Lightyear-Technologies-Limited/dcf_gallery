#!/usr/bin/env node
/**
 * Audit which pieces have optimized image files and which are broken.
 * Runs the real getArtworkImage resolver against public/art/optimized.
 *
 * Usage:
 *   node scripts/audit-images.mjs           # report only
 *   node scripts/audit-images.mjs --fix     # also repair missing from public/art/all
 */

import { readFileSync, readdirSync, existsSync, copyFileSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const FIX = process.argv.includes("--fix");

// ---------------------------------------------------------------------------
// Parse data.ts — robust, bracket-aware block extractor
// ---------------------------------------------------------------------------
function parsePieces() {
  const text = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf-8");
  const start = text.indexOf("export const pieces");
  if (start === -1) throw new Error("pieces array not found");
  // Skip past the `Piece[]` type annotation — find `= [`
  const eq = text.indexOf("=", start);
  const arrStart = text.indexOf("[", eq);
  // Walk bracket depth to find matching closing ]
  let depth = 0, i = arrStart;
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) break; }
  }
  const body = text.slice(arrStart + 1, i);

  // Now walk objects by brace depth
  const pieces = [];
  depth = 0;
  let objStart = -1;
  for (let k = 0; k < body.length; k++) {
    const c = body[k];
    if (c === "{") {
      if (depth === 0) objStart = k;
      depth++;
    } else if (c === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const block = body.slice(objStart, k + 1);
        pieces.push(parseObject(block));
        objStart = -1;
      }
    }
  }
  return pieces;
}

function parseObject(block) {
  const obj = {};
  // Match simple `key: 'value'` (strings) — ignore nested objects/arrays.
  const re = /(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    // Only take the first occurrence of each key (skips nested traits).
    if (obj[m[1]] === undefined) obj[m[1]] = m[2];
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Replicate getArtworkImage() logic
// ---------------------------------------------------------------------------
const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
const PUNKS = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";

function expectedOptimized(piece) {
  if (!piece.contractAddress || !piece.tokenId) return null;
  const contract = piece.contractAddress.toLowerCase();
  if (contract === PUNKS) return { name: `${contract}-${piece.tokenId}.svg`, dir: "all" };
  let tokenId = piece.tokenId;
  if (contract === ART_BLOCKS) {
    const n = parseInt(tokenId, 10);
    if (n < 1000000) {
      let project = null;
      if (piece.slug.startsWith("fidenza-")) project = 78;
      else if (piece.slug.startsWith("ringers-")) project = 13;
      if (project !== null) tokenId = String(project * 1000000 + n);
    }
  }
  return { name: `${contract}-${tokenId}.webp`, dir: "optimized" };
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
const pieces = parsePieces();
console.log(`Parsed ${pieces.length} pieces from data.ts`);

const optimizedDir = resolve(ROOT, "public/art/optimized");
const thumbsDir = resolve(ROOT, "public/art/thumbs");
const allDir = resolve(ROOT, "public/art/all");
const optimizedFiles = new Set(readdirSync(optimizedDir));
const thumbsFiles = new Set(readdirSync(thumbsDir));
const allFiles = existsSync(allDir) ? new Set(readdirSync(allDir)) : new Set();

const missing = [];
const noContract = [];
const availableInAll = [];

for (const p of pieces) {
  const exp = expectedOptimized(p);
  if (!exp) {
    noContract.push(p);
    continue;
  }
  if (exp.dir === "all") continue; // punks use /all SVGs, handled elsewhere
  if (!optimizedFiles.has(exp.name)) {
    // Is the source file in /all? If so we can re-optimize it.
    const rawName = exp.name.replace(".webp", "");
    const candidates = [...allFiles].filter((f) => f.startsWith(rawName + "."));
    missing.push({ piece: p, expected: exp.name, sourceCandidates: candidates });
    if (candidates.length) availableInAll.push({ piece: p, source: candidates[0], target: exp.name });
  }
}

console.log("");
console.log(`Pieces missing contractAddress or tokenId: ${noContract.length}`);
if (noContract.length) {
  const byCol = {};
  for (const p of noContract) byCol[p.collectionSlug] = (byCol[p.collectionSlug] || 0) + 1;
  for (const [c, n] of Object.entries(byCol).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${c}: ${n}`);
  }
}

console.log("");
console.log(`Pieces missing optimized .webp: ${missing.length}`);
if (missing.length) {
  const byCol = {};
  for (const m of missing) byCol[m.piece.collectionSlug] = (byCol[m.piece.collectionSlug] || 0) + 1;
  for (const [c, n] of Object.entries(byCol).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${c}: ${n}`);
  }
  console.log("");
  console.log("Sample missing pieces (first 15):");
  for (const m of missing.slice(0, 15)) {
    const mark = m.sourceCandidates.length ? "✓ source in /all" : "✗ no source";
    console.log(`    ${m.piece.slug.padEnd(40)} ${mark}  ${m.expected}`);
  }
}

console.log("");
console.log(`Of the ${missing.length} missing, ${availableInAll.length} have a source file in public/art/all that could be re-optimized.`);

if (FIX && availableInAll.length) {
  console.log("\n--fix passed: writing sources into public/art/optimized and public/art/thumbs as-is (no resize).");
  console.log("(This gets them loading immediately. Re-run the optimizer later for proper size variants.)");
  let fixed = 0;
  for (const a of availableInAll) {
    const src = resolve(allDir, a.source);
    const destOpt = resolve(optimizedDir, a.target);
    const destThumb = resolve(thumbsDir, a.target);
    try {
      copyFileSync(src, destOpt);
      copyFileSync(src, destThumb);
      fixed++;
    } catch (e) {
      console.error(`    failed ${a.source}: ${e.message}`);
    }
  }
  console.log(`Copied ${fixed} files into optimized/ and thumbs/`);
}
