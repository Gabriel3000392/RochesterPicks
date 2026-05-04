import { MarketStatus } from "@prisma/client";
import { clsx } from "clsx";

export function StatusBadge({ status, closeTime }: { status: MarketStatus; closeTime?: Date }) {
  const isTimedClosed = status === MarketStatus.OPEN && closeTime && closeTime <= new Date();
  const label = isTimedClosed ? "CLOSED" : status;

  return (
    <span
      className={clsx(
        "rounded-full px-2 py-1 text-xs font-semibold",
        label === "OPEN" && "bg-emerald-500/15 text-emerald-300",
        label === "CLOSED" && "bg-amber-500/15 text-amber-300",
        label === "RESOLVED" && "bg-sky-500/15 text-sky-300",
        label === "CANCELLED" && "bg-slate-500/15 text-slate-300"
      )}
    >
      {label.toLowerCase()}
    </span>
  );
}
