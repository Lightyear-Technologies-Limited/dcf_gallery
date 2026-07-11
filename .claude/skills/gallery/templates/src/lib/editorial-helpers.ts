import type { Collection } from "./data";
import { getCollectionEditorial, type CollectionEditorial } from "./editorial";

/**
 * Merges a Collection with its editorial layer so a template can read
 * curatorNote / essayUrl / context / links without cross-referencing
 * two sources. Returns undefined if the collection itself is missing
 * (preserves the notFound() path).
 */
export function withCollectionEditorial(
  col?: Collection,
): (Collection & CollectionEditorial) | undefined {
  if (!col) return undefined;
  const ed = getCollectionEditorial(col.slug);
  return { ...col, ...ed };
}
