export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="panel p-8 text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}
