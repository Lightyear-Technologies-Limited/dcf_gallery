#!/usr/bin/env node
/**
 * onboard.mjs — bring newly-added pieces through the full asset pipeline.
 *
 * Run this whenever pieces are added to src/lib/data.ts as the collection grows.
 * Every step is IDEMPOTENT (skips work already done), so it's always safe to
 * re-run — it only touches pieces that aren't resolved/pinned yet.
 *
 *   1. resolve-sources.mjs — canonical on-chain source(s) for unresolved pieces
 *   2. pin-assets.mjs      — pin original + sharp detail variants + LQIP
 *
 * Then it reports any GAPS (no resolvable source / pin error) that need a manual
 * asset, and prints the editorial + build follow-ups.
 *
 * Usage:
 *   node scripts/onboard.mjs                  # process everything not yet done
 *   node scripts/onboard.mjs --only a,b,c     # just these slugs
 *   node scripts/onboard.mjs --refresh        # re-resolve + re-pin everything
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const passthrough = process.argv.slice(2).join(" ");

function run(label, cmd) {
  console.log(`\n━━━ ${label} ━━━`);
  execSync(cmd, { stdio: "inherit", cwd: ROOT });
}

run("1/2  Resolving canonical sources", `node scripts/resolve-sources.mjs ${passthrough}`.trim());
run("2/2  Pinning originals + sharp variants + LQIP", `node scripts/pin-assets.mjs ${passthrough}`.trim());

// --- Gap report ------------------------------------------------------------
const sourcesPath = resolve(__dirname, "asset-sources.json");
const manifestPath = resolve(ROOT, "src/lib/provenance.data.json");
const sources = existsSync(sourcesPath) ? JSON.parse(readFileSync(sourcesPath, "utf8")) : {};
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};

const noSource = Object.entries(sources)
  .filter(([, v]) => v.storage === "unknown" || (!v.image && !v.onchainSvg && v.storage !== "physical"))
  .map(([k]) => k);
const pinErrors = Object.entries(manifest).filter(([, v]) => v.error).map(([k]) => k);
const variantErrors = Object.entries(manifest).filter(([, v]) => v.variantError).map(([k]) => k);

console.log("\n━━━ Summary ━━━");
console.log(`  Sources resolved : ${Object.keys(sources).length}`);
console.log(`  Pieces pinned    : ${Object.values(manifest).filter((v) => v.cid).length}`);
if (noSource.length) console.log(`  ⚠ No source (need a manual asset): ${noSource.join(", ")}`);
if (pinErrors.length) console.log(`  ⚠ Pin errors (re-run, or backfill a manual asset): ${pinErrors.join(", ")}`);
if (variantErrors.length) console.log(`  ⚠ Variant errors: ${variantErrors.join(", ")}`);
if (!noSource.length && !pinErrors.length && !variantErrors.length) console.log("  ✓ No gaps — every piece resolved + pinned cleanly.");

console.log(`\nNext:`);
console.log(`  • Resolve any ⚠ gaps above, then: npm run onboard --only <slug>`);
console.log(`  • Run /curate (or: npm run curate) if you changed ordering / names / added a collection.`);
console.log(`  • npm run build   — verify, then deploy.`);
console.log(`  • Spot-check a new piece page: grid uses the gateway, detail uses sharp variants.`);
