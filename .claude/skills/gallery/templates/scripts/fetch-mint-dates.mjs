#!/usr/bin/env node
/**
 * Fetch mint dates for every piece in data.ts via Alchemy's
 * `alchemy_getAssetTransfers`. Handles ERC-721 + ERC-1155. Paginated.
 *
 * Env: ALCHEMY_API_KEY
 *
 * Writes intermediate JSON to scripts/mint-dates.json (gitignored).
 * A separate build step merges these into data.ts.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "scripts/mint-dates.json");

const KEY = process.env.ALCHEMY_API_KEY;
if (!KEY) {
  console.error("✗ ALCHEMY_API_KEY env var required");
  process.exit(1);
}
const BASE = `https://eth-mainnet.g.alchemy.com/v2/${KEY}`;

// Parse contract addresses from data.ts (rough regex — good enough for
// this one-off pull; sub-in a real TS-aware parser if desired).
const dataTs = await readFile(resolve(ROOT, "src/lib/data.ts"), "utf-8");
const contractMatches = [...dataTs.matchAll(/contractAddress: '(0x[a-fA-F0-9]{40})'/g)];
const contracts = Array.from(new Set(contractMatches.map((m) => m[1].toLowerCase())));
console.log(`Fetching mint transfers for ${contracts.length} contracts`);

const existing = await readFile(OUT, "utf-8").then(JSON.parse).catch(() => ({}));
const results = { ...existing };

for (const contract of contracts) {
  console.log(`  ${contract}`);
  let pageKey;
  do {
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [{
        fromBlock: "0x0",
        toBlock: "latest",
        contractAddresses: [contract],
        category: ["erc721", "erc1155"],
        withMetadata: true,
        excludeZeroValue: false,
        maxCount: "0x3E8",
        pageKey,
        // Only transfers from the zero address = mints
        fromAddress: "0x0000000000000000000000000000000000000000",
      }],
    };
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`  ✗ ${contract}: ${res.status}`);
      break;
    }
    const json = await res.json();
    const transfers = json.result?.transfers ?? [];
    for (const t of transfers) {
      const tid = t.tokenId ? BigInt(t.tokenId).toString() : null;
      if (!tid) continue;
      const key = `${contract}-${tid}`;
      const iso = t.metadata?.blockTimestamp;
      if (iso) results[key] = iso;
    }
    pageKey = json.result?.pageKey;
  } while (pageKey);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(results, null, 2));
console.log(`✓ scripts/mint-dates.json — ${Object.keys(results).length} entries`);
