# DCF Gallery — Tier 0 & 1 Upgrade Plan

Actionable, trackable plan derived from the 12-agent review (2026-06-04). Decisions
and rationale live in [`DECISIONS.md`](./DECISIONS.md). June launch is soft — we do
this work first.

**How to use this file.** Each task has a checkbox, an ID, the files it touches, an
acceptance test, and dependencies. Check the box when the acceptance test passes.
The **Gaps & Risks register** and **Success criteria** at the bottom were produced
by a `/fb:how` validation pass and should be reviewed whenever the plan changes.

**Status:** ⬜ not started · 🟦 in progress · ✅ done · ⏸ blocked
**Effort:** S (<½ day) · M (½–2 days) · L (>2 days)

---

## Phase 0 — Safety first (do before touching the data pipeline)

> The single highest-severity issue in the repo is **data loss**, independent of
> any feature. Close it before anything else.

- [→] **P0.1 — Freeze & extract editorial content** · M · ↪ folded into C.4
  (acute data-loss risk is now closed by P0.2's guard; doing the full extraction
  once in C.4 avoids throwaway interim work — flagged to user 2026-06-04)
  Extract every human-written field out of the 5,703-line `src/lib/data.ts` into a
  separate, valid, schema-validated source before anyone re-runs the importer.
  - Files: new `content/editorial/*.json` (or `.md`), `scripts/extract-editorial.mjs` (new)
  - Fields: `bio`, `curationComment`, `artistQuote`, `description`, `curatorNote`,
    `artistStatement`, `holdingNote`, ordering, plus hand-added `originalUri`s.
  - Acceptance: editorial content reproducible from the new files via a build join;
    nothing human-written lives only inside `data.ts`; rebuilt `data.ts` is
    byte-equivalent on editorial fields (diff check).

- [x] **P0.2 — Guard `import-portfolio.mjs`** · S · ✅ done — refuses without `--force`
  Make the importer refuse-by-default / merge-only so it can never silently
  truncate-and-replace hand-edited content.
  - Files: `scripts/import-portfolio.mjs` (the destructive `writeFileSync`),
    hardcoded SharePoint path at top.
  - Acceptance: running the importer without `--force` on an existing populated
    `data.ts` aborts with a clear message; with editorial extracted (P0.1) a
    re-import never overwrites editorial fields.

- [x] **P0.3 — Env scaffold + credentials** · S · ✅ `.env.example` + keys verified (Alchemy + Filebase set)
  - Files: `.env.example` (done), `.gitignore` (`!.env.example` exception added, done)
  - Needs from team: `ALCHEMY_API_KEY` (or `ETH_RPC_URL`), `FILEBASE_ACCESS_KEY`,
    `FILEBASE_SECRET_KEY`, `FILEBASE_BUCKET`. Optional: OpenSea/Reservoir.
  - Acceptance: `cp .env.example .env`, keys filled, a pipeline script authenticates
    to the RPC + Filebase successfully.

---

## Phase A — Tier 0: cheap, high-impact wins (no infra decision needed)

- [x] **A.1 — Grids load `thumb`, not `detail`** · S · ✅ done — ⭐ biggest single win
  (corrected scope: 3 true multi-tile grids — Justified/FixedRow/HeroSidebar sidebar.
  The other 3 sites are single-piece *hero* displays and correctly stay on `detail`.)
  Every grid tile fetches the 1200px `detail` image and only uses the small thumb
  to measure aspect ratio → ~5–9× wasted bytes per browse view.
  - Files: `src/components/JustifiedGallery.tsx` (~:100), `FixedRowGallery.tsx` (~:100),
    `CollectionView.tsx` (~:317), `HeroSidebarGallery.tsx` (~:128),
    `src/app/artists/page.tsx` (~:52), `src/app/artist/[slug]/page.tsx` (~:251)
  - Acceptance: grid tiles request the thumb tier; homepage above-the-fold image
    bytes drop materially (verify in DevTools network).

