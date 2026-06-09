// Custom Next.js image loader (plan B.3).
//
// Filebase gateway URLs get on-the-fly resize + webp via query params, so
// next/image generates a responsive srcset "for free" (it calls this loader
// once per candidate width). Everything else — local pre-optimized webp, the
// CryptoPunk SVGs, logos — passes through unchanged. With a custom loader the
// built-in Vercel optimizer is bypassed entirely, so Filebase art is never
// re-processed (no double optimization, no Vercel image cost).
//
// IMPORTANT: the gateway preserves the SOURCE format unless told otherwise, so
// img-format=webp is mandatory to get small webp from PNG/JPG originals.
export default function filebaseLoader({ src, width, quality }) {
  if (src.includes("lightyear.myfilebase.com/ipfs/")) {
    const base = src.split("?")[0];
    // Art-appropriate quality. next/image's default `quality` prop is 75, which
    // is visibly soft on detailed/photographic art; honor an explicitly higher
    // value if a component sets one, otherwise serve 90. (plan B.3 / sharpness)
    const q = quality && quality > 75 ? quality : 90;
    return `${base}?img-width=${width}&img-format=webp&img-quality=${q}`;
  }
  return src;
}
