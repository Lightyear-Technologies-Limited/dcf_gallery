"use client";

import { useState } from "react";

/**
 * Renders a hex string (contract address, SHA-256 hash) truncated to
 * 0x1234…5678 with click-to-copy the full value. Feedback: a brief
 * "copied" indicator; no toast, no icon, no ceremony.
 */
export default function CopyableHash({ value, className = "" }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const display = value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable — do nothing */
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      title={copied ? "Copied" : "Click to copy"}
      className={`font-mono tabular-nums text-foreground-secondary hover:text-foreground transition-colors duration-200 ${className}`}
    >
      {copied ? "copied" : display}
    </button>
  );
}
