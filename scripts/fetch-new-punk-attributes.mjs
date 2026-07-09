#!/usr/bin/env node
/**
 * One-off: fetch Alchemy metadata for the three new-in-2026-06 Punks
 * (4752, 5381, 7036) and merge into scripts/piece-metadata.json,
 * then let fix-punk-traits.mjs populate src/lib/traits.data.json.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const META = "scripts/piece-metadata.json";
const PUNK_CONTRACT = "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB";
const NEW_TOKENS = ["4752", "5381", "7036"];

function loadEnv() {
  if (!existsSync(".env")) return {};
  const src = readFileSync(".env", "utf8");
  const env = {};
  for (const line of src.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const key = env.ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
if (!key) {
  console.error("ALCHEMY_API_KEY missing from .env");
  process.exit(1);
}

const meta = JSON.parse(readFileSync(META, "utf8"));

for (const tokenId of NEW_TOKENS) {
  const slug = `cryptopunks-${tokenId}-3BBB`;
  console.log(`Fetching ${slug}...`);
  const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${key}/getNFTMetadata?contractAddress=${PUNK_CONTRACT}&tokenId=${tokenId}&refreshCache=false`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  HTTP ${res.status}`);
    continue;
  }
  const data = await res.json();
  const raw = data?.raw?.metadata || {};
  // Alchemy V3 returns attributes in OpenSea format (`trait_type`); the
  // consumer script fix-punk-traits.mjs expects the legacy `key` field.
  // Normalise on write so downstream doesn't need to know both shapes.
  const attributes = (raw.attributes || []).map((a) => ({
    key: a.key || a.trait_type,
    value: a.value,
  }));
  meta[slug] = {
    name: raw.name || data?.name || "CryptoPunks",
    description: raw.description || "",
    attributes,
  };
  console.log(`  attrs:`, attributes.map((a) => `${a.key}=${a.value}`).join(", "));
}

writeFileSync(META, JSON.stringify(meta, null, 2) + "\n");
console.log(`\nMerged into ${META}. Now run: node scripts/fix-punk-traits.mjs`);
