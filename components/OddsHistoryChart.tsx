import type { OddsSnapshot, Outcome } from "@prisma/client";
import { formatOdds } from "@/lib/odds";
import { formatReadableDateTime } from "@/lib/time";

type SnapshotWithOutcome = OddsSnapshot & {
  outcome: Pick<Outcome, "id" | "label">;
};

const colors = ["#34d399", "#60a5fa", "#f59e0b", "#f472b6", "#a78bfa", "#fb7185", "#2dd4bf", "#facc15"];

export function OddsHistoryChart({
  snapshots,
  outcomes
}: {
  snapshots: SnapshotWithOutcome[];
  outcomes: Pick<Outcome, "id" | "label">[];
}) {
  if (snapshots.length === 0) {
    return (
      <section className="panel mt-4 p-5">
        <h2 className="text-xl font-bold text-white">Odds history</h2>
        <p className="mt-2 text-sm text-slate-400">No odds history yet. The chart starts after the first prediction.</p>
      </section>
    );
  }

  const times = [...new Set(snapshots.map((snapshot) => snapshot.createdAt.getTime()))].sort((a, b) => a - b);
  const maxOdds = Math.max(2, ...snapshots.map((snapshot) => snapshot.decimalOdds));
  const minOdds = 1;
  const width = 720;
  const height = 260;
  const pad = 34;
  const plotWidth = width - pad * 2;
  const plotHeight = height - pad * 2;

  const xFor = (time: number) => pad + (times.length === 1 ? plotWidth / 2 : ((time - times[0]) / (times[times.length - 1] - times[0])) * plotWidth);
  const yFor = (odds: number) => pad + (1 - (odds - minOdds) / (maxOdds - minOdds)) * plotHeight;

  return (
    <section className="panel mt-4 p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Odds history</h2>
          <p className="mt-1 text-sm text-slate-400">Decimal odds after each credit prediction.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {outcomes.map((outcome, index) => (
            <span key={outcome.id} className="flex items-center gap-1 text-xs text-slate-300">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              {outcome.label}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg className="min-w-[42rem]" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Historical decimal odds chart">
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#334155" />
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#334155" />
          {[minOdds, (minOdds + maxOdds) / 2, maxOdds].map((tick) => (
            <g key={tick}>
              <line x1={pad} x2={width - pad} y1={yFor(tick)} y2={yFor(tick)} stroke="#1f2937" />
              <text x={6} y={yFor(tick) + 4} fill="#94a3b8" fontSize="12">
                {formatOdds(tick)}
              </text>
            </g>
          ))}
          {outcomes.map((outcome, index) => {
            const points = snapshots
              .filter((snapshot) => snapshot.outcomeId === outcome.id)
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
              .map((snapshot) => `${xFor(snapshot.createdAt.getTime())},${yFor(snapshot.decimalOdds)}`)
              .join(" ");

            return (
              <polyline
                key={outcome.id}
                points={points}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
          {snapshots.map((snapshot) => {
            const outcomeIndex = outcomes.findIndex((outcome) => outcome.id === snapshot.outcomeId);
            return (
              <circle
                key={snapshot.id}
                cx={xFor(snapshot.createdAt.getTime())}
                cy={yFor(snapshot.decimalOdds)}
                r="3.5"
                fill={colors[Math.max(outcomeIndex, 0) % colors.length]}
              >
                <title>
                  {snapshot.outcome.label}: {formatOdds(snapshot.decimalOdds)} at {formatReadableDateTime(snapshot.createdAt)}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
