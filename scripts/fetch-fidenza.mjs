#!/usr/bin/env node
// Fetch full metadata for every Fidenza DCF holds.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

const slugs = [];
const re = /slug: '(fidenza-\d+-d270)'/g;
let m;
while ((m = re.exec(data)) !== null) slugs.push(m[1]);
console.log(`Found ${slugs.length} Fidenzas`);

const CONTRACT = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
for (const slug of slugs) {
  const serial = parseInt(slug.match(/fidenza-(\d+)-/)[1], 10);
  const tokenId = String(78 * 1000000 + serial);
  try {
    const r = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}`
    );
    const j = await r.json();
    const f = j?.raw?.metadata?.features;
    if (f) {
      results.push({ slug, tokenId, serial, ...f });
    } else {
      results.push({ slug, tokenId, serial, error: "no features" });
    }
  } catch (e) {
    results.push({ slug, tokenId, serial, error: e.message });
  }
  await sleep(400);
}

writeFileSync(resolve(__dirname, "fidenza-traits.json"), JSON.stringify(results, null, 2));

// Print sample feature keys
const sample = results.find((r) => !r.error);
console.log("\nAvailable feature keys:", Object.keys(sample || {}).filter((k) => !["slug", "tokenId", "serial"].includes(k)));

// Summarize by each trait value
const traits = ["Colors", "Scale", "Turbulence", "Collision check", "Shape spacing", "Flow", "Rotation", "Margin", "Spiral"];
for (const t of traits) {
  const counts = {};
  for (const r of results) {
    if (r.error) continue;
    const v = r[t] ?? "(missing)";
    counts[v] = (counts[v] || 0) + 1;
  }
  if (Object.keys(counts).length > 0) {
    console.log(`\n${t}:`);
    for (const [v, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${v}: ${n}`);
    }
  }
}

// Print full table
console.log("\n\nFull table:");
for (const r of results.sort((a, b) => a.serial - b.serial)) {
  if (r.error) { console.log(`${r.slug}: ${r.error}`); continue; }
  console.log(`#${String(r.serial).padStart(3)} | ${(r.Colors || "").padEnd(12)} | ${(r.Scale || "").padEnd(14)} | Spiral: ${(r.Spiral || "-").padEnd(4)} | Turb: ${(r.Turbulence || "-").padEnd(6)} | ${r.slug}`);
}
