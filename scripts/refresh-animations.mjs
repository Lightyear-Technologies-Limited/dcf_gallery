#!/usr/bin/env node
/**
 * Hard-refresh Alchemy metadata for Dataland Biome Lumina pieces that are missing a
 * playable animation, and write the resolved animation_url into the provenance
 * manifest so pin-videos can transcode + pin it.
 *
 * Why this exists: resolve-sources.mjs queried Alchemy with refreshCache=false, so
 * pieces whose animation_url hadn't been indexed yet came back image-only (and a
 * couple followed arweave's CDN redirect to a text/html error page). A forced
 * refresh (refreshCache=true) re-reads the on-chain tokenURI and surfaces the real
 * animation. After this, run: node scripts/pin-videos.mjs && node scripts/build-motion.mjs
 *
 * Usage: node scripts/refresh-animations.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "src/lib/provenance.data.json");

const env = {};
for (const l of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const KEY = env.ALCHEMY_API_KEY;
const CONTRACT = "0xb097fba49a679a61b18b7079b99a953ca2691c9d"; // Dataland Biome Lumina

const man = JSON.parse(readFileSync(OUT, "utf8"));
const targets = Object.keys(man).filter(
  (s) => s.startsWith("dataland-biome-lumina") && !(man[s].animation && man[s].animation.cid),
);
console.log(`Hard-refreshing ${targets.length} Dataland pieces missing a playable animation…`);

let added = 0;
for (const slug of targets) {
  const tok = slug.match(/lumina-(\d+)-/)?.[1];
  if (!tok) continue;
  try {
    const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${KEY}/getNFTMetadata?contractAddress=${CONTRACT}&tokenId=${tok}&refreshCache=true`;
    const j = await fetch(url).then((r) => r.json());
    const anim = j?.raw?.metadata?.animation_url;
    if (!anim) { console.log(`  ${slug}: still no animation_url`); continue; }
    man[slug].animation = { source: anim, type: "video", pinned: false };
    added++;
    console.log(`  ${slug}: ${anim}`);
  } catch (e) {
    console.log(`  ${slug}: ${e.message}`);
  }
}
writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
console.log(`\nWrote ${added} animation sources → run pin-videos.mjs then build-motion.mjs`);
