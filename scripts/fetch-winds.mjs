#!/usr/bin/env node
// Fetch trait metadata for every Winds of Yawanawa DCF holds.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

const slugs = [];
const re = /slug: '(winds-of-yawanawa-\d+-100b)'/g;
let m;
while ((m = re.exec(data)) !== null) slugs.push(m[1]);
console.log(`Found ${slugs.length} Winds pieces`);

const CONTRACT = "0x7a63d17f5a59bca04b6702f461b1f1a1c59b100b";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
for (const slug of slugs) {
  const tokenId = slug.match(/winds-of-yawanawa-(\d+)-/)[1];
  try {
    const r = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}`
    );
    const j = await r.json();
    // Prefer attributes array (trait_type/value)
    const attrs = j?.raw?.metadata?.attributes || j?.rawMetadata?.attributes || [];
    const traits = {};
    for (const a of attrs) {
      if (a.trait_type) traits[a.trait_type] = a.value;
    }
    results.push({ slug, tokenId, traits });
  } catch (e) {
    results.push({ slug, tokenId, error: e.message });
  }
  await sleep(250);
}

writeFileSync(resolve(__dirname, "winds-traits.json"), JSON.stringify(results, null, 2));

// Collect all trait keys
const allKeys = new Set();
for (const r of results) if (r.traits) Object.keys(r.traits).forEach((k) => allKeys.add(k));
console.log("\nAll trait keys:", [...allKeys].join(", "));

// Per piece
console.log("\n=== Per piece ===");
for (const r of results.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId))) {
  if (r.error) { console.log(`#${r.tokenId}: err ${r.error}`); continue; }
  const parts = [...allKeys].map((k) => `${k}=${r.traits[k] ?? "-"}`).join(" | ");
  console.log(`#${String(r.tokenId).padStart(4)}: ${parts}`);
}

// Value counts
console.log("\n=== Value counts ===");
for (const key of allKeys) {
  const counts = {};
  for (const r of results) {
    const v = r.traits?.[key];
    if (v !== undefined) counts[v] = (counts[v] || 0) + 1;
  }
  console.log(`\n${key}:`);
  for (const [v, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v}: ${n}`);
  }
}
