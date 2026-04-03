type StatsCardProps = {
  label: string;
  value: number;
  accent: string;
};

export function StatsCard({ label, value, accent }: StatsCardProps) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className={`h-2 w-16 rounded-full ${accent}`} />
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
