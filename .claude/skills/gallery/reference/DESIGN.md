# Design — Museum Catalogue Register

The gallery scaffolded by this skill has a specific aesthetic direction: **museum catalogue.** Think Gagosian's online catalogue, David Zwirner's viewing rooms, the Serpentine Gallery's press packs. NOT marketplace, NOT dashboard, NOT product-marketing.

If you're tempted to add a gradient hero, a glassmorphism card, or a colored CTA button — you're building the wrong thing. Stop and revisit this doc.

## Typography

Two typefaces via `next/font/local`. No Google Fonts. No Inter, Geist, Playfair, Fraunces, Crimson, Lora, or any of the AI-reflex serifs.

### Display — Argent Thin (or Argent Bold for weight)
- Used for: page mastheads, section H2s at 32-40px, artist names, piece titles at 40-80px.
- Rationale: Argent is a distinctive display serif with genuine character. Thin weight reads as institutional restraint. Never render body copy in Argent — the letterforms don't perform at ≤18px.

### Body — Instrument Sans (variable)
- Used for: everything below the display register. Body prose, metadata rows, eyebrow labels, buttons.
- Rationale: Instrument Sans has excellent tabular-nums (contract addresses, token IDs, counts), a wide weight range in a single variable file, and no marketing energy.

### Modular scale
- Display (h1 masthead): `display-sm` = clamp(28px, 4vw, 40px)
- H2 subject-tier (artist names, chapter titles): 32px / 40px responsive
- H3 (collection titles): 22px / 28px
- Body (prose): 16px / 17px on wider columns
- Body (secondary): 15px / 13px
- Metadata: 13px, tabular-nums
- Eyebrow: 10px, tracking-[0.1em], uppercase, font-medium

### Fluid vs fixed
- Fluid clamp for display headings (mastheads).
- Fixed rem for body + metadata. **Never** fluid-size product-UI text.

## Palette

OKLCH color space, warm eggshell base. Light-mode first. The dark mode toggle is a `.dark` class on `<html>` toggled by `ThemeToggle`, persisted to `localStorage['gallery-theme']`. An inline script in `layout.tsx` applies the class before paint to avoid flash.

### Tokens (in `globals.css`)

```css
:root {
  /* Light mode — warm eggshell */
  --background: oklch(0.985 0.005 80);        /* warm off-white */
  --foreground: oklch(0.20 0.010 60);         /* near-black warm */
  --foreground-secondary: oklch(0.35 0.008 60); /* soft body text */
  --muted: oklch(0.55 0.006 60);              /* metadata + labels */
  --border: oklch(0.90 0.006 80);             /* hairline dividers */
  --surface: oklch(0.97 0.005 80);            /* card / hover fills */
  --punk-bg: oklch(0.85 0.15 15);             /* CryptoPunks pink, brand-locked */
}

.dark {
  /* Dark mode — deep warm charcoal, NOT pure black */
  --background: oklch(0.18 0.005 60);
  --foreground: oklch(0.95 0.008 80);
  --foreground-secondary: oklch(0.75 0.006 80);
  --muted: oklch(0.55 0.006 60);
  --border: oklch(0.28 0.006 60);
  --surface: oklch(0.22 0.005 60);
}
```

Exposed to Tailwind v4 via `@theme inline` in the same stylesheet.

### Rules

