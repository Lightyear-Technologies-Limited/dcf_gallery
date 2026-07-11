import { notFound } from "next/navigation";
import Link from "next/link";
import { collections, getArtist, getPiecesByCollection } from "@/lib/data";
import { withCollectionEditorial } from "@/lib/editorial-helpers";
import { getArtworkImage } from "@/lib/images";
import {
  getArtistDisplayName,
  getCollectionDisplayName,
  sortPieces,
  isCollectionHidden,
  getPiecesPerRow,
  getPieceRows,
  getHeroLayout,
  getEditionType,
  getPieceTraits,
  CLICKABLE_TRAITS,
  SYNTHETIC_TRAIT_GROUPS,
  isTraitClickable,
  getTraitGlobalCount,
} from "@/lib/curation";
import JustifiedGallery from "@/components/JustifiedGallery";
import FixedRowGallery from "@/components/FixedRowGallery";
import HeroSidebarGallery from "@/components/HeroSidebarGallery";
import SinglePieceDisplay from "@/components/SinglePieceDisplay";
import CopyableHash from "@/components/CopyableHash";
import ScrollRestore from "@/components/ScrollRestore";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ trait?: string; value?: string; set?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const col = withCollectionEditorial(collections.find((c) => c.slug === slug));
  if (!col) notFound();
  if (isCollectionHidden(slug)) notFound();

  const artist = getArtist(col.artistSlug);
  const collectionName = getCollectionDisplayName(col.slug, col.name);
  const artistName = artist ? getArtistDisplayName(artist.slug, artist.name) : null;

  const rawPieces = getPiecesByCollection(slug);
  const sorted = sortPieces(slug, rawPieces);
  const isSetFilter = sp.set === "1";
  const traitFilter = sp.trait && sp.value ? { key: sp.trait, value: sp.value } : null;
  const editionType = getEditionType(slug);

  // Apply trait filter
  let pieces = traitFilter
    ? sorted.filter((p) => {
        const t = getPieceTraits(p.slug);
        return t?.some(([k, v]) => {
          if (k !== traitFilter.key) return false;
          if (Array.isArray(v)) return v.some((x) => String(x) === traitFilter.value);
          return String(v) === traitFilter.value;
        });
      })
    : sorted;

  // Set reduction — only when isSetFilter
  const activeSetValue = traitFilter && isSetFilter
    ? SYNTHETIC_TRAIT_GROUPS[slug]?.flatMap((g) => g.values)
        .find((v) => v.key === traitFilter.key && v.value === traitFilter.value)
    : undefined;
  if (activeSetValue?.pieces?.length) {
    const bySlug = new Map(pieces.map((p) => [p.slug, p]));
    pieces = activeSetValue.pieces.map((s) => bySlug.get(s)).filter((p): p is (typeof pieces)[number] => !!p);
  }

  // Facet aggregation for the Browse-by-trait disclosure
  const facets = new Map<string, Map<string, number>>();
  for (const p of sorted) {
    const t = getPieceTraits(p.slug);
    if (!t) continue;
    for (const [key, val] of t) {
      const values = Array.isArray(val) ? val.map(String) : [String(val)];
      if (!facets.has(key)) facets.set(key, new Map());
      const valMap = facets.get(key)!;
      for (const v of values) valMap.set(v, (valMap.get(v) || 0) + 1);
    }
  }

  const spec = CLICKABLE_TRAITS[slug];
  const buildVisible = (key: string, values: Map<string, number>): [string, number][] => {
    const rule = spec?.[key];
    if (rule === undefined) return [];
    const sortedValues = [...values.entries()].sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])));
    if (rule === "all") return sortedValues;
    const set = new Set(rule);
    const orderIndex = new Map(rule.map((v, i) => [v, i]));
    return sortedValues.filter(([v]) => set.has(v)).sort((a, b) => (orderIndex.get(a[0])! - orderIndex.get(b[0])!));
  };

  const renderLink = (key: string, val: string, count: number) => {
    const active = !isSetFilter && traitFilter?.key === key && traitFilter?.value === val;
    const global = getTraitGlobalCount(slug, key, val);
    return (
      <Link key={val}
        href={`/collection/${slug}?trait=${encodeURIComponent(key)}&value=${encodeURIComponent(val)}`}
        className={`inline-flex items-baseline gap-1.5 transition-colors duration-200 underline underline-offset-4 ${
          active ? "text-foreground font-medium decoration-foreground" : "text-foreground-secondary hover:text-foreground decoration-border hover:decoration-foreground"
        }`}
        aria-current={active ? "page" : undefined}
      >
        <span>{val}</span>
        <span className="text-[11px] tabular-nums no-underline">
          <span className={active ? "text-foreground" : count > 1 ? "text-muted" : "text-muted/40"}>{count}</span>
          {global !== null && <span className="text-muted/40">/{global.toLocaleString()}</span>}
        </span>
      </Link>
    );
  };

  const traitRows: React.ReactNode[] = [];
  for (const [key, values] of facets.entries()) {
    const visible = buildVisible(key, values);
    if (!visible.length) continue;
    traitRows.push(
      <div key={`r-${key}`} className="grid grid-cols-[80px_1fr] items-baseline gap-x-4 gap-y-1">
        <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">{key}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">{visible.map(([v, c]) => renderLink(key, v, c))}</div>
      </div>,
    );
  }
  for (const group of SYNTHETIC_TRAIT_GROUPS[slug] ?? []) {
    const entries = group.values
      .map((v) => ({ ...v, count: v.pieces ? v.pieces.length : Math.min(facets.get(v.key)?.get(v.value) ?? 0, 3) }))
      .filter((v) => v.count > 0);
    if (!entries.length) continue;
    traitRows.push(
      <div key={`s-${group.label}`} className="grid grid-cols-[80px_1fr] items-baseline gap-x-4 gap-y-1">
        <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">{group.label}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {entries.map((e) => {
            const active = isSetFilter && traitFilter?.key === e.key && traitFilter?.value === e.value;
            return (
              <Link key={`${e.key}:${e.value}`}
                href={`/collection/${slug}?trait=${encodeURIComponent(e.key)}&value=${encodeURIComponent(e.value)}&set=1`}
                className={`inline-flex items-baseline gap-1.5 transition-colors duration-200 underline underline-offset-4 ${
                  active ? "text-foreground font-medium decoration-foreground" : "text-foreground-secondary hover:text-foreground decoration-border hover:decoration-foreground"
                }`}
              >
                <span>{e.label}</span>
                <span className="text-[11px] tabular-nums no-underline"><span className={active ? "text-foreground" : "text-muted"}>{e.count}</span></span>
              </Link>
            );
          })}
        </div>
      </div>,
    );
  }

  const traitDisclosure = traitRows.length > 0 ? (
    <div className="max-w-[520px]">
      <div className="flex items-baseline gap-3">
        <details className="group [&_summary::-webkit-details-marker]:hidden" open={!!traitFilter}>
          <summary className="cursor-pointer list-none text-[10px] tracking-[0.1em] uppercase text-muted font-medium hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2 select-none">
            <span>Browse by trait</span>
            <span aria-hidden className="inline-block transition-transform duration-200 group-open:rotate-90">&rsaquo;</span>
          </summary>
          <div className="mt-3 max-w-[520px] space-y-2 text-[12px]">{traitRows}</div>
        </details>
        {traitFilter && (
          <Link href={`/collection/${slug}`} aria-label="Clear filter"
            className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium hover:text-foreground transition-colors duration-200 self-start">
            Clear
          </Link>
        )}
      </div>
    </div>
  ) : null;

  const heroLayout = getHeroLayout(slug);
  const first = sorted[0];
  const n = pieces.length;
  const heroImage = !traitFilter && n === 1 && first
    ? getArtworkImage(first.slug, first.contractAddress, first.tokenId, "detail")
    : null;

  const ideal = getPiecesPerRow(slug) ?? (n <= 3 ? Math.max(n, 1) : n <= 6 ? 3 : n <= 12 ? 4 : 5);
  const pieceRows = getPieceRows(slug);

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
      <ScrollRestore />
      <div className="pt-8">
        <p className="text-[13px] text-muted">
          <Link href="/" className="hover:text-foreground transition-colors duration-200">Collection</Link>
        </p>
      </div>
      <div className="grid md:grid-cols-[45fr_55fr] gap-8 md:gap-16 pt-6">
        <div>
          <div className="flex items-baseline gap-2.5">
            <h1 className="font-serif display-sm">{collectionName}</h1>
            {!col.totalSupply && (
              <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums">
                {sorted.length} {sorted.length === 1 ? "work" : "works"}
              </span>
            )}
          </div>
          {artist && (
            <Link href={`/artist/${artist.slug}`} className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight hover:opacity-60 transition-opacity duration-200 mt-3 inline-block">
              {artistName}
            </Link>
          )}

          <div className="mt-8">
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">Collection details</p>
            <div className="space-y-1 text-[13px] text-muted tabular-nums">
              {col.totalSupply !== undefined && col.totalSupply > 1 && <p>{editionType}</p>}
              {col.contractAddress && (
                <p className="inline-flex items-baseline gap-x-2"><span>Contract:</span><CopyableHash value={col.contractAddress} /></p>
              )}
              {col.totalSupply && (
                <p>Hivemind holds {sorted.length} {sorted.length === 1 ? "work" : "works"}</p>
              )}
              {col.mintDate && <p>Minted {col.mintDate}</p>}
              {col.platform && <p>{col.platform}</p>}
            </div>
          </div>

          {col.exhibitions && col.exhibitions.length > 0 && (
            <div className="mt-6 max-w-[420px]">
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">Exhibitions</p>
              <ul className="space-y-1 text-[13px] leading-snug">
                {col.exhibitions.map((ex, i) => (
                  <li key={i}>
                    <span className="text-muted tabular-nums">{ex.date}</span>
                    <span className="text-muted"> — </span>
                    <span className="font-serif italic text-foreground-secondary">{ex.title}</span>
                    {ex.location && <span className="text-foreground-secondary">, {ex.location}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {traitDisclosure && <div className="mt-6">{traitDisclosure}</div>}
        </div>

        {col.curatorNote && (
          <div className="space-y-6 md:pt-4">
            <div className="border-l border-border pl-5">
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">Hivemind commentary</p>
              <p className="font-serif text-[16px] leading-[1.65] text-foreground-secondary whitespace-pre-line">{col.curatorNote}</p>
              {col.essayUrl && (
                <a href={col.essayUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 text-[13px] text-muted hover:text-foreground transition-colors duration-200 block">
                  Read the essay{col.essayTitle && <>: <span className="underline underline-offset-4 decoration-border">{col.essayTitle}</span></>} →
                </a>
              )}
              {col.context?.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 text-[13px] text-muted hover:text-foreground transition-colors duration-200 block">
                  {l.label} →
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 pb-24">
        {pieces.length === 0 ? (
          <div className="max-w-[520px] text-[13px] text-muted">
            <p>No held pieces match {traitFilter?.key}: <span className="font-medium">{traitFilter?.value}</span>.</p>
            <Link href={`/collection/${slug}`} className="mt-3 inline-block text-foreground-secondary hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors duration-200">Clear filter</Link>
          </div>
        ) : n === 1 && heroImage && first ? (
          <SinglePieceDisplay slug={first.slug} src={heroImage} title={first.title} isPunk={first.collectionSlug === "cryptopunks"} />
        ) : heroLayout && !traitFilter ? (
          <HeroSidebarGallery pieces={pieces} heroSlug={heroLayout.heroPiece} sidebarCols={heroLayout.sidebarCols} sidebarRows={heroLayout.sidebarRows} sidebarSlugs={heroLayout.sidebarPieces} />
        ) : pieceRows && !traitFilter ? (
          <FixedRowGallery pieces={pieces} pieceRows={pieceRows} />
        ) : (
          <JustifiedGallery pieces={pieces} piecesPerRow={ideal} showCaptions={!!traitFilter} />
        )}
      </div>
    </div>
  );
}
