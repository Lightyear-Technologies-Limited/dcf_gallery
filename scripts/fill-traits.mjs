#!/usr/bin/env node
/**
 * Fill in missing entries in src/lib/traits.data.json from the fetched
 * piece-metadata.json. Only writes to pieces that don't already have a trait
 * entry, so the hand-curated per-collection pipelines (Fidenza, Ringers,
 * Winds, etc.) are preserved as-is.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const META = resolve(__dirname, "piece-metadata.json");
const TRAITS = resolve(__dirname, "..", "src/lib/traits.data.json");

const meta = JSON.parse(readFileSync(META, "utf8"));
const traits = JSON.parse(readFileSync(TRAITS, "utf8"));

// Boilerplate attribute keys that don't add curatorial value
const SKIP_KEYS = new Set([
  "artist", "collection", "edition", "year", "contract", "creator",
  "url", "external_url", "blockchain", "token standard",
]);

function titleCase(s) {
  return String(s).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeKey(k) {
  const key = String(k).replace(/[_-]+/g, " ").trim();
  return titleCase(key);
}

function normalizeValue(v) {
  if (v == null) return "";
  const s = String(v).trim();
  // Title-case all-caps; leave mixed-case alone
  if (s.length > 1 && s === s.toUpperCase() && /[A-Z]/.test(s) && !/^\d/.test(s)) {
    return titleCase(s);
  }
  return s;
}

let added = 0;
let skipped = 0;
for (const slug of Object.keys(meta)) {
  if (traits[slug]) { skipped++; continue; }
  const attrs = meta[slug]?.attributes;
  if (!Array.isArray(attrs) || attrs.length === 0) continue;
  const entry = {};
  for (const a of attrs) {
    const key = normalizeKey(a.key);
    if (!key) continue;
    if (SKIP_KEYS.has(key.toLowerCase())) continue;
    const val = normalizeValue(a.value);
    if (!val) continue;
    entry[key] = val;
  }
  if (Object.keys(entry).length > 0) {
    traits[slug] = entry;
    added++;
  }
}

writeFileSync(TRAITS, JSON.stringify(traits, null, 2) + "\n");
console.log(`Added ${added} new trait entries, ${skipped} already had curated entries (preserved).`);
console.log(`Total: ${Object.keys(traits).length} entries.`);
