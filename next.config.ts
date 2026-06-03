import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // CryptoPunks render from local SVG files in public/art/all/. Next/Image
    // refuses SVG by default; opt in since the files are first-party and we
    // ship a Content-Security-Policy that prevents script execution from
    // image responses.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
