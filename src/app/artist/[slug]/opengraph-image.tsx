import { ImageResponse } from "next/og";
import { artists, getCollectionsByArtist } from "@/lib/data";
import { getArtistDisplayName, sortCollections, getCollectionDisplayName, isCollectionHidden } from "@/lib/curation";

const MERGED = new Set(["tyler-hobbs-and-dandelion-wist"]);

export const alt = "Artist. Hivemind Digital Culture Fund.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = artists.find((a) => a.slug === slug && !MERGED.has(a.slug));
  const name = artist ? getArtistDisplayName(artist.slug, artist.name) : "Artist";
  const collections = artist
    ? sortCollections(
        artist.slug,
        getCollectionsByArtist(artist.slug).filter((c) => !isCollectionHidden(c.slug)),
      ).map((c) => getCollectionDisplayName(c.slug, c.name))
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f8f7",
          color: "#1a1815",
          padding: "72px 80px",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#7a746c",
            fontFamily: "sans-serif",
            fontWeight: 500,
          }}
        >
          Hivemind Digital Culture Fund
        </div>

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

        <div
          style={{
            fontSize: 16,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#7a746c",
            fontFamily: "sans-serif",
            fontWeight: 500,
          }}
        >
          Hivemind Digital Culture Fund
        </div>
      </div>
    ),
    { ...size },
  );
}
