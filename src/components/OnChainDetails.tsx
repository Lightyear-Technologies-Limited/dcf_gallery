"use client";

import { useState } from "react";

interface Props {
  contractAddress?: string;
  tokenId?: string;
  editionType?: string;
  tokenStandard?: string;
  chain?: string;
}

/**
 * Collapsed on-chain details for a piece. Native <details> for accessible
 * open/close. Contract address is shown truncated with a click-to-copy
 * button so the full hex string doesn't break the layout.
 */
export default function OnChainDetails({
  contractAddress,
  tokenId,
  editionType,
  tokenStandard = "ERC-721",
  chain = "Ethereum",
}: Props) {
  if (!contractAddress && !tokenId) return null;

  return (
    <details className="group text-[13px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none text-muted hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2 select-none">
        <span>On-chain details</span>
        <span
          aria-hidden
          className="inline-block transition-transform duration-200 group-open:rotate-90"
        >
          &rsaquo;
        </span>
      </summary>

      <div className="mt-4 space-y-0">
        {contractAddress && (
          <Row label="Contract">
            <CopyableHash value={contractAddress} />
          </Row>
        )}
        {tokenId && (
          <Row label="Token ID">
            <span className="font-mono tabular-nums text-foreground">{tokenId}</span>
          </Row>
        )}
        {tokenStandard && (
          <Row label="Token standard">
            <span className="text-foreground">{tokenStandard}</span>
          </Row>
        )}
        {editionType && (
          <Row label="Type">
            <span className="text-foreground">{editionType}</span>
          </Row>
        )}
        {chain && (
          <Row label="Chain">
            <span className="text-foreground">{chain}</span>
          </Row>
        )}
      </div>
    </details>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-border">
      <span className="text-muted shrink-0">{label}</span>
      {children}
    </div>
  );
}

function CopyableHash({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const truncated =
    value.length > 14 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

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
      aria-label={`Copy contract address ${value}`}
      className="font-mono text-foreground cursor-pointer hover:opacity-60 transition-opacity duration-200"
    >
      {copied ? "Copied" : truncated}
    </button>
  );
}
