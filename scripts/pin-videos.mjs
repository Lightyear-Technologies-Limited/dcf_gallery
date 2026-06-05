#!/usr/bin/env node
/**
 * E.1 — pin video/gif animation sources to Filebase IPFS.
 *
 * The stills (posters) are already pinned by pin-assets. This pins the actual
 * video/gif for the 50 video pieces, recording animation.{cid,sha256,bytes,mime,
 * gateway} into the manifest so the piece page can play it (still = poster).
 * Interactive-HTML generators are handled separately (iframe embed), not here.
 *
 * Usage: node scripts/pin-videos.mjs [--refresh] [--limit N] [--only a,b]
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "src/lib/provenance.data.json");

const env = {};
for (const l of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const BUCKET = env.FILEBASE_BUCKET;
const GATEWAY = env.FILEBASE_GATEWAY || "lightyear.myfilebase.com";
const REFRESH = process.argv.includes("--refresh");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg !== -1 ? new Set(process.argv[onlyArg + 1].split(",")) : null;

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: env.FILEBASE_S3_ENDPOINT || "https://s3.filebase.com",
  credentials: { accessKeyId: env.FILEBASE_ACCESS_KEY, secretAccessKey: env.FILEBASE_SECRET_KEY },
  forcePathStyle: true,
});

const IPFS_GW = "https://ipfs.io/ipfs/", AR_GW = "https://arweave.net/";
function toFetchUrl(u) {
  if (!u) return null;
  if (u.startsWith("ipfs://")) return IPFS_GW + u.slice(7).replace(/^ipfs\//, "");
  if (u.startsWith("ar://")) return AR_GW + u.slice(5);
  if (u.startsWith("http")) return u;
  return null;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function dl(url, attempt = 1) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 180000);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { "User-Agent": "dcf-gallery-pinner" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return { buf: Buffer.from(await r.arrayBuffer()), mime: (r.headers.get("content-type") || "video/mp4").split(";")[0] };
  } catch (e) {
    if (attempt < 3) { await sleep(3000 * attempt); return dl(url, attempt + 1); }
    throw e;
  } finally { clearTimeout(t); }
}
async function pin(key, buf, mime) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: mime }));
  const h = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  return h.Metadata?.cid;
}

const man = JSON.parse(readFileSync(OUT, "utf8"));
let targets = Object.entries(man).filter(
  ([, v]) => v.animation && ["video", "gif"].includes(v.animation.type) && (REFRESH || !v.animation.cid),
);
if (ONLY) targets = targets.filter(([slug]) => ONLY.has(slug));
console.log(`${targets.length} video/gif animations to pin`);

let done = 0, ok = 0, fail = 0;
for (const [slug, v] of targets) {
  if (done >= LIMIT) break;
  try {
    const url = toFetchUrl(v.animation.source);
    if (!url) { fail++; console.log(`  ✗ ${slug}: unfetchable`); done++; continue; }
    const { buf, mime } = await dl(url);
    const cid = await pin(`animations/${slug}`, buf, mime);
    Object.assign(v.animation, {
      cid, sha256: createHash("sha256").update(buf).digest("hex"),
      bytes: buf.length, mime, gateway: `https://${GATEWAY}/ipfs/${cid}`, pinned: true,
    });
    ok++; process.stdout.write("●");
  } catch (e) { fail++; console.log(`\n  ✗ ${slug}: ${e.message}`); }
  done++;
  if (done % 2 === 0) writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
  process.stdout.write(` ${ok}✓ ${fail}✗\n`);
  await sleep(200);
}
writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
console.log(`\nPinned ${ok} | Failed ${fail} / ${done}`);
