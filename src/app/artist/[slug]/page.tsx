import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { artists, getCollectionsByArtist, getPiecesByArtist, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import PlaceholderArt from "@/components/PlaceholderArt";
import ArtworkCard from "@/components/ArtworkCard";
import CuratorNote from "@/components/CuratorNote";

export function generateStaticParams() {
  return artists.map((a) => ({ slug: a.slug }));
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((a) => a.slug === slug);
  if (!artist) notFound();

  const cols = getCollectionsByArtist(slug);
  const works = getPiecesByArtist(slug);

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">

      {/* Name */}
      <div className="pt-[120px]">
        <h1 className="font-serif text-[48px] sm:text-[64px] lg:text-[72px] tracking-[-0.02em] leading-[0.95]">
          {artist.name}
        </h1>
        {artist.tags.length > 0 && (
          <p className="text-[13px] text-muted mt-2">
            {artist.tags.join(" · ")}
          </p>
        )}
        {(artist.website || artist.twitter || artist.instagram) && (
          <div className="flex gap-6 mt-4 text-[13px]">
            {artist.website && <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">Website</a>}
            {artist.twitter && <a href={artist.twitter} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">Twitter</a>}
            {artist.instagram && <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200">Instagram</a>}
          </div>
        )}
      </div>

      {/* Bio + Curator's note — two column */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-16 pt-20">
        <div>
          {artist.bio ? (
            <p className="text-[16px] text-foreground-secondary leading-relaxed">{artist.bio}</p>
          ) : (
            <p className="text-[13px] text-muted italic">Artist biography forthcoming.</p>
          )}
        </div>
        {artist.curationComment && (
          <aside>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-4">Why DCF Holds This Work</p>
            <p className="font-serif text-[16px] leading-relaxed text-foreground-secondary italic">{artist.curationComment}</p>
          </aside>
        )}
      </div>

      {/* Artist Quote */}
      {artist.artistQuote && (
        <CuratorNote text={artist.artistQuote} attribution={artist.name} variant="pullquote" />
      )}

      {/* Collections */}
      <div className="pt-20">
        <h2 className="text-[24px] tracking-[-0.01em]">Collections <span className="text-muted font-mono text-[13px] ml-2">{cols.length}</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-12 mt-8">
          {cols.map((col) => {
            const colPieces = getPiecesByCollection(col.slug);
            const first = colPieces[0];
            return (
              <Link key={col.slug} href={`/collection/${col.slug}`} className="block group">
                <div className="aspect-[4/3] bg-surface overflow-hidden relative">
                  {first && (() => {
                    const img = getArtworkImage(first.slug);
                    return img ? (
                      <Image src={img} alt={col.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
                    ) : (
                      <PlaceholderArt collectionSlug={col.slug} pieceSlug={first.slug} />
                    );
                  })()}
                </div>
                <div className="mt-4">
                  <p className="text-[13px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200">{col.name}</p>
                  <p className="text-[13px] text-muted">{colPieces.length} works &middot; {col.medium}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* All works */}
      <div className="pt-12">
        <h2 className="text-[24px] tracking-[-0.01em]">Works <span className="text-muted font-mono text-[13px] ml-2">{works.length}</span></h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {works.map((p) => (
            <ArtworkCard key={p.id} piece={p} showArtist={false} />
          ))}
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
