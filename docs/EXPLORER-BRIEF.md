# DCF Gallery — Explorer Design Brief

Design brief (from the `shape` skill) for the deluxe navigation (plan E.2 + E.3).
Captures the direction agreed with the user; hand to `impeccable craft` to build.

## 1. Feature summary

A multi-view **Explore** experience that lets visitors browse the 313-work
collection through several switchable, persisted *lenses*, with filters + search.
It sits **alongside** the existing homepage (doesn't replace it). A view-switcher
is available on both `/` and a dedicated `/explore`; the chosen view is persisted
per visitor. Piece/gallery pages stay quiet and restrained — the explorer is the
"lobby," the galleries are the quiet rooms.

## 2. Primary user action

Find and move toward works that interest them — by chapter, artist, collection,
medium, or free-text search — while feeling oriented in the collection's
structure. **Works are the star; the 5 chapters are a loose framework** that
contextualizes them within the (still-contemporary, incomplete) digital-art canon.

## 3. Design direction

Mostly a **Gagosian / Pace online-viewing-room**: gorgeous Argent Thin + Instrument
Sans typography, eggshell calm, generous whitespace, quiet purposeful motion. **One
view (Constellation) is permitted to be genuinely experiential** — a "how did they
do that" moment — but executed museum-grade, never sci-fi/gimmick. All motion is
GPU-cheap (transforms/opacity), respects `prefers-reduced-motion`, and stays inside
the Core Web Vitals budget. Evolves `.impeccable.md` principle 5 ("curated, not
queried"): immersive lobby → quiet galleries.

## 4. The multi-view system

A **view switcher** (persisted in `localStorage` + reflected in the URL `?view=`)
offers these lenses; the chosen one is remembered. Available on `/` and `/explore`.

| View | Character | Mobile |
|------|-----------|--------|
| **Salon** (exists) | today's homepage — salon-wall by artist, curated | ✓ full |
| **Index** (default for /explore) | chapter rail + filters (Artist/Collection/Movement/Medium) + search + a justified grid that re-flows with quiet crossfades. The usable, on-brand backbone. | ✓ full |
| **Chapters** | cinematic horizontal procession through the 5 chapters — huge Argent titles, signature works, a 1/5 position indicator | simplified vertical, or hidden |
| **Constellation** | the collection as a navigable terrain — chapters as regions, artists/works positioned + lightly linked by the thesis. The experiential "wow." | **hidden** on mobile |

**Mobile-aware availability:** the switcher only offers views that work on the
current viewport (Constellation is desktop-only; Chapters degrades or hides).

## 5. Key states

- **Default** — a view rendered over the full collection.
- **Filtered / searched** — subset, quiet re-flow, a result count ("36 works"), a clear-filters affordance.
- **Empty** — "No works match" + reset (calm, not alarming).
- **Loading** — blur-up / skeleton consistent with the rest of the site; views don't pop in.
- **First-run (/explore)** — a brief, dismissible tutorial (keyboard hints + how to switch views), "don't show again" persisted.
- **Reduced-motion** — Chapters/Constellation degrade to static/simple; no autoplay.
- **Mobile** — Index full; Chapters simplified; Constellation absent.

## 6. Interaction model

- **View switch:** a quiet labelled/segmented control; choice persisted + URL `?view=`; smooth transition between views.
- **Filters / search:** type-to-search (debounced, tiny client index), filter chips; URL-encoded so state is shareable and survives nav (mirrors the existing `?trait=` convention).
- **Keyboard (esp. /explore):** arrows move between chapters/works; number keys jump to a chapter; `/` focuses search; `?` shows the shortcut legend; `Esc` clears.
- **Click a work →** the existing restrained piece page, preserving view/filter state on Back.
- Motion: GPU transforms/opacity only, reduced-motion fallback, no scroll-jacking that traps the user.

## 7. Content requirements

View names + one-line descriptions for the switcher; filter labels (Artist,
Collection, Movement, Medium); search placeholder ("Search the collection…");
empty-state copy; tutorial copy (1–3 quiet lines + a keyboard legend); chapter
intros (from `chapters.ts`); result-count framing.

## 8. Recommended impeccable references

`spatial-design.md` (multi-view layouts, constellation composition) ·
`motion-design.md` (view transitions, chapter procession — budgeted, reduced-motion) ·
`interaction-design.md` (filters/search, keyboard, switcher, tutorial) ·
`responsive-design.md` (mobile-aware view availability) ·
`typography.md` (Gagosian-grade display type for chapter titles).

## 9. Build order (recommended)

1. **Foundation + Index view + filters/search (E.2):** the `/explore` route, the
   view-switcher shell (localStorage + `?view=`, mobile-aware), and the Index view
   with the full filter set + search over a tiny client index. This is the usable,
   on-brand backbone and ships value immediately.
2. **Chapters view (E.3a):** the cinematic procession (desktop), reduced-motion +
   mobile fallback.
3. **Constellation view (E.3b):** the experiential terrain (desktop-only).
4. **Polish:** first-run tutorial + keyboard nav + the homepage switcher.

## Open questions (to resolve at build)

- Add **"Explore"** to the header nav? (Recommended.)
- Default view on `/explore`: **Index**. Default on `/`: stays **Salon** (today's
  homepage) with the switcher available to jump to other lenses. Confirm.
- Constellation regions: derive from **chapters + tags** (relationship/influence
  data is sparse); keep the linking light rather than a full graph. Confirm.
