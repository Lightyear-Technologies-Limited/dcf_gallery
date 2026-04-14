import { notFound } from "next/navigation";
import { pieces, getArtist, getCollection, getPiecesByCollection } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import PlaceholderArt from "@/components/PlaceholderArt";
import ArtworkCard from "@/components/ArtworkCard";
import BackButton from "@/components/BackButton";
import PieceLayout from "@/components/PieceLayout";
import Link from "next/link";

export function generateStaticParams() {
  return pieces.map((p) => ({ slug: p.slug }));
}

export default async function PiecePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const piece = pieces.find((p) => p.slug === slug);
  if (!piece) notFound();

  const artist = getArtist(piece.artistSlug);
  const collection = getCollection(piece.collectionSlug);
  const colPieces = getPiecesByCollection(piece.collectionSlug);
  const more = colPieces.filter((p) => p.id !== piece.id).slice(0, 4);
  const realImage = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "detail");
  const isPunk = piece.collectionSlug === "cryptopunks";

  const rasterUrl = piece.contractAddress && piece.tokenId
    ? `https://www.raster.art/token/ethereum/${piece.contractAddress}/${piece.tokenId}`
    : undefined;

  const metadata = (
    <div className="space-y-0 text-[13px]">
      {piece.tokenId && (
        <div className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">Token ID</span>
          <span className="font-mono tabular-nums">{piece.tokenId}</span>
        </div>
      )}
      {piece.contractAddress && (
        <div className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">Contract</span>
          <span className="font-mono">{piece.contractAddress.slice(0, 6)}...{piece.contractAddress.slice(-4)}</span>
        </div>
      )}
      {piece.mintDate && (
        <div className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">Minted</span>
          <span>{piece.mintDate}</span>
        </div>
      )}
      {Object.entries(piece.traits).map(([k, v]) => (
        <div key={k} className="flex justify-between py-2.5 border-b border-border">
          <span className="text-muted">{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
      <BackButton />
      <div className="pt-6">
        <PieceLayout
          image={realImage}
          title={piece.title}
          isPunk={isPunk}
          artistName={artist?.name}
          artistSlug={artist?.slug}
          collectionName={collection?.name}
          collectionSlug={collection?.slug}
          metadata={metadata}
          rasterUrl={rasterUrl}
          placeholder={<PlaceholderArt collectionSlug={piece.collectionSlug} pieceSlug={piece.slug} className="w-full h-full" />}
        />
      </div>

      {/* More from collection */}
      {more.length > 0 && (
        <div className="pt-20 pb-8">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-[20px] tracking-[-0.01em]">More from {collection?.name}</h2>
            {collection && (
              <Link href={`/collection/${collection.slug}`} className="text-[13px] text-muted hover:text-foreground transition-colors duration-200">
                View all &rarr;
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {more.map((p) => (
              <ArtworkCard key={p.id} piece={p} showArtist={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
