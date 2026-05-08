#!/usr/bin/env node
// Fetch trait metadata for every Mask of Luci DCF holds.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

const slugs = [];
const re = /slug: '(masks-of-luci-\d+-249a)'/g;
let m;
while ((m = re.exec(data)) !== null) slugs.push(m[1]);
console.log(`Found ${slugs.length} Masks`);

const CONTRACT = "0x4440732b0d85e2a77dcb2caedfd940154241249a";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
for (const slug of slugs) {
  const tokenId = slug.match(/masks-of-luci-(\d+)-/)[1];
  try {
    const r = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tokenId}`
    );
    const j = await r.json();
    const attrs = j?.raw?.metadata?.attributes || [];
    const name = j?.raw?.metadata?.name || j?.name;
    const traits = {};
    for (const a of attrs) if (a.trait_type) traits[a.trait_type] = a.value;
    results.push({ slug, tokenId, name, traits });
  } catch (e) {
    results.push({ slug, tokenId, error: e.message });
  }
  await sleep(250);
}

writeFileSync(resolve(__dirname, "masks-traits.json"), JSON.stringify(results, null, 2));

const allKeys = new Set();
for (const r of results) if (r.traits) Object.keys(r.traits).forEach((k) => allKeys.add(k));
console.log("Keys:", [...allKeys].join(", "));

for (const r of results.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId))) {
  if (r.error) { console.log(`#${r.tokenId}: err`); continue; }
  const parts = Object.entries(r.traits).map(([k, v]) => `${k}=${v}`).join(" | ");
  console.log(`#${String(r.tokenId).padStart(4)} ${r.name || ""}: ${parts}`);
}
