"use client";

import { useSearchParams } from "next/navigation";
import { resolveNav, type PieceNavData } from "@/lib/piece-nav";
import PieceNavView from "./PieceNavView";

/**
 * Client half of the piece-page nav (E.3): reads the trait filter / origin
 * breadcrumb from the URL and re-resolves the Back + Prev/Next links.
 *
 * Must be rendered inside a <Suspense> boundary — a statically prerendered page
 * that calls useSearchParams fails the production build otherwise. The page passes
 * `PieceNavView` with the bare-URL model as the fallback, so the static HTML is
 * the correct unfiltered nav rather than a placeholder, and hydration only changes
 * anything when the URL actually carries params.
 */
export default function PieceNav(data: PieceNavData) {
  const sp = useSearchParams();
  return <PieceNavView {...resolveNav(data, sp)} />;
}
