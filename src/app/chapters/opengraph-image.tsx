import { ImageResponse } from "next/og";
import { CHAPTERS } from "@/lib/chapters";

export const alt = "Chapters. Hivemind Digital Culture Fund.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

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

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ fontSize: 96, lineHeight: 1, letterSpacing: "-0.02em", fontWeight: 300 }}>
            Chapters
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {CHAPTERS.map((c, i) => (
              <div
                key={c.slug}
                style={{ fontSize: 30, lineHeight: 1.25, fontWeight: 300, letterSpacing: "-0.01em" }}
              >
                {`${roman[i]}. ${c.name}`}
              </div>
            ))}
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
          Five chapters of digital art&rsquo;s first decades
        </div>
      </div>
    ),
    { ...size },
  );
}
