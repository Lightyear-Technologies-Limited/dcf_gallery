import Link from "next/link";
import ChapterFilmstrip from "./ChapterFilmstrip";

interface Work {
  id: string;
  slug: string;
  title: string;
  collectionSlug: string;
  artistName: string;
  artistSlug?: string;
  contractAddress?: string;
  tokenId?: string;
}
interface ChapterData {
  slug: string;
  name: string;
  description: string;
  total: number;
  artists: { slug: string; name: string }[];
  works: Work[];
}

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

/**
 * Chapters index. Each chapter renders as a titled section with its
 * artists listed and a horizontal filmstrip of works underneath.
 * Restrained — Argent titles, no color accent per chapter (unlike the
 * home page filter chip which does use the chapter color).
 */
export default function ChaptersView({ chapters }: { chapters: ChapterData[] }) {
  return (
    <div className="relative">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        {chapters.map((c, i) => (
          <section
            key={c.slug}
            className={`border-b border-border last:border-b-0 ${i === 0 ? "pt-2 pb-14" : "py-14"}`}
          >
            <div>
              <h3 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight mb-5">
                {roman[i]}. {c.name}
              </h3>
              <p className="max-w-2xl text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary mb-3">
                {c.description}
              </p>
              <p className="text-[12px] text-muted mb-9 tabular-nums">
                {c.artists.map((a, j) => (
                  <span key={a.slug}>
                    {j > 0 && " · "}
                    <Link href={`/artist/${a.slug}`} className="hover:text-foreground transition-colors duration-200">
                      {a.name}
                    </Link>
                  </span>
                ))}
                {" - "}
                <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums">
                  {c.total} {c.total === 1 ? "work" : "works"}
                </span>
              </p>

              <ChapterFilmstrip name={c.name} works={c.works} />

              <Link
                href={`/?chapter=${c.slug}`}
                className="mt-7 inline-flex items-center gap-2 text-[10px] tracking-[0.1em] uppercase text-muted font-medium hover:text-foreground transition-colors duration-200 tabular-nums"
              >
                View all in {c.name}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
