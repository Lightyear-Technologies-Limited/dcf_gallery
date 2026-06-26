import Link from "next/link";
import { CHAPTERS } from "@/lib/chapters";

export default function AboutPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
      {/* Hero — masthead + Thesis lede mirror the Artists and Chapters
          index-page structure exactly:
            pt-6 on the outer container
            h1 (display-sm) direct child
            mt-6 mb-8 max-w-2xl wrapper around h2 + lede
            h2 (display-sm) + mb-5
            lede at text-[17px] sm:text-[18px], same secondary register
          Same wrapper, same scale, same gap below across all three
          index pages so the masthead → subject → lede rhythm doesn't
          shift between them. */}
      <h1 className="font-serif display-sm">
        Hivemind Digital Culture Fund
      </h1>
      <div className="mt-6 mb-8 max-w-2xl">
        <h2 className="font-serif display-sm mb-5">Thesis</h2>
        <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
          Hivemind Digital Culture Fund is a curated portfolio of digital
          art&rsquo;s emergent canon, acquired after the first market cycle -
          when the artists, collections, and individual works that define the
          medium can be identified with the benefit of historical context and
          data.
        </p>
      </div>

      {/* Cycle-timing context - paraphrases the "Technology Drives Wealth" and
          "A Fund is Born" sections of the source thesis. */}
      <div className="max-w-[680px] space-y-6 text-[16px] text-foreground-secondary leading-[1.65]">
        <p>
          Technological advancements have consistently created new wealth, and
          with it a new class of investors and collectors looking for art that
          resonates with the cultural moment. The Ethereum blockchain has
          redefined how digital art is created, owned, traded, and seen, and
          online communities now drive its value.
        </p>
        <p>
          With the first major market cycle for digital art now past, in 2024
          Hivemind began deliberately acquiring works by those established
          artists who had survived the cycle and whose work traded well below
          its peaks. Today, the collection is comprehensive and targeted, with
          grail works by many of the medium&rsquo;s defining names.
        </p>
      </div>

      {/* Pull-quote: left-aligned with the body column (max-w-[680px], no
          mx-auto) so it doesn't appear shifted right of the prose on wide
          screens. Museum-wall treatment - serif italic with a hairline
          border-l indent rule - earns its bigger size and signals it's
          the thesis's defining beat. */}
      <blockquote className="max-w-[680px] py-12">
        <p className="font-serif italic text-[28px] sm:text-[32px] leading-snug tracking-tight text-foreground border-l border-border pl-6">
          Technology drives wealth. Wealth drives culture.
        </p>
      </blockquote>

      {/* Working Backwards - the thesis's defining methodology. Paraphrased
          from the "Working Backwards: End State" section, with the count
          updated to reflect the portfolio's actual ten-artist shape rather
          than the thesis's aspirational 6-10 core collections target. */}
      <div className="max-w-[680px] space-y-6">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">Working Backwards</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          For an illiquid asset class, the most desirable end state has to be
          defined first, then the plan to reach it works backward from there.
          Hivemind is built around ten artists, each anchoring a chapter of
          digital art&rsquo;s first decades. Within each chapter, collections
          are acquired deep rather than wide, and 1/1 pieces are added to
          elevate the curation of specific movements.
        </p>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          Value in this medium is expected to follow a power-law rather than a
          linear distribution, concentrating in the works, artists, and
          collections that define each chapter. The portfolio is built for that
          geometry.
        </p>
      </div>

      {/* The Curation - mirrors the thesis section of the same name. Three
          subsections (Artist and Collection / Trait Concentration / 1/1
          Keystones) compress the thesis's six subheadings into the ones that
          matter for a public reader; examples are verified DCF holdings
          (White Mono Fidenza, Return Zero, A Slight Lack of Symmetry). */}
      <div className="max-w-[680px] pt-12 space-y-6">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">The Curation</h2>
        <div>
          <p className="text-[16px] font-medium text-foreground">Artist and Collection</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Digital art sits within Contemporary Art, where the actions of a
            living artist still shape an artwork&rsquo;s enduring value. An
            artist with the right profile is necessary but not sufficient; the
            collection must also be significant within its chapter. Hivemind
            approves blue-chip collections from blue-chip artists, not artists
            wholesale.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Trait Concentration</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Within a collection, Hivemind leans into desirable traits when
            pricing is opportunistic. For example, Tyler Hobbs&rsquo;s Fidenza
            series is held with a focus on the White Mono trait - pure white
            forms on a colored ground, the inverse of the standard Fidenza
            palette, and the variant that most clearly exposes the
            algorithm&rsquo;s drawing logic.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">1/1 Keystones</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            1/1s are acquired as keystones, not standalone trophies. Tyler
            Hobbs&rsquo;s <em>Return Zero</em>, the precursor algorithm to
            Fidenza, sits alongside the Fidenza set. Dmitri Cherniak&rsquo;s{" "}
            <em>A Slight Lack of Symmetry Can Cause So Much Pain</em> sits
            alongside the deep Ringers position. Each 1/1 is chosen because it
            completes a thread that runs through the rest of the curation.
          </p>
        </div>
      </div>

      {/* Five Chapters */}
      <div className="pt-12 pb-8">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight max-w-[680px]">Five Chapters</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-4 max-w-[680px]">
          The ten artists are grouped into five chapters of digital
          art&rsquo;s first decades.
        </p>
        <div className="mt-8 space-y-6 max-w-[1000px]">
          {CHAPTERS.map((ch) => (
            <div
              key={ch.slug}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] gap-6 md:gap-8 md:items-baseline"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full shrink-0 bg-foreground"
                />
                <h3 className="font-serif text-[22px] tracking-[-0.01em] leading-tight">
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

      {/* Hivemind closer - firm bio with the institutional-structure language
          folded in (custody / standards), then CTAs to gallery + source essay,
          then a separately-labelled IR block. */}
      <div className="max-w-[680px] pt-12">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">Hivemind Capital Partners</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-6">
          Hivemind Capital Partners is a crypto-focused investment firm with
          positions across infrastructure, applications, and culture. The
          Digital Culture Fund is the firm&rsquo;s vehicle for collecting the
          art of this period - held to the custody, security, and operational
          standards LPs apply to any other asset on their book.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-6 sm:gap-10 text-[13px]">
          <Link
            href="/"
            className="text-foreground hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
          >
            View the Collection
          </Link>
          <a
            href="https://www.hivemind.capital/content/the-making-of-the-digital-culture-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
          >
            Read the Thesis
          </a>
        </div>

        <div className="mt-8 border-t border-border pt-6">
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
