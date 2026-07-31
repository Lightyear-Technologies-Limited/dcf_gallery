import { ImageResponse } from "next/og";
import { Wordmark, frameStyle, footStyle } from "@/lib/og-brand";

export const alt = "Thesis. Hivemind Digital Culture Fund.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div style={frameStyle}>
        <Wordmark />

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 300 }}>
            Thesis
          </div>
          <div
            style={{
              fontSize: 44,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              fontStyle: "italic",
              color: "#1a1815",
              maxWidth: 1000,
              borderLeft: "2px solid #d4cfc4",
              paddingLeft: 32,
            }}
          >
            Technology drives wealth. Wealth drives culture.
          </div>
        </div>

        {/* Descriptive line, matching the other cards — the wordmark above already
            carries the fund name, so repeating it here said nothing. Lifted from
            the /thesis page's own lede rather than newly written. */}
        <div style={footStyle}>
          Digital art&rsquo;s emergent canon, acquired after the first market cycle
        </div>
      </div>
    ),
    { ...size },
  );
}
