#!/usr/bin/env node
/**
 * B.1 — Resolve each piece's CANONICAL on-chain source(s).
 *
 * For every piece with a contract + tokenId, read the on-chain metadata via the
 * Alchemy NFT API and capture, separately:
 *   - image        : artist-declared canonical image pointer (ipfs://, ar://, https, data:)
 *   - animationUrl : for video / interactive / generative pieces
 *   - tokenUri     : the raw on-chain tokenURI
 *   - originalUrl  : Alchemy's resolved source (fallback for download)
 *   - storage      : classification (ipfs | arweave | onchain | centralized | unknown)
 *
 * Writes scripts/asset-sources.json (intermediate facts; consumed by B.2 pinning).
 * Does NOT touch data.ts. Idempotent: skips already-resolved slugs unless --refresh.
 *
 * Env: ALCHEMY_API_KEY (falls back to demo with a warning).
 * Usage: node scripts/resolve-sources.mjs [--refresh] [--limit N] [--only slug,slug]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DATA = resolve(ROOT, "src/lib/data.ts");
const OUT = resolve(__dirname, "asset-sources.json");

// --- env -------------------------------------------------------------------
const env = {};
if (existsSync(resolve(ROOT, ".env"))) {
  for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}
const KEY = env.ALCHEMY_API_KEY || "demo";
if (KEY === "demo") console.warn("⚠ No ALCHEMY_API_KEY in .env — using rate-limited demo endpoint.");

// --- args ------------------------------------------------------------------
const REFRESH = process.argv.includes("--refresh");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg !== -1 ? new Set(process.argv[onlyArg + 1].split(",")) : null;

const PACE_MS = 200;
const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
const PUNK_CANONICAL = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const PUNK_V1 = "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6";

// --- parse pieces from data.ts (bracket-aware) -----------------------------
function parsePieces(src) {
  const start = src.indexOf("export const pieces");
  const arrStart = src.indexOf("[", src.indexOf("=", start));
  let depth = 0, i = arrStart;
  for (; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]") { depth--; if (depth === 0) break; }
  }
  const body = src.slice(arrStart + 1, i);
  const pieces = [];
  depth = 0; let objStart = -1;
  for (let k = 0; k < body.length; k++) {
    if (body[k] === "{") { if (depth === 0) objStart = k; depth++; }
    else if (body[k] === "}") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const block = body.slice(objStart, k + 1);
        const obj = {};
        const re = /(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'/g;
        let m;
        while ((m = re.exec(block)) !== null) if (obj[m[1]] === undefined) obj[m[1]] = m[2];
        pieces.push(obj);
        objStart = -1;
      }
    }
  }
  return pieces;
}

function fullTokenId(piece) {
  const contract = (piece.contractAddress || "").toLowerCase();
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

function classify(uri) {
  if (!uri || typeof uri !== "string") return "unknown";
  if (uri.startsWith("data:")) return "onchain";
  if (uri.startsWith("ar://") || uri.includes("arweave.net") || uri.includes("ar-io.dev")) return "arweave";
  if (uri.startsWith("ipfs://") || uri.includes("/ipfs/") || /\bipfs\./.test(uri)) return "ipfs";
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]+|bafk[a-z2-7]+)/.test(uri)) return "ipfs";
  if (uri.startsWith("http")) return "centralized";
  return "unknown";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMeta(contract, tokenId, attempt = 1) {
  // refreshCache=true on --refresh forces Alchemy to re-read the on-chain tokenURI
  // (not its possibly-stale cache). Some Dataland animation_urls only appear after
  // this; without it they came back image-only or as an arweave CDN redirect page.
  const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${KEY}/getNFTMetadata?contractAddress=${contract}&tokenId=${tokenId}&refreshCache=${REFRESH ? "true" : "false"}`;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (r.status === 429 && attempt < 4) { await sleep(1500 * attempt); return fetchMeta(contract, tokenId, attempt + 1); }
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return await r.json();
  } catch (e) {
    if (attempt < 3) { await sleep(1500); return fetchMeta(contract, tokenId, attempt + 1); }
    return { error: e.name || e.message };
  } finally { clearTimeout(t); }
}

// --- main ------------------------------------------------------------------
const src = readFileSync(DATA, "utf8");
const allPieces = parsePieces(src);
const cache = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

let pieces = allPieces.filter((p) => p.slug);
if (ONLY) pieces = pieces.filter((p) => ONLY.has(p.slug));

console.log(`${allPieces.length} pieces parsed; ${pieces.length} in scope; ${Object.keys(cache).length} cached.`);

let done = 0, skipped = 0, failed = 0, punks = 0, physical = 0, processed = 0;
for (const p of pieces) {
  if (processed >= LIMIT) break;
  if (!REFRESH && cache[p.slug] && !cache[p.slug].error) { skipped++; continue; }

  const contract = (p.contractAddress || "").toLowerCase();

  // Physical / off-chain pieces: no token to resolve.
  if (!p.contractAddress || !p.tokenId) {
    cache[p.slug] = { storage: "physical", image: null, animationUrl: null, note: "no on-chain token" };
    physical++; continue;
  }

  // CryptoPunks: fully on-chain pixel data; the canonical source IS the contract.
  if (contract === PUNK_CANONICAL || contract === PUNK_V1) {
    cache[p.slug] = {
      storage: "onchain",
      image: null, animationUrl: null,
      onchainSvg: `/art/all/${PUNK_CANONICAL}-${p.tokenId}.svg`,
      note: "CryptoPunk — composed from on-chain pixel data",
    };
    punks++; processed++; await sleep(0); continue;
  }

  const { contract: c, tokenId } = fullTokenId(p);
  const meta = await fetchMeta(c, tokenId);
  processed++;
  if (meta?.error) {
    cache[p.slug] = { error: meta.error };
    failed++; process.stdout.write("x");
  } else {
    const rawMeta = meta?.raw?.metadata || {};
    const image = rawMeta.image || rawMeta.image_url || null;
    const animationUrl = rawMeta.animation_url || null;
    const tokenUri = meta?.raw?.tokenUri || meta?.tokenUri || null;
    const originalUrl = meta?.image?.originalUrl || null;
    const best = image || animationUrl || originalUrl;
    cache[p.slug] = {
      storage: classify(best),
      image: image || null,
      animationUrl: animationUrl || null,
      tokenUri: typeof tokenUri === "string" ? tokenUri : null,
      originalUrl: originalUrl || null,
      contentType: meta?.image?.contentType || null,
      medium: p.medium || null,
    };
    done++; process.stdout.write(".");
  }

  if ((done + failed) % 25 === 0) writeFileSync(OUT, JSON.stringify(cache, null, 2) + "\n");
  await sleep(PACE_MS);
}

writeFileSync(OUT, JSON.stringify(cache, null, 2) + "\n");
console.log(`\nResolved ${done} | Punks ${punks} | Physical ${physical} | Skipped ${skipped} | Failed ${failed}`);

// Summary by storage class
const byStorage = {};
for (const v of Object.values(cache)) byStorage[v.storage] = (byStorage[v.storage] || 0) + 1;
console.log("By storage:", JSON.stringify(byStorage));
const withAnim = Object.values(cache).filter((v) => v.animationUrl).length;
console.log(`With animationUrl: ${withAnim}`);
console.log(`Wrote ${OUT}`);
