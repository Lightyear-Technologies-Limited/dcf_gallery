#!/usr/bin/env node
/**
 * import-portfolio.mjs
 * Reads the DCF Portfolio spreadsheet (via xlsx-cli CSV) and generates src/lib/data.ts
 * with the real portfolio data.
 *
 * Usage: node scripts/import-portfolio.mjs
 */

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1. Read spreadsheet via xlsx-cli
// ---------------------------------------------------------------------------
const SPREADSHEET =
  "C:\\Users\\MichaelDavison\\Hivemind Capital Partners LLC\\Trading SharePoint Site Group - Documents\\NFTs\\Portfolio\\20260414_DCF_website.xlsx";

const raw = execSync(`npx --yes xlsx-cli "${SPREADSHEET}"`, {
  encoding: "utf-8",
  maxBuffer: 10 * 1024 * 1024,
});

// ---------------------------------------------------------------------------
// 2. Parse CSV (handles quoted fields with commas)
// ---------------------------------------------------------------------------
function parseCSVLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const lines = raw.split(/\r?\n/).filter((l) => l.trim());
const header = parseCSVLine(lines[0]);
// Columns: ID, Artist, Title, Collection, Movement (Tags), DCF Wallet Name, DCF Wallet Address, Contract Address, URL

// New spreadsheet format (April 14): ID, Artist, Title, Collection, Movement (Tags), Contract Address, URL
const rows = lines.slice(1).map((line) => {
  const f = parseCSVLine(line);
  return {
    tokenId: f[0],
    artist: f[1],
    title: f[2],
    collection: f[3],
    movement: f[4],
    contractAddress: f[5],
    url: f[6],
  };
});

// ---------------------------------------------------------------------------
// 3. Deduplicate (spreadsheet has some duplicate rows at the end)
// ---------------------------------------------------------------------------
const seen = new Set();
const uniqueRows = rows.filter((r) => {
  const key = `${r.contractAddress}:${r.tokenId}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`Parsed ${rows.length} rows, ${uniqueRows.length} unique pieces`);

// ---------------------------------------------------------------------------
// 4. Helpers
// ---------------------------------------------------------------------------
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Consolidate "Meebits" artist → "Larva Labs" (same studio)
function normalizeArtist(name) {
  if (name === "Meebits") return "Larva Labs";
  return name;
}

// Medium inference from collection/artist context
const MEDIUM_MAP = {
  // Generative (Art Blocks / on-chain rendered)
  fidenza: "generative",
  ringers: "generative",
  biomelumina: "generative",
  qql: "generative",
  lightyears: "generative",
  daygardens: "generative",
  "x0x": "generative",
  pxldex: "generative",
  "human-unreadable": "generative",
  "repeat-as-necessary": "generative",
  "synthetic-dreams": "generative",
  dmitricherniak: "generative",
  tylerhobbs: "generative",
  // Image (static artwork / PFPs)
  cryptopunks: "image",
  meebit: "image",
  ack: "image",
  "ack-editions": "image",
  notablepepes: "image",
  masksofluci: "image",
  "skulls-of-luci": "image",
  lights: "image",
  // CryptoArt (may be animated GIFs/video)
  grifters: "video",
  xcopy: "video",
  beeple: "image",
  // Winds of Yawanawa — multimedia/video
  woy: "video",
};

function inferMedium(collectionSlug) {
  return MEDIUM_MAP[collectionSlug] || "image";
}

// ---------------------------------------------------------------------------
// 5. Build artists, collections, pieces
// ---------------------------------------------------------------------------

// -- Artists --
const artistMap = new Map(); // name → { slug, collections, movements }
for (const r of uniqueRows) {
  const name = normalizeArtist(r.artist);
  if (!artistMap.has(name)) {
    artistMap.set(name, {
      name,
      slug: slugify(name),
      movements: new Set(),
      collections: new Set(),
    });
  }
  const a = artistMap.get(name);
  a.movements.add(r.movement);
  a.collections.add(r.collection);
}

// -- Collections --
// Key by collection + artist so contract-shared collections (SuperRare) split per artist
const collectionMap = new Map();
for (const r of uniqueRows) {
  const artistName = normalizeArtist(r.artist);
  const artistSlug = slugify(artistName);
  const colName = r.collection;
  const key = `${artistSlug}::${colName}`;

  if (!collectionMap.has(key)) {
    // For shared-contract collections like SuperRare, give each artist their own slug
    const baseSlug = slugify(colName);
    const slug = baseSlug; // Will dedupe in the artist context

    collectionMap.set(key, {
      name: colName,
      slug,
      artistName,
      artistSlug,
      movement: r.movement,
      medium: inferMedium(slug),
      contractAddresses: new Set(),
      pieceCount: 0,
      key,
    });
  }
  const c = collectionMap.get(key);
  if (r.contractAddress) c.contractAddresses.add(r.contractAddress);
  c.pieceCount++;
}

// If two artists have a collection with the same slug, suffix with artist
const slugCount = new Map();
for (const c of collectionMap.values()) {
  slugCount.set(c.slug, (slugCount.get(c.slug) || 0) + 1);
}
for (const c of collectionMap.values()) {
  if (slugCount.get(c.slug) > 1) {
    c.slug = `${c.slug}-${c.artistSlug}`;
  }
}

// -- Pieces --
const pieceData = uniqueRows.map((r) => {
  const artistName = normalizeArtist(r.artist);
  const artistSlug = slugify(artistName);
  // Look up the per-artist collection slug from collectionMap
  const colKey = `${artistSlug}::${r.collection}`;
  const col = collectionMap.get(colKey);
  const collectionSlug = col ? col.slug : slugify(r.collection);
  // Use contract address suffix to ensure uniqueness when same tokenId appears across contracts
  const contractSuffix = r.contractAddress ? r.contractAddress.slice(-4) : '';
  const slug = `${collectionSlug}-${r.tokenId}-${contractSuffix}`;
  const medium = inferMedium(collectionSlug);
  const url = r.url.startsWith("http") ? r.url : `https://${r.url}`;
  return {
    tokenId: r.tokenId,
    slug,
    title: r.title,
    collectionSlug,
    artistSlug,
    medium,
    contractAddress: r.contractAddress,
    url,
    movement: r.movement,
  };
});

