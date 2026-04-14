/**
 * Artwork image lookup — serves optimized WebP.
 *
 * Two sizes:
 * - /art/optimized/{key}.webp  (max 1200px, for detail pages)
 * - /art/thumbs/{key}.webp     (max 400px, for grid views)
 *
 * CryptoPunks stay as PNG (pixel art).
 */

// Hand-curated overrides for hero/featured pieces
const CURATED_DETAIL: Record<string, string> = {
  "fidenza-145": "/art/optimized/curated-fidenza-145.webp",
  "ringers-13000014": "/art/optimized/curated-ringers-13000014.webp",
  "woy-103": "/art/optimized/curated-woy-103.webp",
  "synthetic-dreams-51": "/art/optimized/curated-synthetic-dreams-51.webp",
  "lightyears-1": "/art/optimized/curated-lightyears-001.webp",
  "masksofluci-442": "/art/optimized/curated-masks-442.webp",
};

const CURATED_THUMB: Record<string, string> = {
  "fidenza-145": "/art/thumbs/curated-fidenza-145.webp",
  "ringers-13000014": "/art/thumbs/curated-ringers-13000014.webp",
  "woy-103": "/art/thumbs/curated-woy-103.webp",
  "synthetic-dreams-51": "/art/thumbs/curated-synthetic-dreams-51.webp",
  "lightyears-1": "/art/thumbs/curated-lightyears-001.webp",
  "masksofluci-442": "/art/thumbs/curated-masks-442.webp",
};

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

  // Auto-pulled: /art/{optimized|thumbs}/{contract}-{tokenId}.webp
  // Falls back to /art/all/{contract}-{tokenId}.{png|svg} for unoptimized
  if (contractAddress && tokenId) {
    const key = `${contractAddress.toLowerCase()}-${tokenId}`;
    const isPunk = contractAddress.toLowerCase() === "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
    const dir = size === "detail" ? "optimized" : "thumbs";

    if (isPunk) {
      // CryptoPunks: serve SVG directly (tiny files, pixel art)
      return `/art/all/${key}.svg`;
    }

    return `/art/${dir}/${key}.webp`;
  }

  return null;
}
