import editorial from "./editorial.data.json";

/**
 * Editorial data helpers. Reads from the consolidated editorial.data.json
 * that build-editorial.mjs produces. See reference/ARCHITECTURE.md.
 */

export interface EditorialLink { label: string; url: string; }

export interface ArtistEditorial {
  bio?: string;
  portraitCredit?: string;
  links?: EditorialLink[];
}

export interface CollectionEditorial {
  curatorNote?: string;
  essayUrl?: string;
  essayTitle?: string;
  links?: EditorialLink[];
  context?: EditorialLink[];
}

export interface PieceEditorial {
  curatorNote?: string;
  links?: EditorialLink[];
  context?: EditorialLink[];
}

const data = editorial as {
  artists: Record<string, ArtistEditorial>;
  collections: Record<string, CollectionEditorial>;
  pieces: Record<string, PieceEditorial>;
};

export const getArtistEditorial = (slug: string): ArtistEditorial | undefined =>
  data.artists[slug];
export const getCollectionEditorial = (slug: string): CollectionEditorial | undefined =>
  data.collections[slug];
export const getPieceEditorial = (slug: string): PieceEditorial | undefined =>
  data.pieces[slug];
