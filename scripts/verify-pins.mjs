#!/usr/bin/env node
/**
 * C.1 — verify pinned originals.
 *
 * Re-fetches each piece's pinned CID from the gateway, recomputes sha256, and
 * asserts it equals the hash recorded at pin time — the substance behind the
 * "integrity verified" claim. Stamps `verifiedAt` + `verified` into the manifest.
 * Run periodically / in CI. Exits non-zero on any integrity mismatch.
 *
 * Usage: node scripts/verify-pins.mjs [--only a,b] [--limit N]
 * Heavy: re-downloads every pinned original (some tens of MB).
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "src/lib/provenance.data.json");

const env = {};
if (existsSync(resolve(ROOT, ".env")))
  for (const l of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
const GW = env.FILEBASE_GATEWAY || "lightyear.myfilebase.com";

const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg !== -1 ? new Set(process.argv[onlyArg + 1].split(",")) : null;
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

const man = JSON.parse(readFileSync(OUT, "utf8"));
let slugs = Object.keys(man).filter((s) => man[s].cid && man[s].sha256);
if (ONLY) slugs = slugs.filter((s) => ONLY.has(s));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function dl(url, attempt = 1) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 90000);
  try {
    const r = await fetch(url, { signal: c.signal });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return Buffer.from(await r.arrayBuffer());
  } catch (e) {
    if (attempt < 3) { await sleep(2000 * attempt); return dl(url, attempt + 1); }
    throw e;
  } finally { clearTimeout(t); }
}

let ok = 0, mismatch = 0, fail = 0, done = 0;
const bad = [];
for (const slug of slugs) {
  if (done >= LIMIT) break;
  const e = man[slug];
  try {
    const buf = await dl(`https://${GW}/ipfs/${e.cid}`);
    const h = createHash("sha256").update(buf).digest("hex");
    if (h === e.sha256) { e.verifiedAt = new Date().toISOString(); e.verified = true; ok++; process.stdout.write("."); }
    else { e.verified = false; mismatch++; bad.push(slug); process.stdout.write("M"); }
  } catch { fail++; process.stdout.write("x"); }
  done++;
  if (done % 10 === 0) writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
  await sleep(50);
}
writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
console.log(`\nVerified ${ok} | Mismatch ${mismatch} | Fetch-fail ${fail} / ${done}`);
if (mismatch) { console.log("⛔ Integrity mismatches:", bad.join(", ")); process.exit(1); }
