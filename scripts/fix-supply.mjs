#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = resolve(__dirname, "..", "src/lib/data.ts");
let data = readFileSync(file, "utf-8");

// Actual series sizes (the denominator for "N of M")
// 1/1 collections: leave totalSupply undefined so UI falls back to "N works"
const SUPPLY = {
  "cryptopunks": 10000,
  "fidenza": 999,
  "ringers": 1000,
  "grifters": 666,
  "masks-of-luci": 613,
  "skulls-of-luci": 49,
  "winds-of-yawanawa": 1000,
  "synthetic-dreams": 1000,
  "dataland-biome-lumina": 1000,
  "qql": 999,
  "lightyears": 200,
  "lights": 100,
  "human-unreadable": 400,
  "pxl-dex": 256,
  "pxl-pod": 256,
  "repeat-as-necessary": 400,
  "day-gardens": 50,
};

// Collections that are 1/1 or complete sets — remove totalSupply so they show "N works"
const REMOVE_SUPPLY = [
  "ack-editions",
  "piano-blossoms",
  "her-favorite-flowers",
  "superrare-beeple",
  "superrare-dmitri-cherniak",
  "superrare-xcopy",
  "tyler-hobbs",
  "harbor-scene",
  "notable-pepes",
  "meebit",
  "x0x",
  "cope-salada",
];

let updated = 0;
for (const [slug, supply] of Object.entries(SUPPLY)) {
  const re = new RegExp(`(slug: '${slug.replace(/-/g, "\\-")}',[\\s\\S]*?totalSupply: )\\d+`);
  if (re.test(data)) {
    data = data.replace(re, `$1${supply}`);
    updated++;
  }
}

// Remove totalSupply from 1/1 collections
for (const slug of REMOVE_SUPPLY) {
  const re = new RegExp(`(slug: '${slug.replace(/-/g, "\\-")}',[\\s\\S]*?)    totalSupply: \\d+,\\n`);
  if (re.test(data)) {
    data = data.replace(re, "$1");
    updated++;
  }
}

writeFileSync(file, data);
console.log(`Updated ${updated} totalSupply values.`);
