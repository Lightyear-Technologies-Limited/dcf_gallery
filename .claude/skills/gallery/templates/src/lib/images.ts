import cids from "./provenance.cids.json";
import { GATEWAY_HOST } from "./site";

/**
 * Image resolution helpers. Resolves a piece's grid / detail image URL
 * using (in order):
 *   1. A CURATED_DETAIL / CURATED_THUMB override — for hero pieces
 *      where a specific crop/still ships with the site.
 *   2. A slug-prefix curated match.
 *   3. The gateway URL derived from the pinned CID (via provenance.cids.json).
 *      A custom image loader (image-loader.js) can rewrite these into
 *      resized WebP variants on the fly.
 *   4. A local fallback under /art/optimized/ or /art/thumbs/.
 * CryptoPunks short-circuit to an on-chain SVG under /art/all/.
 */
type Size = "detail" | "thumb";

export const CURATED_DETAIL: Record<string, string> = {};
export const CURATED_THUMB: Record<string, string> = {};

const CIDS = cids as Record<string, string>;

export function getArtworkImage(
  slug: string,
  contractAddress?: string,
  tokenId?: string,
  size: Size = "thumb",
): string | null {
  // CryptoPunks: served on-chain from /art/all/
  if (contractAddress?.toLowerCase() === "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb" && tokenId) {
    return `/art/all/punk${tokenId.padStart(4, "0")}.svg`;
  }

  const curatedMap = size === "detail" ? CURATED_DETAIL : CURATED_THUMB;
  if (curatedMap[slug]) return curatedMap[slug];

  const cid = CIDS[slug];
  if (cid) return `https://${GATEWAY_HOST}/ipfs/${cid}`;

  if (contractAddress && tokenId) {
    const key = `${contractAddress}-${tokenId}`;
    return size === "detail" ? `/art/optimized/${key}.webp` : `/art/thumbs/${key}.webp`;
  }

  return null;
}
