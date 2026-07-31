import Link from "next/link";
import BackButton from "./BackButton";
import type { PieceNavModel } from "@/lib/piece-nav";

/**
 * Presentational piece-page nav: the Back link plus the Prev/Next work pair.
 * Pure (no hooks), so it renders identically as the server's <Suspense> fallback
 * and as the client-hydrated `PieceNav` output — the markup lives here once.
 */
export default function PieceNavView({ backHref, backLabel, prev, next }: PieceNavModel) {
  return (
    <>
      {/* Back link. With an explicit origin (?from=) it returns there (Collection
          or Chapters). Otherwise it goes UP one level: multi-piece collections —
          and any active trait filter — return to the collection page; single-piece
          collections, whose collection page is redundant chrome, return to the
          artist page instead. Label uses the curated display name, extended with
          "· {trait: value}" when filtered so the destination is unambiguous. */}
      <BackButton href={backHref} label={backLabel} />
      {/* Prev/Next work nav. Always rendered — even when the piece is in a
       *  single-piece collection with no siblings — so the artwork below sits at
       *  the same Y position on every piece page. Without this reservation,
       *  single-piece pages rendered the artwork ~52px higher than multi-piece
       *  pages, breaking the reader's sense of place when clicking between
       *  pieces. Empty spans preserve the layout without any visible chrome. */}
      <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-2 min-h-[40px]">
        {prev ? (
          <Link
            href={prev.href}
            title={prev.title}
            className="group inline-flex flex-col gap-1 max-w-full sm:max-w-[45%]"
          >
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium group-hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1.5">
              <span aria-hidden className="tracking-normal">←</span>
              Previous work
            </span>
            <span className="font-serif text-[15px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200 line-clamp-2">
              {prev.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={next.href}
            title={next.title}
            className="group inline-flex flex-col gap-1 max-w-full sm:max-w-[45%] sm:items-end sm:text-right"
          >
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium group-hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1.5">
              Next work
              <span aria-hidden className="tracking-normal">→</span>
            </span>
            <span className="font-serif text-[15px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200 line-clamp-2">
              {next.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}
