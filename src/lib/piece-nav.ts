// Piece-page Back + Prev/Next link resolution (E.3).
//
// Deliberately a plain shared module (no "use client"): both the server page and
// the client `PieceNav` import `resolveNav`, so the pre-hydration and
// post-hydration links come from ONE implementation and cannot drift.
//
// Background: /piece/[slug] used to `await searchParams` on the server purely to
// build this chrome — the trait filter (?trait=&value=), the origin breadcrumb
// (?from=), and the query carried onto Prev/Next. Reading searchParams server-side
// opts a route out of static generation, so all 318 piece pages were served
// `Cache-Control: private, no-store` — a function invocation on every visit, crawl
// and OG unfurl, on precisely the URLs people share. Nothing about the artwork
// itself ever depended on the params, so the page now prerenders and this resolves
// the nav from the URL on the client.

import type { TraitValue } from "@/lib/curation";

export interface PieceNavSibling {
  slug: string;
  title: string;
  tokenId: string | null;
  /** Only what a filtered walk needs — not the whole traits dataset. */
  traits: Array<[string, TraitValue]>;
}

export interface PieceNavData {
  pieceSlug: string;
  collectionSlug: string | null;
  /** Curated display name, resolved server-side. */
  collectionName: string | null;
  artistSlug: string | null;
  /** Curated display name, resolved server-side. */
  artistName: string | null;
  /** Total pieces in the collection — drives the single-piece Back shortcut. */
  collectionPieceCount: number;
  /** The collection's pieces in curated display order (server `sortPieces`). */
  siblings: PieceNavSibling[];
}

export interface PieceNavModel {
  backHref: string;
  backLabel: string;
  prev: { title: string; href: string } | null;
  next: { title: string; href: string } | null;
}

/** Minimal read surface so both URLSearchParams and Next's ReadonlyURLSearchParams fit. */
export interface ParamReader {
  get(key: string): string | null;
}

/** Empty reader — the server uses this to render the bare-URL (static) nav. */
export const NO_PARAMS: ParamReader = { get: () => null };

export function resolveNav(data: PieceNavData, sp: ParamReader): PieceNavModel {
  const {
    pieceSlug,
    collectionSlug,
    collectionName,
    artistSlug,
    artistName,
    collectionPieceCount,
    siblings,
  } = data;

  const trait = sp.get("trait") || "";
  const value = sp.get("value") || "";
  const incomingFilter = trait && value ? { key: trait, value } : null;
  const filterQs = incomingFilter
    ? `trait=${encodeURIComponent(incomingFilter.key)}&value=${encodeURIComponent(incomingFilter.value)}`
    : "";

  // Origin view (?from=…) so Back returns where the reader came from — the
  // Collection (Salon homepage, carrying any active chapter/artist filter) or the
  // Chapters page — rather than only up to the parent collection.
  const from = sp.get("from") || "";
  const viewParams = new URLSearchParams();
  for (const k of ["chapter", "artist", "collection", "medium", "q"] as const) {
    const v = sp.get(k);
    if (v) viewParams.set(k, v);
  }

  // Anchor Back to the tile the reader opened so returning restores their scroll
  // position instead of jumping to the top.
  const anchor = `#p-${pieceSlug}`;
  let originHref: string | null = null;
  let originLabel = "";
  if (from === "salon") {
    originHref = `/${viewParams.toString() ? `?${viewParams}` : ""}${anchor}`;
    originLabel = "Collection";
  } else if (from === "chapters") {
    originHref = `/chapters${anchor}`;
    originLabel = "Chapters";
  } else if (from === "artist") {
    const a = viewParams.get("artist") || artistSlug || "";
    originHref = `/artist/${a}${anchor}`;
    originLabel = a === artistSlug && artistName ? artistName : "Artist";
  }

  // Carry origin + active filter onto Prev/Next so sibling browsing keeps the same
  // Back destination and stays inside the filtered subset.
  const carry = new URLSearchParams(filterQs);
  if (from) {
    carry.set("from", from);
    for (const [k, v] of viewParams) carry.set(k, v);
  }
  const carryQs = carry.toString();
  const pieceHref = (s: string) => `/piece/${s}${carryQs ? `?${carryQs}` : ""}`;
  const collectionHref = collectionSlug
    ? `/collection/${collectionSlug}${filterQs ? `?${filterQs}` : ""}`
    : "/";

  // Filtered walk: the matching subset sorted by numeric tokenId, matching the
  // order the filtered collection view renders subsets in. Unfiltered walk: the
  // curated display order handed down from the server.
  let walk = siblings;
  if (incomingFilter) {
    walk = siblings
      .filter((p) =>
        p.traits.some(([k, v]) => {
          if (k !== incomingFilter.key) return false;
          if (Array.isArray(v)) return v.some((item) => String(item) === incomingFilter.value);
          return String(v) === incomingFilter.value;
        }),
      )
      .sort((a, b) => {
        const an = parseInt(a.tokenId || "", 10);
        const bn = parseInt(b.tokenId || "", 10);
        if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
        return a.slug.localeCompare(b.slug);
      });
  }
  const i = walk.findIndex((p) => p.slug === pieceSlug);
  const prev = i > 0 ? walk[i - 1] : null;
  const next = i >= 0 && i < walk.length - 1 ? walk[i + 1] : null;

  // Up-the-hierarchy fallback when there's no explicit ?from origin. A
  // single-piece collection is redundant chrome, so its natural parent is the
  // artist — unless a filter is active, which always returns to the collection.
  const upToArtist = !incomingFilter && collectionPieceCount === 1 && !!artistSlug;
  const upHref = (upToArtist ? `/artist/${artistSlug}` : collectionHref) + anchor;
  const upLabel = upToArtist
    ? artistName ?? "Artist"
    : collectionName
      ? `${collectionName}${incomingFilter ? ` · ${incomingFilter.key}: ${incomingFilter.value}` : ""}`
      : "Back";

  return {
    backHref: originHref || upHref,
    backLabel: originHref ? originLabel : upLabel,
    prev: prev ? { title: prev.title, href: pieceHref(prev.slug) } : null,
    next: next ? { title: next.title, href: pieceHref(next.slug) } : null,
  };
}
