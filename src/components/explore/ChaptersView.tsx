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
 * Chapters view (E.3) — the cinematic entry. Each curatorial chapter is a
 * full-height title card with a refined filmstrip of its works. Restrained
 * (Argent titles, no colour accent); static — the big titles carry the
 * cinema, no decorative entrance motion. The filmstrip itself is the only
 * client-side surface (ChapterFilmstrip handles scroll + chevrons).
 */
export default function ChaptersView({ chapters }: { chapters: ChapterData[] }) {
  return (
    <div className="relative">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12">
        {chapters.map((c, i) => (
          <section
            key={c.slug}
            // Consistent top/bottom padding between chapters, no min-height
            // — the earlier "full-height title card" treatment (min-h-[78vh]
            // + vertical centering) left large dead bands above and below
            // each chapter that didn't match the density of the rest of
            // the site.
            className={`border-b border-border last:border-b-0 ${
              i === 0 ? "pt-2 pb-14" : "py-14"
            }`}
          >
            <div>
              {/* Per-chapter title at text-[32px] sm:text-[40px] - same
                  register as artist names on the Artists index, the
                  artist credit on the Collection page, and the body-
                  section H2s on the Thesis page. Site-wide subject-tier
                  heading. */}
              <h3 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight mb-5">{roman[i]}. {c.name}</h3>
              <p className="max-w-2xl text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary mb-3">
                {c.description}
              </p>
              <p className="text-[12px] text-muted tabular-nums">
                {c.artists.map((a, j) => (
                  <span key={a.slug}>
                    {j > 0 && " · "}
                    <Link
                      href={`/artist/${a.slug}`}
                      className="hover:text-foreground transition-colors duration-200"
                    >
                      {a.name}
                    </Link>
                  </span>
                ))}
              </p>
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium tabular-nums mt-2 mb-9">
                {c.total} {c.total === 1 ? "work" : "works"}
              </p>

              <ChapterFilmstrip name={c.name} works={c.works} />

              <Link
                href={`/?chapter=${c.slug}`}
                className="mt-7 inline-flex items-center gap-2 text-[13px] text-foreground-secondary hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
              >
                View all in {c.name}
                <span aria-hidden className="no-underline">→</span>
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
