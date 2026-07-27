"use client";

import { useState } from "react";

interface Props {
  value: string;
  /** Show first N and last 4 characters around an ellipsis. Defaults to 6. */
  prefix?: number;
}

type State = "idle" | "copied" | "failed";

/**
 * Truncated hex string with click-to-copy. Width-locked so the confirmation
 * glyph doesn't shift surrounding layout. On clipboard permission denial
 * (some private-mode browsers, some restricted permissions) shows a ×
 * failure marker so an LP verifying provenance doesn't get silently
 * empty-handed.
 */
export default function CopyableHash({ value, prefix = 6 }: Props) {
  const [state, setState] = useState<State>("idle");
  const truncated =
    value.length > prefix + 5 ? `${value.slice(0, prefix)}…${value.slice(-4)}` : value;

  function copy() {
    if (!navigator.clipboard) {
      setState("failed");
      setTimeout(() => setState("idle"), 1600);
      return;
    }
    navigator.clipboard.writeText(value).then(
      () => {
        setState("copied");
        setTimeout(() => setState("idle"), 1200);
      },
      () => {
        setState("failed");
        setTimeout(() => setState("idle"), 1600);
      }
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Click to copy: ${value}`}
      aria-label={`Copy ${value}`}
      className="font-mono text-foreground cursor-pointer hover:opacity-60 transition-opacity duration-200 inline-flex items-baseline gap-1.5"
    >
      <span>{truncated}</span>
      <span
        aria-hidden
        className={`text-[10px] transition-opacity duration-300 ${
          state === "idle" ? "opacity-0 text-muted" : "opacity-100"
        } ${state === "failed" ? "text-foreground" : "text-muted"}`}
      >
        {state === "failed" ? "×" : "✓"}
      </span>
    </button>
  );
}
