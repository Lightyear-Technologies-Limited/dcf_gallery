import type { NextConfig } from "next";

// Site-wide security headers. Static, no-auth, no-PII catalogue site;
// threat model is reputational (defacement / supply chain).
const csp = [
  "default-src 'self'",
  "img-src 'self' data: https://{{GATEWAY_HOST}}",
  "media-src 'self' https://{{GATEWAY_HOST}}",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self' data: https://{{GATEWAY_HOST}}",
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
    return [
      { source: "/collections", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/art/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    // If using a custom image loader for a gateway (see reference/DATA-PIPELINE.md),
    // uncomment and point to src/lib/image-loader.js:
    // loader: "custom",
    // loaderFile: "./src/lib/image-loader.js",
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
