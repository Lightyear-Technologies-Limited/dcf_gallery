#!/usr/bin/env node
/**
 * Fetch collection-wide trait distributions and merge into
 * src/lib/trait-totals.data.json. Used by the Browse-by-trait disclosure +
 * filter chip on the collection page to show "15 of 146 Big Beards held"
 * style framing.
 *
 * CryptoPunks counts come from the Lightyear MCP and are populated by hand
 * in trait-totals.data.json; this script handles the Art Blocks / Alchemy
 * fetchable collections (Fidenza, Ringers, Winds of Yawanawa).
 *
 * Usage:
 *   node scripts/fetch-trait-totals.mjs [--collection=fidenza|ringers|winds-of-yawanawa|all]
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "src/lib/trait-totals.data.json");

// Each collection declares: how to enumerate token IDs, where in the metadata
// the trait map lives, and how to remap raw key names to the display names
// used in traits.data.json (so the lookup matches what the page renders).
const COLLECTIONS = {
  fidenza: {
    contract: "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    totalSupply: 999,
    tokenIds: () => Array.from({ length: 999 }, (_, i) => String(78 * 1_000_000 + i)),
    extract: (j) => j?.raw?.metadata?.features || null,
    remap: {
      Colors: "Palette",
      Scale: "Scale",
      Spiral: "Spiral",
      Turbulence: "Turbulence",
      "Super Blocks": "Super Blocks",
      Density: "Density",
    },
  },
  ringers: {
    contract: "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270",
    totalSupply: 1000,
    tokenIds: () => Array.from({ length: 1000 }, (_, i) => String(13 * 1_000_000 + i)),
    extract: (j) => j?.raw?.metadata?.features || null,
    // Ringers metadata uses TitleCase feature keys in the on-chain payload
    // ("Peg count": 29) but the display layer renames a few of them ("Peg
    // count" -> "Pegs", "Peg layout" -> "Layout") - mirror that here so the
    // global counts key off the same display names as traits.data.json.
    remap: {
      Body: "Body",
      Background: "Background",
      "Peg count": "Pegs",
      Size: "Size",
      "Peg layout": "Layout",
      "Wrap style": "Wrap style",
      "Wrap orientation": "Wrap orientation",
    },
  },
  "winds-of-yawanawa": {
    contract: "0x7a63d17f5a59bca04b6702f461b1f1a1c59b100b",
    totalSupply: 1000,
    tokenIds: () => Array.from({ length: 1000 }, (_, i) => String(i)),
    // Winds metadata uses the standard `attributes` array shape (one entry
    // per trait, with trait_type/value), not a flat `traits` object. Flatten
    // it back to {key: value} so the remap step matches what's stored in
    // traits.data.json.
    extract: (j) => {
      const attrs = j?.raw?.metadata?.attributes || j?.rawMetadata?.attributes || null;
      if (!Array.isArray(attrs)) return null;
      const out = {};
      for (const a of attrs) if (a?.trait_type) out[a.trait_type] = a.value;
      return Object.keys(out).length ? out : null;
    },
    remap: {
      Origin: "Origin",
      "Color Temperature - Categorical": "Color Temperature",
      "Wind Intensity - Categorical": "Wind Intensity",
      "Particle Type": "Particle Type",
      "Generative Soundtrack": "Soundtrack",
    },
  },
};

const args = process.argv.slice(2);
const collArg = args.find((a) => a.startsWith("--collection="))?.split("=")[1] || "all";
const targets = collArg === "all" ? Object.keys(COLLECTIONS) : [collArg];

const ALCHEMY = "https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata";
const CONCURRENCY = 8;
const RETRY = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOne(contract, tokenId, attempt = 1) {
  try {
    const r = await fetch(`${ALCHEMY}?contractAddress=${contract}&tokenId=${tokenId}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    if (attempt < RETRY) {
      await sleep(500 * attempt);
      return fetchOne(contract, tokenId, attempt + 1);
    }
    return { error: e.message };
  }
}

async function aggregateCollection(slug) {
  const def = COLLECTIONS[slug];
  if (!def) { console.error(`Unknown collection: ${slug}`); return null; }
  const tokenIds = def.tokenIds();
  console.log(`\n[${slug}] Fetching ${tokenIds.length} tokens...`);

  const counts = {}; // key -> value -> count
  let done = 0, missing = 0, errors = 0;

  // Run in a sliding window of CONCURRENCY parallel fetches.
  for (let i = 0; i < tokenIds.length; i += CONCURRENCY) {
    const batch = tokenIds.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((tid) => fetchOne(def.contract, tid)));
    for (let j = 0; j < results.length; j++) {
      const j_data = results[j];
      done++;
      if (j_data.error) { errors++; continue; }
      const raw = def.extract(j_data);
      if (!raw) { missing++; continue; }
      // Normalize unicode dashes (em / en) to ASCII hyphens on BOTH the
      // trait_type keys AND the trait values - Alchemy returns whatever the
      // on-chain metadata literally contains (Winds uses "Wind Intensity —
      // Categorical" and "Niwe — Wind"), but traits.data.json + the remap
      // table are keyed on ASCII hyphens per the project's no-em-dash
      // convention. Without this, lookups silently miss.
      const normalize = (s) => String(s).replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
      for (const [rawKey, value] of Object.entries(raw)) {
        const key = def.remap[normalize(rawKey)];
        if (!key) continue;
        const values = Array.isArray(value) ? value.map(String) : [String(value)];
        if (!counts[key]) counts[key] = {};
        for (const v of values) {
          const norm = normalize(v);
          counts[key][norm] = (counts[key][norm] || 0) + 1;
        }
      }
    }
    if (done % 80 === 0 || done === tokenIds.length) {
      console.log(`[${slug}] ${done}/${tokenIds.length} (${missing} missing, ${errors} errors)`);
    }
    // Small inter-batch delay to stay under Alchemy demo rate limits.
    await sleep(200);
  }

  // Stable-sort each key's value entries by descending count (then alpha) so
  // the JSON is human-skimmable.
  const sorted = {};
  for (const k of Object.keys(counts).sort()) {
    const valEntries = Object.entries(counts[k]).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    sorted[k] = Object.fromEntries(valEntries);
  }

  console.log(`[${slug}] Done. ${done - errors - missing} valid / ${tokenIds.length} total`);
  return { totalSupply: def.totalSupply, totals: sorted };
}

const existing = JSON.parse(readFileSync(OUT, "utf-8"));
for (const slug of targets) {
  const result = await aggregateCollection(slug);
  if (result) existing[slug] = result;
}
writeFileSync(OUT, JSON.stringify(existing, null, 2) + "\n");
console.log(`\nWrote ${OUT}`);
