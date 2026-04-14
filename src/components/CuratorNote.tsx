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
            &mdash; {attribution}
          </cite>
        )}
      </blockquote>
    );
  }

  return (
    <div className="max-w-[52ch]">
      <p className="text-[13px] text-muted mb-3">Curator&rsquo;s note</p>
      <p className="font-serif text-[20px] leading-[1.5] text-foreground-secondary italic">
        {text}
      </p>
    </div>
  );
}
