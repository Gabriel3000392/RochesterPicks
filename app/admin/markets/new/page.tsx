import Link from "next/link";
import { MarketType } from "@prisma/client";
import { createMarketAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";

export default async function NewMarketPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="mb-4 inline-block text-sm text-emerald-300 hover:text-emerald-200">
        Back to admin
      </Link>
      <div className="panel p-5">
        <h1 className="text-2xl font-bold text-white">Create market</h1>
        <MarketForm action={createMarketAction} />
      </div>
    </div>
  );
}

function MarketForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="mt-5 space-y-4">
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input className="input mt-1" id="title" name="title" placeholder="Crusaders beat Blues" required />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description
        </label>
        <textarea className="input mt-1 min-h-24" id="description" name="description" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">
            Category / sport
          </label>
          <input className="input mt-1" id="category" name="category" placeholder="Rugby" required />
        </div>
        <div>
          <label className="label" htmlFor="closeTime">
            Close time
          </label>
          <input className="input mt-1" id="closeTime" name="closeTime" type="datetime-local" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="type">
          Type
        </label>
        <select className="input mt-1" id="type" name="type" defaultValue={MarketType.YES_NO}>
          <option value={MarketType.YES_NO}>Yes / No</option>
          <option value={MarketType.MULTIPLE_CHOICE}>Multiple choice</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="outcomes">
          Outcomes, one per line
        </label>
        <textarea className="input mt-1 min-h-28" id="outcomes" name="outcomes" defaultValue={"Yes\nNo"} required />
      </div>
      <button className="btn btn-primary w-full" type="submit">
        Create market
      </button>
    </form>
  );
}
