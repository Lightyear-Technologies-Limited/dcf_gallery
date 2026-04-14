interface MetadataItem {
  label: string;
  value: React.ReactNode;
}

interface Props {
  items: MetadataItem[];
}

export default function MetadataTable({ items }: Props) {
  const filtered = items.filter((item) => item.value);
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-0">
      {filtered.map((item, i) => (
        <div key={i} className="flex justify-between py-2.5 border-b border-border text-[13px]">
          <span className="text-muted">{item.label}</span>
          <span className="text-foreground-secondary font-mono tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
