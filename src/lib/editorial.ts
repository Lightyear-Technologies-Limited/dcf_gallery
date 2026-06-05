// C.4 — Editorial content overlay.
//
// The AUTHORITATIVE source for human-written prose — artist bios + essays, and
// collection curator notes + essays. Generated from the CMS-editable source at
// `content/editorial/*.json` by `scripts/build-editorial.mjs` (Zod-validated),
// so a re-run of the portfolio importer can no longer clobber curator copy.
//
// Read sites prefer this overlay and fall back to the (legacy) `data.ts` value
// only when an entry has no editorial record yet — keeping a single effective
// writer per field while staying resilient to newly-imported entities.
import editorial from "./editorial.data.json";

export interface ArtistEditorial {
  bio: string;
  essayUrl?: string;
  essayTitle?: string;
}
export interface CollectionEditorial {
  curatorNote: string;
  essayUrl?: string;
  essayTitle?: string;
}

const ED = editorial as {
  artists: Record<string, ArtistEditorial>;
  collections: Record<string, CollectionEditorial>;
};

export function getArtistEditorial(slug: string): ArtistEditorial | undefined {
  return ED.artists[slug];
}

export function getCollectionEditorial(slug: string): CollectionEditorial | undefined {
  return ED.collections[slug];
}

/** Overlay the editorial record onto a generated Artist at the fetch site, so
 *  every downstream read (bio, essay) reflects the authoritative content layer.
 *  Pass-through when there's no editorial record (resilient to new imports). */
export function withArtistEditorial<
  T extends { slug: string; bio: string; essayUrl?: string; essayTitle?: string },
>(a: T | undefined): T | undefined {
  if (!a) return a;
  const ed = ED.artists[a.slug];
  if (!ed) return a;
  return { ...a, bio: ed.bio, essayUrl: ed.essayUrl ?? a.essayUrl, essayTitle: ed.essayTitle ?? a.essayTitle };
}

/** Overlay the editorial record onto a generated Collection (curator note + essay). */
export function withCollectionEditorial<
  T extends { slug: string; curatorNote: string; essayUrl?: string; essayTitle?: string },
>(c: T | undefined): T | undefined {
  if (!c) return c;
  const ed = ED.collections[c.slug];
  if (!ed) return c;
  return { ...c, curatorNote: ed.curatorNote, essayUrl: ed.essayUrl ?? c.essayUrl, essayTitle: ed.essayTitle ?? c.essayTitle };
}
