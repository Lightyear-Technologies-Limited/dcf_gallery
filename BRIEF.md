# DCF Gallery — Project Brief

## Overview

A bespoke, fast gallery website to showcase the Hivemind Digital Culture Fund (DCF) collection. Pure showcase — no transactions, no marketplace, no pricing. The purpose is to display what DCF holds, contextualize the artwork, and communicate the curation thesis to investors and the art community.

**Replacing:** Deca Art (too slow, doesn't reflect collection quality)

**Target launch:** June 2026

**Primary audience:** Potential LPs, existing LPs, art community

**Effort model:** Part-time project. Content written by internal team. Artists may contribute bios/quotes.

---

## Design Direction

### Aesthetic
- **Minimal, crypto-native, high-end gallery**
- Dark-first, but both dark and light modes important (auto-detect + manual toggle)
- Art-focused — the work is the hero, UI gets out of the way
- Clean display, no clutter

### Reference Sites — What to Take From Each

| Site | Take | Leave |
|------|------|-------|
| [Raster.art](https://www.raster.art) | **Primary reference.** Clean tab navigation (Oeuvre / Activity / About), simple grid, collection cards with mini-carousels, minimal typography. Simplicity is the goal. | Light-mode only aesthetic |
| [Curated.xyz](https://explore.curated.xyz) | Left sidebar with collection dropdown. Dual commentary model: artist quote + curator note side-by-side with artwork carousel. Editorial depth without clutter. | Horizontal-only layout can feel limiting |
| [gallery.so](https://gallery.so) | Single-piece hero view: one artwork centered, massive whitespace, just artist name + piece title + counter ("5 of 15"). Perfect for a "focus mode" on key works. Dark mode toggle. | Too minimal for a fund site — not enough editorial context |
| [137.xyz/art](https://137.xyz/art) | Art-forward, single-focus. Nothing competes with the work. | Not deep enough — no artist context, no curation narrative |
| [ArtBlocks](https://www.artblocks.io/discover) | Category carousel at top ("Browse collection categories"), then filter + search bar, then grid. Good drill-down: Artist → Collection → Trait. | Too marketplace-oriented |
| [Artsy](https://www.artsy.net/collect) | Movement/category pages with editorial intro text, "Browse by Category" subcards, then grid. Strong model for DCF's movement pages. | Pricing, marketplace, commerce UX |
| [Tappan Collective](https://www.tappancollective.com) | Editorial piece pages: large artist quote as a design element, "About the Artist" section with photo + full bio, related artwork row at bottom. | E-commerce framing (Add to Bag, framing options) |
| [Verse Works](https://verse.works) | Gallery presentation quality | - |

### Design Synthesis

The DCF sweet spot sits between these three poles:

```
Raster's simplicity ←→ Curated's editorial depth ←→ gallery.so's presentation
```

- **Grid/browse:** Raster-style clean grid with tabs, minimal chrome
- **Artist/collection pages:** Curated-style — curator note + artist commentary alongside the work
- **Individual piece view:** gallery.so-style hero for key works, Tappan-style editorial depth (artist quote, about section, related works)
- **Movement/category pages:** Artsy-style — editorial intro + subcategory cards + grid

### Anti-patterns
- No pricing/marketplace features
- No comments/social features (sharing to socials is OK)
- No lag — speed is critical
- Nothing that looks like a generic NFT platform
- No busy UI — when in doubt, remove elements, don't add them

### Pending
- Brand guidelines (need access from team)
- Domain (meed access from team)

---

## Content Model

### Three levels of curation commentary ("Why we hold it")

Each level gets its own curator's note explaining DCF's thesis:

1. **Artist level** — Why this artist matters to DCF's thesis
2. **Collection level** — Why this collection specifically
3. **Piece level** — Why this individual work (optional, for key pieces)

### Content sources
- Existing X threads and thesis documents
- [HDCF collecting thesis - art styles & movements.docx](internal) — chapter structure for narrative
- Most commentary needs to be **written** (AI-assisted, reviewed by Michael/marketing)
- Artist bios — mix of sourced and contributed by artists directly

---

## Data

### Source spreadsheet
Use the most recent `DCF_Portfolio` file from:
`\\Hivemind Capital Partners LLC\Trading SharePoint Site Group - Documents\NFTs\Portfolio\`

**Columns:** ID, Artist, Title, Collection, Movement (Tags), DCF Wallet Name, DCF Wallet Address, Contract Address, URL

### Actual portfolio (as of April 2026)
- **~12 artists** (core DCF): ACK, Beeple, Dmitri Cherniak, Kim Asendorf, Larva Labs, Operator, Refik Anadol, Sam Spratt, Tyler Hobbs, Tyler Hobbs and Dandelion Wist, XCOPY
- **~25 collections**: ACK, ACK Editions, Beeple, BiomeLumina, CryptoPunks, DayGardens, Fidenza, Grifters, Human Unreadable, Lights, Lightyears, MasksofLuci, Meebit, NotablePepes, PXLDEX, QQL, Ringers, Skulls of Luci, Synthetic Dreams, WOY, X0X, XCOPY, etc.
- **~310 pieces**
- **5 movement tags**: GenArt, CryptoArt, Digital Canvas, AI Art, Digital Identity

### Thesis chapter structure (from collecting thesis doc)
1. From Computer Art to NFT — 60 years of digital art evolution
2. The Early Pioneers (2014–2017) — Rare Pepes, NFT archaeology
3. Rise of Larva Labs — CryptoPunks, Autoglyphs, Meebits
4. Generative Art & Collecting the Algorithm — Fidenza, Ringers, Art Blocks
5. Glitch Art and Crypto Movement — XCOPY, Grifters
6. Data, AI and Refik Anadol — Wind of Yawanawa, GAN art
7. PFP & Web3 Community — CryptoPunks (cultural lens), Meebits
8. New Media Art & NFT for Interactive Culture — Beeple

This chapter structure could inform how the gallery organizes and narrates the collection.

---

## Pages

### Home / View All
- Hero with DCF mission statement
- Artist pills / Collection pills for quick nav
- Full grid of works with search + filters
- Filters: Artist, Collection, Movement/Tag, Medium
- Inspired by: Artsy /collect, ArtBlocks /discover

### Artist Page
- Artist bio/blurb
- DCF curator's note — why we hold their work
- Artist quote (if available)
- Links to socials/website
- Collections by this artist
- All works by this artist
- Art historical connections (nice-to-have)

### Collection Page
- Collection description
- Stats: piece count, medium, mint date, contract
- DCF curator's note — why we hold this collection
- Movement/tag badges
- Works grid
- Breadcrumb drill-down: Artist → Collection → Piece

### Individual Piece Page
- Full-res artwork display (images, video, generative, GIFs, interactive/on-chain)
- On-chain metadata: token ID, contract address, mint date
- Traits (if applicable)
- DCF curator's note (optional, for key pieces)
- Related works within same collection
- Link to OpenSea / external marketplace (present but not prominent)
- Share to socials

### About Page
- About DCF — mission, thesis, approach
- About Hivemind
- Collection stats overview

### Influence / Movement Pages (nice-to-have)
- Pages for each movement tag or art historical influence
- Shows which artists and collections connect to that tradition
- Supports the "relationship mapping" between works

---

## Asset Pipeline

### Current state
- Artwork URLs point to **OpenSea** pages
- Actual files stored on **IPFS and Arweave**
- Some pieces are on-chain generative, GIFs, video, large files

### Required pipeline
1. **Scrape/resolve** OpenSea URLs → extract IPFS/Arweave source URLs
2. **Download and cache** original files locally or to CDN
3. **Generate optimized variants**: thumbnail (400px), medium (1200px), full-res
4. Serve optimized versions for fast load; link to full-res on demand
5. For generative/interactive pieces: determine if we embed live (iframe to token URL) or capture static renders

### Open questions
- Do we self-host optimized files or use a CDN (Cloudflare Images, Vercel Image Optimization)?
- For on-chain generative pieces — embed live rendering or screenshot + link?
- Storage budget / hosting approach

---

## Technical Stack (Proposed)

- **Framework:** Next.js (App Router, SSG/ISR)
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (edge CDN, image optimization)
- **Data layer v1:** Static JSON generated from spreadsheet (no CMS initially)
- **Data layer v2:** Headless CMS (Sanity or similar) for editorial content when team needs to edit without code
- **Image optimization:** Next.js Image component + Vercel, or Cloudflare Images
- **Media:** Video via HTML5 with lazy loading; generative pieces via iframe embed

---

## Relationship Mapping (Nice-to-Have)

The thesis doc structures the collection as a narrative across art movements. The gallery could reflect this:

- Works connect to **movements** (GenArt, CryptoArt, Digital Canvas, AI Art, Digital Identity)
- Works connect to **thesis chapters** (narrative framing)
- Different artists/styles can share a traditional art influence (e.g., Fidenza ↔ Abstract Expressionism ↔ XCOPY's gestural energy)
- Clicking a movement or influence shows all connected works across artists

**Effort note:** This is explicitly nice-to-have given the part-time nature of the project. The data model should support it, but UI can be simple.

---

## Open Items / Blockers

| Item | Owner | Status |
|------|-------|--------|
| Brand guidelines access | Michael | Pending |
| Domain decision | Team | TBC |
| Asset pipeline — scrape OpenSea URLs to source files | Dev | Not started |
| Curation commentary — write per-artist and per-collection notes | Michael + marketing | Not started |
| Artist bios — source or request from artists | Michael | Not started |
| Thesis chapter integration — decide if gallery follows chapter structure | Michael | Discussion needed |
| Generative/interactive display approach | Dev | Decision needed |
| CMS decision (v2) | Team | Future |

---

## Phases

### Phase 1: Foundation (Now → April)
- Finalize brief and design direction
- Get brand guidelines integrated
- Build asset pipeline (scrape → optimize → serve)
- Import real portfolio data from spreadsheet
- Scaffold all pages with real data, placeholder content

### Phase 2: Content & Polish (April → May)
- Write curation commentary (artist + collection level)
- Source/write artist bios
- Apply brand design system (fonts, colors, logo)
- Light/dark mode polish
- Mobile optimization
- Performance tuning (lazy load, image optimization)

### Phase 3: Launch (May → June)
- Domain setup
- Social share functionality
- Final QA
- Soft launch for internal review
- Public launch