// ---------------------------------------------------------------------------
// 6. Movement tag mapping
// ---------------------------------------------------------------------------
const MOVEMENT_TAGS = {
  GenArt: ["generative", "algorithmic", "on-chain"],
  CryptoArt: ["crypto-native", "digital-culture", "glitch"],
  "Digital Canvas": ["digital-painting", "contemporary", "new-media"],
  "Digital Identity": ["pfp", "cultural-icon", "provenance"],
  "AI Art": ["ai-generated", "machine-learning", "data-art"],
};

// ---------------------------------------------------------------------------
// 7. Generate data.ts
// ---------------------------------------------------------------------------
function esc(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function indent(n) {
  return "  ".repeat(n);
}

let out = `// =============================================================================
// DCF Gallery — Portfolio Data
// Generated from 20260408_DCF_Portfolio.xlsx on ${new Date().toISOString().slice(0, 10)}
// =============================================================================

export interface Artist {
  slug: string;
  name: string;
  bio: string;
  curationComment: string;
  artistQuote?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  influences: string[];
  tags: string[];
}

export interface Collection {
  slug: string;
  name: string;
  artistSlug: string;
  description: string;
  curatorNote: string;
  medium: 'image' | 'video' | 'generative' | 'interactive';
  contractAddress?: string;
  totalSupply?: number;
  mintDate?: string;
  tags: string[];
  influences: string[];
}

export interface Piece {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistSlug: string;
  image: string;
  medium: 'image' | 'video' | 'generative' | 'interactive';
  description: string;
  traits: Record<string, string>;
  tokenId?: string;
  contractAddress?: string;
  mintDate?: string;
  lastSalePrice?: string;
  floorPrice?: string;
  influences: string[];
  openseaUrl?: string;
}

export interface Influence {
  name: string;
  movement: string;
  period: string;
  description: string;
  connectedArtists: string[];
  connectedCollections: string[];
}

// ---------------------------------------------------------------------------
// Artists
// ---------------------------------------------------------------------------
export const artists: Artist[] = [\n`;

for (const [, a] of artistMap) {
  const movements = [...a.movements];
  const tags = movements.flatMap((m) => MOVEMENT_TAGS[m] || []);
  const uniqueTags = [...new Set(tags)];

  out += `  {
    slug: '${esc(a.slug)}',
    name: '${esc(a.name)}',
    bio: '',
    curationComment: '',
    influences: [],
    tags: [${uniqueTags.map((t) => `'${esc(t)}'`).join(", ")}],
  },\n`;
}

out += `];

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------
export const collections: Collection[] = [\n`;

for (const [, c] of collectionMap) {
  const contracts = [...c.contractAddresses];
  const primaryContract = contracts[0] || "";
  const tags = MOVEMENT_TAGS[c.movement] || [];

  out += `  {
    slug: '${esc(c.slug)}',
    name: '${esc(c.name)}',
    artistSlug: '${esc(c.artistSlug)}',
    description: '',
    curatorNote: '',
    medium: '${c.medium}',
    contractAddress: '${esc(primaryContract)}',
    totalSupply: ${c.pieceCount},
    tags: [${tags.map((t) => `'${esc(t)}'`).join(", ")}],
    influences: [],
  },\n`;
}

out += `];

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
export const pieces: Piece[] = [\n`;

for (const p of pieceData) {
  out += `  {
    id: '${esc(p.slug)}',
    slug: '${esc(p.slug)}',
    title: '${esc(p.title)}',
    collectionSlug: '${esc(p.collectionSlug)}',
    artistSlug: '${esc(p.artistSlug)}',
    image: '/samples/${esc(p.collectionSlug)}-${esc(p.tokenId)}.svg',
    medium: '${p.medium}',
    description: '',
    traits: {},
    tokenId: '${esc(p.tokenId)}',
    contractAddress: '${esc(p.contractAddress)}',
    influences: [],
    openseaUrl: '${esc(p.url)}',
  },\n`;
}

out += `];

// ---------------------------------------------------------------------------
// Influence map — connecting traditional art to digital works
// (placeholder — to be populated with art historical connections)
// ---------------------------------------------------------------------------
export const influences: Influence[] = [];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
export function getArtist(slug: string) {
  return artists.find((a) => a.slug === slug);
}

export function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug);
}

export function getPiece(slug: string) {
  return pieces.find((p) => p.slug === slug);
}

export function getCollectionsByArtist(artistSlug: string) {
  return collections.filter((c) => c.artistSlug === artistSlug);
}

export function getPiecesByCollection(collectionSlug: string) {
  return pieces.filter((p) => p.collectionSlug === collectionSlug);
}

export function getPiecesByArtist(artistSlug: string) {
  return pieces.filter((p) => p.artistSlug === artistSlug);
}

export function getRelatedPiecesByInfluence(piece: Piece): Piece[] {
  return pieces.filter(
    (p) =>
      p.id !== piece.id &&
      p.influences.some((inf) => piece.influences.includes(inf))
  );
}

export function getInfluence(name: string) {
  return influences.find((i) => i.name === name);
}

export function getInfluencesByArtist(artistSlug: string) {
  return influences.filter((i) => i.connectedArtists.includes(artistSlug));
}

export function getAllTags(): string[] {
  const tagSet = new Set<string>();
  artists.forEach((a) => a.tags.forEach((t) => tagSet.add(t)));
  collections.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

export function getAllMediums(): Piece['medium'][] {
  return ['image', 'video', 'generative', 'interactive'];
}

export function getAllInfluenceNames(): string[] {
  return influences.map((i) => i.name).sort();
}

export function getAllMovements(): string[] {
  const movementSet = new Set<string>();
  collections.forEach((c) => c.tags.forEach((t) => movementSet.add(t)));
  return Array.from(movementSet).sort();
}
`;

// ---------------------------------------------------------------------------
// 8. Write output
// ---------------------------------------------------------------------------
const outPath = resolve(ROOT, "src/lib/data.ts");
writeFileSync(outPath, out, "utf-8");

console.log(`\nGenerated ${outPath}`);
console.log(`  Artists:     ${artistMap.size}`);
console.log(`  Collections: ${collectionMap.size}`);
console.log(`  Pieces:      ${pieceData.length}`);
console.log(`  Movements:   ${new Set(uniqueRows.map((r) => r.movement)).size}`);
