import { ImageResponse } from "next/og";
import { artists } from "@/lib/data";
import { getArtistDisplayName } from "@/lib/curation";
import { OG_COLORS, Wordmark, frameStyle, footStyle } from "@/lib/og-brand";

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
      <div style={frameStyle}>
        <Wordmark />

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 300 }}>
            Artists
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.3,
              color: OG_COLORS.fg,
              maxWidth: 1040,
              fontWeight: 300,
            }}
          >
            {names.join(" · ")}
          </div>
        </div>

        <div style={footStyle}>Ten artists shaping digital art&rsquo;s first decades</div>
      </div>
    ),
    { ...size },
  );
}
