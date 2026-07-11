# Filter Mechanic

The collection page supports trait-facet filtering with URL deep-linking. This is a museum-catalogue affordance ("show me every Fidenza with palette: White Mono") not a marketplace search. Design decisions favour reader clarity over marketplace conventions.

## URL scheme

Canonical (unfiltered): `/collection/<slug>`

Standalone trait click: `/collection/<slug>?trait=<Key>&value=<Value>`

Sets (synthetic group) click: `/collection/<slug>?trait=<Key>&value=<Value>&set=1`

The `set=1` flag distinguishes a Sets-row click from a Type-row click even when the underlying (key, value) is identical (Sets: Shady = Type: Shady both filter to `Type=Shady`). Without the flag, they read as the same filter — the flag lets rendering distinguish "reader wants the curated 3-piece set" from "reader wants every held Shady".

## Sidebar layout — invariant regardless of filter state

**Rule:** the sidebar's DOM order is the same whether a filter is active or not. Applying a filter must NOT reshuffle sidebar blocks.

Order (top to bottom):

1. Breadcrumb + sibling nav (prev collection / next collection under artist)
2. H1 collection name + inline works count (if `!col.totalSupply`)
3. Artist credit (linked)
4. **Collection details** panel — type / contract / Hivemind holds / minted / platform / code size. All rows render in every filter state.
5. **Exhibitions** — show history, if any.
6. **Browse by trait** disclosure:
   - Closed by default when unfiltered.
   - Opens by default when filtered (via `open={!!traitFilter}`).
   - Selected trait is highlighted in-place inside the disclosure.
   - When filtered, a "Clear" affordance renders as a sibling of the `<details>` element (not inside the `<summary>`, since server components can't attach `onClick` handlers for stopPropagation).
7. Editorial column (right side on wide screens): Hivemind commentary, essay link, context links, artist statement.

**Anti-pattern** (do not implement): a top-of-sidebar "FILTER" chip block that appears when filtering. This shifts the entire visual hierarchy on filter click and was removed from DCF Gallery in commit `26d4c2d`. The Browse-by-trait disclosure carries the filter status inline; that's enough.

## Trait row rendering

Each row is a two-column CSS grid:
```
grid-cols-[80px_1fr] items-baseline gap-x-4 gap-y-1
```

Left column: uppercase eyebrow label (`Type`, `Color`, `Palette`, `Sets`, etc.). Right column: flex-wrap of trait values with count badges.

**Why grid over flex-wrap?** On narrow viewports, a flex-wrap parent lets the label drop to its own line and values to the next — inconsistent when some rows fit inline and others don't. Grid pins the label to a fixed column, values always wrap in the second column.

## `renderTraitLink`

Each trait value renders as a link:

```tsx
<Link
  href={`/collection/${slug}?trait=${encodeURIComponent(key)}&value=${encodeURIComponent(val)}`}
  className={isActive
    ? "text-foreground font-medium decoration-foreground"
    : "text-foreground-secondary hover:text-foreground decoration-border hover:decoration-foreground"
  }
  aria-current={isActive ? "page" : undefined}
>
  <span>{val}</span>
  <span className="text-[11px] tabular-nums no-underline">
    <span>{count}</span>
    {globalCount !== null && <span className="text-muted/40">/{globalCount.toLocaleString()}</span>}
  </span>
</Link>
```

`isActive` is computed as:
```
!isSetFilter && traitFilter?.key === key && traitFilter?.value === val
```

The `!isSetFilter` guard is critical — clicking Type: Shady in the Type row highlights Type; clicking Sets: Shady in the Sets row highlights Sets. They never cross-highlight.

## Trait ordering (`buildVisibleValues`)

Default: sort by count desc, ties broken alphabetically.

Override via `CLICKABLE_TRAITS[collectionSlug][key]`:
- `"all"` — every value visible, sorted count-desc.
- `readonly string[]` — value-level whitelist. Only listed values render. Array order becomes display order (for editorial intent like Grifters Color = Yellow / Blue / Green).
- `undefined` — the key doesn't render as a standalone row at all. Used for keys that only surface under a synthetic Sets group (Vision, Noise, Atmosphere on Grifters).

## Synthetic trait groups

Editorially-defined groups that span multiple underlying trait keys. Defined in `SYNTHETIC_TRAIT_GROUPS[collectionSlug]`.

Grifters example — "Sets" spans Vision + Noise + Type + Atmosphere:

```ts
{
  label: "Sets",
  values: [
    { label: "Shady",      key: "Type",       value: "Shady",       pieces: ["grifters-614", "grifters-574", "grifters-37"] },
    { label: "Wretch",     key: "Type",       value: "Wretch" },
    { label: "G to the M", key: "Noise",      value: "G to the M" },
    { label: "Bubbles",    key: "Atmosphere", value: "Bubbles",     pieces: ["grifters-165", "grifters-574", "grifters-132"] },
    { label: "Turbulence", key: "Vision",     value: "Turbulence" },
  ],
}
```

Each set entry:
- `label` — display name in the Sets row.
- `key` + `value` — the underlying trait filter it applies.
- `pieces?` — optional explicit list of 3 slugs to render when the set is active. When present, count = `pieces.length` (typically 3, "1 of each color"). When absent, count caps at 3 via `Math.min(facets.get(key)?.get(value) ?? 0, 3)` and the render auto-picks the first piece per color in `["Yellow", "Blue", "Green"]` order.

### Set reduction

When `isSetFilter && the active (key, value) matches a set entry`, the collection page reduces `pieces` to `activeSetValue.pieces` (or the auto-picked 3). This is the "show me the curated set" behavior.

When the same (key, value) is active but `!isSetFilter` (came from a Type/Color row click), NO reduction — every held piece matching the filter renders. This is the "show me everything" behavior.

Both paths share the same filter chip appearance in the URL, distinguished only by the `set=1` flag.

## Filter-preserving navigation

Piece-page prev/next carries the active filter through:

```tsx
const pieceHref = (slug: string) =>
  `${basePath}${traitFilter ? `?trait=${...}&value=${...}${isSetFilter ? '&set=1' : ''}` : ''}`;
```

So a reader can "walk the White Mono Fidenzas" — click into the first White Mono, next / next / next / next, and the filter never drops.

The origin breadcrumb also preserves salon-mode filters. When a reader clicks into a piece from the home salon, the URL becomes `/piece/<slug>?from=salon&artist=<slug>&chapter=<slug>`. The piece page's Back link returns to `/` with those params reapplied.

## Clear affordance

Renders when `traitFilter` is set. Position: inline beside the Browse-by-trait `<summary>`, styled as an eyebrow:

```tsx
{traitFilter && (
  <Link
    href={`/collection/${slug}`}
    aria-label="Clear filter"
    className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium hover:text-foreground transition-colors duration-200 self-start"
  >
    Clear
  </Link>
)}
```

NOT floated right with `ml-auto` (visually disconnects from the filter it clears). NOT inside the `<summary>` (server component can't stop `<details>` toggle propagation).

## Empty filter state

If the reader arrives via a stale share-link whose filter returns zero held pieces:

```tsx
<div className="max-w-[520px] text-[13px] text-muted">
  <p>No held pieces match <span className="text-foreground">Key: <span className="font-medium">Value</span></span>.</p>
  <Link href={`/collection/${slug}`}>Clear filter</Link>
</div>
```

Real message, real escape. Never a silent empty grid.
