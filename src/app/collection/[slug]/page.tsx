import { notFound } from "next/navigation";
import Link from "next/link";
import { collections, getArtist, getCollectionsByArtist, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  sortPieces,
  sortCollections,
  isCollectionHidden,
  getPiecesPerRow,
  getPieceRows,
  getHeroLayout,
  getEditionType,
  getPieceTraits,
  getTraitGlobalCount,
  CLICKABLE_TRAITS,
} from "@/lib/curation";
import JustifiedGallery from "@/components/JustifiedGallery";
import FixedRowGallery from "@/components/FixedRowGallery";
import HeroSidebarGallery from "@/components/HeroSidebarGallery";
import SinglePieceDisplay from "@/components/SinglePieceDisplay";
import ExpandableProse from "@/components/ExpandableProse";
import CopyableHash from "@/components/CopyableHash";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}


export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ trait?: string; value?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const col = collections.find((c) => c.slug === slug);
  if (!col) notFound();

  const artist = getArtist(col.artistSlug);
  const collectionName = getCollectionDisplayName(col.slug, col.name);
  const artistName = artist ? getArtistDisplayName(artist.slug, artist.name) : null;

  const rawPieces = getPiecesByCollection(slug).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    collectionSlug: p.collectionSlug,
    artistSlug: p.artistSlug,
    medium: p.medium,
    contractAddress: p.contractAddress,
    tokenId: p.tokenId,
  }));
  const sorted = sortPieces(slug, rawPieces);

  // Trait filter: arrives as ?trait=Palette&value=White%20Mono from a piece-
  // page Features link. Filter pieces whose stored traits contain a matching
  // (key, value) pair. The canonical /collection/{slug} (no params) remains
  // statically generated; filtered views are SSR.
  const traitFilter = sp.trait && sp.value ? { key: sp.trait, value: sp.value } : null;

  // Build the (key -> value -> count) facet aggregation over the unfiltered
  // sorted holdings. Used by the "Browse by trait" disclosure so a reader
  // can pivot without first opening a piece. Aggregated on both unfiltered
  // and filtered views: on filtered views the disclosure lets the reader
  // see the other available trait values + their counts and pivot directly.
  const facets = new Map<string, Map<string, number>>();
  for (const p of sorted) {
    const t = getPieceTraits(p.slug);
    if (!t) continue;
    for (const [k, v] of t) {
      const values = Array.isArray(v) ? v.map(String) : [String(v)];
      if (!facets.has(k)) facets.set(k, new Map());
      const valMap = facets.get(k)!;
      for (const val of values) valMap.set(val, (valMap.get(val) || 0) + 1);
    }
  }
  const pieces = traitFilter
    ? sorted
        .filter((p) => {
          const t = getPieceTraits(p.slug);
          return t?.some(([k, v]) => {
            if (k !== traitFilter.key) return false;
            // Array-valued traits (e.g. Punks' "Attribute": ["Cap Forward",
            // "Pipe", "Small Shades"]) match if the filter value is one of
            // the array entries.
            if (Array.isArray(v)) return v.some((item) => String(item) === traitFilter.value);
            return String(v) === traitFilter.value;
          });
        })
        // Filtered subsets sort by numeric tokenId so the scan order is
        // predictable (Fidenza #19 -> #28 -> #60 ...) and matches the
        // piece-page prev/next walk through the same subset. Curation
        // order is preserved on the unfiltered grid where the editorial
        // sequencing earns its keep.
        .sort((a, b) => {
          const an = parseInt(a.tokenId || "", 10);
          const bn = parseInt(b.tokenId || "", 10);
          if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
          return a.slug.localeCompare(b.slug);
        })
    : sorted;

  const piecesPerRow = getPiecesPerRow(slug);
  const pieceRows = getPieceRows(slug);
  const n = pieces.length;
  const first = pieces[0];
  // Only treat as a "single piece" presentation when the collection itself
  // holds a single piece - not when a trait filter narrowed the view down
  // to one match. A filtered single match should still read as a peer in a
  // grid, not as a hero.
  const heroImage =
    !traitFilter && n === 1 && first
      ? getArtworkImage(first.slug, first.contractAddress, first.tokenId, "detail")
      : null;

  let ideal: number;
  if (traitFilter) {
    // Filtered view: target 4-5 thumbnails per row with balanced rows so
    // 7 pieces lay out as 4+3, not 6+1 (and 11 as 4+4+3, not 6+5). Single-
    // row when n <= 5. Ignore the configured piecesPerRow / heroLayout /
    // pieceRows which were designed for the full set.
    if (n <= 5) {
      ideal = Math.max(n, 2);
    } else {
      const rows = Math.ceil(n / 5);
      ideal = Math.ceil(n / rows);
    }
  } else if (piecesPerRow && piecesPerRow > 0) ideal = piecesPerRow;
  else if (n <= 3) ideal = Math.max(n, 1);
  else if (n <= 6) ideal = 3;
  else if (n <= 12) ideal = 4;
  else ideal = 5;

  // Find prev / next visible collection by the same artist for the top nav.
  const siblings = artist
    ? sortCollections(artist.slug, getCollectionsByArtist(artist.slug)).filter(
        (c) => !isCollectionHidden(c.slug)
      )
    : [];
  const idx = siblings.findIndex((c) => c.slug === slug);
  const prevSibling = idx > 0 ? siblings[idx - 1] : null;
  const nextSibling = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const editionType = getEditionType(slug);
  const isSingle = n === 1 && heroImage && first;

  // Shared helpers used by both the inline left-column trait index and the
  // below-grid "Browse by trait" disclosure - keep them in one place so the
  // clickability whitelist + count rendering stay in sync across both
  // surfaces. The disclosure only shows traits the collection has marked
  // clickable in CLICKABLE_TRAITS (curation.ts); a collection with no entry
  // gets an empty disclosure (it's an editorial pivot panel, not an
  // exhaustive enumeration of every on-chain attribute).
  const clickableSpec = CLICKABLE_TRAITS[slug];
  const buildVisibleValues = (key: string, values: Map<string, number>): [string, number][] => {
    const sortedValues = [...values.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    const rule = clickableSpec?.[key];
    if (rule === undefined) {
      // Key not in the clickability whitelist: hide unless the active filter
      // happens to target this key (then promote the active value into view
      // so the reader sees their current pivot, even if it's editorial-off).
      if (
        traitFilter?.key === key &&
        traitFilter?.value &&
        values.has(traitFilter.value)
      ) {
        return [[traitFilter.value, values.get(traitFilter.value)!]];
      }
      return [];
    }
    if (rule === "all") return sortedValues;
    // Value-level whitelist: keep only listed values; always promote the
    // active filter (if any) so "you are here" remains visible.
    const visibleSet = new Set<string>(rule.filter((v) => values.has(v)));
    if (traitFilter?.key === key && traitFilter?.value && values.has(traitFilter.value)) {
      visibleSet.add(traitFilter.value);
    }
    return sortedValues
      .filter(([v]) => visibleSet.has(v))
      .sort((a, b) => a[0].localeCompare(b[0]));
  };
  const renderTraitLink = (key: string, val: string, count: number) => {
    const isActive = traitFilter?.key === key && traitFilter?.value === val;
    const globalCount = getTraitGlobalCount(slug, key, val);
    return (
      <Link
        key={val}
        href={`/collection/${slug}?trait=${encodeURIComponent(key)}&value=${encodeURIComponent(val)}`}
        className={`inline-flex items-baseline gap-1.5 transition-colors duration-200 underline underline-offset-4 ${
          isActive
            ? "text-foreground font-medium decoration-foreground"
            : "text-foreground-secondary hover:text-foreground decoration-border hover:decoration-foreground"
        }`}
        aria-current={isActive ? "page" : undefined}
      >
        <span>{val}</span>
        <span className="text-[11px] tabular-nums no-underline inline-flex items-baseline">
          <span
            className={
              isActive
                ? "text-foreground"
                : count > 1
                ? "text-muted"
                : "text-muted/40"
            }
          >
            {count}
          </span>
          {globalCount !== null && (
            <span className="text-muted/40">/{globalCount.toLocaleString()}</span>
          )}
        </span>
      </Link>
    );
  };

  // Filter status line - rendered in the LEFT column under the holdings line
  // on filtered views. Earlier iterations used a rounded-pill chip with a
  // surface background; that chrome read as a marketplace facet button
  // (OpenSea / Blur / Magic Eden all use the same pill grammar), which
  // undercut the page's institutional register. The current treatment is a
  // flush status row with a single hairline bottom rule - same content
  // (filter axis + held figure + clear), same data, same affordance, but
  // sitting in the rhythm of the page rather than floating as a control.
  // The held figure stays font-medium so the answer to "how many" remains
  // the eye's anchor; everything else is muted.
  const chipBlock = traitFilter ? (() => {
    const globalCount = getTraitGlobalCount(slug, traitFilter.key, traitFilter.value);
    return (
      <div className="mt-6 max-w-[520px] flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3 text-[13px]">
        <span className="text-[10px] uppercase text-muted">
          Filter
        </span>
        <span className="text-foreground">
          {traitFilter.key}: <span className="font-medium">{traitFilter.value}</span>
        </span>
        <span className="text-muted">·</span>
        <span className="text-foreground tabular-nums font-medium">{pieces.length}</span>
        {globalCount !== null ? (
          <span className="text-muted tabular-nums">
            of {globalCount.toLocaleString()} held
          </span>
        ) : (
          <span className="text-muted">held</span>
        )}
        <Link
          href={`/collection/${slug}`}
          aria-label="Clear filter"
          className="ml-auto text-foreground-secondary hover:text-foreground transition-colors duration-200"
        >
          Clear
        </Link>
      </div>
    );
  })() : null;

  // Compact inline trait index - rendered directly under the chip in the
  // LEFT column on filtered views. Two-column row layout: small-caps key
  // eyebrow on the left in a fixed-width gutter, values flowing inline to
  // the right with the held/global count after each value. Reads as a
  // web3-native stats panel (Bloomberg / DeFi dashboard register) rather
  // than as a marketplace facet list. No "Browse by trait" wrapper, no
  // <details> mechanic - the eyebrows carry the navigation. Curated
  // whitelist (Punks Attribute) suppresses sub-core values; full list
  // elsewhere.
  const traitIndexInline = traitFilter && facets.size > 0 ? (
    <div className="mt-6 max-w-[520px] space-y-2 text-[12px]">
      {[...facets.entries()].map(([key, values]) => {
        const visible = buildVisibleValues(key, values);
        if (!visible.length) return null;
        return (
          <div key={key} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-[10px] uppercase text-muted shrink-0 min-w-[80px]">
              {key}
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {visible.map(([val, count]) => renderTraitLink(key, val, count))}
            </div>
          </div>
        );
      })}
    </div>
  ) : null;

  // Browse-by-trait disclosure - rendered BELOW the editorial grid on
  // UNFILTERED pages only. On filtered views the inline traitIndexInline
  // above takes over instead, sitting directly under the chip in the left
  // column.
  const traitDisclosure = facets.size > 0 ? (
    <details
      open={!!traitFilter}
      className="group max-w-[820px] text-[13px] [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="cursor-pointer list-none text-muted hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2 select-none">
        <span className="text-[10px] uppercase">
          Browse by trait
        </span>
        <span
          aria-hidden
          className="inline-block transition-transform duration-200 group-open:rotate-90"
        >
          &rsaquo;
        </span>
      </summary>
      <div className="mt-4 space-y-4">
        {[...facets.entries()].map(([key, values]) => {
          const visible = buildVisibleValues(key, values);
          if (!visible.length) return null;
          return (
            <div key={key}>
              <p className="text-[10px] uppercase text-muted mb-2">
                {key}
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {visible.map(([val, count]) => renderTraitLink(key, val, count))}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  ) : null;

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      {/* Breadcrumb + sibling nav. Prev (artist's other works) and next
          collection sit at the top alongside the trail so a returning
          reader can jump laterally without first scrolling to the bottom
          of the gallery. */}
      <div className="pt-8">
        <p className="text-[13px] text-muted">
          <Link href="/" className="hover:text-foreground transition-colors duration-200">
            Collection
          </Link>
          {" / "}
          {traitFilter ? (
            <>
              <Link
                href={`/collection/${slug}`}
                className="hover:text-foreground transition-colors duration-200"
              >
                {collectionName}
              </Link>
              {" / "}
              <span className="text-foreground-secondary">
                {traitFilter.key}: {traitFilter.value}
              </span>
            </>
          ) : (
            collectionName
          )}
        </p>
        {artist && (
          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-x-8 gap-y-2 text-[13px] text-muted">
            {/* Lateral link to artist (no arrow - it reads as "back" otherwise,
                and this destination is sibling-axis, not up-axis). */}
            <Link
              href={`/artist/${artist.slug}`}
              className="hover:text-foreground transition-colors duration-200"
            >
              All works by {artistName}
            </Link>
            {prevSibling && (
              <Link
                href={`/collection/${prevSibling.slug}`}
                className="hover:text-foreground transition-colors duration-200 sm:ml-auto"
              >
                ← {getCollectionDisplayName(prevSibling.slug, prevSibling.name)}
              </Link>
            )}
            {nextSibling && (
              <Link
                href={`/collection/${nextSibling.slug}`}
                className={`hover:text-foreground transition-colors duration-200 ${prevSibling ? "" : "sm:ml-auto"}`}
              >
                {getCollectionDisplayName(nextSibling.slug, nextSibling.name)} →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Editorial header - same 2-column layout for every collection so
          single-piece pages (Her Favorite Flowers, Harbor Scene, Lights,
          etc.) read with the same positioning as multi-piece collections.
          The gallery below switches presentation based on piece count, but
          the header structure stays constant. */}
      <div className="pt-6 grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-12 md:gap-16">
          <div>
            <h1 className="font-serif display">
              {collectionName}
            </h1>
            {artist && (
              <Link
                href={`/artist/${artist.slug}`}
                className="text-[15px] text-foreground-secondary hover:text-foreground transition-colors duration-200 mt-3 inline-block"
              >
                {artistName}
              </Link>
            )}
            {/* Catalogue-style data stack - reads top-down from work-
                level facts (mint date, code size, edition) to provenance
                (contract) to the fund's position last. Each row is one
                muted 13px tabular-nums line; rows with nothing to say
                are omitted. Replaces the earlier 3-row MetadataTable.
                Hivemind holdings line ("Hivemind holds N of M") omitted
                when:
                  - n === 1: singleton; the count is inventory tally on
                    what is fundamentally a single artwork.
                  - n === totalSupply <= 2: tiny series we hold entire.
                  - !totalSupply: no series context.
                Contract + edition rows suppressed on filtered views
                (collection-level context, not subset-relevant). */}
            <div className="mt-6 space-y-1 text-[13px] text-muted tabular-nums">
              {col.mintDate && <p>Minted {col.mintDate}</p>}
              {col.codeSizeKb !== undefined && (
                <p>Code size {col.codeSizeKb} Kb</p>
              )}
              {/* Edition row shows the canonical web3 shorthand:
                  - "1/1/N" for curated programmatic series (Fidenza 999,
                    Punks 10000): each piece is 1 of 1 in a series of N.
                  - "1/1" alone for collections of independent 1/1s on a
                    shared artist contract (Her favorite flowers, Piano
                    Blossoms): each piece is unique, not a series output.
                    Surfaces when totalSupply > 1 so the reader knows
                    each piece is 1/1 (not an edition of N), paired with
                    the holdings line below.
                  - Suppressed entirely for true singletons (no totalSupply)
                    where the 1/1 is implicit. */}
              {!traitFilter &&
                col.totalSupply !== undefined &&
                col.totalSupply > 1 && <p>{editionType}</p>}
              {!traitFilter && col.platform && <p>{col.platform}</p>}
              {!traitFilter && col.contractAddress && (
                <p className="inline-flex items-baseline gap-x-2">
                  <span>Contract:</span>
                  <CopyableHash value={col.contractAddress} />
                </p>
              )}
              {/* Holdings fraction only carries meaning against a programmatic
                  series (Fidenza 1/1/999, Punks 1/1/10000) where "Hivemind
                  holds N of M" reads as position size against a finite
                  curated set. For collections of independent 1/1s on a
                  shared artist contract (Her favorite flowers, Piano
                  Blossoms) "N of M" lacks the series context to read as
                  position - the works aren't a set. Suppressed in that
                  case; the count is implicit from the gallery below. */}
              {col.totalSupply && editionType !== "1/1" && (
                <p>
                  Hivemind holds {sorted.length} of {col.totalSupply.toLocaleString()}
                </p>
              )}
            </div>

            {/* Filter chip + compact trait index. On filtered views these
                sit directly under the holdings line so the filter context
                pairs visually with the fund's position figure (holdings ->
                chip -> available pivots), and the right column is freed
                for the institutional voice. */}
            {chipBlock}
            {traitIndexInline}

            {/* Exhibitions - tombstone provenance under the holdings stack.
                Catalogue convention: EXHIBITED sits in the lot tombstone
                next to PROVENANCE, not in a page-end appendix. Previously
                rendered as a footer band below the gallery; relocated so
                a reader gets the show history before scrolling past the
                artwork. Persists on filtered views - the show history is
                collection-level truth, not subset-relative. */}
            {col.exhibitions && col.exhibitions.length > 0 && (
              <div className="mt-8 max-w-[420px]">
                <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                  Exhibitions
                </p>
                <ul className="space-y-1 text-[13px] leading-snug">
                  {col.exhibitions.map((ex, i) => (
                    <li key={i}>
                      <span className="text-muted tabular-nums">{ex.date}</span>
                      <span className="text-muted"> - </span>
                      {ex.url ? (
                        <a
                          href={ex.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground-secondary hover:text-foreground transition-colors duration-200 underline decoration-transparent hover:decoration-border underline-offset-4"
                        >
                          <span className="font-serif italic">{ex.title}</span>
                          {ex.location && `, ${ex.location}`}
                        </a>
                      ) : (
                        <>
                          <span className="font-serif italic text-foreground-secondary">{ex.title}</span>
                          {ex.location && (
                            <span className="text-foreground-secondary">, {ex.location}</span>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Browse-by-trait disclosure - sits below the exhibitions
                block when present, otherwise directly under the holdings
                stack. Editorial prose (About + Hivemind Commentary +
                Artist Statement) lives in the RIGHT column. */}
            {!traitFilter && traitDisclosure && (
              <div className="mt-8">{traitDisclosure}</div>
            )}
          </div>

          {/* Right column - editorial voice stack:
              - About description (always)
              - Hivemind Commentary (always, rendered with the same
                serif 16px register as Artist Statement so the two
                voices have visual parity)
              - Artist Statement (when present)
              - Essay link (always when present)
              On filtered views only About survives. */}
          {!traitFilter ? (
            <div className="space-y-6 md:pt-4">
              {col.description && (
                <div className="border-l border-border pl-5">
                  <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                    About {collectionName}
                  </p>
                  <ExpandableProse text={col.description} />
                </div>
              )}
              {/* Commentary + essay link grouped under the same border-l
                  rule. Essay link sits inside the Commentary container so
                  it indents to match the prose (pl-5 from the rule),
                  reading as a continuation of the Commentary voice rather
                  than a flush-left peer. When there's no Commentary, the
                  essay link renders on its own without the rule. */}
              {col.curatorNote && (
                <div className="border-l border-border pl-5">
                  <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                    Hivemind Commentary
                  </p>
                  <ExpandableProse
                    text={col.curatorNote}
                    threshold={400}
                    className="font-serif text-[16px] leading-[1.65] text-foreground-secondary whitespace-pre-line"
                  />
                  {col.essayUrl && (
                    <a
                      href={col.essayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-[13px] text-muted hover:text-foreground transition-colors duration-200 inline-block"
                    >
                      Read the essay
                      {col.essayTitle && (
                        <>
                          : <span className="underline underline-offset-4 decoration-border">{col.essayTitle}</span>
                        </>
                      )}{" "}
                      →
                    </a>
                  )}
                </div>
              )}
              {!col.curatorNote && col.essayUrl && (
                <a
                  href={col.essayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 inline-block"
                >
                  Read the essay
                  {col.essayTitle && (
                    <>
                      : <span className="underline underline-offset-4 decoration-border">{col.essayTitle}</span>
                    </>
                  )}{" "}
                  →
                </a>
              )}
              {col.artistStatement && (
                <div className="border-l border-border pl-5">
                  <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                    Artist Statement
                  </p>
                  {/* Threshold raised to 600 chars so single-paragraph
                      statements (Ringers ~500) render in full while
                      genuinely long ones (Human Unreadable, several
                      thousand chars across paragraphs) collapse to a
                      3-line preview behind Read more. whitespace-pre-line
                      preserves paragraph breaks when expanded. */}
                  <ExpandableProse
                    text={col.artistStatement}
                    threshold={600}
                    className="font-serif text-[16px] leading-[1.65] text-foreground-secondary whitespace-pre-line"
                  />
                </div>
              )}
            </div>
          ) : (
            col.description && (
              <div className="md:pt-4">
                <div className="border-l border-border pl-5">
                  <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
                    About {collectionName}
                  </p>
                  <ExpandableProse text={col.description} />
                </div>
              </div>
            )
          )}
        </div>

      {/* Gallery. */}
      <div className={`${traitFilter ? "pt-8" : "pt-6"} pb-12`}>
        {(() => {
          const heroLayout = getHeroLayout(slug);
          // Filtered view: bypass hero / fixed-row / single-piece layouts
          // (designed for the full set) and render a compact JustifiedGallery
          // so the subset reads as peers. Cap row height so a single match
          // doesn't render full-bleed; show captions so the catalogue
          // identifies each piece (no editorial header to reach into); pass
          // the active filter through so opened pieces can preserve it.
          // Empty-state branch: a reader who arrives via a stale share-link
          // to a filter that returns zero held pieces gets a real message
          // and a Clear affordance, not a silent empty grid.
          if (traitFilter) {
            if (pieces.length === 0) {
              return (
                <div className="max-w-[520px] text-[13px] text-muted">
                  <p>
                    No held pieces match{" "}
                    <span className="text-foreground">
                      {traitFilter.key}: <span className="font-medium">{traitFilter.value}</span>
                    </span>
                    .
                  </p>
                  <Link
                    href={`/collection/${slug}`}
                    className="mt-3 inline-block text-foreground-secondary hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors duration-200"
                  >
                    Clear filter
                  </Link>
                </div>
              );
            }
            const filterQs = `trait=${encodeURIComponent(traitFilter.key)}&value=${encodeURIComponent(traitFilter.value)}`;
            return (
              <JustifiedGallery
                pieces={pieces}
                piecesPerRow={ideal}
                maxRowHeight={420}
                showCaptions
                hrefSearch={filterQs}
              />
            );
          }
          if (n === 1 && heroImage && first) {
            return (
              <SinglePieceDisplay
                slug={first.slug}
                src={heroImage}
                title={first.title}
                isPunk={first.collectionSlug === "cryptopunks"}
              />
            );
          }
          if (heroLayout) {
            return (
              <HeroSidebarGallery
                pieces={pieces}
                heroSlug={heroLayout.heroPiece}
                sidebarCols={heroLayout.sidebarCols}
                sidebarRows={heroLayout.sidebarRows}
                sidebarSlugs={heroLayout.sidebarPieces}
                fallbackPerRow={ideal}
              />
            );
          }
          if (pieceRows && Object.keys(pieceRows).length > 0) {
            return <FixedRowGallery pieces={pieces} rowMap={pieceRows} fallbackPerRow={ideal} />;
          }
          return <JustifiedGallery pieces={pieces} piecesPerRow={ideal} />;
        })()}
      </div>

    </div>
  );
}
