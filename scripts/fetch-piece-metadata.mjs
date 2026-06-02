#!/usr/bin/env node
/**
 * Unified per-piece metadata fetcher.
 *
 * For every piece in data.ts that has a contractAddress + tokenId, query the
 * Alchemy demo endpoint and store {name, description, attributes} keyed by
 * slug. Skips pieces already present in the cache unless --refresh is passed.
 *
 * Output: scripts/piece-metadata.json
 *
 * This feeds two downstream consumers:
 * 1. build-traits-data.mjs - populates src/lib/traits.data.json (the per-piece
 *    trait map shown on piece pages) for collections without a dedicated
 *    per-collection trait JSON
 * 2. build-descriptions.mjs - emits src/lib/descriptions.data.json (per-piece
 *    description prose shown between title and metadata on piece pages)
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, "..", "src/lib/data.ts");
const OUT = resolve(__dirname, "piece-metadata.json");

const REFRESH = process.argv.includes("--refresh");
const PACE_MS = 350;
const TIMEOUT_MS = 20000;

// ---------------------------------------------------------------------------
// Parse data.ts -> pieces with {slug, collectionSlug, contractAddress, tokenId}
// ---------------------------------------------------------------------------
const src = readFileSync(DATA, "utf8");
const piecesStart = src.indexOf("export const pieces: Piece[] = [");
if (piecesStart === -1) {
  console.error("Could not find pieces array in data.ts");
  process.exit(1);
}
const body = src.slice(piecesStart);
const blocks = body.split(/^  \{/m).slice(1);

const pieces = [];
for (const b of blocks) {
  const slug = b.match(/^\s*slug:\s*'([^']+)'/m)?.[1];
  const collectionSlug = b.match(/^\s*collectionSlug:\s*'([^']+)'/m)?.[1];
  const contractAddress = b.match(/^\s*contractAddress:\s*'([^']+)'/m)?.[1];
  const tokenId = b.match(/^\s*tokenId:\s*'([^']*)'/m)?.[1];
  if (!slug || !collectionSlug || !contractAddress || !tokenId) continue;
  pieces.push({ slug, collectionSlug, contractAddress, tokenId });
}
console.log(`Parsed ${pieces.length} pieces from data.ts`);

// ---------------------------------------------------------------------------
// Load existing cache
// ---------------------------------------------------------------------------
const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
const before = Object.keys(cache).length;
console.log(`Cache: ${before} entries${REFRESH ? " (refresh requested)" : ""}`);

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMeta(contract, tokenId, attempt = 1) {
  const url = `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${contract}&tokenId=${tokenId}`;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (r.status === 429 && attempt < 3) {
      await sleep(2000 * attempt);
      return fetchMeta(contract, tokenId, attempt + 1);
    }
    if (!r.ok) return { error: `HTTP ${r.status}` };
    const j = await r.json();
    return j;
  } catch (e) {
    if (attempt < 3) {
      await sleep(2000);
      return fetchMeta(contract, tokenId, attempt + 1);
    }
    return { error: e.name || e.message };
  } finally {
    clearTimeout(t);
  }
}

function extract(meta) {
  if (meta?.error) return { error: meta.error };
  const raw = meta?.raw?.metadata || meta?.metadata || meta || {};
  const name = meta?.name || raw?.name || "";
  const description = meta?.description || raw?.description || "";
  const attrs = raw?.attributes || meta?.attributes || meta?.raw?.metadata?.attributes || [];
  const normalized = Array.isArray(attrs)
    ? attrs.map((a) => ({
        key: a?.trait_type || a?.traitType || a?.key || "",
        value: a?.value ?? a?.trait_value ?? a?.val ?? "",
      })).filter((x) => x.key && x.value !== "")
    : [];
  return { name, description, attributes: normalized };
}

let fetched = 0;
let skipped = 0;
let failed = 0;
const startTime = Date.now();

for (let i = 0; i < pieces.length; i++) {
  const p = pieces[i];
  if (!REFRESH && cache[p.slug] && !cache[p.slug].error) {
    skipped++;
    continue;
  }
  const meta = await fetchMeta(p.contractAddress, p.tokenId);
  const data = extract(meta);
  cache[p.slug] = data;
  if (data.error) {
    failed++;
    process.stdout.write("x");
  } else {
    fetched++;
    process.stdout.write(".");
  }
  // Persist every 25 successful fetches so a crash doesn't lose progress
  if (fetched > 0 && fetched % 25 === 0) {
    writeFileSync(OUT, JSON.stringify(cache, null, 2) + "\n");
  }
  await sleep(PACE_MS);
}

writeFileSync(OUT, JSON.stringify(cache, null, 2) + "\n");
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log();
console.log(`Fetched ${fetched} | Skipped ${skipped} | Failed ${failed} | ${elapsed}s`);
console.log(`Wrote ${OUT} with ${Object.keys(cache).length} total entries`);
