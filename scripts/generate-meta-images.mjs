#!/usr/bin/env node
/**
 * Generate the site's social + app images from the brand assets:
 *   - src/app/opengraph-image.png  (1200×630 default OG/Twitter card — wordmark on eggshell)
 *   - src/app/apple-icon.png       (180²  apple-touch-icon — white H-mark on dark)
 *   - public/icon-192.png, icon-512.png (PWA manifest icons)
 * Baked at generation time so there's no runtime font/SVG dependency. Re-run if the
 * brand assets change. Usage: node scripts/generate-meta-images.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const p = (...x) => resolve(ROOT, ...x);
const EGGSHELL = { r: 248, g: 248, b: 247, alpha: 1 };
const DARK = { r: 17, g: 17, b: 17, alpha: 1 };

// --- Default OG card: wordmark + letter-spaced subtitle on eggshell ---
const wordmark = await sharp(p("public/brand/hivemind-black.png")).resize({ width: 520 }).toBuffer();
const wm = await sharp(wordmark).metadata();
const subtitle = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="60"><text x="600" y="42" font-family="Arial,Helvetica,sans-serif" font-size="26" letter-spacing="10" fill="#7a7a7a" text-anchor="middle">DIGITAL CULTURE FUND</text></svg>`,
);
const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: EGGSHELL } })
  .composite([
    { input: wordmark, top: Math.round(315 - wm.height / 2 - 26), left: Math.round(600 - wm.width / 2) },
    { input: subtitle, top: Math.round(315 + wm.height / 2 + 2), left: 0 },
  ])
  .png()
  .toBuffer();
writeFileSync(p("src/app/opengraph-image.png"), og);

// --- App icons: white H-mark centred on dark ---
const hmark = readFileSync(p("public/brand/h-mark.svg"), "utf8").replace(/currentColor/g, "#ffffff");
async function icon(size, frac = 0.56) {
  const m = Math.round(size * frac);
  const mark = await sharp(Buffer.from(hmark)).resize({ width: m, height: m }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: DARK } })
    .composite([{ input: mark, top: Math.round((size - m) / 2), left: Math.round((size - m) / 2) }])
    .png()
    .toBuffer();
}
writeFileSync(p("src/app/apple-icon.png"), await icon(180));
writeFileSync(p("public/icon-192.png"), await icon(192));
writeFileSync(p("public/icon-512.png"), await icon(512));

console.log("Wrote opengraph-image.png, apple-icon.png, icon-192.png, icon-512.png");
