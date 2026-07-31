import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression locks for properties that are easy to break invisibly.
 *
 * Everything here failed at least once in the 2026-07 review pass, and none of it
 * would have been caught by the build, the typechecker, or the smoke suite — each
 * broke silently and shipped. They are invariants of the *built output* rather
 * than user journeys, which is why they live apart from smoke.spec.ts.
 *
 * Deliberately no pixel snapshots (see playwright.config.ts — brittle across
 * OSes). Where the property is structural, it is asserted against the source or
 * the response headers instead of a rendered image.
 */

const APP = join(process.cwd(), "src", "app");

/** Every generated OG card in the tree, so a newly added one is covered automatically. */
function findOgCards(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) findOgCards(p, out);
    else if (e.name === "opengraph-image.tsx") out.push(p);
  }
  return out;
}

test.describe("invariants: open graph", () => {
  // #29 deleted the static wordmark card and replaced it with a generated one that
  // carried no brand mark and overflowed its own footer.
  test("the site root serves the static wordmark card, not a generated one", async ({ request }) => {
    expect(
      existsSync(join(APP, "opengraph-image.png")),
      "src/app/opengraph-image.png is the hand-made wordmark card and must remain the root OG image",
    ).toBe(true);
    expect(
      existsSync(join(APP, "opengraph-image.tsx")),
      "a generated root card would shadow the static wordmark PNG",
    ).toBe(false);

    const res = await request.get("/opengraph-image.png");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  });

  // The generated per-route cards originally used a letterspaced *text* eyebrow, so
  // a share of /artists or /thesis unfurled with no brand mark at all.
  test("every generated OG card carries the shared Wordmark lockup", () => {
    const cards = findOgCards(APP);
    expect(cards.length, "expected generated OG cards to exist").toBeGreaterThan(0);
    for (const file of cards) {
      const src = readFileSync(file, "utf8");
      const rel = file.replace(process.cwd(), "").replace(/\\/g, "/");
      expect(src, `${rel} must render <Wordmark /> from lib/og-brand`).toMatch(/<Wordmark\s*\/>/);
      expect(src, `${rel} must use the shared frame so the bands cannot collide`).toContain("frameStyle");
    }
  });

  // /collection/* and all 43 CryptoPunk pieces were emitting no og:image at all:
  // the file-convention root image is NOT inherited once a route returns its own
  // openGraph object, and those routes passed images: undefined when they had no
  // artwork (Punk art is SVG, which the gateway cannot transform).
  for (const path of [
    "/",
    "/artists",
    "/chapters",
    "/thesis",
    "/press",
    "/artist/xcopy",
    "/collection/cryptopunks", // all-SVG collection -> must fall back, not go bare
    "/collection/fidenza",
    "/piece/cryptopunks-4752", // SVG piece -> must fall back, not go bare
    "/piece/fidenza-456",
  ]) {
    test(`${path} emits an og:image`, async ({ request }) => {
      const html = await (await request.get(path)).text();
      const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
      expect(og, `${path} unfurls with no image`).toBeTruthy();
      expect(og).toMatch(/^https?:\/\//);
    });
  }
});

test.describe("invariants: rendering + routing", () => {
  // Reading searchParams on the server opts a route out of static generation. When
  // /piece/[slug] did that, all 318 pages were served `private, no-store` -- a
  // function invocation per visit, crawl and OG unfurl, on the URLs people share.
  // Trait filtering there is resolved client-side (src/lib/piece-nav.ts) to keep
  // these cacheable; re-adding a searchParams prop would silently undo it.
  for (const path of ["/piece/cryptopunks-4752", "/piece/fidenza-456", "/artist/xcopy", "/thesis"]) {
    test(`${path} is served cacheable, not per-request`, async ({ request }) => {
      const cc = (await request.get(path)).headers()["cache-control"] ?? "";
      expect(cc, `${path} lost its prerender -- Cache-Control was "${cc}"`).not.toContain("no-store");
      expect(cc).toContain("s-maxage");
    });
  }

  // Unknown slugs used to render on demand, so notFound() was served with HTTP 200
  // -- a soft 404 telling crawlers a broken link is a real page. dynamicParams =
  // false on the parameterized routes is what makes these genuine 404s.
  for (const path of [
    "/piece/definitely-not-a-piece",
    "/artist/definitely-not-an-artist",
    // Folded into another artist: excluded from generateStaticParams AND the
    // sitemap, but was still serving a complete duplicate page.
    "/artist/tyler-hobbs-and-dandelion-wist",
  ]) {
    test(`${path} returns a real 404`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404);
    });
  }

  // Piece URLs are the shared unit; 317 old slugs redirect to their new form.
  test("old piece slugs still redirect", async ({ request }) => {
    const res = await request.get("/piece/pxl-dex-105-ecfb", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toContain("/piece/pxl-dex-105");
  });

  // Set in next.config.ts. Silent to lose and invisible in the UI.
  test("security headers are present", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["strict-transport-security"]).toContain("max-age=");
  });
});

