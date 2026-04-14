import curation from "./curation.json";

/**
 * Get display name for a collection. Falls back to data name.
 */
export function getCollectionDisplayName(slug: string, dataName: string): string {
  return (curation.collectionNames as Record<string, string>)[slug] || dataName;
}

/**
 * Get display name for an artist. Falls back to data name.
 */
export function getArtistDisplayName(slug: string, dataName: string): string {
  return (curation.artistNames as Record<string, string>)[slug] || dataName;
}

/**
 * Get the ordered collection slugs for an artist.
 * Collections not in the list appear at the end in their original order.
 */
export function getCollectionOrder(artistSlug: string): string[] | null {
  return (curation.collectionOrder as unknown as Record<string, string[]>)[artistSlug] || null;
}

/**
 * Sort collections for an artist based on curation.json order.
 */
export function sortCollections<T extends { slug: string }>(artistSlug: string, collections: T[]): T[] {
  const order = getCollectionOrder(artistSlug);
  if (!order) return collections;

  return [...collections].sort((a, b) => {
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    const aIdx = ai === -1 ? 999 : ai;
    const bIdx = bi === -1 ? 999 : bi;
    return aIdx - bIdx;
  });
}

/**
 * Check if a collection should be hidden from the site.
 */
export function isCollectionHidden(slug: string): boolean {
  const hidden = (curation as { hideCollections?: string[] }).hideCollections;
  return Array.isArray(hidden) && hidden.includes(slug);
}

/**
 * Get the ordered piece slugs for a collection.
 */
export function getPieceOrder(collectionSlug: string): string[] | null {
  const po = (curation as { pieceOrder?: Record<string, string[]> }).pieceOrder;
  return (po as unknown as Record<string, string[]>)?.[collectionSlug] || null;
}

/**
 * Sort pieces within a collection based on curation.json order.
 */
export function sortPieces<T extends { slug: string }>(collectionSlug: string, pieces: T[]): T[] {
  const order = getPieceOrder(collectionSlug);
  if (!order) return pieces;

  return [...pieces].sort((a, b) => {
    const ai = order.indexOf(a.slug);
    const bi = order.indexOf(b.slug);
    const aIdx = ai === -1 ? 999 : ai;
    const bIdx = bi === -1 ? 999 : bi;
    return aIdx - bIdx;
  });
}
