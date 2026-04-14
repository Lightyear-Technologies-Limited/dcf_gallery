import Link from "next/link";
import Image from "next/image";
import { type Piece, getArtist } from "@/lib/data";
import { getArtworkImage } from "@/lib/images";
import PlaceholderArt from "./PlaceholderArt";

export default function ArtworkCard({ piece, showArtist = true }: {
  piece: Piece;
  showArtist?: boolean;
}) {
  const artist = getArtist(piece.artistSlug);
  const realImage = getArtworkImage(piece.slug, piece.contractAddress, piece.tokenId, "thumb");
  const isPunk = piece.collectionSlug === "cryptopunks";

  return (
    <Link href={`/piece/${piece.slug}`} className="block group">
      {realImage ? (
        <div className={isPunk ? "bg-[#638596] inline-block" : ""}>
          <Image
            src={realImage}
            alt={piece.title}
            width={400}
            height={400}
            className={`block w-full h-auto ${isPunk ? "[image-rendering:pixelated] max-w-[80px]" : ""}`}
            sizes="200px"
          />
        </div>
      ) : (
        <div className="aspect-square">
          <PlaceholderArt collectionSlug={piece.collectionSlug} pieceSlug={piece.slug} />
        </div>
      )}
      <div className="mt-2">
        {showArtist && artist && (
          <p className="text-[13px] text-foreground">{artist.name}</p>
        )}
        <p className="text-[13px] text-muted">{piece.title}</p>
      </div>
    </Link>
  );
}
