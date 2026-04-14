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
  if (contractAddress && tokenId) {
    const contract = contractAddress.toLowerCase();
    const isPunk = contract === "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb";
    const dir = size === "detail" ? "optimized" : "thumbs";

    if (isPunk) return `/art/all/${contract}-${tokenId}.svg`;

    // Art Blocks contract uses prefixed token IDs (project * 1000000 + serial).
    // The spreadsheet sometimes stores raw serials (Fidenza: "145"), sometimes
    // already-prefixed full IDs (Ringers: "13000374"). Only prefix when raw.
    const ART_BLOCKS = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270";
    if (contract === ART_BLOCKS) {
      const n = parseInt(tokenId, 10);
      if (n < 1000000) {
        const project = (() => {
          if (slug.startsWith("fidenza-")) return 78;
          if (slug.startsWith("ringers-")) return 13;
          return null;
        })();
        if (project !== null) {
          const fullToken = project * 1000000 + n;
          return `/art/${dir}/${contract}-${fullToken}.webp`;
        }
      }
    }

    return `/art/${dir}/${contract}-${tokenId}.webp`;
  }

  return null;
}
