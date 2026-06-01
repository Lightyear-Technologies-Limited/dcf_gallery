import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 min-h-[calc(100vh-14rem)] flex flex-col justify-center py-24">
      <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-6">
        404
      </p>
      <h1 className="font-serif display">
        Not in the collection.
      </h1>
      <p className="text-[20px] text-foreground-secondary leading-[1.6] mt-8 max-w-[52ch]">
        The page you&rsquo;re looking for isn&rsquo;t here. It may have moved, or the link may be
        incorrect.
      </p>
      <Link
        href="/"
        className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 mt-10 inline-block underline underline-offset-4 decoration-border hover:decoration-foreground self-start"
      >
        Return to the collection
      </Link>
    </div>
  );
}
