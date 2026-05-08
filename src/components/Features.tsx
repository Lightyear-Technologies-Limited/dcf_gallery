interface Props {
  traits: Array<[string, string | number]> | null;
}

/**
 * Generative features for a piece (palette, scale, etc). Shown beneath
 * OnChainDetails. Collapsible to preserve the page's quiet hierarchy —
 * traits are supporting context, not the headline.
 */
export default function Features({ traits }: Props) {
  if (!traits || traits.length === 0) return null;

  return (
    <details className="group text-[13px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none text-muted hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2 select-none">
        <span>Features</span>
        <span
          aria-hidden
          className="inline-block transition-transform duration-200 group-open:rotate-90"
        >
          &rsaquo;
        </span>
      </summary>

      <div className="mt-4 space-y-0">
        {traits.map(([key, value]) => (
          <div
            key={key}
            className="flex justify-between items-center gap-4 py-2.5 border-b border-border"
          >
            <span className="text-muted shrink-0">{key}</span>
            <span className="text-foreground text-right tabular-nums">{value}</span>
          </div>
        ))}
      </div>
    </details>
  );
}
