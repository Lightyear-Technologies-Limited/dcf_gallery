#!/usr/bin/env node
// Fetch trait metadata for every Human Unreadable DCF holds.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

const slugs = [];
const re = /slug: '(human-unreadable-\d+-b069)'/g;
let m;
while ((m = re.exec(data)) !== null) slugs.push(m[1]);
console.log(`Found ${slugs.length} Human Unreadable pieces`);

const CONTRACT = "0x99a9b7c1116f9ceeb1652de04d5969cce509b069";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
for (const slug of slugs) {
  const tokenId = slug.match(/human-unreadable-(\d+)-/)[1];
  const serial = parseInt(tokenId, 10) - 455000000;
  try {
    const r = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}`
    );
    const j = await r.json();
    const f = j?.raw?.metadata?.features || {};
    const attrs = j?.raw?.metadata?.attributes || [];
    results.push({ slug, tokenId, serial, features: f, attributes: attrs });
  } catch (e) {
    results.push({ slug, tokenId, serial, error: e.message });
  }
  await sleep(300);
}

writeFileSync(resolve(__dirname, "human-unreadable-traits.json"), JSON.stringify(results, null, 2));

// Print feature keys seen
const allKeys = new Set();
for (const r of results) {
  if (r.features) Object.keys(r.features).forEach((k) => allKeys.add(k));
}
console.log("\nAll feature keys:", [...allKeys].join(", "));

// Print full table per piece
console.log("\n\n=== Full features per piece ===");
for (const r of results.sort((a, b) => a.serial - b.serial)) {
  console.log(`\n#${r.serial} (${r.slug}):`);
  if (r.error) { console.log(`  error: ${r.error}`); continue; }
  if (r.features && Object.keys(r.features).length > 0) {
    for (const [k, v] of Object.entries(r.features)) console.log(`  ${k}: ${v}`);
  } else if (r.attributes?.length) {
    for (const a of r.attributes) console.log(`  ${a.trait_type}: ${a.value}`);
  } else {
    console.log("  (no features or attributes)");
  }
}

// Summarize counts per feature value
console.log("\n\n=== Value counts per feature ===");
for (const key of allKeys) {
  const counts = {};
  for (const r of results) {
    if (r.features?.[key]) {
      counts[r.features[key]] = (counts[r.features[key]] || 0) + 1;
    }
  }
  if (Object.keys(counts).length > 0) {
    console.log(`\n${key}:`);
    for (const [v, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${v}: ${n}`);
    }
  }
}
