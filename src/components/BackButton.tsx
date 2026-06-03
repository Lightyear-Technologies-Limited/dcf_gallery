import Link from "next/link";

/**
 * Back link that goes UP one level in the site hierarchy (parent collection,
 * artist index, etc.) rather than back through browser history. The previous
 * router.back() implementation could land on an unrelated page if the user
 * arrived via search engine or a direct link, and felt non-deterministic
 * when used to navigate between sibling pieces.
 */
export default function BackButton({
  href,
  label = "Back",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 pt-8 inline-block"
    >
      &larr; {label}
    </Link>
  );
}
