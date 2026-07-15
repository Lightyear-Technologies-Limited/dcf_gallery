/**
 * Hivemind wordmark. Renders the official brand mark for the word
 * "Hivemind" at the size of the surrounding text. Light + dark variants
 * are stacked absolutely with theme-based opacity (see globals.css
 * `.logo-wrap` + `.logo-light` / `.logo-dark`).
 *
 * The source PNGs are 745 × 136 (aspect ~5.478). The wrapper takes a
 * height class (`h-6`, `h-8`, etc.); width is derived via aspect-ratio
 * so both images stay proportional across theme switches.
 */
export default function Wordmark({
  className = "h-6 sm:h-8",
  alt = "Hivemind",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={`logo-wrap inline-block shrink-0 ${className}`}
      style={{ aspectRatio: "745 / 136" }}
      aria-label={alt}
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/hivemind-black.png"
        alt=""
        aria-hidden
        className="h-full w-full logo-light"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/hivemind-white.png"
        alt=""
        aria-hidden
        className="h-full w-full logo-dark"
      />
    </span>
  );
}
