import Link from "next/link";
import type { Metadata } from "next";
import { CHAPTERS } from "@/lib/chapters";

export const metadata: Metadata = {
  title: "Thesis",
  description:
    "The Hivemind Digital Culture Fund thesis: technology drives wealth, wealth drives culture. Ten artists, five chapters, held to institutional standards.",
  openGraph: {
    title: "Thesis",
    description:
      "The Hivemind Digital Culture Fund thesis: technology drives wealth, wealth drives culture.",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
      {/* Fund name as small-caps eyebrow, subject as H1. Each index page
          leads with its own subject so the reader doesn't see the same H1
          on every page. */}
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">
        Hivemind Digital Culture Fund
      </p>
      <h1 className="font-serif display-sm mt-3">Thesis</h1>
      <div className="mt-6 mb-8 max-w-2xl">
        <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
          Hivemind Digital Culture Fund is a curated portfolio of digital
          art&rsquo;s emergent canon, acquired after the first market cycle.
          The artists, collections, and individual works that define the
          medium can now be identified with the clarity of historical context.
        </p>
      </div>

      {/* Cycle-timing context. */}
      <div className="max-w-[680px] space-y-6 text-[16px] text-foreground-secondary leading-[1.65]">
        <p>
          Every technological advance creates new wealth, and with it a new
          generation of collectors looking for art that speaks to their
          cultural moment. The Ethereum blockchain has redefined how digital
          art is created, owned, traded, and seen; online communities now set
          its value.
        </p>
        <p>
          In 2024, with the first major market cycle for digital art behind
          it, Hivemind began acquiring the artists who had survived at prices
          set by the reset. Today, the collection is comprehensive and
          targeted, with defining works across many of the medium&rsquo;s
          canonical names.
        </p>
      </div>

      {/* Pull-quote — museum-wall treatment, defines the thesis's central beat. */}
      <blockquote className="max-w-[680px] py-12">
        <p className="font-serif italic text-[28px] sm:text-[32px] leading-snug tracking-tight text-foreground border-l border-border pl-6">
          Technology drives wealth. Wealth drives culture.
        </p>
      </blockquote>

      {/* Working backwards — the thesis's defining methodology. */}
      <div className="max-w-[680px] space-y-6">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">Working backwards</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          In an illiquid asset class, the desirable end state must be defined
          first; the plan works backward from it. Hivemind is built around ten
          artists, each anchoring a chapter of digital art&rsquo;s first
          decades. Within each chapter, collections are acquired deep rather
          than wide, and 1/1 pieces sharpen the reading of specific
          movements.
        </p>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          Value in this medium is expected to follow a power-law rather than a
          linear distribution, concentrating in the works, artists, and
          collections that define each chapter. The portfolio is built for
          that geometry.
        </p>
      </div>

      {/* The curation. */}
      <div className="max-w-[680px] pt-12 space-y-6">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">The curation</h2>
        <div>
          <p className="text-[16px] font-medium text-foreground">Artist and collection</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            In Contemporary Art, the living artist still shapes an artwork&rsquo;s
            value. An artist with the right profile is necessary but not
            sufficient; the collection must also be significant within its
            chapter. Hivemind acquires blue-chip collections by blue-chip
            artists, not artists wholesale.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Trait concentration</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Within a collection, Hivemind concentrates on desirable traits
            when pricing allows. In Fidenza, that focus is White Mono: pure
            white forms on a colored ground, the inverse of the standard
            palette and the variant that most clearly exposes the
            algorithm&rsquo;s drawing logic.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">1/1 keystones</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            1/1s are acquired as keystones, not standalone trophies. Tyler
            Hobbs&rsquo;s{" "}
            <Link
              href="/piece/tyler-hobbs-1"
              className="underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors duration-200"
            >
              <em>Return Zero</em>
            </Link>
            , the precursor algorithm to Fidenza, sits alongside the Fidenza
            set. Dmitri Cherniak&rsquo;s{" "}
            <Link
              href="/piece/superrare-dmitri-cherniak-26901"
              className="underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors duration-200"
            >
              <em>A Slight Lack of Symmetry Can Cause So Much Pain</em>
            </Link>{" "}
            sits alongside the deep Ringers position. Each 1/1 is chosen
            because it completes a thread that runs through the rest of the
            curation.
          </p>
        </div>
      </div>

      {/* Five chapters. */}
      <div className="pt-12 pb-8">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight max-w-[680px]">Five chapters</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-4 max-w-[680px]">
          The ten artists are grouped into five chapters of digital
          art&rsquo;s first decades.
        </p>
        <div className="mt-8 space-y-6 max-w-[680px]">
          {CHAPTERS.map((ch) => (
            <div
              key={ch.slug}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 md:gap-8 md:items-baseline"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ch.color }}
                />
                <h3 className="font-serif text-[22px] tracking-[-0.01em] leading-tight">
                  <Link
                    href={`/chapters#${ch.slug}`}
                    className="hover:opacity-60 transition-opacity duration-200"
                  >
                    {ch.name}
                  </Link>
                </h3>
              </div>
              <p className="text-[16px] text-foreground-secondary leading-[1.65] text-pretty">
                {ch.description}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/chapters"
          className="mt-8 inline-block text-[13px] text-muted hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
        >
          Explore all five chapters <span aria-hidden>→</span>
        </Link>
      </div>

      {/* Hivemind Capital Partners closer. */}
      <div className="max-w-[680px] pt-12">
        <h2 className="font-serif text-[32px] sm:text-[40px] tracking-tight leading-tight">Hivemind Capital Partners</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-6">
          Hivemind Capital Partners is a crypto-focused investment firm with
          positions across infrastructure, applications, and culture. The
          Digital Culture Fund is the firm&rsquo;s vehicle for collecting the
          art of this period, held to the custody, security, and operational
          standards LPs apply to any asset on their book.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-6 sm:gap-10 text-[13px]">
          <Link
            href="/"
            className="text-foreground hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
          >
            View the collection
          </Link>
          <a
            href="https://www.hivemind.capital/content/the-making-of-the-digital-culture-fund"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
          >
            Read the founding essay
          </a>
        </div>

      </div>
    </div>
  );
}
