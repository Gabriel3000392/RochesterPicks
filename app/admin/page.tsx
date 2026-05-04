import Link from "next/link";
import { MarketStatus } from "@prisma/client";
import { Plus, ShieldCheck } from "lucide-react";
import {
  adjustBalanceAction,
  cancelMarketAction,
  cancelInviteCodeAction,
  closeMarketAction,
  createInviteCodeAction,
  createPlayerAction,
  deactivatePlayerAction,
  reactivatePlayerAction,
  resolveMarketAction
} from "@/app/actions";
import { Flash } from "@/components/Flash";
import { StatusBadge } from "@/components/StatusBadge";
import { requireAdmin } from "@/lib/auth";
import { calculateOutcomePools, formatPercent } from "@/lib/odds";
import { prisma } from "@/lib/prisma";
import { formatReadableDateTime, formatRelativeTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const [users, invites, markets, predictions] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] }),
    prisma.inviteCode.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.market.findMany({
      include: {
        outcomes: { orderBy: { createdAt: "asc" } },
        predictions: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.prediction.findMany({
      include: {
        user: { select: { name: true, email: true } },
        market: { select: { title: true } },
        outcome: { select: { label: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 40
    })
  ]);

  return (
    <div>
      <Flash success={params.success} error={params.error} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">Admin</p>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
            <ShieldCheck className="h-7 w-7 text-emerald-300" aria-hidden />
            Control panel
          </h1>
          <p className="mt-1 text-sm text-slate-400">Manage credits, invite codes, players, and private prediction markets.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/markets/new">
          <Plus className="h-4 w-4" aria-hidden />
          New market
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <h2 className="text-xl font-bold text-white">Add player</h2>
          <form action={createPlayerAction} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" name="name" placeholder="Player name" required />
              <input className="input" name="email" type="email" placeholder="player@example.test" required />
            </div>
            <input className="input" name="password" type="password" placeholder="Temporary password" minLength={8} required />
            <button className="btn btn-primary w-full" type="submit">
              Add player
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">New players always start with 0 credits. Add credits separately after creating them.</p>
        </section>

        <section className="panel p-4">
          <h2 className="text-xl font-bold text-white">Invite codes</h2>
          <form action={createInviteCodeAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem_12rem_auto]">
            <input className="input" name="code" placeholder="FRIENDS-2026" required />
            <input className="input" name="maxUses" type="number" min={1} defaultValue={1} required />
            <input className="input" name="expiresAt" type="datetime-local" />
            <button className="btn btn-primary" type="submit">
              Create
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {invites.map((invite) => {
              const expired = Boolean(invite.expiresAt && invite.expiresAt < new Date());
              const full = invite.currentUses >= invite.maxUses;
              const active = !invite.cancelledAt && !expired && !full;
              const status = invite.cancelledAt ? "cancelled" : expired ? "expired" : full ? "used" : "active";

              return (
                <div key={invite.id} className="rounded-md bg-slate-950 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{invite.code}</span>
                        <span className={active ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300" : "rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300"}>
                          {status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Created by {invite.createdBy.name}
                        {invite.expiresAt ? ` - expires ${formatRelativeTime(invite.expiresAt)} (${formatReadableDateTime(invite.expiresAt)})` : " - no expiry"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">
                        {invite.currentUses}/{invite.maxUses} used
                      </span>
                      {active ? (
                        <form action={cancelInviteCodeAction}>
                          <input type="hidden" name="inviteId" value={invite.id} />
                          <button className="btn btn-danger py-1" type="submit">
                            Cancel
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel p-4 lg:col-span-2">
          <h2 className="text-xl font-bold text-white">Players and balances</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {users.map((user) => (
              <div key={user.id} className="rounded-md bg-slate-950 p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-white">{user.name}</div>
                      <span className={user.isActive ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300" : "rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300"}>
                        {user.isActive ? "active" : "inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {user.email} - {user.role.toLowerCase()}
                    </div>
                  </div>
                  <div className="font-bold text-emerald-300">{user.balance} pts</div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <form action={adjustBalanceAction} className="flex gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <input className="input" name="amount" type="number" step={1} placeholder="+100 or -25" required />
                    <button className="btn btn-secondary" type="submit">
                      Adjust
                    </button>
                  </form>
                  {user.role === "USER" ? (
                    user.isActive ? (
                      <form action={deactivatePlayerAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button className="btn btn-danger w-full" type="submit">
                          Remove
                        </button>
                      </form>
                    ) : (
                      <form action={reactivatePlayerAction}>
                        <input type="hidden" name="userId" value={user.id} />
                        <button className="btn btn-primary w-full" type="submit">
                          Reactivate
                        </button>
                      </form>
                    )
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel mt-4 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Markets</h2>
          <Link className="btn btn-secondary" href="/admin/markets/new">
            Create
          </Link>
        </div>
        <div className="grid gap-3">
          {markets.map((market) => {
            const { totalPool, outcomeStats } = calculateOutcomePools(market.outcomes, market.predictions);
            const canSettle = market.status === MarketStatus.OPEN || market.status === MarketStatus.CLOSED;
            return (
              <div key={market.id} className="rounded-md border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <StatusBadge status={market.status} closeTime={market.closeTime} />
                      <span className="text-xs text-slate-500">{market.category}</span>
                    </div>
                    <h3 className="font-bold text-white">{market.title}</h3>
                    <p className="mt-1 text-sm text-slate-400">{market.description}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      Pool: {totalPool} pts - closes {formatRelativeTime(market.closeTime)} ({formatReadableDateTime(market.closeTime)})
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link className="btn btn-secondary py-1" href={`/markets/${market.id}`}>
                      View
                    </Link>
                    <Link className="btn btn-secondary py-1" href={`/admin/markets/${market.id}/edit`}>
                      Edit
                    </Link>
                    {canSettle ? (
                      <form action={closeMarketAction}>
                        <input type="hidden" name="marketId" value={market.id} />
                        <button className="btn btn-secondary py-1" type="submit">
                          Close
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {outcomeStats.map((outcome) => (
                    <div key={outcome.id} className="rounded-md border border-slate-800 p-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold text-white">{outcome.label}</span>
                        <span className="text-slate-300">
                          {outcome.pool} pts - {formatPercent(outcome.probability)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {canSettle ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                    <form action={resolveMarketAction} className="flex flex-col gap-2 sm:flex-row">
                      <input type="hidden" name="marketId" value={market.id} />
                      <select className="input" name="winningOutcomeId" required>
                        <option value="">Select winning outcome</option>
                        {market.outcomes.map((outcome) => (
                          <option key={outcome.id} value={outcome.id}>
                            {outcome.label}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-primary" type="submit">
                        Resolve
                      </button>
                    </form>
                    <form action={cancelMarketAction}>
                      <input type="hidden" name="marketId" value={market.id} />
                      <button className="btn btn-danger w-full" type="submit">
                        Cancel and refund
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel mt-4 p-4">
        <h2 className="text-xl font-bold text-white">Recent predictions</h2>
        <div className="mt-4 space-y-2">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="rounded-md bg-slate-950 p-3 text-sm">
              <div className="font-semibold text-white">
                {prediction.user.name} picked {prediction.outcome.label}
              </div>
              <div className="text-slate-400">
                {prediction.amount} pts - {prediction.market.title} - {prediction.status.toLowerCase()}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
