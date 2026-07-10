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
  /** Hivemind-voice commentary on why we collect this artist. Optional
   *  until every artist has one authored. */
  curatorNote?: string;
  essayUrl?: string;
  essayTitle?: string;
}
export interface EditorialLink {
  /** Human-visible link text (e.g. "View on samspratt.com", "Read the essay"). */
  label: string;
  /** Absolute URL. */
  url: string;
}
export interface CollectionEditorial {
  curatorNote: string;
  essayUrl?: string;
  essayTitle?: string;
  /** Optional X (Twitter) thread / announcement post link. */
  xUrl?: string;
  /** Optional override label for the X link (defaults to "Read the thread on X"). */
  xLabel?: string;
  /** Optional list of external links (artist site catalogue page, credited
   *  collaborator profile, press coverage). Rendered under the collection
   *  links block. Kept generic so new link types don't need a schema change. */
  links?: EditorialLink[];
  /** Optional Context ledger — announcements and third-party responses
   *  rendered as their own "Context" section below Exhibitions on the
   *  piece page. Extensible: entries accumulate as the piece attracts
   *  external commentary. Distinct from `links[]`. */
  context?: EditorialLink[];
}
export interface PieceEditorial {
  /** Optional X (Twitter) thread / announcement post link for a specific
   *  piece (e.g. TIME, ROTTEN, Fidenza #456). Rendered on the piece page. */
  xUrl?: string;
  /** Optional override label for the X link (defaults to "Read the thread on X"). */
  xLabel?: string;
  /** Optional list of external links (samspratt.com profile, credited
   *  collaborator profile, artist catalogue page). Rendered under the piece
   *  links block. */
  links?: EditorialLink[];
  /** Optional Context ledger — announcements + response items rendered as
   *  their own "Context" section below Exhibitions on the piece page.
   *  Extensible. Distinct from `links[]`. */
  context?: EditorialLink[];
}

const ED = editorial as {
  artists: Record<string, ArtistEditorial>;
  collections: Record<string, CollectionEditorial>;
  pieces?: Record<string, PieceEditorial>;
};

export function getArtistEditorial(slug: string): ArtistEditorial | undefined {
  return ED.artists[slug];
}

export function getCollectionEditorial(slug: string): CollectionEditorial | undefined {
  return ED.collections[slug];
}

export function getPieceEditorial(slug: string): PieceEditorial | undefined {
  return ED.pieces?.[slug];
}

/** Overlay the editorial record onto a generated Artist at the fetch site, so
 *  every downstream read (bio, essay) reflects the authoritative content layer.
 *  Pass-through when there's no editorial record (resilient to new imports). */
export function withArtistEditorial<
  T extends { slug: string; bio: string; curationComment?: string; essayUrl?: string; essayTitle?: string },
>(a: T | undefined): T | undefined {
  if (!a) return a;
  const ed = ED.artists[a.slug];
  if (!ed) return a;
  return {
    ...a,
    bio: ed.bio,
    // Editorial layer curatorNote replaces the legacy data.ts
    // curationComment. When empty/absent, the artist page does not
    // render the Hivemind Commentary block - the block reappears once
    // a curatorNote is written into the artist's editorial JSON file.
    curationComment: ed.curatorNote,
    essayUrl: ed.essayUrl ?? a.essayUrl,
    essayTitle: ed.essayTitle ?? a.essayTitle,
  };
}

/** Overlay the editorial record onto a generated Collection (curator note
 *  + essay + optional X link + optional generic links). The xUrl/xLabel and
 *  links fields are editorial-only (no counterpart in data.ts), so the
 *  return type widens to include them. */
export function withCollectionEditorial<
  T extends { slug: string; curatorNote: string; essayUrl?: string; essayTitle?: string },
>(c: T | undefined): (T & { xUrl?: string; xLabel?: string; links?: EditorialLink[]; context?: EditorialLink[] }) | undefined {
  if (!c) return c;
  const ed = ED.collections[c.slug];
  const base = c as T & { xUrl?: string; xLabel?: string; links?: EditorialLink[]; context?: EditorialLink[] };
  if (!ed) return base;
  return {
    ...base,
    curatorNote: ed.curatorNote,
    essayUrl: ed.essayUrl ?? base.essayUrl,
    essayTitle: ed.essayTitle ?? base.essayTitle,
    xUrl: ed.xUrl,
    xLabel: ed.xLabel,
    links: ed.links,
    context: ed.context,
  };
}
