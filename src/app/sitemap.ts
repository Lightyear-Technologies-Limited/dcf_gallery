import type { MetadataRoute } from "next";
import { artists, collections, pieces } from "@/lib/data";
import { isCollectionHidden } from "@/lib/curation";
import { SITE_URL as SITE } from "@/lib/site";

// Artists folded into another on the site have no standalone page (see generateStaticParams).
const MERGED = new Set(["tyler-hobbs-and-dandelion-wist"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/artists",
    "/about",
    "/explore",
    ...artists.filter((a) => !MERGED.has(a.slug)).map((a) => `/artist/${a.slug}`),
    ...collections.filter((c) => !isCollectionHidden(c.slug)).map((c) => `/collection/${c.slug}`),
    ...pieces.filter((p) => !isCollectionHidden(p.collectionSlug)).map((p) => `/piece/${p.slug}`),
  ];
  return paths.map((path) => ({
    url: `${SITE}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : path.startsWith("/piece/") ? 0.6 : 0.8,
  }));
}
