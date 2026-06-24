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
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
        {chapters.map((c, i) => (
          <section
            key={c.slug}
            // First chapter is TOP-anchored (justify-start + pt-6) so its title
            // sits 24px under the masthead — the same masthead→subtitle rhythm as
            // the Artists ("Artists") and About ("Thesis") pages, so the heading
            // doesn't jump when moving between index pages. Chapters 2+ keep the
            // cinematic full-height vertical centering as you scroll the procession.
            className={`min-h-[78vh] flex flex-col border-b border-border last:border-b-0 ${
              i === 0 ? "justify-start pt-6 pb-16" : "justify-center py-16"
            }`}
          >
            <div>
              <h2 className="font-serif display-lg leading-[0.95] mb-5">{roman[i]}. {c.name}</h2>
              <p className="max-w-2xl text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary mb-3">
                {c.description}
              </p>
              <p className="text-[12px] text-muted mb-9 tabular-nums">
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
                {" - "}
                {c.total} {c.total === 1 ? "work" : "works"}
              </p>

              <ChapterFilmstrip name={c.name} works={c.works} />

              <Link
                href={`/?chapter=${c.slug}`}
                className="mt-7 inline-flex items-center gap-2 text-[11px] tracking-[0.12em] uppercase text-muted hover:text-foreground transition-colors duration-200 tabular-nums"
              >
                View all {c.total} in {c.name}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
