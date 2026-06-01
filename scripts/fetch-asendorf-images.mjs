#!/usr/bin/env node
// Download static preview images for all Kim Asendorf pieces via Alchemy metadata.
// Saves raw files to public/art/ as {slug}.{ext} and prints the CURATED_DETAIL/THUMB
// entries to paste into src/lib/images.ts.
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/art");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function resolveUrl(url) {
  if (!url) return null;
  if (url.startsWith("ipfs://")) return "https://ipfs.io/ipfs/" + url.slice(7);
  if (url.startsWith("ar://")) return "https://arweave.net/" + url.slice(5);
  return url;
}

function guessExt(url, contentType) {
  if (contentType?.includes("svg")) return "svg";
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("jpeg") || contentType?.includes("jpg")) return "jpg";
  if (contentType?.includes("gif")) return "gif";
  if (contentType?.includes("webp")) return "webp";
  // guess from URL
  const u = url.split("?")[0].toLowerCase();
  for (const e of ["svg", "png", "jpg", "jpeg", "gif", "webp"]) {
    if (u.endsWith(`.${e}`)) return e === "jpeg" ? "jpg" : e;
  }
  return "png";
}

const PIECES = [
  // Lights
  { slug: "lights-3-2006",    contract: "0x6d38705ad8af087d86ef505618b77b066ead2006", token: "3" },
  // PXL DEX
  { slug: "pxl-dex-105-ecfb", contract: "0x81345761670fc8b90665466a94c196e26b92ecfb", token: "105" },
  { slug: "pxl-dex-107-ecfb", contract: "0x81345761670fc8b90665466a94c196e26b92ecfb", token: "107" },
  { slug: "pxl-dex-130-ecfb", contract: "0x81345761670fc8b90665466a94c196e26b92ecfb", token: "130" },
  { slug: "pxl-dex-139-ecfb", contract: "0x81345761670fc8b90665466a94c196e26b92ecfb", token: "139" },
  { slug: "pxl-dex-141-ecfb", contract: "0x81345761670fc8b90665466a94c196e26b92ecfb", token: "141" },
  // PXL POD
  { slug: "pxl-pod-42-88b3",  contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "42" },
  { slug: "pxl-pod-55-88b3",  contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "55" },
  { slug: "pxl-pod-61-88b3",  contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "61" },
  { slug: "pxl-pod-108-88b3", contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "108" },
  { slug: "pxl-pod-122-88b3", contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "122" },
  { slug: "pxl-pod-175-88b3", contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "175" },
  { slug: "pxl-pod-209-88b3", contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "209" },
  { slug: "pxl-pod-215-88b3", contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "215" },
  { slug: "pxl-pod-241-88b3", contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "241" },
  { slug: "pxl-pod-242-88b3", contract: "0xaee022552b539db18297d7481b6d547c622488b3", token: "242" },
  // X0X
  { slug: "x0x-576-3753",     contract: "0x03699f24c1a96d91c261f3f6574e8aeba6bc3753", token: "576" },
];

const results = [];

for (const p of PIECES) {
  const metaUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/demo/getNFTMetadata?contractAddress=${p.contract}&tokenId=${p.token}`;
  let imageUrl = null;
  try {
    const r = await fetch(metaUrl);
    const j = await r.json();
    // pngUrl is Alchemy's Cloudinary PNG render - use it so we get static PNGs
    // instead of animated SVGs for on-chain SVG works like PXL DEX / PXL POD.
    let pngUrl = j?.image?.pngUrl || j?.image?.cachedUrl || j?.raw?.metadata?.image || null;
    // Upscale small on-chain SVG renders via Cloudinary transform (w_1000,c_pad,b_black)
    if (pngUrl?.includes("res.cloudinary.com/alchemyapi/image/upload/")) {
      pngUrl = pngUrl.replace(
        "image/upload/",
        "image/upload/w_1000,h_1000,c_pad,b_black/"
      );
    }
    imageUrl = pngUrl;
    if (!imageUrl) {
      console.warn(`  [WARN] No image field for ${p.slug}`);
      results.push({ ...p, status: "no-image", file: null });
      continue;
    }
  } catch (e) {
    console.warn(`  [ERR] Metadata fetch failed for ${p.slug}: ${e.message}`);
    results.push({ ...p, status: "meta-err", file: null });
    continue;
  }

  const resolvedUrl = resolveUrl(imageUrl);
  console.log(`${p.slug}: ${resolvedUrl}`);

  try {
    const imgRes = await fetch(resolvedUrl);
    const contentType = imgRes.headers.get("content-type") || "";
    const ext = guessExt(resolvedUrl, contentType);
    // Always save as .png - pngUrl renders and the X0X piece are both PNG
    const filename = `${p.slug}.png`;
    const outPath = resolve(OUT_DIR, filename);
    const buf = Buffer.from(await imgRes.arrayBuffer());
    writeFileSync(outPath, buf);
    console.log(`  → saved public/art/${filename} (${buf.length} bytes)`);
    results.push({ ...p, status: "ok", file: `/art/${filename}`, ext });
  } catch (e) {
    console.warn(`  [ERR] Image download failed for ${p.slug}: ${e.message}`);
    results.push({ ...p, status: "dl-err", file: null });
  }

  await sleep(300);
}

// Print images.ts entries
const ok = results.filter((r) => r.file);
if (ok.length > 0) {
  console.log("\n\n// === Paste into CURATED_DETAIL in src/lib/images.ts ===");
  for (const r of ok) {
    console.log(`  "${r.slug}": "${r.file}",`);
  }
  console.log("\n// === Paste into CURATED_THUMB in src/lib/images.ts ===");
  for (const r of ok) {
    console.log(`  "${r.slug}": "${r.file}",`);
  }
}

const failed = results.filter((r) => !r.file);
if (failed.length) {
  console.log(`\n\nFailed (${failed.length}):`, failed.map((r) => r.slug).join(", "));
}
