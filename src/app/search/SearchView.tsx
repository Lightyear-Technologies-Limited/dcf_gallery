"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { pieces, artists, collections, type Piece, type Artist, type Collection } from "@/lib/data";
import ArtworkCard from "@/components/ArtworkCard";
import Link from "next/link";

export default function SearchView() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query || query.length < 2) return { pieces: [], artists: [], collections: [] };
    const q = query.toLowerCase();
    return {
      artists: artists.filter((a) =>
        a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q))
      ),
      collections: collections.filter((c) =>
        c.name.toLowerCase().includes(q) || c.artistSlug.replace(/-/g, " ").includes(q)
      ),
      pieces: pieces.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.artistSlug.replace(/-/g, " ").includes(q) ||
        p.collectionSlug.replace(/-/g, " ").includes(q)
      ).slice(0, 24),
    };
  }, [query]);

  const hasResults = results.artists.length > 0 || results.collections.length > 0 || results.pieces.length > 0;

  return (
    <div>
      {/* Search input — large, minimal */}
      <div className="border-b border-border pb-4">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists, collections, works..."
          className="w-full bg-transparent font-serif text-[32px] sm:text-[48px] tracking-tight text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>

      {/* Results */}
      {query.length >= 2 && (
        <div className="pt-12">
          {!hasResults && (
            <p className="text-[13px] text-muted">No results for &ldquo;{query}&rdquo;</p>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <div className="mb-16">
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-6">
                Artists ({results.artists.length})
              </p>
              {results.artists.map((a) => (
                <Link
                  key={a.slug}
                  href={`/artist/${a.slug}`}
                  className="flex items-baseline justify-between py-3 border-b border-border group"
                >
                  <span className="text-[20px] tracking-tight text-foreground-secondary group-hover:text-foreground transition-colors duration-200">
                    {a.name}
                  </span>
                  <span className="text-[13px] text-muted">{a.tags.join(" · ")}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Collections */}
          {results.collections.length > 0 && (
            <div className="mb-16">
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-6">
                Collections ({results.collections.length})
              </p>
              {results.collections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collection/${c.slug}`}
                  className="flex items-baseline justify-between py-3 border-b border-border group"
                >
                  <span className="text-[16px] text-foreground-secondary group-hover:text-foreground transition-colors duration-200">
                    {c.name}
                  </span>
                  <span className="text-[13px] text-muted">{artists.find((a) => a.slug === c.artistSlug)?.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Pieces */}
          {results.pieces.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-6">
                Works ({results.pieces.length}{results.pieces.length === 24 ? "+" : ""})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.pieces.map((p) => (
                  <ArtworkCard key={p.id} piece={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state — before typing */}
      {query.length < 2 && (
        <div className="pt-20 text-center">
          <p className="text-[13px] text-muted">
            {pieces.length} works &middot; {artists.length} artists &middot; {collections.length} collections
          </p>
        </div>
      )}
    </div>
  );
}
