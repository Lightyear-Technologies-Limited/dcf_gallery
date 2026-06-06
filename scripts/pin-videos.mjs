#!/usr/bin/env node
/**
 * E.1 — transcode + pin video animations to Filebase IPFS.
 *
 * We serve ONLY a lightweight web transcode (1080p H.264, faststart) — never the
 * 250MB+ masters. The master is downloaded only to transcode it, then discarded;
 * anyone who wants the full original uses the "View original" link to the source.
 * Records animation.{cid,sha256,bytes,gateway} (the transcode) + keeps
 * animation.source (the master URL) for that link. Still = poster.
 *
 * Usage: node scripts/pin-videos.mjs [--refresh] [--limit N] [--only a,b]
 */
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "@ffmpeg-installer/ffmpeg";

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
const sha = (b) => createHash("sha256").update(b).digest("hex");

async function dl(url, attempt = 1) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 300000);
  try {
    const r = await fetch(url, { signal: c.signal, headers: { "User-Agent": "dcf-gallery-pinner" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return Buffer.from(await r.arrayBuffer());
  } catch (e) {
    if (attempt < 3) { await sleep(4000 * attempt); return dl(url, attempt + 1); }
    throw e;
  } finally { clearTimeout(t); }
}

// 1080p H.264 web transcode (faststart for streaming, AAC audio). No upscaling.
function transcode(masterBuf, slug) {
  const inPath = resolve(tmpdir(), `dcf-${slug.replace(/[^a-z0-9]/gi, "")}-in`);
  const outPath = resolve(tmpdir(), `dcf-${slug.replace(/[^a-z0-9]/gi, "")}-out.mp4`);
  writeFileSync(inPath, masterBuf);
  const r = spawnSync(ffmpeg.path, [
    "-y", "-i", inPath,
    "-vf", "scale=-2:'min(1080,ih)'",
    "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "128k",
    outPath,
  ], { stdio: "ignore", maxBuffer: 1 << 30 });
  let out = null;
  try { out = readFileSyncSafe(outPath); } catch { /* */ }
  try { unlinkSync(inPath); } catch { /* */ }
  try { unlinkSync(outPath); } catch { /* */ }
  if (r.status !== 0 || !out) throw new Error(`ffmpeg failed (status ${r.status})`);
  return out;
}
function readFileSyncSafe(p) { return readFileSync(p); }

const man = JSON.parse(readFileSync(OUT, "utf8"));
let targets = Object.entries(man).filter(
  ([, v]) => v.animation && ["video", "gif"].includes(v.animation.type) && (REFRESH || !v.animation.transcoded),
);
if (ONLY) targets = targets.filter(([slug]) => ONLY.has(slug));
console.log(`${targets.length} video/gif animations to transcode + pin`);

let done = 0, ok = 0, fail = 0;
for (const [slug, v] of targets) {
  if (done >= LIMIT) break;
  try {
    const url = toFetchUrl(v.animation.source);
    if (!url) { fail++; console.log(`  ✗ ${slug}: unfetchable`); done++; continue; }
    const master = await dl(url);
    const out = transcode(master, slug);
    const cid = (await (async () => {
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: `animations/${slug}`, Body: out, ContentType: "video/mp4" }));
      const h = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: `animations/${slug}` }));
      return h.Metadata?.cid;
    })());
    v.animation = {
      ...v.animation, cid, sha256: sha(out), bytes: out.length, mime: "video/mp4",
      gateway: `https://${GATEWAY}/ipfs/${cid}`, pinned: true, transcoded: true,
      masterBytes: master.length, // for reference; master is NOT pinned
    };
    ok++;
    console.log(`  ● ${slug}: ${Math.round(master.length / 1048576)}MB → ${Math.round(out.length / 1048576 * 10) / 10}MB`);
  } catch (e) { fail++; console.log(`  ✗ ${slug}: ${e.message}`); }
  done++;
  if (done % 2 === 0) writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
}
writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");

// Slim slug→transcode-URL map for the CLIENT (motion-aware galleries + piece
// page), so the heavy full manifest never reaches the bundle. (E.1)
const videoMap = {};
for (const [slug, v] of Object.entries(man)) {
  if (v.animation && v.animation.type === "video" && v.animation.cid) {
    videoMap[slug] = v.animation.gateway || `https://${GATEWAY}/ipfs/${v.animation.cid}`;
  }
}
writeFileSync(resolve(ROOT, "src/lib/videos.data.json"), JSON.stringify(videoMap) + "\n");
console.log(`\nTranscoded + pinned ${ok} | Failed ${fail} / ${done}`);
console.log(`Wrote videos.data.json (${Object.keys(videoMap).length} reels)`);
