export function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-2">
      <div className="text-2xl font-black text-white">{title}</div>
      <div className="text-sm text-slate-300 font-medium">{subtitle}</div>
    </div>
  );
}

