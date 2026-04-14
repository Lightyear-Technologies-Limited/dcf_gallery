#!/usr/bin/env node
/**
 * Pull missing artwork images identified by scripts/audit-images.mjs.
 *
 * Writes directly into public/art/optimized/ and public/art/thumbs/
 * so images are immediately resolvable by getArtworkImage().
 *
 * Sources (in order):
 *  1. Art Blocks media proxy  — for contract 0xa7d8...d270 (Fidenza, Ringers, etc.)
 *  2. Alchemy demo NFT API    — for everything else
 *
 * Files are saved with .webp extension regardless of source format — Next.js
 * image optimization handles the actual transcoding at request time. Run the
 * proper Python optimizer later if you want true WebP on disk.
 *
 * Usage:
 *   node scripts/pull-missing-images.mjs            # download missing
 *   node scripts/pull-missing-images.mjs --dry      # list only
 */

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");

const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
const PUNKS = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";

const optimizedDir = resolve(ROOT, "public/art/optimized");
const thumbsDir = resolve(ROOT, "public/art/thumbs");
if (!existsSync(optimizedDir)) mkdirSync(optimizedDir, { recursive: true });
if (!existsSync(thumbsDir)) mkdirSync(thumbsDir, { recursive: true });

// ---------------------------------------------------------------------------
// Parse data.ts
// ---------------------------------------------------------------------------
function parsePieces() {
  const text = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf-8");
  const start = text.indexOf("export const pieces");
  const eq = text.indexOf("=", start);
  const arrStart = text.indexOf("[", eq);
  let depth = 0, i = arrStart;
  for (; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") { depth--; if (depth === 0) break; }
  }
  const body = text.slice(arrStart + 1, i);
  const pieces = [];
  depth = 0;
  let objStart = -1;
  for (let k = 0; k < body.length; k++) {
    if (body[k] === "{") { if (depth === 0) objStart = k; depth++; }
    else if (body[k] === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        pieces.push(parseObject(body.slice(objStart, k + 1)));
        objStart = -1;
      }
    }
  }
  return pieces;
}

function parseObject(block) {
  const obj = {};
  const re = /(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    if (obj[m[1]] === undefined) obj[m[1]] = m[2];
  }
  return obj;
}

function expectedName(piece) {
  if (!piece.contractAddress || !piece.tokenId) return null;
  const contract = piece.contractAddress.toLowerCase();
  if (contract === PUNKS) return null; // punks use separate SVG pipeline
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
  return { contract, tokenId, name: `${contract}-${tokenId}.webp` };
}

// ---------------------------------------------------------------------------
// Identify missing
// ---------------------------------------------------------------------------
const pieces = parsePieces();
const optimizedFiles = new Set(readdirSync(optimizedDir));

const missing = [];
for (const p of pieces) {
  const exp = expectedName(p);
  if (!exp) continue;
  if (!optimizedFiles.has(exp.name)) missing.push({ piece: p, ...exp });
}

console.log(`Total pieces: ${pieces.length}`);
console.log(`Missing optimized .webp: ${missing.length}`);

if (DRY || missing.length === 0) {
  for (const m of missing.slice(0, 30)) console.log(`  ${m.piece.slug.padEnd(40)} ${m.name}`);
  if (!DRY) console.log("\nNothing to do.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Fetch one
// ---------------------------------------------------------------------------
async function fetchBinary(url, timeoutMs = 20000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) throw new Error(`not an image (${ct})`);
    const buf = Buffer.from(await res.arrayBuffer());
    return buf;
  } finally {
    clearTimeout(t);
  }
}

async function tryArtBlocks({ contract, tokenId }) {
  // Several hosts serve Art Blocks renders — try in order.
  const urls = [
    `https://media-proxy.artblocks.io/1/${contract}/${tokenId}.png`,
    `https://media.artblocks.io/${tokenId}.png`,
    `https://artblocks-mainnet.s3.amazonaws.com/${tokenId}.png`,
  ];
  let lastErr;
  for (const u of urls) {
    try { return await fetchBinary(u); } catch (e) { lastErr = e; }
  }
  // Fall back to Alchemy metadata as a last resort
  return tryAlchemy({ contract, tokenId });
}

async function tryAlchemy({ contract, tokenId }) {
  const metaUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${contract}&tokenId=${tokenId}`;
  const res = await fetch(metaUrl);
  if (!res.ok) throw new Error(`alchemy HTTP ${res.status}`);
  const text = await res.text();
  let meta;
  try { meta = JSON.parse(text); } catch { throw new Error(`alchemy non-json (${text.slice(0, 40)})`); }
  const candidates = [
    meta?.image?.cachedUrl,
    meta?.image?.pngUrl,
    meta?.image?.originalUrl,
    meta?.image?.thumbnailUrl,
    meta?.raw?.metadata?.image,
    meta?.raw?.metadata?.image_url,
  ].filter(Boolean);
  let lastErr;
  for (const url of candidates) {
    try {
      // ipfs:// URLs need gateway resolution
      const resolved = url.startsWith("ipfs://")
        ? `https://ipfs.io/ipfs/${url.slice(7)}`
        : url;
      return await fetchBinary(resolved);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error(`no image url in metadata`);
}

// ---------------------------------------------------------------------------
// Download loop, limited parallelism
// ---------------------------------------------------------------------------
const LIMIT = 2;           // Alchemy demo tier is strict — keep low
const SLEEP_MS = 400;       // Between requests per worker
const MAX_RETRY = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let done = 0, failed = 0;

async function processOne(m, attempt = 0) {
  const isArtBlocks = m.contract === ART_BLOCKS;
  try {
    const buf = isArtBlocks ? await tryArtBlocks(m) : await tryAlchemy(m);
    writeFileSync(resolve(optimizedDir, m.name), buf);
    writeFileSync(resolve(thumbsDir, m.name), buf);
    done++;
    if (done % 5 === 0 || done + failed === missing.length) {
      console.log(`  ${done} ok / ${failed} failed (${done + failed}/${missing.length})`);
    }
  } catch (e) {
    const throttled = /429|no image url|rate/i.test(e.message);
    if (throttled && attempt < MAX_RETRY) {
      await sleep(1500 * (attempt + 1));
      return processOne(m, attempt + 1);
    }
    failed++;
    console.log(`  ✗ ${m.piece.slug.padEnd(40)} ${e.message}`);
  }
}

async function run() {
  const queue = [...missing];
  const workers = Array.from({ length: LIMIT }, async () => {
    while (queue.length) {
      const m = queue.shift();
      await processOne(m);
      await sleep(SLEEP_MS);
    }
  });
  await Promise.all(workers);
}

console.log(`Downloading with concurrency ${LIMIT}...`);
await run();
console.log(`\nDone. ${done} downloaded, ${failed} failed.`);
if (failed > 0) {
  console.log("Re-run the script to retry failures (successful files are cached).");
}
