#!/usr/bin/env node
/**
 * Fetch CryptoPunk traits from the on-chain CryptoPunksData contract and write
 * them into src/lib/traits.data.json. Companion to fetch-punk-svgs.mjs: run
 * both for every new Punk.
 *
 * `punkAttributes(uint16)` returns a comma-separated string, type first:
 *   "Male 2, Chinstrap, Fedora, Small Shades"
 * The type's trailing skin-tone digit is dropped ("Male 2" -> "Male"), matching
 * fix-punk-traits.mjs and every existing Punk entry.
 *
 * Usage:
 *   node scripts/fetch-punk-traits.mjs <tokenId> [tokenId ...]
 *
 * Output: src/lib/traits.data.json entries keyed `cryptopunks-<tokenId>`:
 *   { "Type": "Male", "Attribute": ["Chinstrap", "Fedora", "Small Shades"] }
 * Existing entries for the same token are overwritten (the chain is canonical).
 *
 * Env: ALCHEMY_API_KEY
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// --- env (same pattern as fetch-punk-svgs.mjs) -----------------------------
const env = {};
if (existsSync(resolve(ROOT, ".env"))) {
  for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
}
const KEY = env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || "demo";
if (KEY === "demo") console.warn("⚠ No ALCHEMY_API_KEY in .env — using rate-limited demo endpoint.");

const RPC = `https://eth-mainnet.g.alchemy.com/v2/${KEY}`;
const PUNK_DATA = "0x16f5a35647d6f03d5d3da7b35409d65ba03af3b2";
// First 4 bytes of keccak256("punkAttributes(uint16)"). Verifiable on
// Etherscan → contract Read Methods → punkAttributes.
const SELECTOR = "0x76dfe297";

const TRAITS = resolve(ROOT, "src/lib/traits.data.json");

const tokenIds = process.argv
  .slice(2)
  .map((s) => parseInt(s, 10))
  .filter((n) => Number.isFinite(n) && n >= 0 && n < 10000);

if (tokenIds.length === 0) {
  console.error("Usage: node scripts/fetch-punk-traits.mjs <tokenId> [tokenId ...]");
  process.exit(1);
}

function decodeAbiString(hex) {
  const data = hex.replace(/^0x/, "");
  if (data.length < 128) throw new Error("response too short");
  const len = parseInt(data.slice(64, 128), 16);
  return Buffer.from(data.slice(128, 128 + len * 2), "hex").toString("utf-8");
}

async function fetchAttributes(tokenId) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: PUNK_DATA, data: `${SELECTOR}${tokenId.toString(16).padStart(64, "0")}` }, "latest"],
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
  if (!j.result || j.result === "0x") throw new Error("empty result");
  return decodeAbiString(j.result);
}

const traits = JSON.parse(readFileSync(TRAITS, "utf8"));

let ok = 0, failed = 0;
for (const tokenId of tokenIds) {
  try {
    const [type, ...attributes] = (await fetchAttributes(tokenId)).split(",").map((s) => s.trim()).filter(Boolean);
    if (!type) throw new Error("no type in response");
    const entry = { Type: type.replace(/\s+\d+$/, "") };
    if (attributes.length) entry.Attribute = attributes;
    traits[`cryptopunks-${tokenId}`] = entry;
    console.log(`✓ ${tokenId}  ${entry.Type}: ${attributes.join(", ") || "(no attributes)"}`);
    ok++;
  } catch (e) {
    console.error(`✗ ${tokenId}  ${e.message}`);
    failed++;
  }
}

if (ok) writeFileSync(TRAITS, JSON.stringify(traits, null, 2) + "\n");
console.log(`\nWrote ${ok} | Failed ${failed}`);
// exitCode, not exit(): on Windows, exiting while fetch's handles are still
// closing trips a libuv assertion.
process.exitCode = failed > 0 ? 1 : 0;
