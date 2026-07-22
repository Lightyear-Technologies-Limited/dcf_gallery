import { ImageResponse } from "next/og";

export const alt = "Press. Hivemind Digital Culture Fund.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
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
          press@hivemind.capital
        </div>
      </div>
    ),
    { ...size },
  );
}
