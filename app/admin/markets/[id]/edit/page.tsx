import Link from "next/link";
import { notFound } from "next/navigation";
import { editMarketAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditMarketPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const routeParams = await params;
  const market = await prisma.market.findUnique({
    where: { id: routeParams.id },
    include: { outcomes: { orderBy: { createdAt: "asc" } } }
  });
  if (!market) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="mb-4 inline-block text-sm text-emerald-300 hover:text-emerald-200">
        Back to admin
      </Link>
      <div className="panel p-5">
        <h1 className="text-2xl font-bold text-white">Edit market</h1>
        <form action={editMarketAction} className="mt-5 space-y-4">
          <input type="hidden" name="marketId" value={market.id} />
          <input type="hidden" name="type" value={market.type} />
          <input type="hidden" name="outcomes" value={market.outcomes.map((outcome) => outcome.label).join("\n")} />
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input className="input mt-1" id="title" name="title" defaultValue={market.title} required />
          </div>
          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea className="input mt-1 min-h-24" id="description" name="description" defaultValue={market.description} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">
                Category / sport
              </label>
              <input className="input mt-1" id="category" name="category" defaultValue={market.category} required />
            </div>
            <div>
              <label className="label" htmlFor="closeTime">
                Close time
              </label>
              <input
                className="input mt-1"
                id="closeTime"
                name="closeTime"
                type="datetime-local"
                defaultValue={toDateTimeLocal(market.closeTime)}
                required
              />
            </div>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
            Outcomes are locked in this simple version after creation to preserve existing prediction records.
          </div>
          <button className="btn btn-primary w-full" type="submit">
            Save changes
          </button>
        </form>
      </div>
    </div>
  );
}

function toDateTimeLocal(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
