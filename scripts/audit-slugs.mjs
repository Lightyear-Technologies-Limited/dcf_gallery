/**
 * Slug cross-reference audit.
 *
 * `src/lib/data.ts` is the canonical entity list, but a dozen other files are keyed
 * by the slugs it defines — the generated `*.data.json` payloads, the curation
 * layer, the per-entity editorial files, and the redirect map. Nothing enforces
 * that they agree: a re-import from the portfolio spreadsheet, a hand-edit, or a
 * slug rename can leave any of them pointing at an entity that no longer exists,
 * and the app will simply render nothing for it. The 2026-07 pass renamed 317
 * piece slugs at once, which is exactly the operation this guards.
 *
 * Pure static analysis — no network, no server, no build output. Runs in about a
 * second, so it belongs in CI alongside `audit` (assets) and `content` (editorial
 * Zod). Exits non-zero with a precise report.
 *
 * Deliberately NOT checked here: whether old slugs still redirect. That depends on
 * git history rather than the working tree, and a legitimately deleted piece would
 * make it fail forever.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const readJSON = (p) => JSON.parse(read(p));

const problems = [];
const fail = (msg) => problems.push(msg);

// ---------------------------------------------------------------- data.ts ----
// data.ts is generated with a stable shape (4-space indented `slug:` per entry),
// so a regex read avoids needing a TS toolchain just to audit it.
const ts = read("src/lib/data.ts");
function block(name) {
  const start = ts.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`data.ts: no "export const ${name}" — has the generated shape changed?`);
  const next = ts.indexOf("\nexport const ", start + 10);
  return ts.slice(start, next < 0 ? ts.length : next);
}
const slugsIn = (b) => [...b.matchAll(/^\s{4}slug: '([^']+)'/gm)].map((m) => m[1]);

const artistBlock = block("artists");
const collBlock = block("collections");
const pieceBlock = block("pieces");

const artistSlugs = slugsIn(artistBlock);
const collSlugs = slugsIn(collBlock);
const pieceSlugs = slugsIn(pieceBlock);
const A = new Set(artistSlugs);
const C = new Set(collSlugs);
const P = new Set(pieceSlugs);

const dupes = (arr) => {
  const seen = new Set(), d = new Set();
  for (const s of arr) (seen.has(s) ? d : seen).add(s);
  return [...d];
};
for (const [label, arr] of [["artist", artistSlugs], ["collection", collSlugs], ["piece", pieceSlugs]]) {
  const d = dupes(arr);
  if (d.length) fail(`data.ts: duplicate ${label} slug(s): ${d.join(", ")}`);
}
const dupIds = dupes([...pieceBlock.matchAll(/^\s{4}id: '([^']+)'/gm)].map((m) => m[1]));
if (dupIds.length) fail(`data.ts: duplicate piece id(s): ${dupIds.join(", ")}`);

// Referential integrity inside data.ts itself.
for (const entry of pieceBlock.split(/\n {2}\{\n/).slice(1)) {
  const slug = entry.match(/slug: '([^']+)'/)?.[1];
  const cs = entry.match(/collectionSlug: '([^']+)'/)?.[1];
  const as = entry.match(/artistSlug: '([^']+)'/)?.[1];
  if (cs && !C.has(cs)) fail(`data.ts: piece ${slug} → unknown collectionSlug "${cs}"`);
  if (as && !A.has(as)) fail(`data.ts: piece ${slug} → unknown artistSlug "${as}"`);
}
for (const entry of collBlock.split(/\n {2}\{\n/).slice(1)) {
  const slug = entry.match(/slug: '([^']+)'/)?.[1];
  const as = entry.match(/artistSlug: '([^']+)'/)?.[1];
  if (as && !A.has(as)) fail(`data.ts: collection ${slug} → unknown artistSlug "${as}"`);
}

// ------------------------------------------------- slug-keyed data payloads ----
const checkKeys = (label, keys, set, kind) => {
  const bad = [...new Set(keys)].filter((k) => !set.has(k));
  if (bad.length) {
    fail(`${label}: ${bad.length} key(s) are not a known ${kind} slug: ${bad.slice(0, 10).join(", ")}${bad.length > 10 ? " …" : ""}`);
  }
  return keys.length;
};

const counts = {};
counts["traits.data.json"] = checkKeys("traits.data.json", Object.keys(readJSON("src/lib/traits.data.json")), P, "piece");
counts["descriptions.data.json"] = checkKeys("descriptions.data.json", Object.keys(readJSON("src/lib/descriptions.data.json")), P, "piece");
counts["motion.data.json"] = checkKeys("motion.data.json", Object.keys(readJSON("src/lib/motion.data.json")), P, "piece");
counts["provenance.cids.json"] = checkKeys("provenance.cids.json", Object.keys(readJSON("src/lib/provenance.cids.json")), P, "piece");
const prov = readJSON("src/lib/provenance.data.json");
counts["provenance.data.json"] = checkKeys("provenance.data.json", Object.keys(prov.assets ?? prov), P, "piece");

// ------------------------------------------------------------- curation ----
// Keys prefixed with `_` are authoring comments in curation.json, not entities.
const real = (o) => Object.keys(o ?? {}).filter((k) => !k.startsWith("_"));
const cur = readJSON("src/lib/curation.data.json");

for (const key of ["collectionNames", "artistSiteTemplates", "editions", "piecesPerRow", "pieceRows", "pieceOrder", "heroLayouts"]) {
  checkKeys(`curation.${key}`, real(cur[key]), C, "collection");
}
checkKeys("curation.artistNames", real(cur.artistNames), A, "artist");
checkKeys("curation.collectionOrder", real(cur.collectionOrder), A, "artist");
checkKeys("curation.hideCollections", cur.hideCollections ?? [], C, "collection");
checkKeys("curation.featuredHeroes", cur.featuredHeroes ?? [], P, "piece");

// Values, not just keys.
for (const [artist, list] of Object.entries(cur.collectionOrder ?? {})) {
  if (artist.startsWith("_")) continue;
  checkKeys(`curation.collectionOrder[${artist}]`, list, C, "collection");
}
for (const [coll, list] of Object.entries(cur.pieceOrder ?? {})) {
  if (coll.startsWith("_")) continue;
  checkKeys(`curation.pieceOrder[${coll}]`, list.flat(Infinity).filter((x) => typeof x === "string"), P, "piece");
}
for (const [coll, rows] of Object.entries(cur.pieceRows ?? {})) {
  if (coll.startsWith("_")) continue;
  checkKeys(`curation.pieceRows[${coll}]`, real(rows), P, "piece");
}
for (const [coll, layout] of Object.entries(cur.heroLayouts ?? {})) {
  if (coll.startsWith("_")) continue;
  const refs = [layout.heroPiece, ...(layout.sidebarPieces ?? [])].filter(Boolean);
  checkKeys(`curation.heroLayouts[${coll}]`, refs, P, "piece");
}

// ------------------------------------------------------------- editorial ----
for (const [dir, set, kind] of [
  ["content/editorial/artists", A, "artist"],
  ["content/editorial/collections", C, "collection"],
  ["content/editorial/pieces", P, "piece"],
]) {
  if (!existsSync(join(ROOT, dir))) continue;
  const files = readdirSync(join(ROOT, dir)).filter((f) => f.endsWith(".json"));
  counts[dir] = files.length;
  checkKeys(dir, files.map((f) => f.replace(/\.json$/, "")), set, kind);
}

// ------------------------------------------- scripts/*.json intermediates ----
// The trait pipeline's inputs are keyed by piece slug too, and they drifted for a
// month after the 2026-07 rename without anything noticing: build-traits-data.mjs
// only ever ADDED on merge, so it wrote 276 dead-slug entries beside the live ones
// while the site carried on working. Two shapes in use — `{ "<slug>": {...} }` and
// `[ { slug: "<slug>", … } ]` — so both are checked. Named explicitly rather than
// globbed: scripts/ also holds outputs and one-off scratch files that are not
// slug-keyed, and a glob would produce noise on those.
const INTERMEDIATES_BY_KEY = [
  "asset-sources.json",
  "manual-traits.json",
  "piece-metadata.json",
  "pxl-traits.json",
  "trait-map.json",
];
const INTERMEDIATES_BY_RECORD = [
  "fidenza-traits.json",
  "ringer-bg.json",
  "winds-traits.json",
  "human-unreadable-traits.json",
  "biome-lumina-traits.json",
  "synthetic-dreams-traits.json",
  "grifters-traits.json",
  "masks-traits.json",
  "qql-traits.json",
];
for (const f of INTERMEDIATES_BY_KEY) {
  const p = join(ROOT, "scripts", f);
  if (!existsSync(p)) continue;
  const keys = real(JSON.parse(readFileSync(p, "utf8")));
  counts[`scripts/${f}`] = keys.length;
  checkKeys(`scripts/${f}`, keys, P, "piece");
}
for (const f of INTERMEDIATES_BY_RECORD) {
  const p = join(ROOT, "scripts", f);
  if (!existsSync(p)) continue;
  const arr = JSON.parse(readFileSync(p, "utf8"));
  if (!Array.isArray(arr)) { fail(`scripts/${f}: expected an array of records`); continue; }
  const slugs = arr.map((r) => r?.slug).filter((s) => typeof s === "string");
  counts[`scripts/${f}`] = slugs.length;
  checkKeys(`scripts/${f}`, slugs, P, "piece");
}

// ------------------------------------------------------------- redirects ----
// A redirect whose source is ALSO a live slug would shadow a real page; one whose
// destination doesn't exist sends a shared link to a 404 (hard, since
// dynamicParams is false). Both are silent in the build.
const reds = readJSON("src/lib/piece-redirects.json");
counts["piece-redirects.json"] = reds.length;
const dangling = reds.filter((r) => !P.has(r.destination.replace("/piece/", "")));
const selfRef = reds.filter((r) => r.source === r.destination);
const shadowing = reds.filter((r) => P.has(r.source.replace("/piece/", "")));
const dupSrc = dupes(reds.map((r) => r.source));
if (dangling.length) fail(`piece-redirects: ${dangling.length} destination(s) are not live pieces: ${dangling.slice(0, 6).map((r) => r.destination).join(", ")}`);
if (selfRef.length) fail(`piece-redirects: ${selfRef.length} self-referencing (redirect loop): ${selfRef.slice(0, 5).map((r) => r.source).join(", ")}`);
if (shadowing.length) fail(`piece-redirects: ${shadowing.length} source(s) shadow a live piece page: ${shadowing.slice(0, 6).map((r) => r.source).join(", ")}`);
if (dupSrc.length) fail(`piece-redirects: duplicate source(s): ${dupSrc.slice(0, 6).join(", ")}`);

// ----------------------------------------------------------------- report ----
console.log(
  `✓ data.ts — ${artistSlugs.length} artists, ${collSlugs.length} collections, ${pieceSlugs.length} pieces`,
);
for (const [k, v] of Object.entries(counts)) console.log(`  ${String(v).padStart(5)}  ${k}`);

if (problems.length) {
  console.error(`\n✗ ${problems.length} slug cross-reference problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("✓ every slug-keyed reference resolves");
