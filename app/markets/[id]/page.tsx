import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Coins } from "lucide-react";
import { placePredictionAction } from "@/app/actions";
import { Flash } from "@/components/Flash";
import { OddsHistoryChart } from "@/components/OddsHistoryChart";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/auth";
import { calculateOutcomePools, formatOdds, formatPercent } from "@/lib/odds";
import { prisma } from "@/lib/prisma";
import { formatReadableDateTime, formatRelativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function MarketDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireUser();
  const routeParams = await params;
  const query = await searchParams;
  const market = await prisma.market.findUnique({
    where: { id: routeParams.id },
    include: {
      outcomes: { orderBy: { createdAt: "asc" } },
      oddsSnapshots: {
        include: { outcome: { select: { id: true, label: true } } },
        orderBy: { createdAt: "asc" },
        take: 300
      },
      predictions: {
        include: { user: { select: { id: true, name: true } }, outcome: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!market) notFound();

  const { totalPool, outcomeStats } = calculateOutcomePools(market.outcomes, market.predictions);
  const userPredictions = market.predictions.filter((prediction) => prediction.userId === user.id);
  const canPredict = market.status === "OPEN" && market.closeTime > new Date();

  return (
    <div>
      <Flash success={query.success} error={query.error} />
      <Link className="mb-4 inline-block text-sm text-emerald-300 hover:text-emerald-200" href="/markets">
        Back to markets
      </Link>
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <section className="panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                {market.category}
              </div>
              <h1 className="text-3xl font-bold text-white">{market.title}</h1>
              <p className="mt-3 text-slate-300">{market.description}</p>
            </div>
            <StatusBadge status={market.status} closeTime={market.closeTime} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Coins className="h-4 w-4" aria-hidden />
                Pool
              </div>
              <div className="mt-1 text-2xl font-bold text-white">{totalPool} points</div>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="h-4 w-4" aria-hidden />
                Closes
              </div>
              <div className="mt-1 text-lg font-semibold text-white">{formatRelativeTime(market.closeTime)}</div>
              <div className="mt-1 text-xs text-slate-400">{formatReadableDateTime(market.closeTime)}</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {outcomeStats.map((outcome) => (
              <div key={outcome.id} className="rounded-md border border-slate-800 bg-slate-950 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{outcome.label}</div>
                  <div className="text-right text-sm text-slate-300">
                    {formatPercent(outcome.probability)} · odds {formatOdds(outcome.decimalOdds)}
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: formatPercent(outcome.probability) }} />
                </div>
                <div className="mt-2 text-xs text-slate-400">{outcome.pool} points staked</div>
              </div>
            ))}
          </div>
        </section>

        <div className="lg:col-start-1">
          <OddsHistoryChart snapshots={market.oddsSnapshots} outcomes={market.outcomes} />
        </div>

        <aside className="space-y-4">
          <section className="panel p-4">
            <h2 className="text-lg font-bold text-white">Place prediction</h2>
            <p className="mt-1 text-sm text-slate-400">Your balance: {user.balance} points</p>
            {canPredict ? (
              <form action={placePredictionAction} className="mt-4 space-y-4">
                <input type="hidden" name="marketId" value={market.id} />
                <div className="space-y-2">
                  {market.outcomes.map((outcome) => (
                    <label
                      key={outcome.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm"
                    >
                      <input name="outcomeId" type="radio" value={outcome.id} required />
                      {outcome.label}
                    </label>
                  ))}
                </div>
                <div>
                  <label className="label" htmlFor="amount">
                    Stake credits
                  </label>
                  <input className="input mt-1" id="amount" name="amount" type="number" min={1} step={1} required />
                </div>
                <button className="btn btn-primary w-full" type="submit">
                  Place prediction
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                This market is closed for new predictions.
              </div>
            )}
          </section>

          <section className="panel p-4">
            <h2 className="text-lg font-bold text-white">Your predictions</h2>
            {userPredictions.length ? (
              <div className="mt-3 space-y-2">
                {userPredictions.map((prediction) => (
                  <div key={prediction.id} className="rounded-md bg-slate-950 p-3 text-sm">
                    <div className="font-semibold text-white">{prediction.outcome.label}</div>
                    <div className="text-slate-400">
                      {prediction.amount} points · {prediction.status.toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No predictions on this market yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
