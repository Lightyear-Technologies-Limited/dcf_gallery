"use client";

/**
 * Share control (C.5). Uses the native Web Share sheet on supported devices
 * (mobile), otherwise opens an X/Twitter intent. Styled to match the quiet
 * link list on the piece page — no icon, just text, per the brand.
 */
export default function ShareButton({ title }: { title: string }) {
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through to the intent */
      }
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
