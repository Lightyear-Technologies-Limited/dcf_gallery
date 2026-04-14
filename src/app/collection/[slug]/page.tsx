import { notFound } from "next/navigation";
import Link from "next/link";
import { collections, getArtist, getPiecesByCollection } from "@/lib/data";
import ArtworkCard from "@/components/ArtworkCard";
import CuratorNote from "@/components/CuratorNote";

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const col = collections.find((c) => c.slug === slug);
  if (!col) notFound();

  const artist = getArtist(col.artistSlug);
  const works = getPiecesByCollection(slug);
  const useLarge = works.length < 12;

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">

      {/* Header */}
      <div className="pt-[120px]">
        <p className="text-[13px] text-muted mb-8">
          <Link href="/" className="hover:text-foreground transition-colors duration-200">Collection</Link>
          {artist && <> / <Link href={`/artist/${artist.slug}`} className="hover:text-foreground transition-colors duration-200">{artist.name}</Link></>}
          {" "}/ {col.name}
        </p>
        <h1 className="font-serif text-[48px] tracking-tight leading-[0.95]">
          {col.name}
        </h1>
        {artist && (
          <Link href={`/artist/${artist.slug}`} className="text-[16px] text-muted hover:text-foreground transition-colors duration-200 mt-2 inline-block">
            {artist.name}
          </Link>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-8 pt-12 text-[13px] text-muted">
        <span>{works.length} works</span>
        <span className="capitalize">{col.medium}</span>
        {col.mintDate && <span>Minted {col.mintDate}</span>}
        {col.contractAddress && <span className="font-mono">{col.contractAddress.slice(0, 6)}...{col.contractAddress.slice(-4)}</span>}
      </div>

      {/* Editorial */}
      {(col.description || col.curatorNote) && (
        <div className="max-w-[680px] pt-12 space-y-8">
          {col.description && (
            <p className="text-[16px] text-foreground-secondary leading-relaxed">{col.description}</p>
          )}
          {col.curatorNote && (
            <CuratorNote text={col.curatorNote} variant="inline" />
          )}
        </div>
      )}

      {/* Works */}
      <div className="pt-20">
        <h2 className="text-[24px] tracking-[-0.01em]">Works <span className="text-muted font-mono text-[13px] ml-2">{works.length}</span></h2>
        <div className={`mt-8 grid gap-4 ${useLarge ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
          {works.map((p) => (
            <ArtworkCard key={p.id} piece={p} showArtist={false} />
          ))}
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
