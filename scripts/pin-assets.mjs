#!/usr/bin/env node
/**
 * B.2 — Pin canonical originals (+ animation sources) to Filebase IPFS.
 *
 * Reads scripts/asset-sources.json (from B.1), downloads each source's bytes,
 * pins them to the Filebase IPFS bucket, and records a provenance manifest with
 * the content-addressed CID + sha256 (the substance behind "preserved & pinned").
 *
 * Output: src/lib/provenance.data.json (shipped — consumed by B.3 / C.1 / C.2).
 * Idempotent: skips pieces already pinned (cid present) unless --refresh.
 * Usage: node scripts/pin-assets.mjs [--refresh] [--only slug,slug] [--limit N] [--dry]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// Sharp variant widths for the DETAIL view (Path B hybrid). Covers phone →
// desktop-retina; the detail column caps ~780px so 1920 gives 2x headroom.
const DETAIL_WIDTHS = [768, 1280, 1920];

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCES = resolve(__dirname, "asset-sources.json");
const OUT = resolve(ROOT, "src/lib/provenance.data.json");

// --- env -------------------------------------------------------------------
const env = {};
for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const BUCKET = env.FILEBASE_BUCKET;
const GATEWAY = env.FILEBASE_GATEWAY || "lightyear.myfilebase.com";

const REFRESH = process.argv.includes("--refresh");
const DRY = process.argv.includes("--dry");
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

// Public gateways used only to DOWNLOAD source bytes for re-pinning.
const IPFS_GW = "https://ipfs.io/ipfs/";
const AR_GW = "https://arweave.net/";

function toFetchUrl(uri) {
  if (!uri || typeof uri !== "string") return null;
  if (uri.startsWith("ipfs://")) return IPFS_GW + uri.slice(7).replace(/^ipfs\//, "");
  if (uri.startsWith("ar://")) return AR_GW + uri.slice(5);
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]+|bafk[a-z2-7]+)/.test(uri)) return IPFS_GW + uri;
  if (uri.startsWith("http")) return uri;
  return null;
}

function dataUriToBuffer(uri) {
  const m = uri.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!m) return null;
  const mime = m[1] || "application/octet-stream";
  const buf = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]), "utf8");
  return { buf, mime };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(url, attempt = 1) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 90000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { "User-Agent": "dcf-gallery-pinner" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    return { buf, mime: (r.headers.get("content-type") || "application/octet-stream").split(";")[0] };
  } catch (e) {
    if (attempt < 3) { await sleep(2000 * attempt); return download(url, attempt + 1); }
    throw e;
  } finally { clearTimeout(t); }
}

async function pin(key, buf, mime) {
  if (DRY) return { cid: "(dry-run)", bytes: buf.length };
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: mime }));
  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  return { cid: head.Metadata?.cid, bytes: buf.length };
}

function sha256(buf) { return createHash("sha256").update(buf).digest("hex"); }

// Acquire bytes for a source URI (download, data:, or local punk SVG).
async function acquire(uri, localPath) {
  if (localPath) {
    // localPath is a public URL path (e.g. /art/all/…svg); the file is under public/.
    const buf = readFileSync(resolve(ROOT, "public", localPath.replace(/^\//, "")));
    return { buf, mime: "image/svg+xml" };
  }
  if (uri?.startsWith("data:")) return dataUriToBuffer(uri);
  const url = toFetchUrl(uri);
  if (!url) throw new Error(`unfetchable uri: ${String(uri).slice(0, 60)}`);
  return download(url);
}

// --- main ------------------------------------------------------------------
if (!existsSync(SOURCES)) { console.error("Run resolve-sources.mjs first."); process.exit(1); }
const sources = JSON.parse(readFileSync(SOURCES, "utf8"));
const manifest = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

let slugs = Object.keys(sources);
if (ONLY) slugs = slugs.filter((s) => ONLY.has(s));

let pinned = 0, skipped = 0, failed = 0, processed = 0;
for (const slug of slugs) {
  if (processed >= LIMIT) break;
  if (!REFRESH && manifest[slug]?.cid) { skipped++; continue; }
  const src = sources[slug];
  if (src.storage === "physical") { manifest[slug] = { storage: "physical" }; continue; }

  try {
    // primary image (or punk on-chain svg)
    const imageUri = src.image || src.originalUrl || null;
    const { buf, mime } = await acquire(imageUri, src.onchainSvg);
    const { cid, bytes } = await pin(`originals/${slug}`, buf, mime);
    const entry = {
      storage: src.storage,
      source: imageUri || src.onchainSvg || null,
      cid,
      sha256: sha256(buf),
      bytes,
      mime,
      gateway: `https://${GATEWAY}/ipfs/${cid}`,
      pinnedAt: new Date().toISOString(),
    };

    // Sharp detail variants (Path B hybrid). The gateway's on-the-fly downscale
    // is soft on detailed art, so the DETAIL view is served from our own
    // Lanczos3 + unsharp variants. Grids keep the gateway (auto-responsive).
    // SVG (punks) is vector — skipped. (plan B.3 / sharpness)
    const isSvg = (mime || "").includes("svg");
    if (!isSvg && !DRY) {
      try {
        const variants = [];
        for (const w of DETAIL_WIDTHS) {
          const vbuf = await sharp(buf, { limitInputPixels: false })
            .resize({ width: w, kernel: "lanczos3", withoutEnlargement: true })
            .sharpen({ sigma: 1, m1: 0.6, m2: 2 })
            .webp({ quality: 95, effort: 5 })
            .toBuffer();
          const v = await pin(`variants/${slug}-${w}.webp`, vbuf, "image/webp");
          variants.push({ w, cid: v.cid, bytes: vbuf.length });
        }
        entry.variants = variants;
        // Tiny blurred LQIP, inlined as a data URI for blur-up (progressive load).
        const lqipBuf = await sharp(buf, { limitInputPixels: false }).resize({ width: 24 }).blur(1).webp({ quality: 40 }).toBuffer();
        entry.lqip = `data:image/webp;base64,${lqipBuf.toString("base64")}`;
      } catch (e) { entry.variantError = e.message; }
    }

    // Record (but do NOT pin) any animation source. Video vs interactive-HTML
    // handling — and the actual pinning of playable video — lives in E.1. Here
    // we just classify so E.1 knows what each one is.
    if (src.animationUrl) {
      const u = src.animationUrl;
      let type = "unknown";
      if (/^data:text\/html/i.test(u) || /^data:application\/(xhtml|javascript)/i.test(u)) type = "interactive-html";
      else if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u) || /^data:video\//i.test(u)) type = "video";
      else if (/\.gif(\?|$)/i.test(u) || /^data:image\/gif/i.test(u)) type = "gif";
      else if (/generator\.artblocks|\/generator\/|livecode/i.test(u)) type = "interactive-html";
      entry.animation = { source: u, type, pinned: false };
    }

    manifest[slug] = entry;
    pinned++; process.stdout.write("●");
  } catch (e) {
    manifest[slug] = { storage: src.storage, error: e.message, source: src.image || null };
    failed++; process.stdout.write("x");
    console.log(`\n  ✗ ${slug}: ${e.message}`);
  }
  processed++;
  if (processed % 5 === 0 && !DRY) writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
  if (processed % 20 === 0) console.log(`  progress: ${pinned}✓ ${failed}✗ ${skipped}skip (${processed}/${slugs.length})`);
  await sleep(150);
}

if (!DRY) {
  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n");
  // Slim slug→CID map for the CLIENT (galleries) — keeps the heavy full
  // manifest out of the client bundle. (plan A.2)
  // Grids/OG downscale from a sharp VARIANT, never the preservation master
  // (which can be 50–160MB and exceeds the gateway's on-the-fly transform
  // limit). SVG / no-variant pieces fall back to the original cid — the
  // gateway can serve vector raw even though it can't transform it. This is
  // what lets CryptoPunks render from IPFS instead of from a committed local
  // SVG, saving ~26KB per Punk in the repo.
  const cids = {};
  for (const [slug, v] of Object.entries(manifest)) {
    if (!v.cid || v.cid === "(dry-run)") continue;
    const v1280 = (v.variants || []).find((x) => x.w === 1280) || (v.variants || []).slice(-1)[0];
    cids[slug] = v1280 ? v1280.cid : v.cid;
  }
  writeFileSync(resolve(ROOT, "src/lib/provenance.cids.json"), JSON.stringify(cids) + "\n");
  console.log(`Wrote provenance.cids.json (${Object.keys(cids).length} cids)`);
}
console.log(`\nPinned ${pinned} | Skipped ${skipped} | Failed ${failed}${DRY ? " (dry-run)" : ""}`);
console.log(`Manifest: ${OUT} (${Object.keys(manifest).length} entries)`);
