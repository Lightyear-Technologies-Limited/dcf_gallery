#!/usr/bin/env node
/**
 * Fetch Kim Asendorf PXL DEX + PXL POD trait counters straight from chain.
 *
 * Why this exists: the "Pixels" / "Allowance" attributes on these pieces are
 * LIVE on-chain values — they change as pixels are deposited into / withdrawn
 * from a deck — so they cannot be hand-entered without drifting (PXL DEX 141
 * displayed "0" while the chain said 1,000,000). Re-pinning the artwork image
 * (`pin-assets.mjs`) does NOT refresh them: that is a separate pipeline.
 *
 * The two collections are different contracts with different ABIs (PXL POD has
 * no `pixels()`/`allowance()` getter), so we read each token's `tokenURI`
 * (standard ERC-721 selector 0xc87b56dd) and pull the `attributes` array — the
 * NFT's own self-reported metadata, i.e. exactly what the gallery should show.
 *
 * Output: scripts/pxl-traits.json — { "<slug>": { "Pixels": "…", "Allowance": "…" } }
 * consumed by build-traits-data.mjs. Run `node scripts/fetch-pxl-traits.mjs`
 * then `node scripts/build-traits-data.mjs` to refresh src/lib/traits.data.json.
 *
 * RPC: set ETH_RPC_URL to override; otherwise a list of public endpoints is
 * tried in order (with per-call failover). No API key required.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, "..", "src/lib/data.ts");
const outPath = resolve(__dirname, "pxl-traits.json");

const PXL_COLLECTIONS = new Set(["pxl-dex", "pxl-pod"]);
const TOKEN_URI_SELECTOR = "0xc87b56dd"; // tokenURI(uint256)
const RPCS = [
  process.env.ETH_RPC_URL,
  "https://ethereum-rpc.publicnode.com",
  "https://cloudflare-eth.com",
  "https://rpc.ankr.com/eth",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Parse the PXL pieces out of data.ts (same block-split as fetch-traits.mjs).
const source = readFileSync(dataPath, "utf-8");
const piecesBody = source.slice(source.indexOf("export const pieces: Piece[] = ["));
const blocks = piecesBody.split(/^  \{/m).slice(1);
const pieces = [];
for (const b of blocks) {
  const slug = b.match(/^\s*slug:\s*'([^']+)'/m)?.[1];
  const coll = b.match(/^\s*collectionSlug:\s*'([^']+)'/m)?.[1];
  const tokenId = b.match(/^\s*tokenId:\s*'([^']*)'/m)?.[1];
  const contract = b.match(/^\s*contractAddress:\s*'([^']+)'/m)?.[1];
  if (!slug || !coll || !PXL_COLLECTIONS.has(coll) || !tokenId || !contract) continue;
  pieces.push({ slug, collectionSlug: coll, tokenId, contractAddress: contract });
}
console.log(`Parsed ${pieces.length} PXL pieces from data.ts`);

// --- Decode an ABI-encoded single `string` return (offset, length, bytes).
function decodeAbiString(resultHex) {
  const hex = resultHex.startsWith("0x") ? resultHex.slice(2) : resultHex;
  const len = parseInt(hex.slice(64, 128), 16);
  return Buffer.from(hex.slice(128, 128 + len * 2), "hex").toString("utf8");
}

// --- A tokenURI string → its parsed JSON metadata object (handles the common
//     data: URI encodings for fully on-chain tokens, plus bare JSON / http).
async function parseTokenUri(uri) {
  if (uri.startsWith("data:application/json;base64,")) {
    return JSON.parse(Buffer.from(uri.slice(29), "base64").toString("utf8"));
  }
  if (uri.startsWith("data:application/json")) {
    const payload = uri.slice(uri.indexOf(",") + 1);
    try { return JSON.parse(decodeURIComponent(payload)); } catch { return JSON.parse(payload); }
  }
  if (uri.startsWith("http")) return (await fetch(uri)).json();
  return JSON.parse(uri); // bare JSON
}

// --- eth_call tokenURI(tokenId), trying each RPC until one answers.
async function tokenUri(contract, tokenId) {
  const data = TOKEN_URI_SELECTOR + BigInt(tokenId).toString(16).padStart(64, "0");
  let lastErr;
  for (const rpc of RPCS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(rpc, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: contract, data }, "latest"] }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
        if (!json.result || json.result === "0x") throw new Error("empty result");
        return decodeAbiString(json.result);
      } catch (e) {
        lastErr = e;
        await sleep(attempt * 400);
      }
    }
  }
  throw lastErr ?? new Error("all RPCs failed");
}

// --- Main: read each token's attributes into { slug: { key: value } }.
const out = {};
const failures = [];
for (let i = 0; i < pieces.length; i++) {
  const p = pieces[i];
  process.stdout.write(`[${i + 1}/${pieces.length}] ${p.slug} ... `);
  try {
    const meta = await parseTokenUri(await tokenUri(p.contractAddress, p.tokenId));
    const attrs = Array.isArray(meta?.attributes) ? meta.attributes : [];
    const traits = {};
    for (const a of attrs) {
      const key = a.trait_type ?? a.key;
      if (key == null) continue;
      traits[key] = a.value; // keep the chain's own representation (string)
    }
    out[p.slug] = traits;
    console.log(JSON.stringify(traits));
  } catch (e) {
    failures.push({ slug: p.slug, reason: e.message });
    console.log(`FAIL (${e.message})`);
  }
  await sleep(150);
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s):`, JSON.stringify(failures, null, 2));
  process.exitCode = 1; // surface failures but still write what we got
}

writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`\nWrote ${Object.keys(out).length} entries to scripts/pxl-traits.json`);
