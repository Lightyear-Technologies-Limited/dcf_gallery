export default function CuratorNote({ text, attribution, variant = "inline" }: {
  text: string;
  attribution?: string;
  variant?: "inline" | "pullquote";
}) {
  if (!text) return null;

  if (variant === "pullquote") {
    return (
      <blockquote className="max-w-[680px] mx-auto text-center py-20">
        <p className="font-serif text-[28px] italic leading-relaxed tracking-tight text-foreground">
          &ldquo;{text}&rdquo;
        </p>
        {attribution && (
          <cite className="block mt-4 text-[13px] text-muted not-italic">
            &ndash; {attribution}
          </cite>
        )}
      </blockquote>
    );
  }

  return (
    <div className="max-w-[52ch]">
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-3">
        Hivemind commentary
      </p>
      <p className="font-serif text-[18px] leading-[1.55] text-foreground-secondary">
        {text}
      </p>
    </div>
  );
}
