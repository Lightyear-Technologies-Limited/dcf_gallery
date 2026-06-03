#!/usr/bin/env node
/**
 * Rebuild CryptoPunks trait entries in src/lib/traits.data.json from the raw
 * scripts/piece-metadata.json.
 *
 * Punks have a "type" entry plus N "attribute" entries (Luxurious Beard,
 * Earring, Hoodie, etc.). The generic fill-traits pipeline collapsed these
 * to a single row because the map-by-key normalization treats duplicates as
 * overwrites. This script puts back:
 *   - Type: "Male 1" / "Female 2" -> human-language "Male" / "Female"
 *     ("Male 1" vs "Male 2" actually marks a skin-tone variant; for the
 *     catalogue read, the broad type is what readers want)
 *   - Accessories: trimmed, comma-joined list of every attribute
 */
import { readFileSync, writeFileSync } from "node:fs";

const META = "scripts/piece-metadata.json";
const TRAITS = "src/lib/traits.data.json";

const meta = JSON.parse(readFileSync(META, "utf8"));
const traits = JSON.parse(readFileSync(TRAITS, "utf8"));

function cleanType(raw) {
  if (!raw) return raw;
  // "Male 1" / "Male 2" / "Female 1-4" -> just the role. "Zombie", "Ape",
  // "Alien" come without a number suffix; leave those alone.
  return String(raw).replace(/\s+\d+$/, "").trim();
}

let updated = 0;
for (const [slug, m] of Object.entries(meta)) {
  if (!slug.startsWith("cryptopunks-")) continue;
  const attrs = Array.isArray(m.attributes) ? m.attributes : [];
  if (attrs.length === 0) continue;
  const type = attrs.find((a) => (a.key || "").toLowerCase() === "type");
  const accessories = attrs
    .filter((a) => (a.key || "").toLowerCase() === "attribute")
    .map((a) => String(a.value || "").trim())
    .filter(Boolean);
  const entry = {};
  if (type?.value) entry["Type"] = cleanType(type.value);
  // Store each accessory as its own array entry so the Features panel can
  // render one row per accessory and each becomes independently filterable
  // (matching the cryptopunks.app marketplace layout).
  if (accessories.length) entry["Attribute"] = accessories;
  if (Object.keys(entry).length > 0) {
    traits[slug] = entry;
    updated++;
  }
}

writeFileSync(TRAITS, JSON.stringify(traits, null, 2) + "\n");
console.log(`Updated ${updated} Punk entries in ${TRAITS}.`);
