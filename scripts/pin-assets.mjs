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
 * Usage: node scripts/pin-assets.mjs [--refresh] [--upgrade] [--only slug,slug] [--limit N] [--dry]
 *
 *   --upgrade  re-derive variants ONLY where the encoder stamp is stale (see
 *              VARIANT_ENCODER). Idempotent and resumable — the intended way to
 *              roll an encode change across the catalogue. Re-run until it
 *              reports "Pinned 0"; --refresh would restart the whole 4.2GB sweep.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// Sharp variant widths for the DETAIL view (Path B hybrid). Covers phone →
// desktop-retina. Measured: the hero caps at 978 CSS px, so at DPR 2 it asks for
// 1956px and 1920 is a hair short (1.96x rather than 2x) — imperceptible on most
// work, which is why this stayed at 1920.
const DETAIL_WIDTHS = [768, 1280, 1920];

// Collections that additionally get a 2560w tier.
//
// For work whose subject IS micro-texture, the 4.4x downscale from an 8500px
// master merges adjacent marks before the encoder sees them, and no amount of
// quality tuning recovers them. a.c.k.'s Piano Blossoms are pointillist — built
// from thousands of individually coloured dots — and at 1920w the stipple reads
// as ropey directional smears rather than discrete touches of paint. The artist
// noticed and was right. 2560w restores it (verified against the master).
//
// Deliberately opt-in per collection rather than global: this tier costs ~1.2MB
// over 1920w on dense work, and srcset means only DPR>=2 viewports ever fetch it.
// Grids and thumbs are untouched, so it never affects the homepage.
//
// ONLY add a collection here when its masters are meaningfully WIDER than 2560
// AND its detail is high-frequency. Measured counter-example: Fidenza masters are
// 2000x2400, so 1920w is already a 1.04x downscale (essentially native) and there
// is no resampling loss to recover — the tier would cap at 2000w via
// withoutEnlargement and, being encoded at the wide tier's q90, would land as a
// 2000w candidate slightly WORSE than the existing 1920w q95 one. Flat-colour
// generative work (Fidenza, Ringers, QQL) gains nothing here.
const EXTRA_WIDE_COLLECTIONS = new Set(["piano-blossoms"]);
const EXTRA_WIDE_WIDTH = 2560;

// Stamp recording which variant-encoder settings produced a piece's variants.
// Bump this whenever the encode changes (widths, quality, subsampling) so
// `--upgrade` can find the stragglers.
//
// This exists because a full re-encode means re-downloading ~4.2GB of masters, and
// `--refresh` is not resumable: it ignores the already-pinned check, so an
// interrupted overnight run would start from zero. `--upgrade` re-pins only pieces
// whose stamp is missing or stale, making the sweep idempotent and safe to run
// repeatedly until it reports 0 remaining.
const VARIANT_ENCODER = "webp-q95-sharpyuv-v2";

/** Widths for a given piece — the base tiers plus 2560 for opted-in collections. */
function detailWidthsFor(slug) {
  for (const c of EXTRA_WIDE_COLLECTIONS) {
    if (slug.startsWith(`${c}-`)) return [...DETAIL_WIDTHS, EXTRA_WIDE_WIDTH];
  }
  return DETAIL_WIDTHS;
}

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
const UPGRADE = process.argv.includes("--upgrade");
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
  // --upgrade: re-derive variants only where the encoder stamp is missing or stale.
  // Idempotent, so an interrupted sweep can simply be re-run until it reports 0.
  if (UPGRADE) {
    const m = manifest[slug];
    const stale = m?.cid && m.variants?.length && m.variantEncoder !== VARIANT_ENCODER;
    if (!stale) { skipped++; continue; }
  } else if (!REFRESH && manifest[slug]?.cid) { skipped++; continue; }
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
        const masterW = (await sharp(buf, { limitInputPixels: false }).metadata()).width || 0;
        for (const w of detailWidthsFor(slug)) {
          // Don't emit a tier the master can't actually fill. withoutEnlargement
          // would silently produce a narrower image, and because the wide tier
          // encodes at a lower quality it could land as a candidate that is barely
          // wider than the 1920 one but visibly worse — so the browser would pick
          // it and get a softer image. Skipping keeps the srcset honest.
          if (w > masterW && w > DETAIL_WIDTHS[DETAIL_WIDTHS.length - 1]) {
            console.warn(`  ${slug}: skipping ${w}w tier (master is only ${masterW}w)`);
            continue;
          }
          // smartSubsample (libwebp's -sharp_yuv) is the important flag here.
          // Without it sharp encodes WebP at 4:2:0, halving colour resolution in
          // both axes — which on work made of individually coloured marks smears
          // them into muddy streaks. It costs ~6% more bytes and is the single
          // biggest quality win available on this pipeline.
          //
          // The wider tier drops to q90: at 2560w each mark covers more pixels,
          // so per-pixel quality matters less, and q90/2560 both looks better than
          // q95/1920 and costs less than q95/2560 would.
          const vbuf = await sharp(buf, { limitInputPixels: false })
            .resize({ width: w, kernel: "lanczos3", withoutEnlargement: true })
            .sharpen({ sigma: 1, m1: 0.6, m2: 2 })
            .webp({ quality: w >= EXTRA_WIDE_WIDTH ? 90 : 95, effort: w >= EXTRA_WIDE_WIDTH ? 6 : 5, smartSubsample: true })
            .toBuffer();
          const v = await pin(`variants/${slug}-${w}.webp`, vbuf, "image/webp");
          // Record the ACTUAL encoded width, not the requested one. With
          // withoutEnlargement a master narrower than the tier yields a smaller
          // image, and recording the request would put a wrong descriptor in the
          // srcset — the browser would pick that candidate believing it is wider
          // than it is, and get a soft image for its trouble. Dedupe on the way
          // out so a small master doesn't emit two candidates at the same width.
          const actualW = (await sharp(vbuf).metadata()).width || w;
          if (!variants.some((x) => x.w === actualW)) {
            variants.push({ w: actualW, cid: v.cid, bytes: vbuf.length });
          }
        }
        entry.variants = variants;
        entry.variantEncoder = VARIANT_ENCODER;
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
  // Slim slug→CID map for the CLIENT (galleries) — raster pinned only — so the
  // heavy full manifest never reaches the client bundle. (plan A.2)
  // Grids/OG downscale from a sharp VARIANT, never the preservation master (which
  // can be 50–160MB and exceeds the gateway's on-the-fly transform limit). SVG /
  // no-variant pieces fall back to the original cid.
  const cids = {};
  for (const [slug, v] of Object.entries(manifest)) {
    if (!v.cid || v.cid === "(dry-run)" || (v.mime || "").includes("svg")) continue;
    const v1280 = (v.variants || []).find((x) => x.w === 1280) || (v.variants || []).slice(-1)[0];
    cids[slug] = v1280 ? v1280.cid : v.cid;
  }
  writeFileSync(resolve(ROOT, "src/lib/provenance.cids.json"), JSON.stringify(cids) + "\n");
  console.log(`Wrote provenance.cids.json (${Object.keys(cids).length} raster cids)`);
}
console.log(`\nPinned ${pinned} | Skipped ${skipped} | Failed ${failed}${DRY ? " (dry-run)" : ""}`);
console.log(`Manifest: ${OUT} (${Object.keys(manifest).length} entries)`);
