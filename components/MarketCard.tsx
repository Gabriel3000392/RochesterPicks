import Link from "next/link";
import type { Market, Outcome, Prediction } from "@prisma/client";
import { BarChart3 } from "lucide-react";
import { calculateOutcomePools, formatOdds, formatPercent } from "@/lib/odds";
import { StatusBadge } from "@/components/StatusBadge";

type MarketWithData = Market & {
  outcomes: Outcome[];
  predictions: Prediction[];
};

export function MarketCard({ market }: { market: MarketWithData }) {
  const { totalPool, outcomeStats } = calculateOutcomePools(market.outcomes, market.predictions);

  return (
    <Link href={`/markets/${market.id}`} className="panel block p-4 transition hover:border-slate-600">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">{market.category}</div>
          <h2 className="text-lg font-bold text-white">{market.title}</h2>
        </div>
        <StatusBadge status={market.status} closeTime={market.closeTime} />
      </div>
      <p className="mb-4 line-clamp-2 text-sm text-slate-300">{market.description}</p>
      <div className="space-y-3">
        {outcomeStats.map((outcome) => (
          <div key={outcome.id}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span>{outcome.label}</span>
              <span>
                {formatPercent(outcome.probability)} · {formatOdds(outcome.decimalOdds)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-emerald-400" style={{ width: formatPercent(outcome.probability) }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <BarChart3 className="h-4 w-4" aria-hidden />
        {totalPool} credits in pool
      </div>
    </Link>
  );
}
