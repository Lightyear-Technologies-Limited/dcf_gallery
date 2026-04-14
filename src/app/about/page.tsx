import Link from "next/link";
import { artists, collections, pieces } from "@/lib/data";

export default function AboutPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12">

      <div className="max-w-[680px] pt-[120px]">
        <h1 className="font-serif text-[48px] sm:text-[56px] tracking-[-0.02em] leading-[0.95]">
          Digital Culture Fund
        </h1>
        <p className="text-[20px] text-foreground-secondary mt-8 leading-relaxed">
          A Hivemind initiative for collecting, contextualizing, and preserving
          culturally significant digital art.
        </p>
      </div>

      <div className="max-w-[680px] pt-20 space-y-6 text-[16px] text-foreground-secondary leading-relaxed">
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

      <div className="max-w-[680px] space-y-8">
        <h2 className="text-[24px] tracking-[-0.01em]">Collecting Framework</h2>
        <div>
          <p className="text-[16px] font-medium text-foreground">Cultural Significance</p>
          <p className="text-[16px] text-foreground-secondary leading-relaxed mt-1">
            Does this work advance the medium? Does it mark a moment in the evolution
            of digital art that future historians will reference?
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Aesthetic Depth</p>
          <p className="text-[16px] text-foreground-secondary leading-relaxed mt-1">
            Does it reward sustained attention? Does the formal quality hold up against
            the best of any medium, digital or traditional?
          </p>
        </div>
        <div>
          <p className="text-[16px] font-medium text-foreground">Art Historical Connection</p>
          <p className="text-[16px] text-foreground-secondary leading-relaxed mt-1">
            How does it relate to the broader canon? What traditions does it extend,
            challenge, or transform?
          </p>
        </div>
      </div>

      <div className="max-w-[680px] pt-20">
        <p className="text-[16px] text-foreground-secondary leading-relaxed">
          The fund holds{" "}
          <span className="font-serif text-[36px] text-foreground align-baseline">{pieces.length}</span>{" "}
          works by{" "}
          <span className="font-serif text-[36px] text-foreground align-baseline">{artists.length}</span>{" "}
          artists across{" "}
          <span className="font-serif text-[36px] text-foreground align-baseline">{collections.length}</span>{" "}
          collections.
        </p>
      </div>

      <div className="max-w-[680px] pt-20">
        <h2 className="text-[24px] tracking-[-0.01em]">Hivemind</h2>
        <p className="text-[16px] text-foreground-secondary leading-relaxed mt-4">
          Hivemind is a crypto-focused investment firm that backs the infrastructure,
          platforms, and culture shaping the decentralized future. The Digital Culture
          Fund is our commitment to preserving and promoting the art that defines this
          moment in cultural history.
        </p>
      </div>

      <div className="pt-20 pb-8">
        <Link href="/" className="text-[13px] text-muted hover:text-foreground transition-colors duration-200">
          View the Collection &rarr;
        </Link>
      </div>
    </div>
  );
}
