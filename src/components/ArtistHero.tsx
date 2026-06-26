import Link from "next/link";
import Image from "next/image";

interface Candidate {
  src: string;
  title: string;
  isPunk: boolean;
}

interface Props {
  artistSlug: string;
  candidates: Candidate[];
  /** width/height. Defaults to 1 (square). Punks always render square
   *  regardless. When the supplied aspect matches the piece's intrinsic
   *  aspect (fit-to-the-art), the image fills the frame exactly. When
   *  it doesn't (Kim Asendorf's dynamic Lights forced to 1:1), the
   *  object-cover crops to fill rather than compressing. */
  aspect?: number;
}

export default function ArtistHero({ artistSlug, candidates, aspect = 1 }: Props) {
  if (candidates.length === 0) return null;
  const hero = candidates[0];
  const frameAspect = hero.isPunk ? 1 : aspect;

  return (
    <Link
      href={`/artist/${artistSlug}`}
      style={{ aspectRatio: String(frameAspect) }}
      className="block w-full overflow-hidden"
    >
      {hero.isPunk ? (
        <div className="w-full h-full bg-punk flex items-center justify-center overflow-hidden">
          <Image
            src={hero.src}
            alt={hero.title}
            width={1200}
            height={1200}
            className="max-w-full max-h-full w-auto h-auto [image-rendering:pixelated]"
            sizes="(max-width: 768px) 90vw, 50vw"
          />
        </div>
      ) : (
        <Image
          src={hero.src}
          alt={hero.title}
          width={1200}
          height={1200}
          className="w-full h-full object-cover"
          sizes="(max-width: 768px) 90vw, 50vw"
        />
      )}
    </Link>
  );
}
