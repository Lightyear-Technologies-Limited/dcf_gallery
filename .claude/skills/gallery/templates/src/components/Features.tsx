import Link from "next/link";
import {
  CLICKABLE_TRAITS,
  HIDDEN_TRAIT_KEYS,
  TRAITS_FULLY_SUPPRESSED,
  isTraitClickable,
  type TraitValue,
} from "@/lib/curation";

interface Props {
  traits: Array<[string, TraitValue]> | null;
  /** Collection slug. When provided, eligible trait values (per
      CLICKABLE_TRAITS) link to the collection page's filtered view. */
  collectionSlug?: string;
  defaultOpen?: boolean;
  /** Header label override. Default "Traits". */
  label?: string;
}

/**
 * Generative features panel on a piece page. One row per trait key.
 * Single-value traits render as "Key | Value". Array-valued traits (e.g.
 * Punks' "Attribute": ["Cap Forward", "Pipe"]) render the key once
 * pluralised, with values stacked on the right and a preceding
 * "Trait count" row.
 *
 * Only trait keys / values listed as clickable render as filter links;
 * everything else is plain foreground text — catalogue-of-record, not
 * marketplace facet navigation.
 */
export default function Features({ traits, collectionSlug, defaultOpen = false, label = "Traits" }: Props) {
  if (!traits || traits.length === 0) return null;
  if (collectionSlug && TRAITS_FULLY_SUPPRESSED.has(collectionSlug)) return null;

  const hiddenKeys = collectionSlug ? HIDDEN_TRAIT_KEYS[collectionSlug] : undefined;
  const visibleTraits = hiddenKeys
    ? traits.filter(([k]) => !hiddenKeys.includes(k))
    : traits;
  if (visibleTraits.length === 0) return null;

  type Row =
    | { kind: "single"; key: string; value: string | number }
    | { kind: "count"; key: string; count: number }
    | { kind: "multi"; key: string; values: string[] };
  const rows: Row[] = [];
  for (const [key, val] of visibleTraits) {
    if (Array.isArray(val)) {
      // Sort multi-value lists with editorial "core" values (CLICKABLE_TRAITS
      // whitelist entries) leading; within each tier, alphabetical.
      const spec = collectionSlug ? CLICKABLE_TRAITS[collectionSlug]?.[key] : undefined;
      const coreSet = new Set<string>(Array.isArray(spec) ? spec : []);
      const values = [...val].map(String).sort((a, b) => {
        const aCore = coreSet.has(a);
        const bCore = coreSet.has(b);
        if (aCore !== bCore) return aCore ? -1 : 1;
        return a.localeCompare(b);
      });
      rows.push({ kind: "count", key, count: val.length });
      rows.push({ kind: "multi", key, values });
    } else {
      rows.push({ kind: "single", key, value: val });
    }
  }

  const linkFor = (key: string, value: string | number) =>
    collectionSlug
      ? `/collection/${collectionSlug}?trait=${encodeURIComponent(key)}&value=${encodeURIComponent(String(value))}`
      : null;

  return (
    <details className="group text-[13px] [&_summary::-webkit-details-marker]:hidden" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-[10px] tracking-[0.1em] uppercase font-medium text-muted hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2 select-none">
        <span>{label}</span>
        <span aria-hidden className="inline-block transition-transform duration-200 group-open:rotate-90">
          &rsaquo;
        </span>
      </summary>

      <div className="mt-4 space-y-0">
        {rows.map((row, i) => {
          if (row.kind === "single") {
            const clickable = isTraitClickable(collectionSlug, row.key, String(row.value));
            const href = clickable ? linkFor(row.key, row.value) : null;
            return (
              <div key={`single-${row.key}-${i}`} className="flex justify-between items-center gap-4 py-2.5 border-b border-border">
                <span className="text-muted shrink-0">{row.key}</span>
                {href ? (
                  <Link href={href} className="text-foreground text-right tabular-nums hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground" title={`See all ${row.value} in this collection`}>
                    {row.value}
                  </Link>
                ) : (
                  <span className="text-foreground text-right tabular-nums">{row.value}</span>
                )}
              </div>
            );
          }
          if (row.kind === "count") {
            return (
              <div key={`count-${row.key}-${i}`} className="flex justify-between items-center gap-4 py-2.5 border-b border-border">
                <span className="text-muted shrink-0">Trait count</span>
                <span className="text-foreground text-right tabular-nums">{row.count}</span>
              </div>
            );
          }
          const pluralKey = row.key.endsWith("s") ? row.key : `${row.key}s`;
          return (
            <div key={`multi-${row.key}-${i}`} className="flex justify-between items-start gap-4 py-2.5 border-b border-border">
              <span className="text-muted shrink-0 pt-0.5">{pluralKey}</span>
              <div className="flex flex-col items-end gap-1.5">
                {row.values.map((v, j) => {
                  const clickable = isTraitClickable(collectionSlug, row.key, v);
                  const href = clickable ? linkFor(row.key, v) : null;
                  return href ? (
                    <Link key={`${v}-${j}`} href={href} className="text-foreground text-right tabular-nums hover:opacity-60 transition-opacity duration-200 underline underline-offset-4 decoration-border hover:decoration-foreground" title={`See all ${v} in this collection`}>
                      {v}
                    </Link>
                  ) : (
                    <span key={`${v}-${j}`} className="text-foreground text-right tabular-nums">{v}</span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
