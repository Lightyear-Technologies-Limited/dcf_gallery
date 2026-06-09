#!/usr/bin/env node
/**
 * Pin the on-chain interactive HTML pieces (Kim Asendorf — Lights, PXL DEX/POD,
 * X0X) to Filebase so they can run live in a sandboxed iframe across the galleries
 * (the data: URI is too large to ship in the client bundle, and these are animated
 * generative works whose true form is the running code, not a captured still).
 *
 * Decodes each animation.source (data:text/html;base64) → uploads as text/html →
 * records animation.{htmlCid,htmlGateway,htmlSha256} in the provenance manifest.
 * Then run build-motion.mjs. Idempotent (skips already-pinned unless --refresh).
 * Usage: node scripts/pin-interactive.mjs [--refresh]
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

const s3 = new S3Client({
  region: "us-east-1",
  endpoint: env.FILEBASE_S3_ENDPOINT || "https://s3.filebase.com",
  credentials: { accessKeyId: env.FILEBASE_ACCESS_KEY, secretAccessKey: env.FILEBASE_SECRET_KEY },
  forcePathStyle: true,
});

const man = JSON.parse(readFileSync(OUT, "utf8"));
const targets = Object.entries(man).filter(
  ([, v]) =>
    v.animation && v.animation.type === "interactive-html" &&
    v.animation.source?.startsWith("data:") && (REFRESH || !v.animation.htmlCid),
);

console.log(`Pinning ${targets.length} interactive HTML pieces…`);
let ok = 0, fail = 0;
for (const [slug, v] of targets) {
  try {
    const m = v.animation.source.match(/^data:text\/html;base64,([\s\S]*)$/);
    if (!m) { console.log(`  skip ${slug}: not base64 html`); continue; }
    const buf = Buffer.from(m[1], "base64");
    const key = `interactive/${slug}.html`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: "text/html; charset=utf-8" }));
    const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    const cid = head.Metadata?.cid;
    v.animation.htmlCid = cid;
    v.animation.htmlGateway = `https://${GATEWAY}/ipfs/${cid}`;
    v.animation.htmlSha256 = createHash("sha256").update(buf).digest("hex");
    writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
    ok++;
    console.log(`  ● ${slug}: ${Math.round(buf.length / 1024)}KB → ${cid}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${slug}: ${e.message}`);
  }
}
writeFileSync(OUT, JSON.stringify(man, null, 2) + "\n");
console.log(`\nPinned ${ok} | Failed ${fail}`);
console.log("Run `node scripts/build-motion.mjs` to refresh the client motion map.");
