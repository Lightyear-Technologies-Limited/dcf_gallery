const P: Record<string, { bg: string; fg: string }> = {
  fidenza:            { bg: "#EDE9E3", fg: "#C4A888" },
  ringers:            { bg: "#E6E9ED", fg: "#8898A8" },
  cryptopunks:        { bg: "#EAE6E6", fg: "#B89090" },
  grifters:           { bg: "#E9E4E7", fg: "#A88898" },
  woy:                { bg: "#E4EAEA", fg: "#88A8A8" },
  "synthetic-dreams": { bg: "#E9E4EC", fg: "#9888A8" },
  biomelumina:        { bg: "#E4E7EA", fg: "#88A0B0" },
  ack:                { bg: "#E8E7E5", fg: "#A09890" },
  "ack-editions":     { bg: "#E8E7E5", fg: "#A09890" },
  notablepepes:       { bg: "#E4EAE4", fg: "#88A088" },
  beeple:             { bg: "#E7E7E5", fg: "#989890" },
  dmitricherniak:     { bg: "#E5E7EA", fg: "#8890A0" },
  lightyears:         { bg: "#EAEAE8", fg: "#A8A8A0" },
  pxldex:             { bg: "#E4E8E4", fg: "#80A080" },
  lights:             { bg: "#EAE8E4", fg: "#B8A888" },
  "x0x":              { bg: "#EAE4E4", fg: "#B88888" },
  meebit:             { bg: "#E6E6EA", fg: "#9090A0" },
  "human-unreadable": { bg: "#E5E8E5", fg: "#88A088" },
  "repeat-as-necessary": { bg: "#E8E8E7", fg: "#A0A098" },
  masksofluci:        { bg: "#EBE6E3", fg: "#B89880" },
  "skulls-of-luci":   { bg: "#EBE6E3", fg: "#B89880" },
  daygardens:         { bg: "#E3EBE5", fg: "#80B088" },
  tylerhobbs:         { bg: "#EDE9E3", fg: "#C4A888" },
  qql:                { bg: "#E8E5EB", fg: "#9888A0" },
  xcopy:              { bg: "#EBE4E4", fg: "#C08888" },
};

const D = { bg: "#E8E7E5", fg: "#A09890" };

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h); }
function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

export default function PlaceholderArt({ collectionSlug, pieceSlug, className = "" }: { collectionSlug: string; pieceSlug?: string; className?: string }) {
  const p = P[collectionSlug] || D;
  const seed = hash(pieceSlug || collectionSlug);
  const r = rng(seed);
  const n = 2 + Math.floor(r() * 3);
  const shapes: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = r() * 100, y = r() * 100, s = 6 + r() * 25, o = 0.15 + r() * 0.25;
    shapes.push(r() > 0.5
      ? <circle key={i} cx={`${x}%`} cy={`${y}%`} r={s} fill={p.fg} opacity={o} />
      : <rect key={i} x={`${x}%`} y={`${y}%`} width={s} height={s} fill={p.fg} opacity={o} />
    );
  }
  const name = collectionSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <div className={`relative w-full h-full ${className}`} style={{ backgroundColor: p.bg }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">{shapes}</svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: p.fg, opacity: 0.4 }}>{name}</span>
      </div>
    </div>
  );
}
