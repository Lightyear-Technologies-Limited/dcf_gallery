"use client";

import CopyableHash from "./CopyableHash";

/**
 * Blockchain details panel — the provenance crown jewel.
 * See reference/PROVENANCE.md for the full rationale.
 *
 * Reader-facing convention: rows read top-down as
 *   identity (contract, tokenId) →
 *   classification (standard, type, chain) →
 *   history (minted, released on) →
 *   preservation (storage, pin, CID, SHA-256, verified).
 *
 * The SHA-256 row's hover hint is not decoration; it lets any reader
 * verify byte-integrity themselves with a real command.
 */
interface Props {
  contractAddress?: string;
  tokenId?: string;
  editionType?: string;
  tokenStandard?: string;
  chain?: string;
  storage?: string;
  mintDate?: string;
  mintPlatform?: string;
  provenance?: {
    cid?: string;
    sha256?: string;
    pinnedAt?: string;
    verifiedAt?: string;
  };
  gatewayBase?: string;
}

export default function OnChainDetails({
  contractAddress,
  tokenId,
  editionType,
  tokenStandard = "ERC-721",
  chain = "Ethereum",
  storage,
  mintDate,
  mintPlatform,
  provenance,
  gatewayBase,
}: Props) {
  if (!contractAddress && !tokenId && !provenance?.cid) return null;
  const pinnedDate = provenance?.verifiedAt || provenance?.pinnedAt;

  return (
    <details className="group/details text-[13px] [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none text-[10px] tracking-[0.1em] uppercase font-medium text-muted hover:text-foreground transition-colors duration-200 inline-flex items-center gap-2 select-none">
        <span>Blockchain details</span>
        <span aria-hidden className="inline-block transition-transform duration-200 group-open/details:rotate-90">
          &rsaquo;
        </span>
      </summary>

      <div className="mt-4 space-y-0">
        {contractAddress && <Row label="Contract"><CopyableHash value={contractAddress} /></Row>}
        {tokenId && <Row label="Token ID"><span className="font-mono tabular-nums text-foreground">{tokenId}</span></Row>}
        {tokenStandard && <Row label="Token standard"><span className="text-foreground">{tokenStandard}</span></Row>}
        {editionType && <Row label="Type"><span className="text-foreground">{editionType}</span></Row>}
        {chain && <Row label="Chain"><span className="text-foreground">{chain}</span></Row>}
        {mintDate && <Row label="Minted"><span className="text-foreground tabular-nums">{mintDate}</span></Row>}
        {mintPlatform && <Row label="Released on"><span className="text-foreground">{mintPlatform}</span></Row>}
        {storage && (
          <Row label="Storage">
            <span className="text-foreground" title={storageTooltip(storage)}>{storage}</span>
          </Row>
        )}
        {provenance?.cid && (
          <>
            <Row label="Pinned"><span className="text-foreground">IPFS{provenance.verifiedAt ? " · verified" : ""}</span></Row>
            <Row label="CID">
              <a
                href={`${gatewayBase ?? ""}${provenance.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono tabular-nums text-foreground-secondary hover:text-foreground transition-colors duration-200"
                title={`${provenance.cid} — open the preserved copy`}
              >
                {provenance.cid.slice(0, 8)}…{provenance.cid.slice(-6)}
              </a>
            </Row>
            {provenance.sha256 && (
              <Row label="SHA-256" hint={SHA256_VERIFY_HINT}>
                <CopyableHash value={provenance.sha256} />
              </Row>
            )}
            {pinnedDate && (
              <Row label={provenance.verifiedAt ? "Verified" : "Pinned"}>
                <span className="font-mono tabular-nums text-foreground">{formatDayMonthYear(pinnedDate)}</span>
              </Row>
            )}
          </>
        )}
      </div>
    </details>
  );
}

function storageTooltip(storage: string): string {
  if (storage === "On-chain") return "Rendered from contract bytecode. Survives as long as Ethereum.";
  if (storage === "IPFS") return "Image pinned to IPFS. Distributed storage; persistence depends on continued pinning.";
  if (storage === "IPFS (Art Blocks proxy)") return "Image on IPFS, served via Art Blocks' media proxy.";
  if (storage === "Arweave") return "Image on Arweave. Paid-once permanent storage.";
  if (storage === "Centralized") return "Image hosted on a centralized server. Depends on that host remaining online.";
  return storage;
}

function formatDayMonthYear(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const M = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getUTCDate()).padStart(2, "0")}-${M[d.getUTCMonth()]}-${d.getUTCFullYear()}`;
}

function Row({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4 py-2.5 border-b border-border">
      <span className="text-muted shrink-0 inline-flex items-center gap-1.5 relative">
        {label}
        {hint && (
          <span
            aria-label="What is this?"
            className="group/hint cursor-help inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-border text-[9px] leading-none text-muted hover:text-foreground hover:border-foreground/40 transition-colors duration-200 relative"
          >
            ?
            <span
              role="tooltip"
              className="pointer-events-none invisible opacity-0 group-hover/hint:visible group-hover/hint:opacity-100 absolute left-0 top-full mt-2 z-20 w-[300px] rounded border border-border bg-background text-foreground-secondary text-[11px] leading-[1.55] p-3 shadow-lg normal-case tracking-normal"
            >
              {hint}
            </span>
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

const SHA256_VERIFY_HINT = (
  <>
    <span className="block text-foreground mb-1.5 font-medium">Verify this hash yourself:</span>
    <span className="block">Download the file from the CID above, then run:</span>
    <code className="block mt-1.5 font-mono text-[10.5px] text-foreground">sha256sum &lt;file&gt;</code>
    <span className="block text-muted mt-0.5 text-[10px]">(macOS: <code className="font-mono">shasum -a 256 &lt;file&gt;</code>)</span>
    <span className="block mt-1.5">
      The output should match this hash exactly. If it does, the preserved bytes are byte-identical to what was pinned at capture time.
    </span>
  </>
);
