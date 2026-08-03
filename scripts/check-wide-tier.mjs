#!/usr/bin/env node
/**
 * Pre-flight: is a wider detail-variant tier worth it for this collection?
 *
 * Run this BEFORE adding a collection to EXTRA_WIDE_COLLECTIONS in
 * pin-assets.mjs, because opting in commits you to re-pinning every piece in it.
 *
 *   node scripts/check-wide-tier.mjs --collection piano-blossoms
 *   node scripts/check-wide-tier.mjs --collection masks-of-luci --limit 4
 *   node scripts/check-wide-tier.mjs --piece piano-blossoms-3
 *
 * Two things have to be true for the tier to earn its bytes, and the pin script
 * only enforces the first:
 *
 *   1. The master must be substantially WIDER than the tier. pin-assets.mjs
 *      already refuses to emit a tier the master can't fill — that is the check
 *      that (by luck) rejected Fidenza's 2000x2400 masters.
 *   2. The detail must be HIGH-FREQUENCY. Nothing in the pipeline checks this, and
 *      it is the real blind spot: a 6000px master of flat colour fields sails past
 *      the width guard and costs ~1MB/piece for no visible gain.
 *
 * This measures (2). It asks whether capping at 1920 actually discards anything by
 * round-tripping the master through 1920, scaling back up, and comparing against a
 * direct wide encode. Flat art round-trips nearly losslessly; stipple does not.
 *
 * ADVISORY, not a gate. The score informs a human decision — it is deliberately
 * not wired into pin-assets.mjs, because a magic threshold could quietly deny an
 * artist's work the resolution it needs.
 *
 * Thresholds below are calibrated against measured collections, not guessed:
 *
 *   Piano Blossoms   8500-8700w  4.4x  14.8 / 20.5 / 22.3   TIER SHIPPED (artist-visible)
 *   Masks of Luci    3840w       2.0x   3.9 /  4.2 /  4.8   not worth it
 *   Fidenza @8500w   synthetic   4.4x   5.5                 flat-but-wide blind-spot case
 *   Fidenza actual   2000w       —      too narrow; width guard rejects it
 *
 * Note the spread WITHIN Piano Blossoms (14.8-22.3): a single piece is not
 * representative, which is why this samples across the collection and reports a
 * mean. The clusters are well separated (~4-6 vs ~15-22), so the gap is the
 * threshold; do not tighten it on the strength of one new sample.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const NARROW = 1920; // current top base tier
const WIDE = 2560; // the tier under consideration

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
};
const COLLECTION = arg("--collection");
const PIECE = arg("--piece");
const LIMIT = parseInt(arg("--limit") || "3", 10);

if (!COLLECTION && !PIECE) {
  console.error("Usage: node scripts/check-wide-tier.mjs --collection <slug> [--limit N]");
  console.error("       node scripts/check-wide-tier.mjs --piece <slug>");
  process.exit(1);
}

// --- which pieces to sample -------------------------------------------------
const ts = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf-8");
const pieceBlock = (() => {
  const s = ts.indexOf("export const pieces");
  const e = ts.indexOf("\nexport const ", s + 10);
  return ts.slice(s, e < 0 ? ts.length : e);
})();
// Walk line-wise so each slug is paired with the collectionSlug that follows it.
const byCollection = {};
let cur = null;
for (const line of pieceBlock.split(/\r?\n/)) {
  const m = line.match(/^\s{4}slug: '([^']+)'/);
  if (m) { cur = m[1]; continue; }
  const c = line.match(/^\s{4}collectionSlug: '([^']+)'/);
  if (c && cur) { (byCollection[c[1]] ||= []).push(cur); cur = null; }
}

let slugs;
if (PIECE) slugs = [PIECE];
else {
  slugs = byCollection[COLLECTION];
  if (!slugs?.length) {
    console.error(`✗ no pieces found for collection "${COLLECTION}"`);
    console.error(`  known: ${Object.keys(byCollection).sort().join(", ")}`);
    process.exit(1);
  }
  // Spread the sample across the collection rather than taking the first N —
  // ordering is curatorial, so the opening pieces aren't representative.
  const step = Math.max(1, Math.floor(slugs.length / LIMIT));
  slugs = slugs.filter((_, i) => i % step === 0).slice(0, LIMIT);
}

const prov = JSON.parse(readFileSync(resolve(ROOT, "src/lib/provenance.data.json"), "utf-8"));
const P = prov.assets ?? prov;

// --- the metric -------------------------------------------------------------
async function detailLostByCapping(buf) {
  const direct = await sharp(buf, { limitInputPixels: false })
    .resize({ width: WIDE, kernel: "lanczos3", withoutEnlargement: true })
    .toBuffer();
  const targetW = (await sharp(direct).metadata()).width;

  // Two pipelines, deliberately: sharp honours only ONE resize per chain, so a
  // .resize().resize() round trip silently drops the first and ends up comparing
  // a buffer with itself (which reads as a perfect score — very misleading).
  const narrow = await sharp(buf, { limitInputPixels: false })
    .resize({ width: NARROW, kernel: "lanczos3", withoutEnlargement: true })
    .toBuffer();
  const viaNarrow = await sharp(narrow, { limitInputPixels: false })
    .resize({ width: targetW, kernel: "lanczos3" })
    .toBuffer();

  const grey = (b) => sharp(b, { limitInputPixels: false }).greyscale().raw().toBuffer();
  const [a, c] = await Promise.all([grey(direct), grey(viaNarrow)]);
  const n = Math.min(a.length, c.length);
  let sum = 0;
  for (let i = 0; i < n; i++) { const d = a[i] - c[i]; sum += d * d; }
  return Math.sqrt(sum / n);
}

// --- run --------------------------------------------------------------------
console.log(`\nchecking ${PIECE ? `piece ${PIECE}` : `collection ${COLLECTION}`} for a ${WIDE}w tier`);
console.log(`sampling ${slugs.length} piece(s): ${slugs.join(", ")}\n`);

const scores = [];
for (const slug of slugs) {
  const entry = P[slug];
  if (!entry?.cid) { console.log(`${slug.padEnd(24)} — not pinned, skipping`); continue; }
  if ((entry.mime || "").includes("svg")) { console.log(`${slug.padEnd(24)} — vector (SVG), tier is meaningless`); continue; }

  const url = `https://${entry.gateway ? new URL(entry.gateway).host : "lightyear.myfilebase.com"}/ipfs/${entry.cid}`;
  process.stdout.write(`${slug.padEnd(24)} fetching ${((entry.bytes || 0) / 1e6).toFixed(0)}MB… `);
  let buf;
  try {
    const res = await fetch(url.replace(/\/ipfs\/.*/, `/ipfs/${entry.cid}`));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  } catch (e) { console.log(`✗ ${e.message}`); continue; }

  const meta = await sharp(buf, { limitInputPixels: false }).metadata();
  // Prerequisite (1): the width guard in pin-assets.mjs would reject this anyway,
  // so say so plainly rather than reporting a score that cannot be acted on.
  if (meta.width < WIDE) {
    console.log(`master ${meta.width}w — TOO NARROW for a ${WIDE}w tier (pin-assets would skip it)`);
    continue;
  }
  const rmse = await detailLostByCapping(buf);
  scores.push(rmse);
  const ratio = (meta.width / NARROW).toFixed(1);
  console.log(`master ${meta.width}w (${ratio}x downscale to ${NARROW})  detail-lost score ${rmse.toFixed(2)}`);
}

if (!scores.length) {
  console.log(`\nno usable samples — a ${WIDE}w tier is not applicable here.`);
  process.exit(0);
}

const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
console.log(`\nmean detail-lost score: ${mean.toFixed(2)}`);
console.log(
  mean >= 12
    ? `→ WORTH IT. Capping at ${NARROW} is visibly discarding detail; add this collection to\n  EXTRA_WIDE_COLLECTIONS in pin-assets.mjs, then re-pin it (see docs/ADDING-PIECES.md).`
    : mean < 8
      ? `→ NOT WORTH IT. ${NARROW}w already carries essentially everything the master has;\n  the tier would cost ~1MB/piece on DPR-2 views for no visible gain.`
      : `→ BORDERLINE. Compare crops before deciding — encode the master at ${NARROW} and\n  ${WIDE}, crop the same region of each at 1:1, and look at them side by side.`,
);
console.log(`  (measured: Piano Blossoms 14.8-22.3 shipped · Masks of Luci ~4.3 and`);
console.log(`   flat-but-wide ~5.5 rejected — the 8-12 band is the gap between those clusters)\n`);
