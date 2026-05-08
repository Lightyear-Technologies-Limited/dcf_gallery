#!/usr/bin/env node
// Fetch trait metadata for Biome Lumina, Synthetic Dreams, Grifters.
// Saves one JSON per collection.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

const COLLECTIONS = [
  { name: "biome-lumina", pattern: /slug: '(dataland-biome-lumina-\d+-1c9d)'/g, contract: "0xb097fba49a679a61b18b7079b99a953ca2691c9d", extract: (s) => s.match(/dataland-biome-lumina-(\d+)-/)[1] },
  { name: "synthetic-dreams", pattern: /slug: '(synthetic-dreams-\d+-be3a)'/g, contract: "0x183368d767b299681fdf660233e39f9f8cf8be3a", extract: (s) => s.match(/synthetic-dreams-(\d+)-/)[1] },
  { name: "grifters", pattern: /slug: '(grifters-\d+-c1f3)'/g, contract: "0xc143bbfcdbdbed6d454803804752a064a622c1f3", extract: (s) => s.match(/grifters-(\d+)-/)[1] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const col of COLLECTIONS) {
  const slugs = [];
  let m;
  const re = new RegExp(col.pattern);
  while ((m = re.exec(data)) !== null) slugs.push(m[1]);
  console.log(`\n=== ${col.name} (${slugs.length} pieces) ===`);

  const results = [];
  for (const slug of slugs) {
    const tokenId = col.extract(slug);
    try {
      const r = await fetch(
        `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${col.contract}&tokenId=${tokenId}`
      );
      const j = await r.json();
      const attrs = j?.raw?.metadata?.attributes || [];
      const traits = {};
      for (const a of attrs) {
        if (a.trait_type) traits[a.trait_type] = a.value;
      }
      // Also check features (like Art Blocks uses)
      const features = j?.raw?.metadata?.features || {};
      results.push({ slug, tokenId, traits, features });
    } catch (e) {
      results.push({ slug, tokenId, error: e.message });
    }
    await sleep(250);
  }

  writeFileSync(resolve(__dirname, `${col.name}-traits.json`), JSON.stringify(results, null, 2));

  // Value counts
  const allKeys = new Set();
  for (const r of results) {
    if (r.traits) Object.keys(r.traits).forEach((k) => allKeys.add(k));
    if (r.features) Object.keys(r.features).forEach((k) => allKeys.add(`feat:${k}`));
  }
  console.log("Keys:", [...allKeys].join(", "));
  for (const key of allKeys) {
    const isFeat = key.startsWith("feat:");
    const realKey = isFeat ? key.slice(5) : key;
    const counts = {};
    for (const r of results) {
      const src = isFeat ? r.features : r.traits;
      const v = src?.[realKey];
      if (v !== undefined) counts[v] = (counts[v] || 0) + 1;
    }
    if (Object.keys(counts).length > 0) {
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      console.log(`  ${key}: ${sorted.slice(0, 8).map(([v, n]) => `${v}(${n})`).join(", ")}${sorted.length > 8 ? ` +${sorted.length - 8} more` : ""}`);
    }
  }
}

console.log("\nDone.");
