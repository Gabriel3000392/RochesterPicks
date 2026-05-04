import { Medal } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  await requireUser();
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      predictions: true,
      balanceTransactions: true
    },
    orderBy: [{ balance: "desc" }, { name: "asc" }]
  });

  const rows = users.map((user) => {
    const predictionProfitLoss = user.balanceTransactions
      .filter((tx) => tx.type === "STAKE" || tx.type === "PAYOUT" || tx.type === "REFUND")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const adminAdjustments = user.balanceTransactions
      .filter((tx) => tx.type === "ADMIN_ADJUSTMENT")
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      id: user.id,
      name: user.name,
      balance: user.balance,
      totalPredictions: user.predictions.length,
      wins: user.predictions.filter((prediction) => prediction.status === "WON").length,
      losses: user.predictions.filter((prediction) => prediction.status === "LOST").length,
      predictionProfitLoss,
      adminAdjustments
    };
  });

  return (
    <div>
      <div className="mb-5">
        <p className="label">Leaderboard</p>
        <h1 className="text-3xl font-bold text-white">Credit standings</h1>
        <p className="mt-1 text-sm text-slate-400">Prediction profit/loss is separated from admin balance changes.</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="hidden grid-cols-[4rem_1fr_repeat(6,minmax(6rem,8rem))] gap-3 border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
          <div>Rank</div>
          <div>User</div>
          <div>Balance</div>
          <div>Total</div>
          <div>Wins</div>
          <div>Losses</div>
          <div>P/L</div>
          <div>Admin</div>
        </div>
        <div className="divide-y divide-slate-800">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[4rem_1fr_repeat(6,minmax(6rem,8rem))] lg:items-center"
            >
              <div className="flex items-center gap-2 font-bold text-white">
                {index < 3 ? <Medal className="h-4 w-4 text-emerald-300" aria-hidden /> : null}
                #{index + 1}
              </div>
              <div className="font-semibold text-white">{row.name}</div>
              <Metric label="Balance" value={`${row.balance} pts`} />
              <Metric label="Total" value={row.totalPredictions} />
              <Metric label="Wins" value={row.wins} />
              <Metric label="Losses" value={row.losses} />
              <Metric label="P/L" value={signed(row.predictionProfitLoss)} tone={row.predictionProfitLoss >= 0 ? "good" : "bad"} />
              <Metric label="Admin" value={signed(row.adminAdjustments)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "good" | "bad" }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 lg:hidden">{label}</div>
      <div className={tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : "text-slate-200"}>
        {value}
      </div>
    </div>
  );
}

function signed(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}
