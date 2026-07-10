/**
 * Artwork image lookup - serves optimized WebP.
 *
 * Two sizes:
 * - /art/optimized/{key}.webp  (max 1200px, for detail pages)
 * - /art/thumbs/{key}.webp     (max 400px, for grid views)
 *
 * CryptoPunks stay as PNG (pixel art).
 */

// Hand-curated overrides for hero/featured pieces
const CURATED_DETAIL: Record<string, string> = {
  // XCOPY "Cope Salada" #125 lives on Shape (L2) as an animated on-chain SVG,
  // decoded from the contract's data:image/svg+xml tokenURI. Served raw locally
  // (the gateway can't transform SVG); the external marketplace URL is dead.
  "cope-salada-125": "/art/cope-salada-125.svg",
  "fidenza-145": "/art/optimized/curated-fidenza-145.webp",
  "ringers-13000014": "/art/optimized/curated-ringers-13000014.webp",
  "woy-103": "/art/optimized/curated-woy-103.webp",
  "synthetic-dreams-51": "/art/optimized/curated-synthetic-dreams-51.webp",
  "lightyears-1": "/art/optimized/curated-lightyears-001.webp",
  "masksofluci-442": "/art/optimized/curated-masks-442.webp",
  "x-ray-machine-1": "/art/optimized/operator-x-ray-machine.webp",
  // Kim Asendorf — lossless WebP detail (pixel-perfect for hard-edged pixel art,
  // and smaller than the source PNG). x0x keeps its existing PNG; lights-3
  // (Raster und Spektrum) uses the artist-gallery 2400×1561 render as its still.
  "lights-3": "/art/lights-3-detail.webp",
  "pxl-dex-105": "/art/optimized/curated-pxl-dex-105.webp",
  "pxl-dex-107": "/art/optimized/curated-pxl-dex-107.webp",
  "pxl-dex-130": "/art/optimized/curated-pxl-dex-130.webp",
  "pxl-dex-139": "/art/optimized/curated-pxl-dex-139.webp",
  "pxl-dex-141": "/art/optimized/curated-pxl-dex-141.webp",
  "pxl-pod-42": "/art/optimized/curated-pxl-pod-42.webp",
  "pxl-pod-55": "/art/optimized/curated-pxl-pod-55.webp",
  "pxl-pod-61": "/art/optimized/curated-pxl-pod-61.webp",
  "pxl-pod-108": "/art/optimized/curated-pxl-pod-108.webp",
  "pxl-pod-122": "/art/optimized/curated-pxl-pod-122.webp",
  "pxl-pod-175": "/art/optimized/curated-pxl-pod-175.webp",
  "pxl-pod-209": "/art/optimized/curated-pxl-pod-209.webp",
  "pxl-pod-215": "/art/optimized/curated-pxl-pod-215.webp",
  "pxl-pod-241": "/art/optimized/curated-pxl-pod-241.webp",
  "pxl-pod-242": "/art/optimized/curated-pxl-pod-242.webp",
  "x0x-576": "/art/x0x-576.png",
  // Operator - Repeat as Necessary (Art Blocks Engine via Verse, contract
  // ...2ee0). Stored as raw SVG decoded from the contract's tokenURI
  // data: URL; same file serves detail + thumb (SVG scales).
  "repeat-as-necessary-1": "/art/repeat-as-necessary-1.svg",
  "repeat-as-necessary-12": "/art/repeat-as-necessary-12.svg",
  "repeat-as-necessary-21": "/art/repeat-as-necessary-21.svg",
  "repeat-as-necessary-40": "/art/repeat-as-necessary-40.svg",
};

const CURATED_THUMB: Record<string, string> = {
  "cope-salada-125": "/art/cope-salada-125.svg",
  "fidenza-145": "/art/thumbs/curated-fidenza-145.webp",
  "ringers-13000014": "/art/thumbs/curated-ringers-13000014.webp",
  "woy-103": "/art/thumbs/curated-woy-103.webp",
  "synthetic-dreams-51": "/art/thumbs/curated-synthetic-dreams-51.webp",
  "lightyears-1": "/art/thumbs/curated-lightyears-001.webp",
  "masksofluci-442": "/art/thumbs/curated-masks-442.webp",
  "x-ray-machine-1": "/art/thumbs/operator-x-ray-machine.webp",
  // Kim Asendorf — WebP thumbs (≤400px, lossy q80). x0x keeps its PNG;
  // lights-3 (Raster und Spektrum) uses the artist-gallery render.
  "lights-3": "/art/lights-3-thumb.webp",
  "pxl-dex-105": "/art/thumbs/curated-pxl-dex-105.webp",
  "pxl-dex-107": "/art/thumbs/curated-pxl-dex-107.webp",
  "pxl-dex-130": "/art/thumbs/curated-pxl-dex-130.webp",
  "pxl-dex-139": "/art/thumbs/curated-pxl-dex-139.webp",
  "pxl-dex-141": "/art/thumbs/curated-pxl-dex-141.webp",
  "pxl-pod-42": "/art/thumbs/curated-pxl-pod-42.webp",
  "pxl-pod-55": "/art/thumbs/curated-pxl-pod-55.webp",
  "pxl-pod-61": "/art/thumbs/curated-pxl-pod-61.webp",
  "pxl-pod-108": "/art/thumbs/curated-pxl-pod-108.webp",
  "pxl-pod-122": "/art/thumbs/curated-pxl-pod-122.webp",
  "pxl-pod-175": "/art/thumbs/curated-pxl-pod-175.webp",
  "pxl-pod-209": "/art/thumbs/curated-pxl-pod-209.webp",
  "pxl-pod-215": "/art/thumbs/curated-pxl-pod-215.webp",
  "pxl-pod-241": "/art/thumbs/curated-pxl-pod-241.webp",
  "pxl-pod-242": "/art/thumbs/curated-pxl-pod-242.webp",
  "x0x-576": "/art/x0x-576.png",
  // Operator - Repeat as Necessary (same SVGs as detail; vector scales).
  "repeat-as-necessary-1": "/art/repeat-as-necessary-1.svg",
  "repeat-as-necessary-12": "/art/repeat-as-necessary-12.svg",
  "repeat-as-necessary-21": "/art/repeat-as-necessary-21.svg",
  "repeat-as-necessary-40": "/art/repeat-as-necessary-40.svg",
};

