#!/usr/bin/env node
/**
 * Re-fetch every pinned CID, re-compute SHA-256, compare to the stored
 * hash. Writes `verifiedAt` timestamp on match. Fails LOUDLY on mismatch —
 * that's the "somebody swapped the bytes" scenario.
 *
 * Run quarterly at minimum. Usage:
 *   node scripts/verify-pins.mjs             — verify every piece
 *   node scripts/verify-pins.mjs --only s1,s2 — verify these slugs only
 */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const onlyArg = process.argv.slice(2).find((a) => a.startsWith("--only="))?.split("=")[1];
const onlySlugs = onlyArg ? new Set(onlyArg.split(",")) : null;

// Read gateway host from site.ts
const siteTs = await readFile(resolve(ROOT, "src/lib/site.ts"), "utf-8");
const gatewayHost = siteTs.match(/GATEWAY_HOST\s*=\s*["']([^"']+)["']/)?.[1] || "lightyear.myfilebase.com";

const manifest = JSON.parse(await readFile(resolve(ROOT, "src/lib/provenance.data.json"), "utf-8"));
let mismatches = 0;
let verified = 0;

for (const [slug, entry] of Object.entries(manifest)) {
  if (onlySlugs && !onlySlugs.has(slug)) continue;
  if (!entry.cid || !entry.sha256) continue;
  const url = `https://${gatewayHost}/ipfs/${entry.cid}`;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.error(`  ✗ ${slug}: ${res.status}`); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const sha = createHash("sha256").update(buf).digest("hex");
    if (sha !== entry.sha256) {
      console.error(`  ✗✗✗ MISMATCH ${slug}: expected ${entry.sha256}, got ${sha}`);
      mismatches++;
    } else {
      entry.verifiedAt = new Date().toISOString();
      verified++;
    }
  } catch (e) {
    console.error(`  ✗ ${slug}: ${e.message}`);
  }
}

if (mismatches > 0) {
  console.error(`\n✗ ${mismatches} pinned bytes DO NOT match stored hashes. Investigate immediately.`);
  await writeFile(resolve(ROOT, "src/lib/provenance.data.json"), JSON.stringify(manifest, null, 2));
  process.exit(2);
}

await writeFile(resolve(ROOT, "src/lib/provenance.data.json"), JSON.stringify(manifest, null, 2));
console.log(`✓ Verified ${verified} pieces.`);
