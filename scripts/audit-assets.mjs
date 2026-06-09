#!/usr/bin/env node
/**
 * D.3 — asset audit (CI gate). For every piece in data.ts, confirm it resolves
 * to a servable image: a pinned gateway CID (provenance.cids.json), an existing
 * curated/local file, or a CryptoPunk SVG. Exits non-zero on any missing or
 * broken mapping, so a deploy can't silently ship a 404 across 313 pages.
 *
 * Usage: node scripts/audit-assets.mjs   (npm run audit)
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const cids = JSON.parse(readFileSync(resolve(ROOT, "src/lib/provenance.cids.json"), "utf8"));
const imagesTs = readFileSync(resolve(ROOT, "src/lib/images.ts"), "utf8");
const curated = new Map(
  [...imagesTs.matchAll(/"([a-z0-9-]+)":\s*"(\/art\/[^"]+)"/g)].map((m) => [m[1], m[2]]),
);
const PUNK1 = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
const PUNK2 = "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6";

function curatedPath(slug) {
  if (curated.has(slug)) return curated.get(slug);
  const p = slug.split("-");
  for (let l = p.length - 1; l >= 2; l--) if (curated.has(p.slice(0, l).join("-"))) return curated.get(p.slice(0, l).join("-"));
  return null;
}

const data = readFileSync(resolve(ROOT, "src/lib/data.ts"), "utf8");
const body = data.slice(data.indexOf("export const pieces"), data.indexOf("export const influences"));
const blocks = body.split(/\n\s{2}\{\s*\n/).slice(1);

const issues = [];
let gateway = 0, curatedOk = 0, punk = 0, physical = 0, total = 0;
for (const b of blocks) {
  const slug = b.match(/slug:\s*'([^']+)'/)?.[1];
  if (!slug) continue;
  total++;
  const contract = (b.match(/contractAddress:\s*'([^']*)'/)?.[1] || "").toLowerCase();
  const tokenId = b.match(/tokenId:\s*'([^']*)'/)?.[1];
  const isPhysical = /physical:\s*\{/.test(b);

  if (cids[slug]) { gateway++; continue; }
  const cur = curatedPath(slug);
  if (cur) {
    if (existsSync(resolve(ROOT, "public", cur.replace(/^\//, "")))) curatedOk++;
    else issues.push(`${slug}: curated file missing → ${cur}`);
    continue;
  }
  if (contract === PUNK1 || contract === PUNK2) {
    if (existsSync(resolve(ROOT, `public/art/all/${PUNK1}-${tokenId}.svg`))) punk++;
    else issues.push(`${slug}: punk svg missing → /art/all/${PUNK1}-${tokenId}.svg`);
    continue;
  }
  if (isPhysical) { physical++; continue; }
  issues.push(`${slug}: no servable image (not pinned, not curated, not a punk)`);
}

console.log(`pieces ${total} → gateway ${gateway} | curated ${curatedOk} | punk ${punk} | physical ${physical}`);
if (issues.length) {
  console.log(`\n⛔ ${issues.length} issue(s):`);
  for (const i of issues) console.log("  - " + i);
  process.exit(1);
}
console.log("✓ every piece resolves to a servable image.");