test.describe("invariants: images", () => {
  // A flat `sizes` string makes the browser pick a candidate sized for the WIDEST
  // tile in the layout and download it for every tile. #29 widened FixedRowGallery
  // to "(min-width: 1024px) 1000px, 500px", which put 185/313 homepage tiles above
  // 2.5x oversampling and cost 71MB vs 31MB over a full scroll.
  //
  // Asserted on the width the browser ACTUALLY requested (img-width in currentSrc,
  // which the Filebase loader writes) rather than on the `sizes` string. That is
  // the property we care about, and it is agnostic to how sizes is expressed --
  // the original bug used a media-query form, so a test that only understood bare
  // pixel values would have missed a re-introduction of the exact same mistake.
  //
  // Some headroom is expected and fine: srcset candidates are discrete (256, 384,
  // 640, 750, 1080 …) so a 285px tile legitimately requests 384. The failure being
  // guarded against was an order of magnitude off -- 1080 for a 285px tile.
  const MAX_OVERSAMPLE = 2;

  test("no gallery tile requests an image far larger than it renders", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const { measured, bad } = await page.evaluate(() => {
      const bad: { requested: number; rendered: number; ratio: number }[] = [];
      let measured = 0;
      // Gallery tiles only (GridArtwork's class signature). Hero / single-piece
      // displays are excluded deliberately: they declare a larger `sizes` than
      // their CSS width so a retina screen still gets a sharp master, and this
      // test runs at DPR 1, which would read that as oversampling. The invariant
      // being protected here is about grid tiles, where the artwork is small and
      // the multiplier compounds across hundreds of images.
      for (const img of Array.from(document.querySelectorAll("img.h-full.w-full"))) {
        const el = img as HTMLImageElement;
        const requested = Number(el.currentSrc?.match(/img-width=(\d+)/)?.[1] ?? 0);
        const rendered = Math.round(el.getBoundingClientRect().width);
        if (!requested || !rendered) continue;
        measured++;
        const ratio = requested / rendered;
        if (ratio > 2) bad.push({ requested, rendered, ratio: Number(ratio.toFixed(2)) });
      }
      return { measured, bad };
    });

    // Guard against the test silently passing because nothing was measured.
    expect(measured, "no gateway-served tiles were measured").toBeGreaterThan(20);
    expect(
      bad,
      `tiles requesting >${MAX_OVERSAMPLE}x their rendered width: ${JSON.stringify(bad.slice(0, 8))}`,
    ).toHaveLength(0);
  });
});

test.describe("invariants: accessibility", () => {
  // Section labels ("Exhibitions", "Hivemind commentary", "Collection details")
  // were styled <p> eyebrows, so content pages exposed exactly one heading and
  // screen-reader users got no navigable structure. The small-caps eyebrow style
  // is used for two different things -- the page-level label above the <h1> stays
  // a <p>; anything introducing a block must be a heading.
  for (const path of ["/press", "/collection/cryptopunks", "/piece/fidenza-456", "/artist/xcopy"]) {
    test(`${path} exposes a real heading structure`, async ({ page }) => {
      await page.goto(path);
      const { h1, levels } = await page.evaluate(() => ({
        h1: document.querySelectorAll("h1").length,
        levels: Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) =>
          Number(h.tagName[1]),
        ),
      }));
      expect(h1, "exactly one h1 per page").toBe(1);
      expect(levels.length, "section labels should be headings, not styled <p>").toBeGreaterThan(1);
      const skips = levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1);
      expect(skips, `heading levels skip: ${levels.join(",")}`).toHaveLength(0);
    });
  }
});
