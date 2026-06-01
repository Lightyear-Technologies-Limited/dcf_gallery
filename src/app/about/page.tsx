import Link from "next/link";
import { artists, collections, pieces } from "@/lib/data";
import { isCollectionHidden } from "@/lib/curation";
import { CHAPTERS } from "@/lib/chapters";

export default function AboutPage() {
  const visibleCollections = collections.filter((c) => !isCollectionHidden(c.slug));
  const visiblePieces = pieces.filter((p) => !isCollectionHidden(p.collectionSlug));
  const primaryArtists = artists.filter(
    (a) => a.slug !== "tyler-hobbs-and-dandelion-wist"
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">
      <div className="max-w-[680px] pt-[120px]">
        <h1 className="font-serif display">
          Digital Culture Fund
        </h1>
        <p className="text-[20px] text-foreground-secondary mt-8 leading-[1.6]">
          A curated portfolio of digital art&rsquo;s emergent canon, acquired
          after the first market cycle - when the artists, collections, and
          individual works that define the medium can be identified with the
          benefit of a full cycle of data.
        </p>
        <p className="text-[13px] text-muted mt-6 tabular-nums">
          {visiblePieces.length} works &middot; {primaryArtists.length} artists &middot; {visibleCollections.length} collections
        </p>
      </div>

      <div className="max-w-[680px] pt-20 space-y-10 text-[16px] text-foreground-secondary leading-[1.65]">
        <p>
          Every technological cycle mints a new class of wealth, and that wealth
          buys the art of its moment. Blockchain has redefined how digital art is
          owned, traded, and seen; online communities now influence the markets
          that price it.
        </p>
        <p>
          Hivemind launched the Fund deliberately late in the first cycle. A
          handful of artists and collections have broken out and now stand as
          the established canon - names that have survived the cycle and trade
          well below their peaks.
        </p>
      </div>

      <blockquote className="max-w-[680px] mx-auto text-center py-24">
        <p className="font-serif text-[28px] leading-relaxed tracking-tight text-foreground">
          Technology drives wealth. Wealth drives culture.
        </p>
      </blockquote>

      {/* Collecting Framework - reduced to the three pillars that actually
          differentiate. Accessibility cut (retail-flavoured pitch wrong for
          institutional reader); Power-Law moved to lead position as the only
          claim doing real positioning work. */}
      <div className="max-w-[680px] space-y-8">
        <h2 className="font-serif display-sm">Collecting Framework</h2>
        <div>
          <p className="text-[16px] font-medium text-foreground">Power-Law Concentration</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            As the medium matures, value concentrates in the collections,
            artists, and individual works that define each chapter. The
            portfolio is built deep rather than wide.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">End-State Curation</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            The portfolio is designed end-first. Collections and 1/1 pieces are
            chosen to fill specific chapters of digital culture, so the holdings
            compound into a single argument.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Institutional Structure</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Custody, security, and operational standards meet the requirements
            LPs apply to any other asset on their book. The fund is structured
            for a long-horizon, depth-over-volume approach to a less liquid
            asset class.
          </p>
        </div>
      </div>

      {/* Five chapters */}
      <div className="pt-24 pb-8">
        <h2 className="font-serif display-sm max-w-[680px]">Five chapters</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-4 max-w-[680px]">
          The ten artists in the fund are grouped into five chapters of digital
          art&rsquo;s first decades.
        </p>
        <div className="mt-12 space-y-10 max-w-[820px]">
          {CHAPTERS.map((ch) => (
            <div
              key={ch.slug}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] gap-3 md:gap-12 md:items-baseline"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ch.color }}
                />
                <h3
                  className="font-serif text-[22px] tracking-[-0.01em] leading-tight"
                  style={{ color: ch.color }}
                >
                  {ch.name}
                </h3>
              </div>
              <p className="text-[16px] text-foreground-secondary leading-[1.65]">
                {ch.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Practice - methodology drawn directly from the Hivemind making-of
          essay. Examples cited are all verified DCF holdings (White Mono
          Fidenzas, Return Zero, Slight Lack of Symmetry 1/4 + 2/4). */}
      <div className="max-w-[680px] pt-24 space-y-6">
        <h2 className="font-serif display-sm">Practice</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          Within a collection, the fund concentrates on the traits that define
          it. Tyler Hobbs&rsquo;s Fidenza series is held with a focus on the
          White Mono trait - pure white forms on a colored ground, the inverse
          of the standard Fidenza palette, and the variant that most clearly
          exposes the algorithm&rsquo;s drawing logic.
        </p>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          1/1s are acquired as keystones rather than standalone trophies. Tyler
          Hobbs&rsquo;s <em>Return Zero</em>, the precursor algorithm to Fidenza,
          sits alongside the Fidenza set. Dmitri Cherniak&rsquo;s <em>A Slight
          Lack of Symmetry Can Cause So Much Pain</em> sits alongside the deep
          Ringers position.
        </p>
      </div>

      {/* Hivemind closer - tightened firm bio, then a CTA row for the two
          natural next destinations (View Collection / Read Thesis), then a
          separately-labeled IR block. */}
      <div className="max-w-[680px] pt-24">
        <h2 className="font-serif display-sm">Hivemind Capital Partners</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-6">
          Hivemind is a crypto-focused investment firm with positions across
          infrastructure, applications, and culture. The Digital Culture Fund is
          Hivemind&rsquo;s vehicle for collecting the art of this period at
          institutional scale.
        </p>

        {/* Primary CTAs - View Collection routes to the gallery, Read Thesis
            links to the source essay on hivemind.capital. */}
        <div className="mt-10 flex flex-col sm:flex-row gap-6 sm:gap-10 text-[13px]">
          <Link
            href="/"
            className="text-foreground hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
          >
            View the Collection →
          </Link>
          <a
            href="https://www.hivemind.capital/content/the-making-of-the-digital-culture-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
          >
            Read the Thesis →
          </a>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">
            Investor Relations
          </p>
          <a
            href="mailto:investor.relations@hivemind.capital"
            className="text-[15px] text-foreground-secondary hover:text-foreground transition-colors duration-200 inline-block underline underline-offset-4 decoration-border hover:decoration-foreground mt-2 font-mono"
          >
            investor.relations@hivemind.capital
          </a>
        </div>

      </div>
    </div>
  );
}
