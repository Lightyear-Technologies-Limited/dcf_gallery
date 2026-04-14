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
    <div className="border-l border-border pl-8">
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-4">
        Curator&rsquo;s Note
      </p>
      <p className="font-serif text-[20px] leading-relaxed text-foreground-secondary italic">
        {text}
      </p>
    </div>
  );
}