- [x] **A.2 — Build-time aspect ratios in galleries** · ✅ done
  Galleries now read `getArtworkAspect` (aspects.data.json) directly — **266/312
  pieces resolve instantly, no network**; the other 46 use a **tiny 32px gateway
  probe, never the full original**. Fixes the heavy-load regression that gateway
  routing introduced (the old probe was loading 34 MB originals to measure aspect).
  - Follow-up (optional): server-feed the aspect as a prop for zero-CLS first paint.

- [x] **A.3 — Fonts → woff2** · ✅ done — Instrument Sans variable TTFs converted to woff2
  (192K→88K, 200K→96K; ~54% smaller); removed the dead Argent `.woff`. `next/font/local`
  handles preload + `display: swap`. ~258 KB of font weight removed.

- [x] **A.4 — Add `prefers-reduced-motion` guard + focus-visible rings** · S · ✅ done (globals.css)
  - Files: `src/app/globals.css`, gallery tile `Link`s
  - Acceptance: reduced-motion users get no transitions; keyboard focus is visible
    on tiles in both themes. (Prereq for D8 playback + D7 explorer motion.)

- [x] **A.5 — Correctness fixes surfaced by the review** · S · ✅ done — `deriveStorage` IPFS-gateway fix + `PlaceholderArt` 11 slug-keys corrected
  - `PlaceholderArt.tsx` palette keys use stale slugs (`woy`, `pxldex`, `xcopy`…)
    that never match real slugs → all fall to gray. Fix keys or delete the map.
  - `deriveStorage()` in `src/app/piece/[slug]/page.tsx` mislabels `ipfs.pixura.io`
    (and bare-CID/Art-Blocks branches never fire) → IPFS art shown as "Centralized".
    Detect `/ipfs/` before the generic https check.
  - Acceptance: placeholder colors correct (or map removed); Storage row labels
    IPFS-hosted pieces as IPFS.

---

## Phase B — Tier 1: asset pipeline → Filebase IPFS

