#!/usr/bin/env node
// Fix openseaUrl for Art Blocks Fidenza pieces - short serials → full on-chain token IDs
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../src/lib/data.ts");
let src = readFileSync(filePath, "utf-8");

const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
const FIDENZA_PROJECT = 78;

// Match openseaUrl lines for the Art Blocks contract with a short token ID (< 1_000_000)
const re = new RegExp(
  `(openseaUrl: 'https://opensea\\.io/item/ethereum/${ART_BLOCKS}/)([0-9]+)(')`,
  "g"
);

let count = 0;
const fixed = src.replace(re, (match, prefix, tokenId, suffix) => {
  const n = parseInt(tokenId, 10);
  if (n >= 1_000_000) return match; // already a full ID
  const fullId = String(FIDENZA_PROJECT * 1_000_000 + n);
  count++;
  console.log(`  ${tokenId} → ${fullId}`);
  return prefix + fullId + suffix;
});

if (count === 0) {
  console.log("No short Fidenza openseaUrls found - nothing to do.");
} else {
  writeFileSync(filePath, fixed);
  console.log(`\nFixed ${count} openseaUrl(s).`);
}
