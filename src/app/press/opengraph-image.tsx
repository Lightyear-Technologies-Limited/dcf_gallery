import { ImageResponse } from "next/og";
import { Wordmark, frameStyle, footStyle } from "@/lib/og-brand";

export const alt = "Press. Hivemind Digital Culture Fund.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div style={frameStyle}>
        <Wordmark />

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 300 }}>
            Press
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.4,
              color: "#4a4640",
              fontFamily: "sans-serif",
              fontWeight: 400,
              maxWidth: 900,
            }}
          >
            Overview, brand assets, published essays, and press contact for
            journalists, editors, and researchers covering Hivemind Digital Culture Fund.
          </div>
        </div>

        <div style={footStyle}>press@hivemind.capital</div>
      </div>
    ),
    { ...size },
  );
}
