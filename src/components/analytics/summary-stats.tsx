import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MovePair } from "@/components/analytics/move-pair";

/**
 * The headline stat row above the analytics charts: the last 24 hours of oil and
 * gas, estimated monthly NET revenue, and the company's projected decline.
 * Presentational — every number is computed server-side; this only formats.
 * Matches the minimalist Stat used on the tank workspace.
 *
 * Net, not gross: only net is the operator's money — what is left after the
 * royalty and working-interest owners are paid — and the gross figure beside it
 * was one more number to read past. The table below nets its rows the same
 * way, as "Net rev/day", so the card is that column added up.
 */

// Both bounds: `maximumFractionDigits` alone drops trailing zeros, so a rate of
// 54.00 printed as "54" and the column lost its decimal alignment.
const num = (n: number, decimals = 0) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

/** Effective annual decline (fraction) → "12.34%/yr"; positive = declining. */
function formatDecline(annual: number | null): string {
  if (annual == null || !Number.isFinite(annual)) return "—";
  return `${(annual * 100).toFixed(2).replace("-", "−")}%/yr`;
}

function Stat({
  label,
  value,
  /** Day-over-day and 30-day moves, side by side (`MovePair`). Absent on the
   *  cards that have nothing to compare against. */
  change,
  change30,
}: {
  label: string;
  value: ReactNode;
  change?: number | null;
  change30?: number | null;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[0.15rem] border px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        {change !== undefined || change30 !== undefined ? (
          <MovePair day={change ?? null} month={change30 ?? null} className="text-xs" />
        ) : null}
      </span>
    </div>
  );
}

export function SummaryStats({
  oilBblPerDay,
  gasMcfPerDay,
  oilChangePct,
  gasChangePct,
  oilChange30Pct,
  gasChange30Pct,
  netRevenueMonthly,
  netChangePct,
  netChange30Pct,
  decline,
}: {
  /**
   * The company's last complete measured day of oil and gas — the lease table's
   * columns, added up.
   *
   * Passed in rather than taken from `summary`, which derives its own company
   * rate from the tank series and therefore answered this question differently
   * from the table sitting under these cards.
   */
  oilBblPerDay: number;
  gasMcfPerDay: number;
  /**
   * The move from the day before, as a fraction (0.0125 = up 1.25%), or null
   * when there is nothing to compare against. The table's own move columns
   * summed and divided once — not an average of them, which is a different
   * number.
   */
  oilChangePct: number | null;
  gasChangePct: number | null;
  /**
   * That same day's revenue at realized prices, before interest, carried over an
   * average month — the table's rev/day column x 365.25/12.
   */
  /**
   * The move on that revenue. The same percentage the daily figure moved — the
   * monthly carry is a constant — so it is the table's rev/day column's own.
   */
  /**
   * The same, net of the operator's interest, counting only the leases that HAVE
   * one recorded. Null when none does — a dash, never $0, because "nobody has
   * entered the interest" and "you keep none of it" must not read the same.
   */
  netRevenueMonthly: number | null;
  /** That figure's move, netted lease by lease over the same leases. */
  netChangePct: number | null;
  /** The 30-day moves, each on the same basis as its day-over-day twin. */
  oilChange30Pct: number | null;
  gasChange30Pct: number | null;
  netChange30Pct: number | null;
  /**
   * The company's fleet decline — every lease's curves summed forward
   * (`lib/analytics/fleet-decline`) — which the chart draws as its company
   * decline curve, so the card and the curve under it are one number.
   *
   * Undefined while the chart's full history is still loading, and the card
   * WAITS for it. It used to show a 12-month figure meanwhile, which meant the
   * headline quietly changed to a different number a few seconds after the page
   * settled — a number that moves on its own is worse than a number that is
   * late.
   */
  decline?: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {/* "24hr", not "production": these are the last COMPLETE day each well
          measured, not a smoothed rate, and the label has to say which. */}
      <Stat
        label="24hr oil prod"
        value={`${num(oilBblPerDay, 2)} bbl/d`}
        change={oilChangePct}
        change30={oilChange30Pct}
      />
      <Stat
        label="24hr gas prod"
        value={`${num(gasMcfPerDay, 2)} mcf/d`}
        change={gasChangePct}
        change30={gasChange30Pct}
      />
      {/* "rev", and the period spelled out in the label rather than a /mo on the
          figure: the value column stays money and only money, so the numbers
          in this row read down cleanly. */}
      <Stat
        label="Est. net monthly rev"
        value={netRevenueMonthly == null ? "—" : money(netRevenueMonthly)}
        change={netChangePct}
        change30={netChange30Pct}
      />
      <Stat
        label="Proj. 12-mo decline"
        value={
          decline === undefined ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            formatDecline(decline)
          )
        }
      />
    </div>
  );
}
