"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { CompanyCharts, type ChartLease } from "@/components/analytics/company-charts";
import { LeaseSummaryTable } from "@/components/analytics/lease-summary-table";
import { SummaryStats } from "@/components/analytics/summary-stats";
import {
  unitDecline,
  wellUnitKey,
  wellUnitKeys,
  type FleetDecline,
} from "@/lib/analytics/fleet-decline";
import type { LeaseSummaryRow, LeaseWellRow } from "@/lib/analytics/lease-summaries";
import type {
  CommodityPrices,
  MonthlyProduction,
  WellDailySeries,
  WellMonthlySeries,
} from "@/lib/analytics/types";

/**
 * The stat row and the chart under it, sharing one decline number.
 *
 * The number is the company's fleet decline — every lease's oil and gas curves
 * anchored at their current rates and summed forward (`lib/analytics/
 * fleet-decline`). It arrives with the chart's full-history prefetch, because
 * it wants the whole history and the public record behind it and must not sit
 * on the page's critical path. The chart draws that projection as its company
 * decline curve and reports the same figure up here, so the card and the curve
 * under it are one derivation; until it lands the card shows a skeleton rather
 * than a placeholder that would later change.
 *
 * The lease table's decline column is the same projection taken apart: each
 * lease row is its wells' curves summed (`unitDecline` over `wellUnitKeys`),
 * each well row under it is that well's own, and the unassigned row is the
 * unassigned wells', so the wells add up to their lease and the leases to the
 * card. It lands with the card and shows a skeleton until then.
 *
 * This component exists only to own that one piece of state — the children are
 * otherwise unchanged, and everything else on them is still server-computed.
 */
export function DashboardOverview({
  oilBblPerDay,
  gasMcfPerDay,
  oilChangePct,
  gasChangePct,
  oilChange30Pct,
  gasChange30Pct,
  netRevenueMonthly,
  netChangePct,
  netChange30Pct,
  monthly,
  byWellMonthly,
  dailyByWell,
  prices,
  nriByLease,
  companyNri,
  pie,
  leaseRows,
  wellRows,
  chartLeases,
}: {
  oilBblPerDay: number;
  gasMcfPerDay: number;
  /** Day-over-day move on each figure, or null with nothing to compare against. */
  oilChangePct: number | null;
  gasChangePct: number | null;
  /** The 30-day move on each figure (`thirty-day-change.ts`), or null. */
  oilChange30Pct: number | null;
  gasChange30Pct: number | null;
  netRevenueMonthly: number | null;
  netChangePct: number | null;
  netChange30Pct: number | null;
  monthly: MonthlyProduction[];
  byWellMonthly: WellMonthlySeries[];
  /** Recent per-well daily production, for the chart's 1M/3M/6M windows. */
  dailyByWell: WellDailySeries[];
  prices: CommodityPrices;
  /** The chart's Revenue view nets one lease by its own interest. Keyed by row key. */
  nriByLease: Record<string, number>;
  companyNri: number | null;
  /** The pie beside the chart — passed through so the grid row stays one row. */
  pie: ReactNode;
  /** The lease table's rows; rendered here so its decline column can read the fleet. */
  leaseRows: LeaseSummaryRow[];
  /** The wells those rows were summed from; the table expands a lease into them. */
  wellRows: LeaseWellRow[];
  /** The same rows as the chart's picker, each with its wells. */
  chartLeases: ChartLease[];
}) {
  // Undefined until the chart's prefetch has landed; the card and the table's
  // decline column show skeletons in the meantime. Null when the server could
  // not build it.
  const [fleet, setFleet] = useState<FleetDecline | null | undefined>(undefined);
  // Stable, or the effect reporting it would fire on every parent render.
  const handleDecline = useCallback((v: FleetDecline | null) => setFleet(v), []);
  const decline = fleet === undefined ? undefined : (fleet?.annual ?? null);
  // Row key → that row's decline: a lease row over its wells' units, a well
  // row (keyed `well:<id>`, as the table reads it) over its own.
  const declineByRow = useMemo(() => {
    if (fleet === undefined) return undefined;
    const byUnit = fleet?.byUnit ?? {};
    const wellsOf = new Map(chartLeases.map((l) => [l.key, l.wellIds]));
    return Object.fromEntries([
      ...leaseRows.map((r) => [r.key, unitDecline(byUnit, wellUnitKeys(wellsOf.get(r.key) ?? []))]),
      ...wellRows.map((w) => [wellUnitKey(w.wellId), unitDecline(byUnit, [wellUnitKey(w.wellId)])]),
    ]);
  }, [fleet, leaseRows, wellRows, chartLeases]);

  return (
    <>
      <SummaryStats
        oilBblPerDay={oilBblPerDay}
        gasMcfPerDay={gasMcfPerDay}
        oilChangePct={oilChangePct}
        gasChangePct={gasChangePct}
        oilChange30Pct={oilChange30Pct}
        gasChange30Pct={gasChange30Pct}
        netRevenueMonthly={netRevenueMonthly}
        netChangePct={netChangePct}
        netChange30Pct={netChange30Pct}
        decline={decline}
      />

      {/* One grid, not two stacked columns: the chart and the pie are cells of
          the SAME row, so the grid stretches them to a common height instead of
          leaving the pie short beside it. */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        <CompanyCharts
          data={monthly}
          wells={byWellMonthly}
          dailyByWell={dailyByWell}
          prices={prices}
          leases={chartLeases}
          nriByLease={nriByLease}
          companyNri={companyNri}
          onDeclineChange={handleDecline}
          className="lg:col-span-2"
        />
        {pie}
      </div>

      {/* Full width, and no grid around it: the week's agenda used to sit
          beside this table and now lives on /agenda alone, so there is nothing
          left to share the row with. */}
      <LeaseSummaryTable rows={leaseRows} wells={wellRows} decline={declineByRow} />
    </>
  );
}
