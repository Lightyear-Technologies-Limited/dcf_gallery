#!/usr/bin/env node
/**
 * Fetch the original artwork URI (IPFS, Arweave, or on-chain) for each piece
 * and inject it into data.ts as `originalUri`.
 *
 * Priority order for the URI we capture (most useful to least):
 *   1. raw.metadata.image  — the artist-declared image source (usually ipfs://)
 *   2. raw.metadata.animation_url — for video/interactive pieces
 *   3. image.originalUrl — Alchemy's resolved source
 *
 * Skips pieces that already have originalUri.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const file = resolve(ROOT, "src/lib/data.ts");

// ---------------------------------------------------------------------------
// Parse pieces from data.ts (bracket-aware)
// ---------------------------------------------------------------------------
function parsePieces(src) {
  const start = src.indexOf("export const pieces");
  const eq = src.indexOf("=", start);
  const arrStart = src.indexOf("[", eq);
  let depth = 0, i = arrStart;
  for (; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") { depth--; if (depth === 0) break; }
  }
  const body = src.slice(arrStart + 1, i);
  const pieces = [];
  depth = 0;
  let objStart = -1;
  for (let k = 0; k < body.length; k++) {
    if (body[k] === "{") { if (depth === 0) objStart = k; depth++; }
    else if (body[k] === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const block = body.slice(objStart, k + 1);
        const obj = {};
        const re = /(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'/g;
        let m;
        while ((m = re.exec(block)) !== null) {
          if (obj[m[1]] === undefined) obj[m[1]] = m[2];
        }
        obj._absStart = arrStart + 1 + objStart;
        obj._absEnd = arrStart + 1 + k + 1;
        pieces.push(obj);
        objStart = -1;
      }
    }
  }
  return pieces;
}

const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";

function resolveTokenId(piece) {
  if (!piece.contractAddress || !piece.tokenId) return null;
  const contract = piece.contractAddress.toLowerCase();
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
  return { contract, tokenId };
}

async function fetchOriginalUri(piece) {
  const r = resolveTokenId(piece);
  if (!r) return null;
  const url = `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${r.contract}&tokenId=${r.tokenId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  let meta;
  try { meta = JSON.parse(text); } catch { throw new Error(`non-json`); }
  // Prefer the raw artist-declared image over Alchemy's cached version
  const candidates = [
    meta?.raw?.metadata?.image,
    meta?.raw?.metadata?.animation_url,
    meta?.image?.originalUrl,
  ].filter((u) => typeof u === "string" && u.length > 0 && !u.startsWith("data:"));
  return candidates[0] || null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
let src = readFileSync(file, "utf-8");
const pieces = parsePieces(src);

const todo = pieces.filter((p) => !p.originalUri && p.contractAddress && p.tokenId);
console.log(`${pieces.length} total, ${todo.length} need originalUri`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = {};
let done = 0, failed = 0;
for (const piece of todo) {
  try {
    const uri = await fetchOriginalUri(piece);
    if (uri) {
      results[piece.slug] = uri;
      done++;
    } else {
      failed++;
      console.log(`  ✗ ${piece.slug}: no usable uri`);
    }
  } catch (e) {
    failed++;
    console.log(`  ✗ ${piece.slug}: ${e.message}`);
  }
  if ((done + failed) % 20 === 0) {
    console.log(`  ${done} ok / ${failed} failed (${done + failed}/${todo.length})`);
  }
  await sleep(400);
}

console.log(`\nFetched ${done} URIs, ${failed} failed.`);

// ---------------------------------------------------------------------------
// Inject into data.ts
// ---------------------------------------------------------------------------
// Walk pieces in reverse (highest offset first) so offsets stay valid.
// Inject BEFORE the closing `}` without removing the brace itself.
const sorted = [...pieces].sort((a, b) => b._absEnd - a._absEnd);
let injected = 0;
for (const piece of sorted) {
  const uri = results[piece.slug];
  if (!uri) continue;
  const block = src.slice(piece._absStart, piece._absEnd);
  if (block.includes("originalUri:")) continue; // already set
  const closingBraceRel = block.lastIndexOf("}");
  if (closingBraceRel < 0) continue;
  const indent = "    ";
  const escapedUri = uri.replace(/'/g, "\\'");
  // Insert before the closing brace — preserves existing structure
  const insertAt = piece._absStart + closingBraceRel;
  src =
    src.slice(0, insertAt).trimEnd() +
    `\n${indent}originalUri: '${escapedUri}',\n  ` +
    src.slice(insertAt);
  injected++;
}

writeFileSync(file, src);
console.log(`Injected originalUri into ${injected} pieces.`);
