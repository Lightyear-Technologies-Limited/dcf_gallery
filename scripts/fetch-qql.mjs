#!/usr/bin/env node
// Fetch trait metadata for QQL pieces (two contracts: minted and mint pass).
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = readFileSync(resolve(__dirname, "..", "src/lib/data.ts"), "utf-8");

const CONTRACTS = {
  "0c88": "0x845dd2a7ee2a92a0518ab2135365ed63fdba0c88", // Minted QQL
  "1088": "0xc73b17179bf0c59cd5860bb25247d1d1092c1088", // Mint Pass
};

const slugs = [];
const re = /slug: '(qql-\d+-(?:0c88|1088))'/g;
let m;
while ((m = re.exec(data)) !== null) slugs.push(m[1]);
console.log(`Found ${slugs.length} QQL pieces`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

for (const slug of slugs) {
  const [_, tokenId, suffix] = slug.match(/qql-(\d+)-(\w+)/);
  const contract = CONTRACTS[suffix];
  try {
    const r = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${contract}&tokenId=${tokenId}`
    );
    const j = await r.json();
    const attrs = j?.raw?.metadata?.attributes || [];
    const features = j?.raw?.metadata?.features || {};
    const name = j?.raw?.metadata?.name || j?.name;
    const traits = {};
    for (const a of attrs) if (a.trait_type) traits[a.trait_type] = a.value;
    results.push({ slug, tokenId, suffix, name, traits, features });
  } catch (e) {
    results.push({ slug, tokenId, suffix, error: e.message });
  }
  await sleep(250);
}

writeFileSync(resolve(__dirname, "qql-traits.json"), JSON.stringify(results, null, 2));

const allKeys = new Set();
for (const r of results) {
  if (r.traits) Object.keys(r.traits).forEach((k) => allKeys.add(`a:${k}`));
  if (r.features) Object.keys(r.features).forEach((k) => allKeys.add(`f:${k}`));
}
console.log("Keys:", [...allKeys].join(", "));

for (const r of results.sort((a, b) => parseInt(a.tokenId) - parseInt(b.tokenId))) {
  if (r.error) { console.log(`#${r.tokenId} ${r.suffix}: err`); continue; }
  const a = Object.entries(r.traits).map(([k, v]) => `${k}=${v}`).join(" | ");
  const f = Object.entries(r.features || {}).map(([k, v]) => `${k}=${v}`).join(" | ");
  console.log(`#${r.tokenId} (${r.suffix}) ${r.name || ""}\n  attrs: ${a}\n  features: ${f}`);
}
