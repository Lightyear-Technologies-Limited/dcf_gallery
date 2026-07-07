#!/usr/bin/env node
/**
 * Fetch CryptoPunk SVGs from the on-chain CryptoPunksData contract via
 * Alchemy JSON-RPC, save them locally so the pin pipeline can pick them up.
 *
 * The CryptoPunksData contract (0x16f5a35647d6f03d5d3da7b35409d65ba03af3b2)
 * is the official Larva Labs companion contract that exposes
 * `punkImageSvg(uint16)` — fully on-chain SVG composed from the raw pixel
 * data. We hit it once per token; the SVG is the genuine canonical source.
 *
 * Usage:
 *   node scripts/fetch-punk-svgs.mjs <tokenId> [tokenId ...]
 *
 * Example:
 *   node scripts/fetch-punk-svgs.mjs 4752 5381 7036
 *
 * Output:
 *   public/art/all/0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb-<tokenId>.svg
 *
 * The file is written to disk locally so `npm run onboard` (specifically
 * pin-assets.mjs's acquire() call for Punks) can read it and pin to Filebase.
 * Once pinned the file isn't strictly needed at runtime — production reads
 * from the IPFS gateway via the CID in provenance.cids.json.
 *
 * Env: ALCHEMY_API_KEY
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// --- env (same pattern as resolve-sources.mjs) ----------------------------
const env = {};
if (existsSync(resolve(ROOT, ".env"))) {
  for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}
// Match resolve-sources.mjs: fall back to Alchemy's public "demo" endpoint
// with a warning, rather than hard-failing. eth_call works on demo (with
// strict rate limits), so a one-shot fetch of 3 Punks is fine in a pinch.
const KEY = env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || "demo";
if (KEY === "demo") console.warn("⚠ No ALCHEMY_API_KEY in .env — using rate-limited demo endpoint.");

const RPC = `https://eth-mainnet.g.alchemy.com/v2/${KEY}`;
const PUNK_CANONICAL = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const PUNK_DATA = "0x16f5a35647d6f03d5d3da7b35409d65ba03af3b2";
// First 4 bytes of keccak256("punkImageSvg(uint16)"). Verifiable on Etherscan
// → contract Read Methods → punkImageSvg.
const SELECTOR = "0x74beb047";

const OUT_DIR = resolve(ROOT, "public/art/all");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const tokenIds = process.argv
  .slice(2)
  .map((s) => parseInt(s, 10))
  .filter((n) => Number.isFinite(n) && n >= 0 && n < 10000);

if (tokenIds.length === 0) {
  console.error("Usage: node scripts/fetch-punk-svgs.mjs <tokenId> [tokenId ...]");
  console.error("Example: node scripts/fetch-punk-svgs.mjs 4752 5381 7036");
  process.exit(1);
}

function encodeUint16(n) {
  return n.toString(16).padStart(64, "0");
}

function decodeAbiString(hex) {
  // ABI-encoded `string` return:
  //   32 bytes: offset (typically 0x20)
  //   32 bytes: length L
  //   L bytes:  UTF-8 data, right-padded to a 32-byte boundary
  const data = hex.replace(/^0x/, "");
  if (data.length < 128) throw new Error("response too short");
  const len = parseInt(data.slice(64, 128), 16);
  const utf8Hex = data.slice(128, 128 + len * 2);
  return Buffer.from(utf8Hex, "hex").toString("utf-8");
}

async function fetchSvg(tokenId) {
  const data = `${SELECTOR}${encodeUint16(tokenId)}`;
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: PUNK_DATA, data }, "latest"],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
  if (!j.result || j.result === "0x") throw new Error("empty result");
  return decodeAbiString(j.result);
}

let ok = 0, skipped = 0, failed = 0;
for (const tokenId of tokenIds) {
  const dest = resolve(OUT_DIR, `${PUNK_CANONICAL}-${tokenId}.svg`);
  if (existsSync(dest)) {
    console.log(`= ${tokenId}  already exists, skipping`);
    skipped++;
    continue;
  }
  try {
    let svg = await fetchSvg(tokenId);
    // CryptoPunksData.punkImageSvg returns the SVG wrapped in a
    // `data:image/svg+xml;utf8,` prefix. Existing 40 Punks in the repo are
    // stored as raw SVG (no prefix) so we strip it here for consistency.
    svg = svg.replace(/^data:image\/svg\+xml;utf8,/, "");
    if (!svg.startsWith("<svg")) {
      console.error(`✗ ${tokenId}  response does not look like SVG: ${svg.slice(0, 60)}…`);
      failed++;
      continue;
    }
    writeFileSync(dest, svg, "utf-8");
    console.log(`✓ ${tokenId}  ${(svg.length / 1024).toFixed(1)} KB → ${dest}`);
    ok++;
  } catch (e) {
    console.error(`✗ ${tokenId}  ${e.message}`);
    failed++;
  }
}

console.log(`\nFetched ${ok} | Skipped ${skipped} | Failed ${failed}`);
process.exit(failed > 0 ? 1 : 0);
