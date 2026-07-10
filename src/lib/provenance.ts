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
  verifiedAt?: string;
  verified?: boolean;
  variants?: { w: number; cid: string; bytes: number }[];
  lqip?: string;
  animation?: {
    source: string;
    type: string;
    pinned: boolean;
    cid?: string;
    sha256?: string;
    bytes?: number;
    mime?: string;
    gateway?: string;
  };
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

/** Tiny blurred LQIP data URI for blur-up (progressive load), or undefined.
 *
 *  Skulls of Luci are released as transparent tondos (circular artwork on
 *  a transparent canvas). Applying a rectangular LQIP as a background on
 *  the img element makes the LQIP show through the transparent pixels
 *  around the circular skull — reading as a strange rectangular halo /
 *  frame around the artwork. For transparent-tondo pieces we return
 *  undefined so no LQIP background is set; the page background shows
 *  through the transparency cleanly. Trade-off: no blur-up on initial
 *  load for these specific pieces, but tondo files are small and load
 *  fast in practice. */
export function getArtworkBlur(slug: string): string | undefined {
  const p = PROVENANCE[slug];
  if (!p?.lqip) return undefined;
  if ((p as { display?: string }).display === "transparent-tondo") return undefined;
  return p.lqip;
}

/** Social-card (OG) image for a piece: a 1200px JPG via the gateway, for the
 *  widest unfurler compatibility. Raster pieces only — SVG/punks return
 *  undefined and the caller falls back to the site default card. (C.3) */
export function getOgImage(slug: string): string | undefined {
  const p = PROVENANCE[slug];
  if (!p?.cid || (p.mime && p.mime.includes("svg"))) return undefined;
  // Downscale from our sharp VARIANT, never the preservation master (which can be
  // 50–160MB and exceeds the gateway's transform limit). SVG/no-variant fall back.
  const v = p.variants?.find((x) => x.w === 1280) || p.variants?.[p.variants.length - 1];
  const cid = v ? v.cid : p.cid;
  return `https://${FILEBASE_GATEWAY}/ipfs/${cid}?img-width=1200&img-format=jpg`;
}
