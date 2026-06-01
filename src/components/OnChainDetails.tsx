"use client";

import CopyableHash from "./CopyableHash";

interface Props {
  contractAddress?: string;
  tokenId?: string;
  editionType?: string;
  tokenStandard?: string;
  chain?: string;
  storage?: string;
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
  storage,
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
        {storage && (
          <Row label="Storage">
            <span
              className="text-foreground"
              title={storageTooltip(storage)}
            >
              {storage}
            </span>
          </Row>
        )}
      </div>
    </details>
  );
}

/** Hover tooltip for the Storage label - explains what the label means for
    permanence (the actual fund-relevant property). */
function storageTooltip(storage: string): string {
  if (storage === "On-chain") return "Rendered from contract bytecode - survives as long as Ethereum.";
  if (storage === "IPFS") return "Image pinned to IPFS - distributed storage, persistence depends on continued pinning.";
  if (storage === "IPFS (Art Blocks proxy)") return "Image on IPFS, served via Art Blocks' media proxy.";
  if (storage === "Arweave") return "Image on Arweave - paid-once permanent storage.";
  if (storage === "Centralized") return "Image hosted on a centralized server - depends on that host remaining online.";
  return storage;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-border">
      <span className="text-muted shrink-0">{label}</span>
      {children}
    </div>
  );
}
