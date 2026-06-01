#!/usr/bin/env node
// Backfill originalUri for Grifters that resolve at xcopy's admin path.
// Pattern: https://admin.xcopy.art/media/original_images/{contract}-{tokenId}.png
// Some tokens 404 - only inject when HEAD returns 200.
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, "../src/lib/data.ts");
const CONTRACT = "0xc143bbfcdbdbed6d454803804752a064a622c1f3";
const BASE = `https://admin.xcopy.art/media/original_images/${CONTRACT}-`;

let src = readFileSync(filePath, "utf-8");

// Find each Grifter piece (block ending with closing })
const blockRe = /\{\s*id: '(grifters-\d+-c1f3)',[\s\S]*?\n\s\s\}/g;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const updates = [];

let m;
while ((m = blockRe.exec(src)) !== null) {
  const block = m[0];
  const tokenIdMatch = block.match(/tokenId: '(\d+)'/);
  if (!tokenIdMatch) continue;
  const tokenId = tokenIdMatch[1];
  const url = `${BASE}${tokenId}.png`;
  const r = await fetch(url, { method: "HEAD" });
  if (r.ok) {
    updates.push({ slug: m[1], tokenId, url, blockStart: m.index, blockEnd: m.index + block.length });
    console.log(`  ✓ ${m[1]} → ${url}`);
  } else {
    console.log(`  ✗ ${m[1]} (${tokenId}) - ${r.status}, leaving existing originalUri`);
  }
  await sleep(120);
}

if (updates.length === 0) {
  console.log("\nNo Grifters to inject.");
  process.exit(0);
}

// Apply edits in reverse order so indexes stay valid
updates.sort((a, b) => b.blockStart - a.blockStart);
for (const u of updates) {
  const block = src.slice(u.blockStart, u.blockEnd);
  let updatedBlock;
  if (block.includes("originalUri:")) {
    // Replace the existing originalUri value
    updatedBlock = block.replace(
      /originalUri: '[^']*'/,
      `originalUri: '${u.url}'`
    );
  } else {
    // Inject before the closing `}`
    updatedBlock = block.replace(
      /(\n\s\sopenseaUrl: '[^']*',?[^\n]*)(\n\s\s\})/,
      `$1\n    originalUri: '${u.url}',$2`
    );
    if (updatedBlock === block) {
      updatedBlock = block.replace(/(\n\s\s\})$/, `\n    originalUri: '${u.url}',$1`);
    }
  }
  src = src.slice(0, u.blockStart) + updatedBlock + src.slice(u.blockEnd);
}

writeFileSync(filePath, src);
console.log(`\nInjected ${updates.length} originalUri values into data.ts.`);
