#!/usr/bin/env node
/**
 * Pin canonical artwork bytes to Filebase IPFS. Records CID + SHA-256
 * + Sharp variants + LQIP in provenance.data.json (server-only manifest)
 * and provenance.cids.json (slim client-safe slug → CID map).
 *
 * Requires:
 *   FILEBASE_KEY, FILEBASE_SECRET, FILEBASE_BUCKET
 *   npm i sharp @aws-sdk/client-s3 @aws-sdk/lib-storage
 *
 * Usage: node scripts/pin-assets.mjs [--only slug1,slug2]
 */
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ARGS = process.argv.slice(2);
const onlyArg = ARGS.find((a) => a.startsWith("--only="))?.split("=")[1];
const onlySlugs = onlyArg ? new Set(onlyArg.split(",")) : null;

const KEY = process.env.FILEBASE_KEY;
const SECRET = process.env.FILEBASE_SECRET;
const BUCKET = process.env.FILEBASE_BUCKET;
if (!KEY || !SECRET || !BUCKET) {
  console.error("✗ FILEBASE_KEY, FILEBASE_SECRET, FILEBASE_BUCKET required");
  process.exit(1);
}

// Lazy-load heavy deps
const { S3Client, PutObjectCommand, HeadObjectCommand } = await import("@aws-sdk/client-s3");
const sharp = (await import("sharp")).default;

const s3 = new S3Client({
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  credentials: { accessKeyId: KEY, secretAccessKey: SECRET },
});

async function pinBuffer(buf, key, mime) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buf, ContentType: mime,
    Metadata: {},
  });
  await s3.send(cmd);
  // Read back the object to get the CID header Filebase attaches.
  const head = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
  const meta = await s3.send(head);
  const cid = meta.Metadata?.cid || meta.Metadata?.["ipfs-hash"];
  if (!cid) throw new Error(`Filebase did not return CID for ${key}`);
  return cid;
}

const dataTs = await readFile(resolve(ROOT, "src/lib/data.ts"), "utf-8");
// Parse each piece {slug, originalUri, medium} — same rough regex as fetch-mint-dates.
const slugs = [...dataTs.matchAll(/slug: '([^']+)',[^}]*?originalUri: '([^']+)'/g)]
  .map((m) => ({ slug: m[1], src: m[2] }));

const existing = await readFile(resolve(ROOT, "src/lib/provenance.data.json"), "utf-8").then(JSON.parse).catch(() => ({}));
const cids = await readFile(resolve(ROOT, "src/lib/provenance.cids.json"), "utf-8").then(JSON.parse).catch(() => ({}));

for (const { slug, src } of slugs) {
  if (onlySlugs && !onlySlugs.has(slug)) continue;
  if (existing[slug]?.cid) { console.log(`  skip ${slug} (already pinned)`); continue; }

  console.log(`  ${slug}`);
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const sha = createHash("sha256").update(buf).digest("hex");
    const mime = res.headers.get("content-type") || "application/octet-stream";
    const cid = await pinBuffer(buf, `${slug}-original`, mime);

    const variants = [];
    if (mime.startsWith("image/") && !mime.includes("svg")) {
      for (const w of [768, 1280, 1920]) {
        const vBuf = await sharp(buf).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
        const vSha = createHash("sha256").update(vBuf).digest("hex");
        const vCid = await pinBuffer(vBuf, `${slug}-w${w}.webp`, "image/webp");
        variants.push({ w, cid: vCid, sha256: vSha, bytes: vBuf.length });
      }
    }

    let lqip;
    if (mime.startsWith("image/") && !mime.includes("svg")) {
      const lqBuf = await sharp(buf).resize({ width: 24, withoutEnlargement: false }).webp({ quality: 40 }).toBuffer();
      lqip = lqBuf.toString("base64");
    }

    existing[slug] = {
      cid, sha256: sha, bytes: buf.length, mime,
      pinnedAt: new Date().toISOString(),
      variants: variants.length ? variants : undefined,
      lqip,
      storage: src.startsWith("ar://") || src.includes("arweave") ? "arweave" : src.includes("ipfs") ? "ipfs" : "centralized",
      source: src,
    };
    cids[slug] = cid;
  } catch (e) {
    console.error(`  ✗ ${slug}: ${e.message}`);
  }
}

await writeFile(resolve(ROOT, "src/lib/provenance.data.json"), JSON.stringify(existing, null, 2));
await writeFile(resolve(ROOT, "src/lib/provenance.cids.json"), JSON.stringify(cids, null, 2));
console.log(`✓ provenance.data.json + provenance.cids.json updated`);
