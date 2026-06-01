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
          The Hivemind Digital Culture Fund is a curated collection of digital art
          that is emblematic of today&rsquo;s digital cultural revolution &mdash;
          a thesis-driven acquisition program holding {visiblePieces.length} works
          by {primaryArtists.length} artists across {visibleCollections.length} collections.
        </p>
      </div>

      <div className="max-w-[680px] pt-20 space-y-10 text-[16px] text-foreground-secondary leading-[1.65]">
        <p>
          Most collections are assembled after the fact &mdash; once the canon is
          established, once the prices are set, once history has decided what matters.
          The Digital Culture Fund was built differently. We started acquiring in the
          middle of the story, when the artists in this collection were still defining
          the medium, when the line between experiment and masterwork was drawn in
          real time.
        </p>
        <p className="text-foreground">
          This is not a retrospective. It is a position: that the most significant
          artistic movement of the twenty-first century is happening on-chain, and
          that the works in this collection will be studied long after the platforms
          that hosted them have been forgotten.
        </p>
      </div>

      <blockquote className="max-w-[680px] mx-auto text-center py-24">
        <p className="font-serif text-[28px] italic leading-relaxed tracking-tight text-foreground">
          &ldquo;The best digital art doesn&rsquo;t replace tradition.
          It makes visible the computational structures that were always
          latent in the work of its predecessors.&rdquo;
        </p>
      </blockquote>

      {/* Curation thesis */}
      <div className="max-w-[680px] space-y-8">
        <h2 className="font-serif display-sm">Collecting Framework</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          Strategic curation informed by a deep understanding of the origins,
          development, and evolution of digital art.
        </p>
        <div>
          <p className="text-[16px] font-medium text-foreground">Mirroring the Movement</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Curated collections with historical precedents, sampled from across
            digital art and culture. We collect artists and artworks that embody
            and elevate the digital art movement as it evolves.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Value Accrues to the Top</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Focus on quality to capture value. Digital art exhibits similar concentration
            dynamics to global contemporary art: the top 10 artists account for 27%
            of market turnover, the top 50 for 51%.
          </p>
          {/* TODO: replace with the actual citation source used in the deck */}
          <p className="text-[13px] text-muted mt-2">Source: ArtTactic Digital Art Market Report, 2024.</p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Cornerstone Collections &amp; Unique 1/1s</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Scale through core collections with support from singular 1/1 pieces
            and adjacent works, with the goal of elevating the significance of the
            portfolio and enhancing long-term value.
          </p>
        </div>
      </div>

      {/* Five chapters */}
      <div className="pt-24 pb-8">
        <h2 className="font-serif display-sm max-w-[680px]">Five chapters</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-4 max-w-[680px]">
          The collection is organized around five chapters of digital art&rsquo;s
          first two decades. Each chapter groups artists whose practices share a
          lineage &mdash; a way of making, a stance toward the medium, or a
          cultural moment.
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

      {/* Practice - reframed from "Edge in Execution" (LP-deck language) into
          institutional prose. Three flowing paragraphs instead of bold-label
          stacks so the visual rhythm differs from "Collecting Framework". */}
      <div className="max-w-[680px] pt-24 space-y-6">
        <h2 className="font-serif display-sm">Practice</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          DCF benefits from an expansive network and access to premier venues,
          which enables exclusive acquisitions and strategic partnerships &mdash;
          including coveted pieces from 3AC&rsquo;s iconic NFT collection,
          secured on favorable terms.
        </p>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          The fund launched at a pivotal moment, capitalizing on a period when
          mainstream opinion was at its lowest. Early conviction in &lsquo;grail&rsquo;
          works positioned Hivemind at the forefront of the digital art space
          from the outset.
        </p>
        <p className="text-[16px] text-foreground-secondary leading-[1.65]">
          Commitment extends beyond acquisition. Hivemind invests in experiences
          that strengthen the visibility and long-term value of the fund, its
          artists, and the field as a whole &mdash; including sponsorship of the
          inaugural Digital Art Awards in May 2025.
        </p>
      </div>

      {/* Hivemind closer - heading + thesis paragraph, then a labeled
          INVESTOR RELATIONS block so the IR email reads as its own surface
          rather than parenthetical prose. */}
      <div className="max-w-[680px] pt-24">
        <h2 className="font-serif display-sm">Hivemind Capital Partners</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-6">
          Hivemind is a crypto-focused investment firm backing the infrastructure,
          platforms, and culture that shape the decentralized future. The Digital
          Culture Fund is Hivemind&rsquo;s commitment to preserving and promoting
          the art that defines this moment in cultural history.
        </p>

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

      <div className="pt-20 pb-8">
        <Link
          href="/"
          className="text-[13px] text-muted hover:text-foreground transition-colors duration-200"
        >
          View the collection →
        </Link>
      </div>
    </div>
  );
}
