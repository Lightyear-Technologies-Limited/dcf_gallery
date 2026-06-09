# Deployment runbook — Vercel (D.5)

The gallery is a **fully static Next.js 16 site** (every page is pre-rendered via
`generateStaticParams`; there is no runtime backend). Artwork is served from
**Filebase IPFS**, never from Vercel. This runbook is the one-time setup plus the
ongoing deploy flow.

> TL;DR: import the repo, set **one** env var, deploy. Vercel serves HTML + a little
> JS; Filebase serves all the heavy art. Vercel image bandwidth is ~zero by design.

---

## 1. One-time project setup

1. **Import the repo** in Vercel → *Add New… → Project* → pick this GitHub repo.
2. **Framework preset:** Next.js (auto-detected — leave the defaults).
   - Build command: `npm run build` *(do not override)*. This automatically runs
     the `prebuild` step (`npm run content`) first, which **Zod-validates the
     editorial content and fails the build on a bad curator note** — see
     [`content/editorial/README.md`](../content/editorial/README.md).
   - Install command: `npm ci` (default).
   - Output: `.next` (default).
3. **Node version:** 20.x (matches CI; pinned via `engines` in `package.json`).
   Project Settings → *Node.js Version* if you need to set it explicitly.
4. **Environment variables** (Project Settings → *Environment Variables*):

   | Variable | Value | Scope | Notes |
   |---|---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://gallery.hivemind.capital` (final domain) | Production (+ Preview) | Only used to build absolute OG/canonical URLs. If unset, it falls back to that same default, so the site still builds. |

   **That's the only variable Vercel needs.** The Alchemy / Filebase keys in
   `.env.example` are for the **local** data-pipeline scripts (`npm run pin`,
   `pin-videos`, `verify-pins`, `sources`) — those are run by a maintainer on their
   machine, never during a Vercel build. Do **not** add them to Vercel.

5. **Deploy.** The first build should generate all ~354 static pages.

---

## 2. Custom domain

1. Project Settings → *Domains* → add `gallery.hivemind.capital`.
2. At the DNS provider, add the CNAME / A record Vercel shows.
3. Set `NEXT_PUBLIC_SITE_URL` to the final `https://…` origin and redeploy so OG
   tags and the sitemap use it.

---

## 3. Why Vercel image bandwidth is ~zero (and how to confirm)

`next.config.ts` sets a **custom image loader** (`src/lib/image-loader.js`). With a
custom loader, Next's `<Image>` does **not** route through Vercel's `/_next/image`
optimizer:

- **Artwork** → the loader rewrites the `src` to the Filebase gateway transform
  (`…?img-width=N&img-format=webp`). The browser fetches it **directly from
  Filebase**. Vercel never touches the bytes.
- **Local files** (the 40 CryptoPunk SVGs, a handful of curated crops) → served as
  static assets with `Cache-Control: public, max-age=31536000, immutable`.

**Verify after deploy:**
- DevTools → Network → filter `myfilebase.com`: grid/detail images load from the
  gateway (status 200, `cache-control: … immutable`).
- There should be **no** `/_next/image?url=…` requests.
- Vercel dashboard → *Usage → Image Optimization* should stay ~0 over time.

Security headers (CSP, HSTS, `X-Frame-Options: DENY`, etc.) are emitted by
`next.config.ts` `headers()` and apply automatically on Vercel — confirm with
`curl -I https://<domain>/`.

---

## 4. Preview deploys (content review)

Vercel's GitHub integration builds a **preview deployment for every pull request**
automatically — no config needed. Use these URLs to review curator-copy edits
(e.g. a PR that fills in the empty curator notes) before they reach production.

Because editorial content is validated in `prebuild`, a PR with an invalid edit
**fails its preview build** with the exact field path, so broken copy can't merge.

---

## 5. Ongoing flow

- **Production** deploys from `master` on every push/merge.
- **Previews** deploy from every PR / non-production branch.
- Routine content edits (curator notes, bios) are a PR against
  `content/editorial/*.json` → preview → merge → auto-deploy. A git-backed CMS
  (TinaCMS) will later drive these edits without hand-editing JSON.

---

## 6. Acceptance checklist (plan D.5)

- [ ] Production deploy succeeds from `master` (all static pages generated).
- [ ] Preview deploy appears on a test PR.
- [ ] Network panel shows art from `lightyear.myfilebase.com`, **no** `/_next/image`.
- [ ] Vercel Image Optimization usage ~0.
- [ ] `NEXT_PUBLIC_SITE_URL` set; OG tags + canonical URLs use the real domain.
- [ ] Security headers present (`curl -I`).
