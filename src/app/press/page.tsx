import type { Metadata } from "next";
import Link from "next/link";
import { collections } from "@/lib/data";
import { getCollectionEditorial } from "@/lib/editorial";

export const metadata: Metadata = {
  title: "Press",
  description:
    "Press resources for the Hivemind Digital Culture Fund: boilerplate, brand assets, published essays, and contact.",
  openGraph: {
    title: "Press",
    description:
      "Press resources for the Hivemind Digital Culture Fund: boilerplate, brand assets, published essays, and contact.",
  },
};

const BOILERPLATE = `The Hivemind Digital Culture Fund is a curated portfolio of digital art's emergent canon. Acquired after the first market cycle, the collection is comprehensive and targeted, with defining works by a.c.k., Beeple, Dmitri Cherniak, Kim Asendorf, Larva Labs (CryptoPunks), Operator, Refik Anadol, Sam Spratt, Tyler Hobbs, and XCOPY. Holdings are managed to the custody, security, and operational standards LPs apply to any asset on their book.`;

export default function PressPage() {
  const essays = collections
    .map((c) => {
      const ed = getCollectionEditorial(c.slug);
      return ed?.essayUrl && ed?.essayTitle ? { title: ed.essayTitle, url: ed.essayUrl, collection: c.name } : null;
    })
    .filter((e): e is { title: string; url: string; collection: string } => e !== null);

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24 min-h-screen">
      {/* Eyebrow + subject H1 pattern, matching /thesis /artists /chapters. */}
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">
        Hivemind Digital Culture Fund
      </p>
      <h1 className="font-serif display-sm mt-3">Press</h1>
      <div className="mt-6 mb-8 max-w-2xl">
        <p className="text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary">
          Resources for journalists, editors, and researchers covering the fund.
        </p>
      </div>

      <div className="max-w-[680px] space-y-12">
        <section>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
            Boilerplate
          </p>
          <p className="text-[16px] text-foreground-secondary leading-[1.65]">
            {BOILERPLATE}
          </p>
        </section>

        <section>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
            Brand assets
          </p>
          <div className="space-y-1.5 text-[13px]">
            <a
              href="/brand/hivemind-black.png"
              download
              className="block text-foreground-secondary hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
            >
              Wordmark, light background (PNG)
            </a>
            <a
              href="/brand/hivemind-white.png"
              download
              className="block text-foreground-secondary hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
            >
              Wordmark, dark background (PNG)
            </a>
          </div>
        </section>

        {essays.length > 0 && (
          <section>
            <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
              Published essays
            </p>
            <ul className="space-y-1.5 text-[13px]">
              {essays.map((e) => (
                <li key={e.url}>
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-secondary hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
                  >
                    {e.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
            Press contact
          </p>
          <a
            href="mailto:press@hivemind.capital"
            className="text-[15px] text-foreground-secondary hover:text-foreground transition-colors duration-200 inline-block underline underline-offset-4 decoration-border hover:decoration-foreground font-mono"
          >
            press@hivemind.capital
          </a>
          <p className="text-[13px] text-muted mt-4">
            For high-resolution imagery of specific works, please email the press address with the piece title and intended publication.
          </p>
        </section>

        <div>
          <Link
            href="/"
            className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground"
          >
            Return to the collection
          </Link>
        </div>
      </div>
    </div>
  );
}
