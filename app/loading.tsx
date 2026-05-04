export default function Loading() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-4">
          <div className="h-4 w-24 rounded bg-slate-800" />
          <div className="mt-3 h-6 w-3/4 rounded bg-slate-800" />
          <div className="mt-4 h-3 w-full rounded bg-slate-800" />
          <div className="mt-5 space-y-3">
            <div className="h-2 rounded bg-slate-800" />
            <div className="h-2 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}
