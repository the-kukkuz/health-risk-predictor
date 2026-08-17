export default function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="card flex items-center gap-3 text-slate-500">
      <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-brand-600 rounded-full animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
