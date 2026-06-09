#!/usr/bin/env node
/**
 * Build the unified client motion map (E.1) from the provenance manifest →
 * src/lib/motion.data.json. Covers the three playable kinds:
 *   - video       : pinned 1080p transcode (animation.type === "video")
 *   - gif         : animated GIF artwork (mime image/gif) served from its plain CID
 *   - interactive : on-chain HTML pinned to the gateway (animation.htmlGateway,
 *                   set by scripts/pin-interactive.mjs)
 * Run after any pin step. Usage: node scripts/build-motion.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const GW = "lightyear.myfilebase.com";
const m = JSON.parse(readFileSync(resolve(ROOT, "src/lib/provenance.data.json"), "utf8"));

const out = {};
for (const [slug, v] of Object.entries(m)) {
  const a = v.animation;
  if (a && a.type === "video" && a.cid) {
    out[slug] = { type: "video", src: a.gateway || `https://${GW}/ipfs/${a.cid}` };
  } else if ((v.mime || "").includes("gif") && v.cid) {
    // Plain CID (no img-transform) serves the original, animated GIF.
    out[slug] = { type: "gif", src: `https://${GW}/ipfs/${v.cid}` };
  } else if (a && a.type === "interactive-html" && a.htmlGateway) {
    out[slug] = { type: "interactive", src: a.htmlGateway };
  }
}

writeFileSync(resolve(ROOT, "src/lib/motion.data.json"), JSON.stringify(out) + "\n");
const counts = {};
for (const v of Object.values(out)) counts[v.type] = (counts[v.type] || 0) + 1;
console.log(`motion.data.json — ${Object.keys(out).length} entries ${JSON.stringify(counts)}`);
