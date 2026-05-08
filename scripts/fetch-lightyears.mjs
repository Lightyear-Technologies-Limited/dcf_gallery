#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

const slugs = [];
const re = /slug: '(lightyears-\d+-f3f5)'/g;
let m;
while ((m = re.exec(data)) !== null) slugs.push(m[1]);
console.log(`Found ${slugs.length} Lightyears`);

const CONTRACT = "0x082dcab372505ae56eafde58204ba5b12ff3f3f5";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

for (const slug of slugs) {
  const tokenId = slug.match(/lightyears-(\d+)-/)[1];
  try {
    const r = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}`
    );
    const j = await r.json();
    const attrs = j?.raw?.metadata?.attributes || [];
    const features = j?.raw?.metadata?.features || {};
    const name = j?.raw?.metadata?.name || j?.name;
    const traits = {};
    for (const a of attrs) if (a.trait_type) traits[a.trait_type] = a.value;
    results.push({ slug, tokenId, name, traits, features });
  } catch (e) {
    results.push({ slug, tokenId, error: e.message });
  }
  await sleep(250);
}

writeFileSync(resolve(__dirname, "lightyears-traits.json"), JSON.stringify(results, null, 2));

const allKeys = new Set();
for (const r of results) {
  if (r.traits) Object.keys(r.traits).forEach((k) => allKeys.add(`a:${k}`));
  if (r.features) Object.keys(r.features).forEach((k) => allKeys.add(`f:${k}`));
}
console.log("Keys:", [...allKeys].join(", "));

for (const r of results.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId))) {
  if (r.error) { console.log(`#${r.tokenId}: err`); continue; }
  const a = Object.entries(r.traits).map(([k, v]) => `${k}=${v}`).join(" | ");
  const f = Object.entries(r.features || {}).map(([k, v]) => `${k}=${v}`).join(" | ");
  console.log(`#${r.tokenId} ${r.name || ""}\n  attrs: ${a}\n  features: ${f}`);
}
