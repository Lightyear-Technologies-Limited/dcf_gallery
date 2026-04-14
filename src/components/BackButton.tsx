"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-[13px] text-muted hover:text-foreground transition-colors duration-200 pt-6"
    >
      &larr; Back
    </button>
  );
}
