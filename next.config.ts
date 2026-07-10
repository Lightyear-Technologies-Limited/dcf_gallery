import type { NextConfig } from "next";

// Site-wide security headers (D.1). This is a static, no-auth, no-PII brochure
// site, so the threat model is reputational (defacement / supply chain) more
// than XSS. CSP restricts every directive tightly; script-src/style-src keep
// 'unsafe-inline' because Next's App Router injects inline RSC/hydration scripts
// and Tailwind/next-font inject inline styles — a nonce-based CSP would force
// every page to render dynamically (lose static generation) for little gain
// here. The Filebase gateway is allowed for images/media only.
const csp = [
  "default-src 'self'",
  "img-src 'self' data: https://lightyear.myfilebase.com",
  "media-src 'self' https://lightyear.myfilebase.com",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'",
  // On-chain interactive HTML art (Kim Asendorf, etc.) runs in a sandboxed iframe
  // (allow-scripts, no same-origin) — pinned HTML from the gateway in galleries,
  // or the data: URI on the piece page. Scoped to those. (E.1)
  "frame-src 'self' data: https://lightyear.myfilebase.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  async redirects() {
    // The home page IS the collections index — there's no /collections
    // route. A reader who guesses /collections (natural given the site
    // uses /artists as the artists index) previously hit a 404; redirect
    // to the salon instead.
    return [
      { source: "/collections", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Local art (punk SVGs, curated crops, on-chain SVGs) is immutable; the
      // Filebase gateway already serves its own immutable Cache-Control. (B.4)
      {
        source: "/art/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    // Filebase gateway does our image optimization (img-width + webp). A custom
    // loader rewrites <Image> srcs to the gateway transform per requested width
    // (responsive srcset for free); local images pass through unchanged. With a
    // custom loader the built-in Vercel optimizer is bypassed, so Filebase art
    // is never re-processed (no double cost). See src/lib/image-loader.js. (B.3)
    loader: "custom",
    loaderFile: "./src/lib/image-loader.js",
    // Kept for the local CryptoPunk SVGs still served via <Image>.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
