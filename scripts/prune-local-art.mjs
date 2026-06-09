#!/usr/bin/env node
/**
 * prune-local-art.mjs — remove dead local binaries from public/art.
 *
 * After the Filebase migration, raster pieces serve from the gateway and only a
 * computed KEEP-SET of local files is still referenced: the curated crops /
 * screengrabs / physical-piece image in images.ts, plus the CryptoPunk SVGs in
 * /art/all. Everything else (auto-pulled optimized/ + thumbs/ webp, raw master
 * PNGs) is dead weight.
 *
 * SAFETY: flags any piece that would resolve to a deleted file (404). If any are
 * found it refuses to apply. Dry-run by default; pass --apply to delete.
 *
 * Usage: node scripts/prune-local-art.mjs [--apply]
 */
import { readFileSync, readdirSync, statSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");
const ART = resolve(ROOT, "public/art");

const PUNK1 = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const PUNK2 = "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6";
const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";

// --- curated keys + paths from images.ts -----------------------------------
const imagesTs = readFileSync(resolve(ROOT, "src/lib/images.ts"), "utf8");
const curatedEntries = [...imagesTs.matchAll(/"([a-z0-9-]+)":\s*"(\/art\/[^"]+)"/g)];
const curatedKeys = new Set(curatedEntries.map((m) => m[1]));
const keep = new Set(curatedEntries.map((m) => m[2].replace(/^\//, ""))); // relative to public/

// punk SVGs always kept
try {
  for (const f of readdirSync(resolve(ART, "all"))) if (f.endsWith(".svg")) keep.add(`art/all/${f}`);
} catch {}

function isCurated(slug) {
  if (curatedKeys.has(slug)) return true;
  const p = slug.split("-");
  for (let l = p.length - 1; l >= 2; l--) if (curatedKeys.has(p.slice(0, l).join("-"))) return true;
  return false;
}

// --- pieces from data.ts ---------------------------------------------------
const cids = JSON.parse(readFileSync(resolve(ROOT, "src/lib/provenance.cids.json"), "utf8"));
const data = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf8");
const body = data.slice(data.indexOf("export const pieces"), data.indexOf("export const influences"));
const blocks = body.split(/\n\s{2}\{\s*\n/).slice(1);
const pieces = [];
for (const b of blocks) {
  const slug = b.match(/slug:\s*'([^']+)'/)?.[1];
  const contract = b.match(/contractAddress:\s*'([^']*)'/)?.[1];
  const tokenId = b.match(/tokenId:\s*'([^']*)'/)?.[1];
  if (slug) pieces.push({ slug, contract: (contract || "").toLowerCase(), tokenId });
}

function resolveTokenId(slug, contract, tokenId) {
  if (contract === ART_BLOCKS && parseInt(tokenId, 10) < 1000000) {
    let project = slug.startsWith("fidenza-") ? 78 : slug.startsWith("ringers-") ? 13 : null;
    if (project) return String(project * 1000000 + parseInt(tokenId, 10));
  }
  return tokenId;
}

// --- safety: which pieces would 404 after the prune? -----------------------
const wouldBreak = [];
for (const p of pieces) {
  if (isCurated(p.slug)) continue;                       // served by a kept curated file
  if (p.contract === PUNK1 || p.contract === PUNK2) continue; // kept punk svg
  if (cids[p.slug]) continue;                            // served by the gateway
  // otherwise getArtworkImage would fall to the (deleted) auto-path
  if (p.contract && p.tokenId) {
    const full = resolveTokenId(p.slug, p.contract, p.tokenId);
    wouldBreak.push({ slug: p.slug, autoPath: `art/optimized/${p.contract}-${full}.webp` });
  }
}

// --- walk public/art, classify -----------------------------------------------
function walk(dir, acc = []) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, f.name);
    if (f.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}
const PUBLIC = resolve(ROOT, "public").replace(/\\/g, "/") + "/";
const all = walk(ART);
let pruneBytes = 0, keepBytes = 0, pruneCount = 0, keepCount = 0;
const toPrune = [];
for (const f of all) {
  const fNorm = f.replace(/\\/g, "/");
  const rel = fNorm.startsWith(PUBLIC) ? fNorm.slice(PUBLIC.length) : fNorm;
  const sz = statSync(f).size;
  if (keep.has(rel)) { keepBytes += sz; keepCount++; }
  else { pruneBytes += sz; pruneCount++; toPrune.push(f); }
}

console.log(`Curated keep paths: ${[...keep].filter((k) => !k.startsWith("art/all/")).length}`);
console.log(`Punk svgs kept:     ${[...keep].filter((k) => k.startsWith("art/all/")).length}`);
console.log(`KEEP:  ${keepCount} files, ${(keepBytes / 1048576).toFixed(1)} MB`);
console.log(`PRUNE: ${pruneCount} files, ${(pruneBytes / 1048576).toFixed(1)} MB`);

if (wouldBreak.length) {
  console.log(`\n⛔ ${wouldBreak.length} piece(s) would 404 after pruning (no gateway/curated/punk source):`);
  for (const w of wouldBreak.slice(0, 20)) console.log(`   - ${w.slug}`);
  console.log("Refusing to apply. Resolve these (pin them, or add to the curated map) first.");
  process.exit(1);
}

if (APPLY) {
  for (const f of toPrune) unlinkSync(f);
  console.log(`\n✓ Deleted ${pruneCount} files (${(pruneBytes / 1048576).toFixed(1)} MB freed).`);
} else {
  console.log(`\nDry-run. Re-run with --apply to delete. (No pieces would 404.)`);
}
