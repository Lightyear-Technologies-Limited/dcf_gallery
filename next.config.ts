import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
