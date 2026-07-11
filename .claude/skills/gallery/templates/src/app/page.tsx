/**
 * Home. Starter — replace with the salon-wall CollectionView pattern
 * from the DCF Gallery repo once you have at least one artist +
 * collection + piece in data.ts. See reference/ARCHITECTURE.md for
 * the invariants that CollectionView must preserve.
 */
export default function HomePage() {
  return (
    <main className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6 pb-24">
      <h1 className="font-serif display-sm">{{FUND_NAME}}</h1>
      <p className="mt-6 text-[17px] sm:text-[18px] leading-[1.6] text-foreground-secondary max-w-2xl">
        {{SITE_DESCRIPTION}}
      </p>
      <p className="mt-12 text-[13px] text-muted">
        Add your first artist to <code className="font-mono">src/lib/data.ts</code>, then run{" "}
        <code className="font-mono">npm run content</code> to build the editorial data.
      </p>
    </main>
  );
}
