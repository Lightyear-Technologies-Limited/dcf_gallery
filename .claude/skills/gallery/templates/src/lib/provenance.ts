import manifest from "./provenance.data.json";
import { GATEWAY_HOST } from "./site";

/**
 * Full provenance manifest (server-only). Keyed by piece slug.
 *
 * Do NOT import this from a Client Component — the manifest is
 * intentionally heavy (Sharp variants + LQIP base64 + full sha256 per
 * piece). Keep it inside Server Components + page.tsx level code.
 *
 * The slim client-safe version (slug → CID) is provenance.cids.json,
 * imported by src/lib/images.ts.
 */

export interface ProvenanceEntry {
  cid?: string;
  sha256?: string;
  bytes?: number;
  mime?: string;
  pinnedAt?: string;
  verifiedAt?: string;
  gateway?: string;
  /** Sharp-generated variants for the piece page srcset. */
  variants?: Array<{ w: number; cid: string; sha256: string; bytes: number }>;
  /** Base64 low-quality image placeholder (24×24). */
  lqip?: string;
  storage?: "onchain" | "ipfs" | "arweave" | "centralized";
  /** Source URI from data.ts (Arweave / IPFS gateway / centralized). */
  source?: string;
}

const data = manifest as Record<string, ProvenanceEntry>;

export const getProvenance = (slug: string): ProvenanceEntry | undefined => data[slug];

export const GATEWAY_BASE = `https://${GATEWAY_HOST}/ipfs/`;

/**
 * Build a <img srcset> from the pinned Sharp variants. Returns null if
 * the piece has no variants.
 */
export function getDetailSrcSet(slug: string): { src: string; srcSet: string } | null {
  const p = getProvenance(slug);
  if (!p?.variants?.length) return null;
  const src = `${GATEWAY_BASE}${p.variants[0].cid}`;
  const srcSet = p.variants.map((v) => `${GATEWAY_BASE}${v.cid} ${v.w}w`).join(", ");
  return { src, srcSet };
}

/** Extract the LQIP base64 URI for blur-up. Null for transparent-tondo pieces. */
export function getArtworkBlur(slug: string): string | undefined {
  const p = getProvenance(slug);
  return p?.lqip ? `data:image/webp;base64,${p.lqip}` : undefined;
}

/** OG image URL for the piece — the pinned CID at gateway. */
export function getOgImage(slug: string): string | null {
  const p = getProvenance(slug);
  return p?.cid ? `${GATEWAY_BASE}${p.cid}` : null;
}
