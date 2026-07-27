import { ImageResponse } from "next/og";
import { artists } from "@/lib/data";
import { getArtistDisplayName } from "@/lib/curation";

const MERGED = new Set(["tyler-hobbs-and-dandelion-wist"]);

export const alt = "Artists. Hivemind Digital Culture Fund.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  const names = artists
    .filter((a) => !MERGED.has(a.slug))
    .map((a) => getArtistDisplayName(a.slug, a.name))
    .sort((a, b) => a.localeCompare(b));

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
            Artists
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.3,
              color: "#1a1815",
              maxWidth: 1040,
              fontStyle: "italic",
              fontWeight: 300,
            }}
          >
            {names.join(" · ")}
          </div>
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
          Ten artists shaping digital art&rsquo;s first decades
        </div>
      </div>
    ),
    { ...size },
  );
}
