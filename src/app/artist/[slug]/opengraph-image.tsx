import { ImageResponse } from "next/og";
import { Wordmark, frameStyle, footStyle } from "@/lib/og-brand";
import { artists, getCollectionsByArtist } from "@/lib/data";
import { getArtistDisplayName, sortCollections, getCollectionDisplayName, isCollectionHidden } from "@/lib/curation";
import { getChapterForArtist } from "@/lib/chapters";

const MERGED = new Set(["tyler-hobbs-and-dandelion-wist"]);

export const alt = "Artist. Hivemind Digital Culture Fund.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Prerender one card per artist rather than rendering on demand. Besides matching
// the page route, this keeps the wordmark's disk read (see lib/og-brand) strictly
// at build time — nothing touches the filesystem at request time.
export function generateStaticParams() {
  return artists.filter((a) => !MERGED.has(a.slug)).map((a) => ({ slug: a.slug }));
}

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((a) => a.slug === slug && !MERGED.has(a.slug));
  const chapter = artist ? getChapterForArtist(artist.slug) : null;
  const name = artist ? getArtistDisplayName(artist.slug, artist.name) : "Artist";
  const collections = artist
    ? sortCollections(
        artist.slug,
        getCollectionsByArtist(artist.slug).filter((c) => !isCollectionHidden(c.slug)),
      ).map((c) => getCollectionDisplayName(c.slug, c.name))
    : [];

  return new ImageResponse(
    (
      <div style={frameStyle}>
        <Wordmark />

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 300 }}>
            {name}
          </div>
          {collections.length > 0 && (
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.35,
                color: "#4a4640",
                fontStyle: "italic",
                maxWidth: 1040,
                fontWeight: 300,
              }}
            >
              {collections.join(" · ")}
            </div>
          )}
        </div>

        {/* Descriptive line, matching the other cards. The wordmark above carries
            the fund name, so repeating it said nothing; the artist's curatorial
            chapter is derived from the same mapping the /chapters page uses. */}
        <div style={footStyle}>{chapter ? `${chapter.name} · Hivemind DCF` : "Hivemind DCF"}</div>
      </div>
    ),
    { ...size },
  );
}
