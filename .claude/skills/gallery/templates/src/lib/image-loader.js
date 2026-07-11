/**
 * Custom Next Image loader. Rewrites <Image src="..."> URLs to the
 * gateway transform per requested width so we get responsive srcset
 * without paying the Vercel image optimizer to re-process pinned bytes.
 *
 * Gateway-hosted URLs (https://<GATEWAY_HOST>/ipfs/...) get the
 * ?img-width=X&format=webp query params appended.
 * Local URLs (starting with /) pass through unchanged.
 *
 * Configured in next.config.ts:
 *   images: { loader: "custom", loaderFile: "./src/lib/image-loader.js" }
 */
export default function imageLoader({ src, width, quality }) {
  if (src.startsWith("/")) return src;
  try {
    const url = new URL(src);
    // Only transform gateway URLs; leave other absolute URLs alone.
    if (!url.hostname.endsWith(".myfilebase.com") && !url.hostname.endsWith(".pinata.cloud")) {
      return src;
    }
    url.searchParams.set("img-width", String(width));
    url.searchParams.set("format", "webp");
    if (quality) url.searchParams.set("img-quality", String(quality));
    return url.toString();
  } catch {
    return src;
  }
}
