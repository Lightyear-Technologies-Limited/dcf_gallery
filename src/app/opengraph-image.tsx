import { ImageResponse } from "next/og";

// Homepage OG card. Replaces the plain static wordmark PNG so shares of
// the site root land with a fund-branded card carrying the thesis line
// and the artist roster (the two things a first-time reader needs to
// self-qualify).

export const alt = "Hivemind Digital Culture Fund. Digital art's emergent canon.";
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 300,
              maxWidth: 1000,
            }}
          >
            <div>Digital art&rsquo;s emergent canon,</div>
            <div>held by Hivemind Digital Culture Fund.</div>
          </div>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.4,
              color: "#4a4640",
              fontFamily: "sans-serif",
              fontWeight: 400,
              maxWidth: 900,
            }}
          >
            XCOPY. Tyler Hobbs. Dmitri Cherniak. Larva Labs (CryptoPunks). Refik
            Anadol. Sam Spratt. Kim Asendorf. Operator. Beeple. a.c.k.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 16,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#7a746c",
            fontFamily: "sans-serif",
            fontWeight: 500,
          }}
        >
          <div>Hivemind Digital Culture Fund</div>
          <div>Collection</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
