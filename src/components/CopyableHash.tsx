"use client";

import { useState } from "react";

interface Props {
  value: string;
  /** Show first N and last 4 characters around an ellipsis. Defaults to 6. */
  prefix?: number;
}

/**
 * Truncated hex string with click-to-copy. Width-locked so the "Copied"
 * confirmation doesn't shift surrounding layout.
 */
export default function CopyableHash({ value, prefix = 6 }: Props) {
  const [copied, setCopied] = useState(false);
  const truncated =
    value.length > prefix + 5 ? `${value.slice(0, prefix)}…${value.slice(-4)}` : value;

  function copy() {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {}
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Click to copy — ${value}`}
      aria-label={`Copy ${value}`}
      className="font-mono text-foreground cursor-pointer hover:opacity-60 transition-opacity duration-200 inline-flex items-baseline gap-1.5"
    >
      <span>{truncated}</span>
      <span
        aria-hidden
        className={`text-[10px] text-muted transition-opacity duration-300 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        ✓
      </span>
    </button>
  );
}
