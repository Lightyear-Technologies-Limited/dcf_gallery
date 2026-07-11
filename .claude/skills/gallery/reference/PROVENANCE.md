# Provenance — The Crown Jewel

This is the single most differentiating element of a catalogue built with this skill. A marketplace shows you a piece; this site lets you **verify** the piece. The provenance panel is the reason a due-diligence collector, an institutional LP, or a journalist takes the catalogue seriously.

Do not simplify or hide this. Do not soften the "verify yourself" language. Do not defer the pin pipeline as a "later" step.

## The panel

Every piece page renders a `<details>` disclosure titled **"Blockchain details"** (sentence-case), closed by default. Attributes/Traits sit ABOVE it and open by default (the piece is the subject, provenance is the verification tail).

Rows inside `OnChainDetails.tsx`, in order:

1. **Contract** — hex address, truncated to `0x1234…5678` via `CopyableHash`, click-to-copy full string.
2. **Token ID** — mono, tabular-nums.
3. **Token standard** — ERC-721 / ERC-1155.
4. **Type** — edition shorthand (`1/1`, `1/1/999`, `1/1/10000`).
5. **Chain** — Ethereum, Base, etc.
6. **Minted** — mint date, tabular-nums.
7. **Released on** — mint platform (Art Blocks, SuperRare, Avant Arte, HOFA, Nifty Gateway, Nguyen Wahed, cryptopunks.app). This is the release brand, NOT the underlying mint tech (Manifold, custom contract) — that distinction reads correctly to an editorial audience.
8. **Storage** — On-chain / IPFS / IPFS (Art Blocks proxy) / Arweave / Centralized. Hover reveals a tooltip explaining permanence implications for each.
9. **Pinned** (only if pinned) — "IPFS · Filebase" + optional `· verified` if we've re-hashed the pinned bytes.
10. **CID** (only if pinned) — content-addressed identifier, truncated + click-through to the gateway URL for direct verification.
11. **SHA-256** (only if pinned) — hex hash of the preserved bytes, click-to-copy, hover reveals the verify-yourself hint (see below).
12. **Verified** / **Pinned** — timestamp of the last verify or original pin, tabular-nums.

## The SHA-256 verify-yourself hint

This is the crown-jewel-within-the-crown-jewel. On the SHA-256 row, a `?` icon reveals a popover on hover:

```
Verify this hash yourself:

Download the file from the CID above, then run:

  sha256sum <file>

(macOS: shasum -a 256 <file>)

The output should match this hash exactly. If it does, the preserved
bytes are byte-identical to what was pinned at capture time.
```

This is not documentation. This is proof. Any reader can, right now, download the pinned copy from the gateway and re-hash it — and see that the number matches. It converts "trust us" to "here's how you check". Ship it exactly.

Implementation notes:
- Use a named Tailwind group (`group/hint`) on the `?` icon and `group-hover/hint:visible` on the popover — an unnamed group would fire on any ancestor with `.group` (e.g. the outer `<details>` element's chevron-rotate group).
- The popover uses `absolute z-20 w-[300px] rounded border border-border bg-background text-foreground-secondary text-[11px] leading-[1.55] p-3 shadow-lg normal-case tracking-normal`.

## Storage taxonomy

The `Storage` row is a plain-language classification. Tooltips explain the permanence tradeoff:

| Value | Tooltip |
|---|---|
| On-chain | Rendered from contract bytecode. Survives as long as Ethereum. |
| IPFS | Image pinned to IPFS. Distributed storage; persistence depends on continued pinning. |
| IPFS (Art Blocks proxy) | Image on IPFS, served via Art Blocks' media proxy. |
| Arweave | Image on Arweave. Paid-once permanent storage. |
| Centralized | Image hosted on a centralized server. Depends on that host remaining online. |

If a piece is **Centralized**, that's the biggest risk signal on the entire catalogue. In v1 of the DCF Gallery this shipped as plain text with the tooltip; a future pass should render it with an amber accent (Priority 3 from the critique report) — but do NOT hide it, do NOT gloss it. Institutional collectors are looking specifically for this.

## The pin pipeline

Every non-on-chain piece is preserved to Hivemind-controlled IPFS storage via Filebase. The pipeline:

1. **Fetch canonical bytes** — download the actual pixels the on-chain metadata points to (Arweave URL, IPFS gateway, or centralized URL).
2. **Hash + upload** — compute SHA-256, upload to Filebase, record CID.
3. **Generate variants** — Sharp resizes to 768w / 1280w / 1920w WebP at quality 82. These are what render in the gallery (via `<img srcset>`), the original is preserved but not served at full size to browsers.
4. **Generate LQIP** — a 24×24 blur placeholder used as `backgroundImage` on the `<img>` for blur-up on load.
5. **Record manifest** — `src/lib/provenance.data.json` stores `{cid, sha256, variants, lqip, pinnedAt, verifiedAt}` per piece slug. The slim `provenance.cids.json` is the client-safe subset (slug → CID) imported by `images.ts`.

The `verifiedAt` timestamp comes from `scripts/verify-pins.mjs`, which:
- Fetches each pinned CID
- Re-computes SHA-256
- Compares to the stored hash
- If match: writes `verifiedAt = now`
- If mismatch: fails loudly (the preserved bytes have somehow changed — investigate)

Verify quarterly at minimum. Ship the timestamp on the piece page so the reader can see how fresh the verification is.

## Special cases

### On-chain generative (Art Blocks, CryptoPunks V2, PXL DEX)
- No pin needed for the artwork bytes (they're in contract storage).
- Storage row: "On-chain".
- CID + SHA-256 rows omitted or reference the on-chain script hash if useful.
- For CryptoPunks specifically: the site short-circuits to on-chain SVG rendering (via `/art/all/`), never the gateway (vector art doesn't survive raster transformation).

### Physical companions (Operator's x-ray-machine-1)
- No blockchain data at all. The piece is a physical work, no on-chain token by design.
- `OnChainDetails` returns `null` for these pieces.
- Instead render a `Specifications` panel with `Dimensions`, `Weight`, `Materials`, `Edition` (physical edition, not on-chain).
- The `Preserved by Hivemind` block is omitted (nothing to pin).

### Video pieces still pending video-transcode pin
- Show the still poster.
- Set `videoPinPending: true` in the piece's data.ts entry.
- The `Preserved by Hivemind` block is suppressed silently.
- Long-term: run `pin-videos.mjs` against the source `.mp4` to transcode + pin.

## What the panel is NOT

- NOT a marketplace link block. Buy / sell / list affordances belong nowhere on this page.
- NOT a graphic display. No color-coded status badges, no "trust score", no green checkmarks. The panel is text and hairlines. The reader forms their own trust conclusion from the primary source (the hash, the CID) — the catalogue doesn't tell them what to think.
- NOT skippable. If a piece has none of these fields populated, that's an editorial gap to fix, not a page state to design around.
