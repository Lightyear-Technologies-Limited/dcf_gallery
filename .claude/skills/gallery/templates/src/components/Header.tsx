import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import MotionToggle from "./MotionToggle";
import { FUND_NAME } from "@/lib/site";

/**
 * Persistent site sidebar (desktop) / header (mobile). Carries the
 * wordmark, primary nav, and preference toggles. Static.
 */
export default function Header() {
  return (
    <aside
      aria-label="Site"
      className="fixed left-0 top-0 bottom-0 z-30 hidden md:flex md:flex-col justify-between md:w-32 xl:w-36 px-4 pt-6 pb-6 border-r border-border bg-background"
    >
      <div>
        <Link href="/" className="block">
          <p className="text-[10px] tracking-[0.1em] uppercase text-muted font-medium mb-2">
            {FUND_NAME}
          </p>
        </Link>
        <nav className="mt-8 space-y-3 text-[13px]">
          <Link href="/" className="block text-foreground-secondary hover:text-foreground transition-colors duration-200">Salon</Link>
          <Link href="/artists" className="block text-foreground-secondary hover:text-foreground transition-colors duration-200">Artists</Link>
          <Link href="/chapters" className="block text-foreground-secondary hover:text-foreground transition-colors duration-200">Chapters</Link>
          <Link href="/about" className="block text-foreground-secondary hover:text-foreground transition-colors duration-200">Thesis</Link>
        </nav>
      </div>
      <div className="space-y-6">
        <MotionToggle />
        <ThemeToggle />
      </div>
    </aside>
  );
}
