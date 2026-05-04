import Link from "next/link";
import { MarketStatus, Prisma } from "@prisma/client";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Flash } from "@/components/Flash";
import { MarketCard } from "@/components/MarketCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const filters = ["active", "closed", "resolved", "cancelled"] as const;
type Filter = (typeof filters)[number];

function whereForFilter(filter: Filter): Prisma.MarketWhereInput {
  const now = new Date();
  if (filter === "active") return { status: MarketStatus.OPEN, closeTime: { gt: now } };
  if (filter === "closed") {
    return {
      OR: [
        { status: MarketStatus.CLOSED },
        { status: MarketStatus.OPEN, closeTime: { lte: now } }
      ]
    };
  }
  if (filter === "resolved") return { status: MarketStatus.RESOLVED };
  return { status: MarketStatus.CANCELLED };
}

export default async function MarketsPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string; success?: string; error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const filter = filters.includes(params.filter as Filter) ? (params.filter as Filter) : "active";
  const markets = await prisma.market.findMany({
    where: whereForFilter(filter),
    include: {
      outcomes: { orderBy: { createdAt: "asc" } },
      predictions: true
    },
    orderBy: [{ closeTime: "asc" }, { createdAt: "desc" }]
  });

  return (
    <div>
      <Flash success={params.success} error={params.error} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">Credit balance</p>
          <h1 className="text-3xl font-bold text-white">{user.balance} points</h1>
          <p className="mt-1 text-sm text-slate-400">Private predictions with friends. No cash value.</p>
        </div>
        {user.role === "ADMIN" ? (
          <Link className="btn btn-primary" href="/admin/markets/new">
            <Plus className="h-4 w-4" aria-hidden />
            Create market
          </Link>
        ) : null}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link
            key={item}
            href={`/markets?filter=${item}`}
            className={item === filter ? "btn btn-primary py-1" : "btn btn-secondary py-1"}
          >
            {item}
          </Link>
        ))}
      </div>

      {markets.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <EmptyState title="No markets here" body="Try another filter or ask an admin to create a new market." />
      )}
    </div>
  );
}
