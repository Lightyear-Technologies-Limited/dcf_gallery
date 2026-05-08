#!/usr/bin/env node
// Fetch Background color for every Ringer the fund holds.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

// Find all ringers-*-d270 pieces and their tokenIds
const slugs = [];
const re = /slug: '(ringers-\d+-d270)'/g;
let m;
while ((m = re.exec(data)) !== null) slugs.push(m[1]);

console.log(`Found ${slugs.length} Ringers`);
const CONTRACT = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
for (const slug of slugs) {
  const tokenId = slug.match(/ringers-(\d+)-/)[1];
  const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${CONTRACT.toLowerCase() === CONTRACT.toLowerCase() ? "demo" : "demo"}/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}`;
  try {
    const r = await fetch(`https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}`);
    const j = await r.json();
    const f = j?.raw?.metadata?.features;
    if (f) {
      results.push({
        slug,
        tokenId,
        body: f.Body,
        background: f.Background,
        pegs: f["Peg count"],
        size: f.Size,
        layout: f["Peg layout"],
        wrapStyle: f["Wrap style"],
        wrapOrientation: f["Wrap orientation"],
      });
    } else {
      results.push({ slug, tokenId, error: "no features" });
    }
  } catch (e) {
    results.push({ slug, tokenId, error: e.message });
  }
  await sleep(400);
}

// Summary
console.log("\nBy Wrap style:");
const byWrap = {};
for (const r of results) {
  if (r.error) continue;
  byWrap[r.wrapStyle] = byWrap[r.wrapStyle] || [];
  byWrap[r.wrapStyle].push(r);
}
for (const [l, items] of Object.entries(byWrap).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${l} (${items.length}):`);
  for (const r of items) console.log(`  ${r.slug}   body=${r.body} bg=${r.background} pegs=${r.pegs} layout=${r.layout}`);
}

writeFileSync(resolve(__dirname, "ringer-bg.json"), JSON.stringify(results, null, 2));
