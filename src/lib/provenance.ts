// Server-only provenance access.
//
// Imports the FULL provenance manifest (~1.7MB: CIDs + sha256 + sharp variants +
// LQIP). DO NOT import this from a client component — it would pull the whole
// manifest into the client bundle. The galleries (client) use the slim CID map
// in images.ts; only the piece page (a server component) imports this for the
// detail variants, blur-up, and provenance badge. (plan A.2 / C.1 / C.2)
import provenanceRaw from "./provenance.data.json";
import { FILEBASE_GATEWAY } from "./images";

export type ProvenanceEntry = {
  storage?: string;
  source?: string;
  cid?: string;
  sha256?: string;
  bytes?: number;
  mime?: string;
  gateway?: string;
  pinnedAt?: string;
  variants?: { w: number; cid: string; bytes: number }[];
  lqip?: string;
  animation?: { source: string; type: string; pinned: boolean };
};

const PROVENANCE = provenanceRaw as Record<string, ProvenanceEntry>;

/** Full provenance record for a piece (CID, sha256, storage, variants, …).
 *  Used server-side for the preservation/provenance UI (C.2). */
export function getProvenance(slug: string): ProvenanceEntry | undefined {
  return PROVENANCE[slug];
}

/** Sharp detail-view variants (Path B hybrid): a manual srcset of our own
 *  Lanczos+unsharp webp variants, served RAW from the gateway. Rendered via a
 *  plain <img> (not next/image) so the custom loader never re-resizes and
 *  re-softens them. Returns null for SVG / unpinned pieces — the caller then
 *  falls back to next/image + the gateway. */
export function getDetailVariants(slug: string): { src: string; srcSet: string } | null {
  const v = PROVENANCE[slug]?.variants;
  if (!v || v.length === 0) return null;
  const sorted = [...v].sort((a, b) => a.w - b.w);
  const srcSet = sorted.map((x) => `https://${FILEBASE_GATEWAY}/ipfs/${x.cid} ${x.w}w`).join(", ");
  const src = `https://${FILEBASE_GATEWAY}/ipfs/${sorted[sorted.length - 1].cid}`;
  return { src, srcSet };
}

/** Tiny blurred LQIP data URI for blur-up (progressive load), or undefined. */
export function getArtworkBlur(slug: string): string | undefined {
  return PROVENANCE[slug]?.lqip;
}
