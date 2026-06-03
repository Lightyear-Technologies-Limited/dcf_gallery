#!/usr/bin/env node
/**
 * Build src/lib/descriptions.data.json from scripts/piece-metadata.json.
 *
 * Filters:
 * - Drop empty / placeholder descriptions
 * - Drop descriptions identical across >= 70% of a collection (boilerplate
 *   that repeats on every piece - those belong on the collection page, not
 *   the piece page)
 * - Trim trailing whitespace + collapse internal whitespace
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DATA = resolve(__dirname, "..", "src/lib/data.ts");
const META = resolve(__dirname, "piece-metadata.json");
const OUT = resolve(__dirname, "..", "src/lib/descriptions.data.json");

const meta = JSON.parse(readFileSync(META, "utf8"));

// Parse data.ts -> {slug -> collectionSlug} for pieces, plus the set of
// collection slugs that opt out of per-piece descriptions (suppressPieceDescriptions: true).
// data.ts orders the arrays as: artists -> collections -> pieces -> influences.
const src = readFileSync(SRC_DATA, "utf8");
const collectionsStart = src.indexOf("export const collections: Collection[] = [");
const piecesStart = src.indexOf("export const pieces: Piece[] = [");
const collectionsBody = src.slice(collectionsStart, piecesStart);
const piecesBody = src.slice(piecesStart);

const pieceCol = {};
for (const b of piecesBody.split(/^  \{/m).slice(1)) {
  const slug = b.match(/^\s*slug:\s*'([^']+)'/m)?.[1];
  const col = b.match(/^\s*collectionSlug:\s*'([^']+)'/m)?.[1];
  if (slug && col) pieceCol[slug] = col;
}

const suppressedCollections = new Set();
for (const b of collectionsBody.split(/^  \{/m).slice(1)) {
  const slug = b.match(/^\s*slug:\s*'([^']+)'/m)?.[1];
  const suppressed = /suppressPieceDescriptions:\s*true/.test(b);
  if (slug && suppressed) suppressedCollections.add(slug);
}
if (suppressedCollections.size > 0) {
  console.log(`Suppressing per-piece descriptions for: ${[...suppressedCollections].join(", ")}`);
}

function clean(s) {
  if (!s || typeof s !== "string") return "";
  // Normalize line endings and treat every newline as a paragraph break.
  // Artists embed \n in NFT description metadata as the paragraph separator
  // for prose statements (Piano Blossoms, Tyler Hobbs 1/1s, etc.); rendering
  // them at single line-height collapses paragraphs into one block. Promote
  // any 1+ newline to \n\n so whitespace-pre-line surfaces them as proper
  // paragraph breaks with vertical space.
  let out = s.replace(/\r\n/g, "\n");
  out = out.replace(/[ \t]+/g, " ");
  out = out.split("\n").map((l) => l.trim()).join("\n");
  out = out.replace(/\n+/g, "\n\n").trim();
  return out;
}

// Earlier versions of this script dropped descriptions that repeated across
// >= 70% of a collection's pieces, treating them as boilerplate that belonged
// on the collection page rather than per-piece. In practice that stripped
// useful artist-voice context from many series (Day Gardens, Ringers, Winds
// of Yawanawa, etc.) where every token shares the same description because
// that IS the artist's statement for the work. We now keep every non-empty
// description and let the reader compare across pieces.

const out = {};
let kept = 0;
let dropped = 0;
let suppressed = 0;
for (const slug of Object.keys(meta)) {
  const d = clean(meta[slug]?.description);
  if (!d) { dropped++; continue; }
  // Keep any non-empty description, even single words. Artists like XCOPY
  // use 4-char metadata fields ("SALT" on THE FUD) as intentional editorial
  // commentary - the earlier <10 char filter dropped these as noise. Now
  // the only floor is empty / whitespace-only.
  if (suppressedCollections.has(pieceCol[slug])) { suppressed++; continue; }
  out[slug] = d;
  kept++;
}
if (suppressed > 0) console.log(`Suppressed: ${suppressed}`);

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`Wrote ${OUT}: ${kept} kept, ${dropped} dropped`);