/**
 * Resolve the full on-chain token ID for a piece.
 *
 * Most contracts store the tokenId as-is. The Art Blocks contract uses a
 * prefixed ID (project * 1_000_000 + serial). The spreadsheet stores some
 * projects as raw serials (Fidenza: "145") and others as already-prefixed
 * full IDs (Ringers: "13000374"). This helper normalizes both to the full
 * on-chain tokenId so URLs built from it - Raster, OpenSea, image paths -
 * resolve correctly.
 */
export function resolveTokenId(
  slug: string,
  contractAddress: string | undefined,
  tokenId: string | undefined
): string | undefined {
  if (!contractAddress || !tokenId) return tokenId;
  const contract = contractAddress.toLowerCase();
  const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
  if (contract === ART_BLOCKS) {
    const n = parseInt(tokenId, 10);
    if (n < 1000000) {
      let project: number | null = null;
      if (slug.startsWith("fidenza-")) project = 78;
      else if (slug.startsWith("ringers-")) project = 13;
      if (project !== null) return String(project * 1000000 + n);
    }
  }
  return tokenId;
}

// Natural aspect ratios extracted from the optimized webp/png/svg files at
// build time. See scripts/extract-aspects.mjs. Used by piece pages so the
// Image box renders at the real intrinsic aspect rather than a 4:3 default.
import aspectsRaw from "./aspects.data.json";
const ASPECTS = aspectsRaw as Record<string, { w: number; h: number }>;

import cidsRaw from "./provenance.cids.json";
// Slim slug→CID map for RASTER pinned originals (SVG/unpinned excluded). Kept
// separate from the full provenance manifest so the heavy manifest (~1.7MB of
// CIDs + variants + LQIP) never reaches the CLIENT bundle — galleries only need
// the grid gateway URL. Full manifest + detail variants live in provenance.ts
// (server-only). (plan A.2 / bundle hygiene)
const CIDS = cidsRaw as Record<string, string>;

/** Filebase dedicated IPFS gateway (public, not a secret). Serves pinned CIDs
 *  and does on-the-fly resize/webp via the custom image loader (image-loader.js). */
export const FILEBASE_GATEWAY = "lightyear.myfilebase.com";

/** Gateway base URL for a pinned RASTER original, or null. SVG/unpinned pieces
 *  aren't in the CID map, so they fall through to the local path below. */
function gatewayUrl(slug: string): string | null {
  const cid = CIDS[slug];
  return cid ? `https://${FILEBASE_GATEWAY}/ipfs/${cid}` : null;
}

/**
 * Get natural (width, height) of the optimized artwork file, if known.
 * Returns null for Punks, curated samples, and any piece without a stored
 * dimension entry - PieceLayout falls back to its 4:3 default in that case.
 */
export function getArtworkAspect(
  slug: string,
  contractAddress?: string,
  tokenId?: string
): { w: number; h: number } | null {
  if (contractAddress && tokenId) {
    const contract = contractAddress.toLowerCase();
    const fullToken = resolveTokenId(slug, contractAddress, tokenId);
    const key = `${contract}-${fullToken}`.toLowerCase();
    if (ASPECTS[key]) return ASPECTS[key];
  }
  return null;
}

/**
 * Get artwork image path.
 * @param size - "detail" (1200px) or "thumb" (400px)
 */
export function getArtworkImage(
  slug: string,
  contractAddress?: string,
  tokenId?: string,
  size: "detail" | "thumb" = "thumb"
): string | null {
  // Try curated
  const curatedMap = size === "detail" ? CURATED_DETAIL : CURATED_THUMB;
  if (curatedMap[slug]) return curatedMap[slug];

  // Try slug prefix
  const parts = slug.split("-");
  for (let len = parts.length - 1; len >= 2; len--) {
    const prefix = parts.slice(0, len).join("-");
    if (curatedMap[prefix]) return curatedMap[prefix];
  }

  // Filebase gateway (pinned raster originals). The custom image loader
  // (src/lib/image-loader.js) appends img-width + img-format=webp per requested
  // width. SVG returns null here and falls through to the local path. (plan B.3)
  const gw = gatewayUrl(slug);
  if (gw) return gw;

  // Auto-pulled: /art/{optimized|thumbs}/{contract}-{tokenId}.webp
  if (contractAddress && tokenId) {
    const contract = contractAddress.toLowerCase();
    const PUNK_CANONICAL = "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
    const PUNK_V1_WRAPPED = "0xb7f7f6c52f2e2fdb1963eab30438024864c313f6";
    const isPunk = contract === PUNK_CANONICAL || contract === PUNK_V1_WRAPPED;
    const dir = size === "detail" ? "optimized" : "thumbs";

    // V1 wrapped punks share the same pixel art as the canonical contract
    if (isPunk) return `/art/all/${PUNK_CANONICAL}-${tokenId}.svg`;

    const fullToken = resolveTokenId(slug, contractAddress, tokenId);
    return `/art/${dir}/${contract}-${fullToken}.webp`;
  }

  return null;
}
