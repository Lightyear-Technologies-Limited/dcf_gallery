#!/usr/bin/env node
/**
 * Fetches NFT trait metadata from Alchemy demo endpoint and merges
 * summaries into scripts/trait-map.json. Preserves all existing keys.
 *
 * Rate-limited: concurrency=1, 500ms between requests, 2s backoff + 1 retry.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, "..", "src/lib/data.ts");
const traitMapPath = resolve(__dirname, "trait-map.json");

const TARGET_COLLECTIONS = new Set([
  "piano-blossoms",
  "her-favorite-flowers",
  "superrare-beeple",
  "dmitri-cherniak",
  "superrare-dmitri-cherniak",
  "lights",
  "dataland-biome-lumina",
  "synthetic-dreams",
  "masks-of-luci",
  "skulls-of-luci",
  "tyler-hobbs",
  "harbor-scene",
  "qql",
  "day-gardens",
  "superrare-xcopy",
  "human-unreadable",
  "repeat-as-necessary",
]);

// ---------------------------------------------------------------------------
// Parse data.ts for piece objects of interest.
// ---------------------------------------------------------------------------
const source = readFileSync(dataPath, "utf-8");

// Match { ... } piece objects with collectionSlug in target list.
// We'll split the pieces array by top-level "{" boundaries.
const piecesArrayStart = source.indexOf("export const pieces: Piece[] = [");
const piecesArrayBody = source.slice(piecesArrayStart);

// data.ts has inconsistent block terminators (some `},`, many just `,`).
// Split the body into candidate blocks by start-of-block pattern `^  {`.
// Each block is the text between consecutive `^  {` anchors.
const rawBlocks = piecesArrayBody.split(/^  \{/m).slice(1); // drop the prelude

const pieces = [];
for (const blockRaw of rawBlocks) {
  // Only look at content up to the next block boundary within this slice
  // (the split already ensures each block ends before the next `  {`).
  const idMatch = blockRaw.match(/^\s*id:\s*'([^']+)'/m);
  const slugMatch = blockRaw.match(/^\s*slug:\s*'([^']+)'/m);
  const titleMatch = blockRaw.match(/^\s*title:\s*'([^']*)'/m);
  const collMatch = blockRaw.match(/^\s*collectionSlug:\s*'([^']+)'/m);
  const artistMatch = blockRaw.match(/^\s*artistSlug:\s*'([^']+)'/m);
  const tokenMatch = blockRaw.match(/^\s*tokenId:\s*'([^']*)'/m);
  const contractMatch = blockRaw.match(/^\s*contractAddress:\s*'([^']+)'/m);

  if (!idMatch || !slugMatch || !collMatch) continue;
  const collectionSlug = collMatch[1];
  if (!TARGET_COLLECTIONS.has(collectionSlug)) continue;

  // Skip pieces without tokenId or contractAddress (e.g. x-ray-machine, 1/1 placeholders)
  if (!tokenMatch || !contractMatch) {
    console.log(`  SKIP (no tokenId/contract): ${slugMatch?.[1] || idMatch[1]} [${collectionSlug}]`);
    continue;
  }

  pieces.push({
    id: idMatch[1],
    slug: slugMatch[1],
    title: titleMatch ? titleMatch[1] : "",
    collectionSlug,
    artistSlug: artistMatch ? artistMatch[1] : "",
    tokenId: tokenMatch[1],
    contractAddress: contractMatch[1],
  });
}

console.log(`Parsed ${pieces.length} target pieces from data.ts`);
const byCollection = {};
for (const p of pieces) {
  byCollection[p.collectionSlug] = (byCollection[p.collectionSlug] || 0) + 1;
}
console.log("By collection:", byCollection);

// ---------------------------------------------------------------------------
// Fetch helper with rate limiting.
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchMeta(contractAddress, tokenId, attempt = 1) {
  const url = `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      if (attempt < 2) {
        await sleep(2000);
        return fetchMeta(contractAddress, tokenId, attempt + 1);
      }
      return { error: "rate-limited" };
    }
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    const json = await res.json();
    if (!json || (!json.name && !json.raw && !json.attributes)) {
      if (attempt < 2) {
        await sleep(2000);
        return fetchMeta(contractAddress, tokenId, attempt + 1);
      }
      return { error: "empty response" };
    }
    return json;
  } catch (err) {
    if (attempt < 2) {
      await sleep(2000);
      return fetchMeta(contractAddress, tokenId, attempt + 1);
    }
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------------
// Trait summarization logic per collection.
// ---------------------------------------------------------------------------
function getAttrs(meta) {
  // Alchemy v3 returns raw.metadata.attributes usually; also attributes at root.
  const attrs =
    meta?.raw?.metadata?.attributes ||
    meta?.attributes ||
    meta?.metadata?.attributes ||
    [];
  return Array.isArray(attrs) ? attrs : [];
}

function getName(meta) {
  return (
    meta?.name ||
    meta?.raw?.metadata?.name ||
    meta?.metadata?.name ||
    ""
  );
}

function attrValue(attrs, key) {
  const a = attrs.find(
    (x) => (x.trait_type || x.traitType || "").toLowerCase() === key.toLowerCase()
  );
  if (!a) return null;
  return a.value || a.trait_value || null;
}

// Preferred-title: if chain name exists and is cleaner/different from local, use it;
// otherwise use local title; otherwise #tokenId.
function preferTitle(piece, meta) {
  const name = getName(meta);
  const title = piece.title || "";
  // Prefer chain name if different AND it isn't just "Collection #N/M"
  if (name && name.trim()) {
    // Avoid verbose placeholder names like "BIOME LUMINA #115/1000"
    if (!/^\s*[A-Z][A-Z\s\-—]+#\d+/i.test(name) && !/#\d+\/\d+$/.test(name)) {
      return name;
    }
  }
  return title || `#${piece.tokenId}`;
}

function summarize(piece, meta) {
  const attrs = getAttrs(meta);
  const name = getName(meta);
  const title = piece.title || "";
  const truncate = (s) => (s && s.length > 60 ? s.slice(0, 57) + "..." : s);

  switch (piece.collectionSlug) {
    case "piano-blossoms": {
      // ACK piano blossoms — 1/1 title. Prefer chain's spaced version (e.g. "Flower Demons").
      return truncate(preferTitle(piece, meta));
    }
    case "her-favorite-flowers": {
      // Single piece. "kissed by the Moonlight" from chain.
      return truncate(preferTitle(piece, meta));
    }
    case "superrare-beeple": {
      // "TIME" is the title.
      return truncate(title || name || `#${piece.tokenId}`);
    }
    case "dmitri-cherniak":
    case "superrare-dmitri-cherniak": {
      return truncate(preferTitle(piece, meta));
    }
    case "lights": {
      // Kim Asendorf — chain name is "Raster und Spektrum" which is perfect.
      return truncate(preferTitle(piece, meta));
    }
    case "dataland-biome-lumina": {
      // Distinctive trait: SPECIES NAME (e.g. "Luminflora Aureolea"). Add cluster.
      const species = attrValue(attrs, "SPECIES NAME") || attrValue(attrs, "Species Name") || attrValue(attrs, "Species");
      const cluster = attrValue(attrs, "CLUSTER") || attrValue(attrs, "Cluster");
      if (species) {
        const pretty = String(species).split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        if (cluster) {
          const prettyCluster = String(cluster).split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
          return truncate(`${pretty}, ${prettyCluster}`);
        }
        return truncate(pretty);
      }
      return truncate(`#${piece.tokenId}`);
    }
    case "synthetic-dreams": {
      // Distinctive trait: Cluster (e.g. "CLOSED WATER"). Add rarity if present.
      const cluster = attrValue(attrs, "Cluster") || attrValue(attrs, "CLUSTER");
      const rarity = attrValue(attrs, "Rarity");
      if (cluster) {
        const pretty = String(cluster).split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        return truncate(rarity ? `${pretty}, Rarity ${rarity}` : pretty);
      }
      return truncate(`#${piece.tokenId}`);
    }
    case "masks-of-luci": {
      // The chain name IS the mask name (e.g. "Prism Shield"). Optionally append Category.
      const maskName = name || title;
      const category = attrValue(attrs, "Category");
      const material = attrValue(attrs, "Material");
      if (maskName) {
        const extras = [category, material].filter(Boolean);
        if (extras.length && maskName.length + 2 + extras.join(", ").length <= 60) {
          return truncate(`${maskName}, ${extras.join(", ")}`);
        }
        return truncate(maskName);
      }
      return truncate(`#${piece.tokenId}`);
    }
    case "skulls-of-luci": {
      // Same pattern as masks — chain name is the skull name.
      return truncate(name || title || `#${piece.tokenId}`);
    }
    case "tyler-hobbs": {
      // 1/1 titles (Return Zero, Elektroanima, One One Overflow).
      return truncate(title || name || `#${piece.tokenId}`);
    }
    case "harbor-scene": {
      return truncate(title || name || `#${piece.tokenId}`);
    }
    case "qql": {
      // Minted (contract ...0c88) vs Mint Pass (contract ...1088)
      const contractLower = piece.contractAddress.toLowerCase();
      const isMintPass = contractLower.endsWith("1088") || /mint\s*pass/i.test(name || "") || /mint\s*pass/i.test(title);
      const prefix = isMintPass ? "Mint Pass" : "Minted";
      if (isMintPass) return truncate(prefix);
      const palette =
        attrValue(attrs, "Color Palette") ||
        attrValue(attrs, "Palette");
      const style =
        attrValue(attrs, "Structure") ||
        attrValue(attrs, "Flow Field");
      const parts = [prefix];
      if (palette) parts.push(palette);
      if (style && parts.length < 3) parts.push(style);
      return truncate(parts.join(", "));
    }
    case "day-gardens": {
      // These titles come as "Day Garden #N". Look for palette/style traits.
      const palette =
        attrValue(attrs, "Palette") ||
        attrValue(attrs, "Color Palette") ||
        attrValue(attrs, "Color");
      const style = attrValue(attrs, "Style") || attrValue(attrs, "Variant");
      const parts = [];
      if (palette) parts.push(palette);
      if (style) parts.push(style);
      if (parts.length) return truncate(parts.join(", "));
      // Fallback: use any non-boilerplate attrs
      const filtered = (attrs || []).filter(a => !/^(artist|collection|event|year|museum)$/i.test(a.trait_type || ""));
      if (filtered.length) {
        const picks = filtered.slice(0, 2).map((a) => a.value).filter(Boolean);
        if (picks.length) return truncate(picks.join(", "));
      }
      return truncate(title || name || `#${piece.tokenId}`);
    }
    case "superrare-xcopy": {
      // Titles are distinctive (CITIZENS!, DANKRUPT, etc.).
      return truncate(title || name || `#${piece.tokenId}`);
    }
    case "human-unreadable": {
      // Alchemy demo returns no attributes for this Art Blocks project.
      // Fall back to #tokenId.
      if (attrs.length) {
        const picks = attrs.slice(0, 2).map((a) => a.value).filter(Boolean);
        if (picks.length) return truncate(picks.join(", "));
      }
      return truncate(`#${piece.tokenId}`);
    }
    case "repeat-as-necessary": {
      // Distinctive: the subtitle after " - " in the name.
      if (title.includes(" - ")) {
        const subtitle = title.split(" - ").slice(1).join(" - ");
        if (subtitle) return truncate(subtitle);
      }
      if (attrs.length) {
        const picks = attrs.slice(0, 3).map((a) => a.value).filter(Boolean);
        if (picks.length) return truncate(picks.join(", "));
      }
      return truncate(title || name || `#${piece.tokenId}`);
    }
    default:
      return truncate(title || name || `#${piece.tokenId}`);
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
const existing = JSON.parse(readFileSync(traitMapPath, "utf-8"));
const merged = { ...existing };
const failures = [];
const notes = [];
let added = 0;
let skipped = 0;

for (let i = 0; i < pieces.length; i++) {
  const p = pieces[i];
  if (merged[p.slug]) {
    skipped++;
    continue;
  }
  process.stdout.write(`[${i + 1}/${pieces.length}] ${p.slug} ... `);
  const meta = await fetchMeta(p.contractAddress, p.tokenId);
  if (meta?.error) {
    console.log(`FAIL (${meta.error}) — using fallback`);
    failures.push({ slug: p.slug, reason: meta.error, title: p.title });
    // Fallback based on title or #tokenId
    merged[p.slug] = p.title ? p.title.slice(0, 60) : `#${p.tokenId}`;
    added++;
  } else {
    const summary = summarize(p, meta);
    const name = getName(meta);
    const attrs = getAttrs(meta);
    if (name && name !== p.title && name.length < 80) {
      notes.push({ slug: p.slug, ourTitle: p.title, chainName: name });
    }
    if (attrs.length) {
      notes.push({ slug: p.slug, attrCount: attrs.length, sample: attrs.slice(0, 3) });
    }
    console.log(`OK -> "${summary}"`);
    merged[p.slug] = summary;
    added++;
  }
  // 500ms delay between requests
  await sleep(500);
}

// Write back, preserving existing keys first then new keys in insertion order
writeFileSync(traitMapPath, JSON.stringify(merged, null, 2) + "\n");

console.log("\n--- SUMMARY ---");
console.log(`Pieces parsed: ${pieces.length}`);
console.log(`New entries added: ${added}`);
console.log(`Already present (skipped): ${skipped}`);
console.log(`Failures: ${failures.length}`);
if (failures.length) {
  console.log(JSON.stringify(failures, null, 2));
}
console.log(`\nNotes (first 20):`);
console.log(JSON.stringify(notes.slice(0, 20), null, 2));
