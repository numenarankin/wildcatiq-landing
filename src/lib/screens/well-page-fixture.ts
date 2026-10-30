/**
 * Johnson A 3's well page, in the shapes `WellWorkspace` takes from
 * `src/app/production/wells/[well]/page.tsx`. Every volume is the dashboard
 * fixture's: the measured rows are the well's daily record (April 1 to
 * FIXTURE_TODAY), and the months before it are the state's record, expanded
 * to days by the app's own `expandMonthlyToDaily` with the operator's first
 * day as the boundary, as `wellRrcHistory` does on the server.
 */
import type { ProductionPoint } from "@/lib/wells/wells";
import {
  expandMonthlyToDaily,
  historyMonths,
  earliestMeasuredDate,
  type HistoryMonth,
  type LeaseHistorySeries,
} from "@/lib/rrc/lease-history-series";
import { dashboardFixture } from "./dashboard-fixture";
import { OPERATOR, PRICES, WELLS, leaseOf, type WellSpec } from "./operator";

export const PAGE_WELL: WellSpec = WELLS.find((w) => w.id === "w-ja3")!;

/** The header line's well fields (`well.zone`, `well.county`, `well.perforations`). */
export const PAGE_WELL_INFO = {
  zone: "Caddo",
  county: OPERATOR.county,
  perforations: "3926-3954",
} as const;

export interface WellPageFixture {
  production: ProductionPoint[];
  rrcHistory: LeaseHistorySeries;
  rrcHistoryMonths: HistoryMonth[];
  /** The well's last measured day against the one before, as the dashboard row reads it. */
  dayChange: { oil: number | null; gas: number | null };
  nri: number;
  prices: { oilPerBbl: number; gasPerMcf: number };
}

let cached: WellPageFixture | null = null;

export function wellPageFixture(): WellPageFixture {
  if (cached) return cached;
  const fx = dashboardFixture();
  const daily = fx.dailyByWell.find((s) => s.wellId === PAGE_WELL.id)!.daily;
  // Derived well rows carry noon (`lib/wells/production-rows.ts`).
  const production: ProductionPoint[] = daily.map((d) => ({
    date: d.date,
    time: "12:00",
    oilProduction: d.oilBbl,
    gasProduction: d.gasMcf,
    saltWater: d.water,
    oilStock: 0,
    oilSales: 0,
    measured: { oil: true, gas: true, water: true },
  }));

  const before = earliestMeasuredDate(production);
  const monthly = fx.byWellMonthly.find((s) => s.wellId === PAGE_WELL.id)!.monthly;
  const rrcHistory = expandMonthlyToDaily(
    monthly
      .filter((m) => before === null || `${m.month}-01` < before)
      .map((m) => ({ cycle: `${m.month}-01`, oilBbl: m.oilBbl, gasMcf: m.gasMcf })),
    before
  );

  const row = fx.wellRows.find((r) => r.wellId === PAGE_WELL.id)!;
  const pct = (c: { now: number; prev: number }) => (c.prev > 0 ? c.now / c.prev - 1 : null);

  cached = {
    production,
    rrcHistory,
    rrcHistoryMonths: historyMonths(rrcHistory),
    dayChange: { oil: pct(row.change.oil), gas: pct(row.change.gas) },
    nri: leaseOf(PAGE_WELL).nri,
    prices: PRICES,
  };
  return cached;
}