> Implements [D1](./DECISIONS.md#d1) (IPFS single store). No `sharp` resize
> pipeline — Filebase does on-the-fly optimization. App stays on Vercel ([D2](./DECISIONS.md#d2)).

- [x] **B.1 — Re-resolve canonical sources + `animation_url`** · ✅ done (`scripts/resolve-sources.mjs`)
  313 resolved, 0 failures → 40 arweave / 37 ipfs / 174 centralized / 60 onchain / 1 physical.
  79 have an `animation_url` (mostly interactive-HTML generators, not video). **1 gap:
  `cope-salada-125` returned no source — backfill manually.** Output: `scripts/asset-sources.json`.
  258 pieces have `originalUri` (190 are centralized renders); 54 on-chain pieces
  have none (mostly fully-on-chain CryptoPunks). Resolve the **canonical** source
  AND capture `animation_url` for video/interactive pieces (for D8).
  - Files: `scripts/pull-original-uris.mjs`, `scripts/fetch-piece-metadata.mjs` (extend),
    needs `ALCHEMY_API_KEY` (not `--demo`)
  - Acceptance: every non-physical piece has a canonical image pointer; the 26
    video/interactive pieces have a resolved `animation_url`; recorded in facts layer.

- [x] **B.2 — Pin originals + sharp detail variants to Filebase IPFS** · ✅ done (`scripts/pin-assets.mjs`)
  **All 313 pinned, 0 errors.** 311 auto + 2 fixed: `cope-salada` (Shape L2 — animated on-chain
  SVG resolved via Shape RPC, wired into the curated map) and `tyler-hobbs-2` (variants
  regenerated after lifting sharp's pixel limit). 251 raster pieces carry sharp variants
  (768/1280/1920, webp q95) + LQIP; SVG/punk pieces serve raw. Animation/video pinning → E.1.
  Upload via the S3 API (`aws-cli`/SDK) to the **IPFS** bucket; capture CID +
  sha256 + byteLength + mimeType per asset. Pin both stills and video sources.
  - Files: new `scripts/pin-assets.mjs`, Filebase credentials in `.env`/CI secrets
  - Acceptance: every piece's original (and each video) is pinned; manifest rows
    written (see C.1); the dedicated gateway serves each CID.

- [x] **B.3 — Image loader → Filebase gateway** · ✅ done (`src/lib/image-loader.js`)
  Custom Next loader appends `img-width` + `img-format=webp` per width (responsive srcset);
  `getArtworkImage` routes pinned raster → gateway, SVG/unpinned → local fallback. Verified:
  34 MB PNG renders as 74 KB webp @512; full srcset (384–3840px) confirmed in rendered HTML.
  **Note:** `img-format=webp` is mandatory (gateway preserves source format otherwise).
  **Path B hybrid (decided by visual A/B):** the gateway's resampler is soft on detailed art,
  so **grids use the gateway (q90, auto-responsive)** but the **detail/hero serves our own
  `sharp` variants** (raw `<img srcset>`, bypassing the loader) + **LQIP blur-up**
  (`getDetailVariants`/`getArtworkBlur` in images.ts; render in PieceLayout). Verified rendering.
  Replace local-path resolution with gateway URLs carrying transform params; build
  `srcset` of breakpoint widths (LQIP ~24px, grid ~512px, detail ~1280px); full
  original via the un-parametered CID URL for click-to-zoom / "View original".
  - Files: `src/lib/images.ts` (`getArtworkImage`/`getArtworkAspect` → gateway URLs),
    `next.config.ts` (Filebase loader / `unoptimized` for those sources so Vercel
    doesn't re-optimize), gallery + `PieceLayout`
  - Acceptance: pages load sized WebP from the gateway; no >60KB image in any grid
    view; mobile honors smaller widths; full-res reachable on demand; **fallback to
    full image if a transform errors**. (param contract verified — see gap #1)

- [x] **B.4 — Immutable caching** · ✅ done — the Filebase gateway already serves
  `Cache-Control: …immutable`; added the same for local `/art/*` via `next.config`
  `headers()`. The custom image loader already bypasses Vercel's optimizer.

- [~] **B.5 — Remove binaries from git + purge history** · 🟦 tree done; history purge pending
  `scripts/prune-local-art.mjs --apply` removed 667 dead files (228.6 MB); `public/art`
  234 MB → 3.7 MB (keeps punks + curated set). `.gitignore` updated. Committed (`2d02ec6`).
  **Remaining:** `git filter-repo` to purge blobs from history (shrinks `.git`) — the
  FINAL step before merge to master (needs a coordinated re-clone).

- [x] **B.6 — Onboarding tooling for future pieces** · ✅ done
  `npm run onboard` (`scripts/onboard.mjs`) chains resolve-sources → pin-assets
  (idempotent; `--only`/`--refresh`) and prints a gap report. npm scripts added:
  `sources`, `pin`, `onboard`, `curate`, `typecheck`. Runbook + reusable **agent
  prompt**: `docs/ADDING-PIECES.md`. New pieces flow through the identical pipeline.

- [x] **B.7 — Manifest bundle hygiene (server/client split)** · ✅ done
  The full provenance manifest (~1.7 MB) had leaked into a **1.6 MB client chunk**. Split it:
  galleries (client) read a slim **18 KB `provenance.cids.json`** (grid CIDs only); the full
  manifest + detail variants + LQIP live in **server-only `src/lib/provenance.ts`** (imported
  only by the piece page). Verified: **0 variant CIDs / 0 LQIP in client JS; total client JS
  ~784 KB** (was ~2.4 MB). Pre-empts part of A.2.

---

## Phase C — Tier 1: content architecture, provenance & credibility

- [x] **C.1 — Provenance manifest + verification** · ✅ done — `scripts/verify-pins.mjs`
  (`npm run verify-pins`): re-fetch each CID → recompute sha256 → assert match → stamp
  `verifiedAt`; exits non-zero on mismatch. **Full run: 312/312 verified, 0 mismatch.** CI wiring → D.4.
  Per-piece `{ source, cid, sha256, byteLength, pins[], pinnedAt, verifiedAt }` in
  the derived layer; a CI job re-fetches each CID, recomputes the hash, asserts match.
  - Files: new `src/lib/provenance.data.json` (+ generator), `scripts/verify-pins.mjs`,
    `Piece`/derived schema
  - Acceptance: build/CI fails (or degrades the badge) on a hash mismatch;
    `verifiedAt` refreshed on each verification run.

- [x] **C.2 — Preservation indicator + provenance rows** · ✅ done — visible "Preserved by
  DCF — pinned to IPFS[· integrity verified]" line + CID(→gateway) / SHA-256 / date rows in
  the expandable OnChainDetails, from the server-only manifest. Storage label now from real
  provenance data.
  Surface "Preserved · pinned · CID … · verified {date}" **from the manifest**, and
  an **expandable (not default-open) full-metadata panel** with the complete
  on-chain attributes + storage provenance. "View original" → the pinned CID URL.
  - Files: `src/components/OnChainDetails.tsx` (extend), `MetadataTable.tsx`,
    `PieceLayout.tsx`, `src/app/piece/[slug]/page.tsx` (`deriveStorage` → manifest)
  - Acceptance: badge reflects real data; full metadata reachable via disclosure,
    closed by default; IPFS pieces link to your gateway CID.

- [x] **C.3 — Per-page OG / social metadata** · ✅ done — `generateMetadata` on
  piece/artist/collection routes; per-piece **og:image** (gateway 1200px JPG), title
  template (`… — Hivemind DCF`), `twitter:summary_large_image`; `metadataBase` via
  `NEXT_PUBLIC_SITE_URL` (domain TBD). Verified: a shared piece unfurls with artwork
  + title + artist + description.

- [ ] **C.4 — Content/copy segregation (three-layer model) + Tina-ready** · L · _P0.1_
  Promote the P0.1 extraction into the real build join: facts ⨝ editorial ⨝ derived,
  validated by Zod; `data.ts` becomes generated; structure files so a git-backed CMS
  (Tina/Decap) can edit them later.
  - Files: `content/editorial/*`, `scripts/build-data.mjs` (new join), `src/lib/data.ts`
    (generated), `src/lib/curation.ts` (replace `as unknown as` casts with Zod types)
  - Acceptance: editing a curator note = editing one valid file; build fails with a
    precise path on invalid editorial data; no field has two writers.

- [x] **C.5 — Share affordance** · ✅ done — `ShareButton` (native Web Share sheet on
  mobile, X-intent fallback) in the piece-page link list.

- [ ] **C.6 — Fill the 5 empty collection curator notes + audit artist notes** · M · _C.4_
  (Content task, owner = Michael/marketing.) Acceptance: no `curatorNote: ''`.

---

## Phase D — Tier 1: quality gates, security, hosting

- [x] **D.1 — Site-wide security headers / CSP** · ✅ done — `next.config.ts` `headers()`
  emits a tight CSP (gateway scoped to `img-src`/`media-src` only) + `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options: DENY`, HSTS, `Permissions-Policy`. Verified live.
  `script-src`/`style-src` keep `'unsafe-inline'` (Next injects inline RSC/hydration scripts;
  a nonce CSP would force all pages dynamic — not worth it for a static no-auth site).

- [~] **D.2 — Dependency hygiene** · 🟦 mostly done
  `playwright` moved to `devDependencies`. `npm audit`: 2 moderate are a build-time
  transitive `postcss` in Next 16 (CSS-stringify XSS, not exploitable — we don't process
  untrusted CSS); the auto-"fix" wants to **downgrade Next to 9.3.3**, so we leave it
  (resolves when Next bumps its bundled postcss). Dependabot added (D.4); secret scan clean
  (only `.env.example` tracked, `.env` ignored, no hardcoded keys; the "key-like" hits were
  public Arweave tx IDs).

- [x] **D.3 — `npm run audit` asset gate** · ✅ done — `scripts/audit-assets.mjs` confirms
  every piece resolves to a servable image (gateway CID / curated file / punk SVG) and
  exits non-zero on any gap. Verified: 313 → 251 gateway / 22 curated / 40 punk, 0 issues.
  Architecture-aware replacement for the old local-only audit scripts.

- [~] **D.4 — CI pipeline** · 🟦 core done — `.github/workflows/ci.yml`: `npm ci` → lint →
  typecheck → audit → build (all verified green locally), plus `.github/dependabot.yml`
  (weekly npm + actions, grouped minor/patch). **Remaining:** Playwright smoke/visual +
  Lighthouse budget (needs `@playwright/test` + baseline snapshots).

- [ ] **D.5 — Vercel hosting hardening** · S · _B.4_ · (host decided: Vercel ✅)
  Confirm SSG build on Vercel; ensure Filebase art isn't re-optimized by Vercel;
  wire env vars into Vercel project; confirm per-PR preview deploys for content review.
  - Acceptance: production deploy from `main`; preview per PR; image bandwidth on
    Vercel near-zero (art served by Filebase).

---

## Phase E — Tier 1: signature experiences (motion + deluxe navigation)

> Implements [D7](./DECISIONS.md#d7) (navigation) and [D8](./DECISIONS.md#d8)
> (playback). Design-led; expressive but inside the perf budget and reduced-motion.

- [ ] **E.1 — Video/interactive playback engine** · L · _B.2, A.4_
  Poster-still-by-default + "motion" indicator; global **"Play all"** preference in
  `localStorage` (pre-paint, like theme); hover-to-play (desktop) / tap-to-play
  (touch); keyboard play/pause/stop on focused piece; in-view autoplay (muted,
  looped, lazy, paused off-screen) when "Play all"; `prefers-reduced-motion` honored;
  mobile-data guard; clear video/interactive labelling.
  - Files: new `MotionPreference` context + toggle (header), poster-extraction step
    (`scripts/extract-posters.mjs`, ffmpeg), `PieceLayout.tsx`, gallery components,
    `src/app/layout.tsx` (pre-paint pref script)
  - Acceptance: the 26 pieces play per the rules above; no autoplay under reduced-
    motion or on mobile-by-default; off-screen videos paused; within perf budget.

- [ ] **E.2 — Filters + free-text search** · M · _A.2_
  Brief's full set — Artist / Collection / Movement(Chapter) / Medium — plus text
  search, as a refined secondary surface (not replacing curation).
  - Files: new filter/search components, `CollectionView.tsx`, a client search index
    built from `data.ts` at build (keep it tiny / server-fed)
  - Acceptance: filter + search work across all pieces; URL-encoded so state survives
    nav (mirrors existing `?trait=` pattern); no heavy client payload regression.

- [ ] **E.3 — Deluxe chapter-explorer navigation** · L · _A.2, E.2_ · design-led
  An immersive, high-craft way to move between the 5 chapters and *feel* where you
  are — the "lobby" experience. Run `shape` to design, then `impeccable`/`overdrive`/
  `animate` to build. GPU-cheap (transforms/opacity), reduced-motion fallback, inside
  CWV budget. Piece/gallery pages stay restrained.
  - Files: new explorer component(s), `src/lib/chapters.ts`, home route; update
    `.impeccable.md` principle 5 to reflect the lobby-vs-gallery split
  - Acceptance: a distinctive, professional chapter navigation; LCP/CLS/INP budgets
    held; degrades gracefully under reduced-motion and on mobile.

---

## Gaps, risks & dependencies (`/fb:how` validation pass)

**Gaps to close before/while building:**
1. ✅ **Filebase transform contract — VERIFIED 2026-06-04.** Dedicated gateway
   `lightyear.myfilebase.com` does on-the-fly transforms: `img-width=N` (resize),
   `img-quality=N`, `img-format=jpg|png`; default **webp** is the deliverable
   (AVIF unsupported). Immutable `Cache-Control` built in. `img-width=24` ≈ 512 B LQIP.
2. **No LQIP source decided** — `?img-width=24` blur vs a build-time base64.
   → fold into B.3 (prefer the gateway param to avoid a build step).
3. **CMS tool**: Tina (preferred) vs Decap — pick when C.4 lands; CMS-agnostic until then.
4. **Video weights + poster extraction** (E.1) — need ffmpeg in the pipeline; confirm
   each `animation_url` is web-deliverable (transcode oversized GIF/MP4 if needed).
5. **Design direction for the explorer** (E.3) needs a `shape` brief + sign-off; it
   evolves `.impeccable.md` doctrine — get explicit brand approval.
6. **Editorial extraction must be lossless** (P0.1) — byte-equivalent diff on rebuild.

**Risks:**
- **R1 (high):** history rewrite (B.5) breaks collaborators' clones — coordinate a
  cut-over. Mitigated: colleague already aware.
- **R2 (med):** hot-path dependency on Filebase transform/gateway — mitigated by the
  full-image fallback (B.3) and immutable caching (B.4).
- **R3 (med):** deluxe explorer + motion (E.1/E.3) could regress CWV or fight the
  restrained brand — mitigated by perf budget, reduced-motion, lobby-vs-gallery split.
- **R4 (low):** re-resolved canonical CIDs may differ from existing centralized
  `originalUri` — keep both; label the optimized derivative as a derivative.

**Cross-task dependencies (build order):**
`P0.1/P0.2/P0.3 → A.* (parallel) → B.1 → B.2 → {B.3 → B.4 → B.5}`,
then `C.1 → C.2`, `B.3 → C.3 → C.5`, `P0.1 → C.4 → C.6`,
`B.2+A.4 → E.1`, `A.2 → E.2 → E.3`, and `D.*` after their noted deps.

---

## Success criteria / launch gates

- [ ] No grid view ships an image > 60 KB; homepage < 1.2 MB on 4G.
- [ ] Mobile LCP < 2.5s; CLS < 0.05; INP < 200ms (Lighthouse, mid-tier phone) —
      held even with the explorer + motion enabled.
- [ ] Zero missing/mismapped images across all 313 pieces (`npm run audit` green).
- [ ] Every piece's original (and video) is pinned with a CI-verified CID + hash.
- [ ] Shared piece links unfurl with artwork + title + artist.
- [ ] Video/interactive pieces play per D8; reduced-motion + mobile defaults respected.
- [ ] Editing a curator note = editing one valid file; re-import can't destroy copy.
- [ ] `public/art/**` no longer in git; assets served from Filebase.
- [ ] Security headers A-grade; no secrets in history.
- [ ] CI blocks a broken-page deploy.

---

## Decisions resolved (was "still needed")

1. **App host** → **Vercel** ([D2](./DECISIONS.md#d2)). ✅
2. **CMS** → **TinaCMS** (Decap fallback), built on the C.4 content layer ([D5](./DECISIONS.md#d5)). ✅
3. **Video/interactive** → **full playback** with motion-preference toggle ([D8](./DECISIONS.md#d8)). ✅
4. **Filters/search** → **kept and elevated** + deluxe chapter explorer ([D7](./DECISIONS.md#d7)). ✅

**Still needed from the team:**
- Credentials for `.env` (RPC + Filebase) — see P0.3.
- Brand sign-off to evolve `.impeccable.md` principle 5 for the explorer (E.3).
- Confirm acceptable video weights / whether any piece must stay still-only.
