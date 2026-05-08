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

      <div className="max-w-[680px] pt-20 space-y-6 text-[16px] text-foreground-secondary leading-[1.65]">
        <p>
          Most collections are assembled after the fact &mdash; once the canon is
          established, once the prices are set, once history has decided what matters.
          The Digital Culture Fund was built differently. We started acquiring in the
          middle of the story, when the artists in this collection were still defining
          the medium, when the line between experiment and masterwork was drawn in
          real time.
        </p>
        <p>
          This is not a retrospective. It is a position: that the most significant
          artistic movement of the twenty-first century is happening on-chain, and
          that the works in this collection will be studied long after the platforms
          that hosted them have been forgotten.
        </p>
      </div>

      <blockquote className="max-w-[680px] mx-auto text-center py-20">
        <p className="font-serif text-[28px] italic leading-relaxed tracking-tight text-foreground">
          &ldquo;The best digital art doesn&rsquo;t replace tradition.
          It makes visible the computational structures that were always
          latent in the work of its predecessors.&rdquo;
        </p>
      </blockquote>

      {/* Curation thesis */}
      <div className="max-w-[680px] space-y-8">
        <h2 className="text-[24px] tracking-[-0.01em]">Collecting Framework</h2>
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
        <h2 className="text-[24px] tracking-[-0.01em] max-w-[680px]">Five chapters</h2>
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
              className="grid grid-cols-[minmax(0,3fr)_minmax(0,7fr)] gap-8 md:gap-12 items-baseline"
            >
              <div className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full shrink-0 translate-y-[-2px]"
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

      {/* Edge in execution */}
      <div className="max-w-[680px] pt-24 space-y-8">
        <h2 className="text-[24px] tracking-[-0.01em]">Edge in Execution</h2>
        <div>
          <p className="text-[16px] font-medium text-foreground">Access &amp; Network</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Access to an expansive network and premier venues facilitates exclusive
            acquisitions and strategic partnerships. The fund&rsquo;s portfolio includes
            highly coveted pieces from 3AC&rsquo;s iconic NFT collection, secured on
            favorable terms.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Timing</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Launched at a pivotal moment, capitalizing on a unique period when mainstream
            public opinion was at its lowest. Early conviction in &lsquo;grail&rsquo;
            artworks positioned Hivemind at the forefront of the digital art space
            from the outset.
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Depth</p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-1">
            Commitment beyond acquisition. Hivemind is focused on creating impactful
            experiences that strengthen the visibility and long-term value of the fund,
            its artists, and the industry as a whole. Hivemind sponsored the inaugural
            Digital Art Awards in May 2025.
          </p>
        </div>
      </div>

      {/* Hivemind */}
      <div className="max-w-[680px] pt-24">
        <h2 className="text-[24px] tracking-[-0.01em]">Hivemind Capital Partners</h2>
        <p className="text-[16px] text-foreground-secondary leading-[1.65] mt-4">
          Hivemind is a crypto-focused investment firm that backs the infrastructure,
          platforms, and culture shaping the decentralized future. The Digital Culture
          Fund is Hivemind&rsquo;s commitment to preserving and promoting the art that
          defines this moment in cultural history.
        </p>
        <p className="text-[13px] text-muted mt-6">
          For investor inquiries:{" "}
          <a
            href="mailto:investor.relations@hivemind.capital"
            className="underline underline-offset-4 decoration-border hover:text-foreground transition-colors duration-200"
          >
            investor.relations@hivemind.capital
          </a>
        </p>
      </div>

      <div className="pt-20 pb-8">
        <Link
          href="/"
          className="text-[13px] text-muted hover:text-foreground transition-colors duration-200"
        >
          View the collection &rarr;
        </Link>
      </div>
    </div>
  );
}
