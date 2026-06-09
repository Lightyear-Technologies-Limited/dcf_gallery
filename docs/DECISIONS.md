# DCF Gallery — Decision Log

Decisions arising from the 12-agent architecture review on **2026-06-04** and the
follow-up discussion. The June 2026 launch is an **internal / soft** target — we
are doing this upgrade work first.

**Status legend:** ✅ Accepted · 🟡 Proposed (needs confirmation) · ⬜ Open

Companion document: [`UPGRADE-PLAN.md`](./UPGRADE-PLAN.md) (the actionable, trackable plan).

---

## D1 — Storage & delivery: Filebase **IPFS** (single store) ✅

**Decision.** Use one Filebase **IPFS** bucket as both the serving store and the
preservation layer. Pin each piece's canonical original (→ CID + sha256) and
serve sized WebP via Filebase's **on-the-fly image optimization** through the
dedicated gateway `lightyear.myfilebase.com`, CDN-cached.

**Why.** Filebase's on-the-fly optimization (sized-to-screen WebP via
`?img-width=…` — the feature we want) is **IPFS-only today** ("Object Storage
support coming soon"). IPFS also yields the CID/provenance story natively. For a
part-time, non-dev team the **single-store, no-build-pipeline simplicity**
outweighs S3's marginal free-egress benefit (negligible at gallery traffic).

**Considered & rejected.**
- *S3-serve + IPFS-pin hybrid* — cleaner serve/preserve separation, but forfeits
  on-the-fly optimization (would require a `sharp` build pipeline to maintain)
  and adds a two-bucket dual-write. The egress saving doesn't matter at our scale.
- *Pre-generated variants on a generic CDN / Cloudflare R2* — more moving parts
  than the team needs; only revisit if we outgrow Filebase's transform.

**Transform contract — VERIFIED 2026-06-04 (one-asset spike).** Pin via S3 API
→ CID + `pinning-status: pinned`. Gateway `lightyear.myfilebase.com/ipfs/{CID}`
does on-the-fly transforms: **`img-width=N`** (resize; bare `width` is ignored),
**`img-quality=N`**, **`img-format=jpg|png`**. Default output is **webp** and is
the deliverable — **AVIF is not supported** (and not `Accept`-negotiated).
`img-width=24` ≈ 512 B (great LQIP). Responses carry `Cache-Control: …immutable`,
so B.4 caching is free. Warm latency ~0.4s; cache-warm hero sizes at deploy if needed.

**Delivery quality — Path B hybrid (decided 2026-06-05 by visual A/B).** The
gateway's on-the-fly resampler is visibly soft on detailed art even at q95, so:
**grids** use the gateway (q90, auto-responsive, light); the **detail/hero** serves
our own pre-generated **`sharp` Lanczos3 + unsharp webp variants** (768/1280/1920,
q95) raw via a plain `<img srcset>` (bypassing the loader so they aren't
re-resized), with a tiny **LQIP blur-up**. The true original stays pinned + one
click away. Grids can be upgraded to sharp variants later if needed.

**Remaining caveats.**
- Keep a **fallback**: if a transform fails, serve the full image (degraded but
  functional).
- Content-addressed URLs are immutable — fine for immutable art.
- **Video pieces** are pinned as their `animation_url` source; stills are an
  extracted poster frame (see [D8](#d8)).

**Durability story for LPs.** Each work ends up in three places: the Filebase
IPFS pin (verifiable CID), the asset's native Arweave/IPFS source, and the
on-chain `tokenURI` pointer. We can credibly say "preserved & pinned."

---

## D2 — App hosting: **stay on Vercel** ✅

**Decision.** Keep the app on **Vercel** (the team already has a Pro plan and
pipeline). Deploy as a Next.js SSG app; the heavy art is served from Filebase
(D1), so we **do not** route images through Vercel's image optimizer — meaning
Vercel's usual cost traps (image-optimization units, bandwidth) effectively don't
apply; the app ships only HTML/JS.

**Why this changes the earlier lean.** The original pull toward Cloudflare Pages +
static export was motivated by "serve off-ours" and cheap image egress. Both
dissolve here: the team is fine on Vercel, and image egress is now Filebase's job.
Staying put = zero migration, best-in-class Next support, and per-PR **preview
deploys** for non-dev content review.

**Consequences.**
- A hard `output: 'export'` is **no longer required** — keep Next SSG on Vercel,
  which preserves useful options (e.g. `@vercel/og` for share images, future ISR).
- Configure `next/image` so Filebase-hosted art is **not** re-optimized by Vercel
  (custom loader or `unoptimized` for those sources).
- Still target immutable, long-cache headers on static assets.

---

## D3 — Provenance / preservation is data, not a static badge ✅

**Decision.** Store per piece: canonical source pointer, **CID**, **sha256**,
byte length, pin provider(s), `pinnedAt`, `verifiedAt`. **Re-verify in CI**
(re-fetch CID, recompute hash, assert match) and render the "Preserved · pinned ·
verified" indicator **from that data**, never as hardcoded copy. Re-resolve the
**canonical** source from the on-chain `tokenURI` for the 190 pieces whose current
`originalUri` is a centralized render.

**Why.** For an institutional audience a green check that verifies nothing is a
liability. The claim must equal the data.

---

## D4 — Binaries out of git; purge masters from history ✅

**Decision.** Remove `public/art/**` (234 MB, ~110 MB of which are 22–45 MB raw
masters that are **never served**) from the repo; assets live on Filebase.
Purge the large masters from git history (`git filter-repo`).
**Colleague has agreed to this.** Requires a coordinated re-clone for collaborators.

---

## D5 — Content/copy segregation now; **git-backed CMS (Tina)** later ✅

**Decision.** Split the data into three field-classes with **one writer each**:
- **facts** (machine-owned: tokenId, contract, traits, mintDate…) — regenerable.
- **editorial** (human-owned: bios, curator notes, descriptions, statements,
  ordering) — **never auto-overwritten**.
- **derived** (machine: image variants, aspects, LQIP, provenance manifest).

Extract the editorial layer **now** into flat, **valid**, schema-validated files
(Zod) the colleague can edit, joined into `data.ts` at build. Later, layer a
**git-backed CMS — TinaCMS preferred** (visual editor over the repo's files, great
non-dev UX), **Decap** as the zero-cost fallback. **Sanity rejected** for now: its
content lives in a separate cloud, diverging from the "flat files, versioned in
repo, no vendor lock" approach and overkill for ~313 part-time-edited pieces.

**Why.** Today editing copy means touching a 5,703-line `data.ts` and a
not-valid-JSON `curation.json`; and re-running `import-portfolio.mjs` would
**destroy** all hand-written copy. Segregation fixes both, and is CMS-agnostic.

---

## D6 — Launch priorities: fix cheap speed wins; spend richness deliberately ✅

**Decision.** Speed is table-stakes (it's why Deca was dropped) and is mostly
**one bug + bytes** — fix the Tier-0 wins, then stop *blindly* optimizing speed.
The differentiators for an LP audience are editorial completeness, shareability,
the preservation narrative, **and a deluxe navigation experience** ([D7](#d7)).
Mobile is first-class throughout. Richness (the chapter explorer, motion) is spent
**deliberately and within the perf budget**, not sprinkled everywhere.

---

## D7 — Keep **and elevate** navigation: filters + search + deluxe chapter explorer ✅

**Decision (reverses the earlier "cut" proposal).** Keep the Artist + Chapter
structure **and** add the brief's full filter set (Artist / Collection / Movement /
Medium) **and** free-text search **and** a signature, immersive **chapter-explorer**
navigation — a high-craft visual way to move between chapters and *feel* where you
are. The goal is a deluxe, high-end gallery experience; "more ways to navigate" is
a feature.

**Doctrine reconciliation (required).** This collides with `.impeccable.md`
**principle 5** ("the homepage is curated, not queried; filtering is secondary").
Resolution: an **immersive "lobby"** (the explorer, where expressive CSS/motion
earns its place) leading into **quiet, restrained galleries** (piece pages stay
museum-grade) — how blue-chip galleries actually work. `.impeccable.md` principle 5
to be updated to reflect this. Build as a **design-led** task (`shape` →
`impeccable`/`overdrive`/`animate`), GPU-cheap, reduced-motion fallback, inside the
Core Web Vitals budget.

---

## D8 — Animated/interactive works: **full playback** ✅

**Decision.** Enable real playback for the 26 video/interactive pieces, with the
full option set:
- **Poster still by default** + a tasteful "motion" indicator (on-brand, not a
  garish badge).
- A global **"Play all" preference** saved to `localStorage` (applied pre-paint
  like the theme toggle); when on, in-view pieces autoplay (muted, looped, lazy,
  paused off-screen).
- Otherwise **hover-to-play** (desktop) / **tap-to-play** (touch); **keyboard**
  play/pause/stop on the focused piece.
- `prefers-reduced-motion` honored (no autoplay; explicit opt-in only).
- **Mobile-data guard** — never push heavy video by default on a phone.
- Pieces clearly **labelled** as video/interactive.

**Pipeline impact.** Capture each piece's `animation_url`, pin the video to
Filebase, extract a poster frame (ffmpeg). Keep video web-weight (MP4/WebM).

---

## D9 — Add a CI quality gate ✅

**Decision.** Introduce a minimal CI pipeline (lint → typecheck → build → audit
images/links/curation → Lighthouse budget → Playwright smoke). None exists today;
`playwright` is already a dependency. Right-sized to a non-dev team: hard-fail on
broken-page signals, warn on external-link rot (checked nightly, not in the gate).

---

## D10 — Explorer simplified to a single Chapters view (post-UAT) ✅

**Decision (amends [D7](#d7)).** After UAT with users, retire the multi-view
explorer. Remove the **Index** and **Constellation** views, the `?view=`
**view-switcher**, and the **`/explore`** route. Keep the **Chapters** view and
promote it to a top-level **`/chapters`** route reached from the sidebar nav, which
becomes **Collection · Artists · Chapters · About**.

**Why.** Across the four lenses, users navigated almost entirely via the Salon
(homepage) and Chapters. The Index duplicated filtering the Salon already offers, and
the Constellation — a nice "wow" — wasn't a door people actually used. The switcher
added a mode-y surface (and a keyboard/a11y burden) for views that didn't earn their
keep. Fewer, clearer entrances beat four switchable lenses.

**Kept from the Index.** Its per-collection **piece count** — now shown next to each
collection title on the Salon and on the collection page (a quick "how many works"
read).

**Navigation consequences.** The piece-page back-link resolves up the hierarchy: to
**Chapters** (arriving from a filmstrip), the **collection page** (multi-piece
collections, and the Salon homepage), or the **artist page** (single-piece
collections, whose collection page is redundant chrome). Chapter width was aligned to
the Salon (`max-w-[1200px]`) so the wordmark holds position across views.

**Doctrine note.** This *eases* the [D7](#d7) tension with `.impeccable.md`
principle 5 ("curated, not queried") rather than deepening it: the queried Index is
gone; the homepage stays the curated front door, with Chapters as the one immersive
lens.
