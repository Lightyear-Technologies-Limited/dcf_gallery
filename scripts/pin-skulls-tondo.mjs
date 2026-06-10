#!/usr/bin/env node
/**
 * One-off: re-pin the Skulls of Luci as hi-res TRANSPARENT tondos.
 *
 * The previous masters were 7.6 KB seadn AVIF thumbnails. This pins the authentic
 * Arweave 2160² originals as the preservation master (honest cid + sha256), and
 * the DISPLAY variants (768/1280/1920 webp + LQIP) as circle-masked transparent
 * tondos — the skulls are circular paintings delivered square with white corners,
 * so a geometric mask (NOT chroma-key; skull-20's interior is near-white) yields
 * clean medallions. Patches src/lib/provenance.data.json + provenance.cids.json.
 *
 * Usage: node scripts/pin-skulls-tondo.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const env = {};
for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const BUCKET = env.FILEBASE_BUCKET;
const GATEWAY = env.FILEBASE_GATEWAY || "lightyear.myfilebase.com";
const s3 = new S3Client({
  region: "us-east-1",
  endpoint: env.FILEBASE_S3_ENDPOINT || "https://s3.filebase.com",
  credentials: { accessKeyId: env.FILEBASE_ACCESS_KEY, secretAccessKey: env.FILEBASE_SECRET_KEY },
  forcePathStyle: true,
});

const DETAIL_WIDTHS = [768, 1280, 1920];
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

async function pin(key, buf, mime) {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: mime }));
  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  return head.Metadata?.cid;
}

// Circle-mask a square tondo buffer -> transparent PNG buffer (full res).
async function tondo(buf) {
  const { data, info } = await sharp(buf, { limitInputPixels: false }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const cx = (W - 1) / 2, cy = (H - 1) / 2, r = Math.min(W, H) / 2 - 2, f = 1.5;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - cx, y - cy);
      let a;
      if (d <= r - f) a = 255;
      else if (d >= r + f) a = 0;
      else a = Math.round((255 * (r + f - d)) / (2 * f));
      data[(y * W + x) * C + 3] = a;
    }
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

const SKULLS = {
  "skulls-of-luci-12-d27c": "https://arweave.net/mnnvYqIxCkPj7Hx5B_YBaOAkVwspaNnb4D3b39RIc1g",
  "skulls-of-luci-20-d27c": "https://arweave.net/lyjTnF_faOuiMUNUSvCeiZ9fhaI4kuOh8elK0icZBtE",
};

const manifestPath = resolve(ROOT, "src/lib/provenance.data.json");
const cidsPath = resolve(ROOT, "src/lib/provenance.cids.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const cids = JSON.parse(readFileSync(cidsPath, "utf8"));

for (const [slug, url] of Object.entries(SKULLS)) {
  console.log("→", slug);
  const r = await fetch(url, { headers: { "User-Agent": "dcf-gallery-pinner" } });
  if (!r.ok) throw new Error(`download ${slug}: HTTP ${r.status}`);
  const orig = Buffer.from(await r.arrayBuffer());
  const cidOrig = await pin(`originals/${slug}`, orig, "image/jpeg"); // honest preservation master

  const transPng = await tondo(orig);
  const variants = [];
  for (const w of DETAIL_WIDTHS) {
    const vbuf = await sharp(transPng, { limitInputPixels: false })
      .resize({ width: w, kernel: "lanczos3", withoutEnlargement: true })
      .sharpen({ sigma: 1, m1: 0.6, m2: 2 })
      .webp({ quality: 95, effort: 5, alphaQuality: 100 })
      .toBuffer();
    const cid = await pin(`variants/${slug}-${w}.webp`, vbuf, "image/webp");
    variants.push({ w, cid, bytes: vbuf.length });
  }
  const lqipBuf = await sharp(transPng, { limitInputPixels: false }).resize({ width: 24 }).blur(1).webp({ quality: 40 }).toBuffer();

  manifest[slug] = {
    storage: "arweave",
    source: url,
    cid: cidOrig,
    sha256: sha256(orig),
    bytes: orig.length,
    mime: "image/jpeg",
    gateway: `https://${GATEWAY}/ipfs/${cidOrig}`,
    pinnedAt: new Date().toISOString(),
    display: "transparent-tondo",
    variants,
    lqip: `data:image/webp;base64,${lqipBuf.toString("base64")}`,
  };
  const v1280 = variants.find((v) => v.w === 1280) || variants[variants.length - 1];
  cids[slug] = v1280.cid;
  console.log(`   original ${cidOrig} (${orig.length}B) | variants ${variants.map((v) => `${v.w}:${v.bytes}B`).join("  ")}`);
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(cidsPath, JSON.stringify(cids) + "\n");
console.log("done — patched provenance.data.json + provenance.cids.json");
