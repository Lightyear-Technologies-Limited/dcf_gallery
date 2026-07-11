"use client";

/**
 * Share affordance on the piece page. Uses the native Web Share sheet
 * when available (mobile), otherwise opens an X/Twitter intent. Styled
 * as an eyebrow to match every other section label.
 */
export default function ShareButton({ title }: { title: string }) {
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* user cancelled — fall through */ }
    }
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className="text-left text-[10px] tracking-[0.1em] uppercase font-medium text-muted hover:text-foreground transition-colors duration-200"
    >
      Share
    </button>
  );
}