- **No blue-500, no purple gradient, no black background.** All the OKLCH tokens carry a warm tint (hue ~60-80). Cold grey palettes are wrong for this aesthetic.
- **No decorative accent color.** The palette is intentionally monochromatic. Highlights use the `--foreground` token, not a saturated color.
- **Semantic colors for chapters only.** If the site has curatorial chapters (DCF's five-chapter model), each chapter can carry a hue-shifted accent applied ONLY to the chapter title and filter chip. Never to buttons or CTAs.
- **Punk pink is brand-locked.** If the collection includes CryptoPunks, their thumbnails render on a specific pink background (`--punk-bg`). Do not use this color anywhere else.

## Section headers (eyebrows)

The site-wide convention for section labels:

```html
<p class="text-[10px] tracking-[0.1em] uppercase text-muted font-medium">
  Section name
</p>
```

Used for:
- "Collection details" panel header
- "Exhibitions" header
- "Blockchain details" `<summary>`
- "Attributes" / "Traits" `<summary>`
- "Other resources" header
- "Preserved by Hivemind" label
- Prev/Next work labels
- Filter row eyebrows (Artist / Chapter)
- All `Row` labels inside `OnChainDetails`

**Enforcement (design-check subcommand):** grep for `text-[10px] uppercase` and flag anything missing `tracking-[0.1em]` or `font-medium` or `text-muted`.

## Header casing

**Sentence-case, always.** Contemporary editorial register.

- ✅ "Collection details" · "Hivemind commentary" · "Artist statement" · "Blockchain details" · "Other resources" · "Browse by trait" · "Trait count"
- ❌ "Collection Details" · "Hivemind Commentary" · "Artist Statement"

**Proper nouns keep their capitalisation:** "Hivemind Capital Partners" (company name), "Instrument Sans" (font name), individual artist names, collection names as titled by the artist.

## Em-dashes

**Banned in every user-facing string.** No exceptions. Applies to:
- All prose in `content/editorial/*.json`
- All rendered strings in `src/app/*` and `src/components/*`
- All curator notes in `src/lib/data.ts`
- Attribution lines under quotes

**Allowed substitutes:** colon, comma, semicolon, period, parentheses.

**In code comments** — em-dashes are fine (developer-facing, not rendered).

**Enforcement (design-check subcommand):** grep for `—` (U+2014) in files under `src/app/`, `src/components/`, `content/editorial/`, and any curator-note fields in `src/lib/data.ts`. Report each as a P1 finding.

## Motion

Restrained. Museum catalogues don't animate.

- No page-load animations (fade-ins, slide-ups).
- No decorative background motion.
- Hover transitions on links: `transition-colors duration-200`. Nothing longer.
- Interactive artworks (Kim Asendorf's Raster und Spektrum, PXL DEX, X0X) run in a sandboxed iframe. Playback is gated by a global Media preference (Auto / Hover / Off) stored in `localStorage['gallery-motion']`. NO manual play/stop buttons on the piece itself; the preference is the switch.
- `prefers-reduced-motion` suppresses hover / autoplay unconditionally.

## Spacing & rhythm

- Container: `max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12`
- Vertical rhythm on index pages: `pt-6 pb-24` outer, sections separated by `border-b border-border` + `pt-16 pb-16`
- Editorial body columns cap at `max-w-[680px]` for readable line length (~65-75ch)
- Hairline dividers only. No shadows, no rounded cards, no elevation.

## Links

```html
<a class="underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors duration-200 text-foreground hover:opacity-60">
```

Underline offset 4, hairline decoration, no accent color. The Raster / museum-catalogue convention.

## Icons

Almost none. The only icons in the DCF Gallery are:
- ▶ (motion badge on animated thumbnails, 8px, `bg-black/55` circle)
- Sun / Moon SVG in `ThemeToggle` (16px, `text-muted`)
- Menu hamburger (mobile only)
- Chevron ` › ` for `<details>` disclosure

No icon library (Lucide, Heroicons, Radix Icons). If you need an icon that's not in this list, question whether you need it at all.

## Anti-patterns to reject

The impeccable skill (installed alongside this one) has an exhaustive list. Never in a scaffolded gallery:

- Gradient hero text
- Glassmorphism cards / backdrop-blur
- Dark glow / drop-shadow-2xl on any element
- Card grids with identical rounded-lg + shadow-sm
- Marketing "Get started" CTAs
- Emoji in rendered output
- "AI voice" microcopy ("Let's get you set up!", "Awesome!", "You're all set 🎉")
- Rainbow gradient overlays on artwork
- Auto-carousels

If you catch yourself reaching for any of these, the answer is No. The site's confidence comes from restraint.
