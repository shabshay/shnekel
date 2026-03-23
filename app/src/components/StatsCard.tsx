interface StatsCardProps {
  label: string;
  value: string;
  color?: string;
}

export function StatsCard({ label, value, color }: StatsCardProps) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl">
      <p className="text-on-surface-variant font-label text-xs tracking-wide font-semibold mb-2">
        {label}
      </p>
      <p className="font-headline text-2xl font-bold" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}
