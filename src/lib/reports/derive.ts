/**
 * Pure derivations for the GBC-3 reports - no React, no DB, no I/O. Everything
 * here is a deterministic function of a `CompanyProductionRow[]` so it can be
 * unit-tested in isolation and reused by both the View modal (client) and the
 * export route (server) without either importing the other.
 *
 * All five report families reduce to a few primitives: group-by-date, group-by-
 * well, windowed %-change, and a 3-day-vs-30-day exception scan.
 */

import type { CompanyProductionRow } from "@/lib/reports/types";

// --- tank-derived overlay --------------------------------------------------

/**
 * Derived per-well/day production from the measurement engines; `null` (or
 * absent) on a product means it wasn't derived (leave the hand-entered value).
 * Oil / water come from the tank engine, gas from the meter engine. Kept as a
 * local type so this pure, client-safe module never imports the engines' server
 * data-access.
 */
export interface DerivedDaily {
  oil: number | null;
  water: number | null;
  /** Meter-derived gas (MCF), or null/absent when no meter covers the well. */
  gas?: number | null;
}

/**
 * Overlay measurement-derived oil / water / gas onto the raw production rows.
 * Where an engine produced a value for a (well, date) - a tank covers it for
 * oil/water, a meter for gas - it replaces the hand-entered figure; every other
 * field and every non-covered (well, date) is left untouched. Non-destructive
 * per product: a well with only an oil tank keeps its entered water/gas, etc.
 */
export function overlayDerivedProduction(
  rows: CompanyProductionRow[],
  derived: Map<string, Map<string, DerivedDaily>>
): CompanyProductionRow[] {
  return rows.map((r) => {
    const d = derived.get(r.wellId)?.get(r.date);
    if (!d) return r;
    return {
      ...r,
      oilProduction: d.oil ?? r.oilProduction,
      saltWater: d.water ?? r.saltWater,
      gasProduction: d.gas ?? r.gasProduction,
    };
  });
}

/**
 * Merge the tank engine's per-well/day oil-water map with the meter engine's
 * gas map into one `DerivedDaily` map for the overlay. A (well, date) present in
 * either engine gets an entry; products the other engine didn't cover stay null.
 */
export function mergeDerivedProduction(
  tank: Map<string, Map<string, { oil: number | null; water: number | null }>>,
  gas: Map<string, Map<string, number>>
): Map<string, Map<string, DerivedDaily>> {
  const out = new Map<string, Map<string, DerivedDaily>>();
  const slot = (well: string, date: string): DerivedDaily => {
    let byDate = out.get(well);
    if (!byDate) out.set(well, (byDate = new Map()));
    let d = byDate.get(date);
    if (!d) byDate.set(date, (d = { oil: null, water: null, gas: null }));
    return d;
  };
  for (const [well, byDate] of tank) {
    for (const [date, v] of byDate) {
      const d = slot(well, date);
      d.oil = v.oil;
      d.water = v.water;
    }
  }
  for (const [well, byDate] of gas) {
    for (const [date, mcf] of byDate) {
      slot(well, date).gas = mcf;
    }
  }
  return out;
}

// --- date helpers ----------------------------------------------------------

/** Ascending compare for ISO `YYYY-MM-DD` strings (lexicographic == chronological). */
function byDateAsc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Shift an ISO date by whole days (UTC), returning `YYYY-MM-DD`. */
/** Whole days between two ISO `YYYY-MM-DD` dates (a − b). */
export function daysBetween(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000
  );
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// --- daily company totals --------------------------------------------------

export interface DailyTotals {
  date: string;
  oil: number;
  oilStock: number;
  oilSales: number;
  water: number;
  gas: number;
  /**
   * Which streams anything was MEASURED for on this date.
   *
   * A row exists for the union of a well's three series, so a day the gas meter
   * was read and no tank gauged carries oil 0 - and a variance column comparing
   * against it reports the oil down 100%. Oil, gas and saltwater all land in
   * this trap; saltwater worst, since its measurements are the lumpiest.
   */
  measured: { oil: boolean; gas: boolean; water: boolean };
}

/** Sum every metric across all wells, one row per date, oldest first. */
export function companyDailyTotals(rows: CompanyProductionRow[]): DailyTotals[] {
  const byDate = new Map<string, DailyTotals>();
  for (const r of rows) {
    const d =
      byDate.get(r.date) ??
      {
        date: r.date,
        oil: 0,
        oilStock: 0,
        oilSales: 0,
        water: 0,
        gas: 0,
        measured: { oil: false, gas: false, water: false },
      };
    d.oil += r.oilProduction;
    d.oilStock += r.oilStock;
    d.oilSales += r.oilSales;
    d.water += r.saltWater;
    d.gas += r.gasProduction;
    const m = r.measured ?? { oil: true, gas: true, water: true };
    d.measured.oil ||= m.oil;
    d.measured.gas ||= m.gas;
    d.measured.water ||= m.water;
    byDate.set(r.date, d);
  }
  return [...byDate.values()].sort((a, b) => byDateAsc(a.date, b.date));
}

// --- per-facility (well) totals --------------------------------------------

export interface FacilityTotals {
  wellId: string;
  wellName: string;
  oil: number;
  gas: number;
  water: number;
  oilSales: number;
}

/** Period totals per well (a facility proxy), alphabetical by well name. */
export function facilityPeriodTotals(
  rows: CompanyProductionRow[]
): FacilityTotals[] {
  const byWell = new Map<string, FacilityTotals>();
  for (const r of rows) {
    const f =
      byWell.get(r.wellId) ??
      {
        wellId: r.wellId,
        wellName: r.wellName,
        oil: 0,
        gas: 0,
        water: 0,
        oilSales: 0,
      };
    f.oil += r.oilProduction;
    f.gas += r.gasProduction;
    f.water += r.saltWater;
    f.oilSales += r.oilSales;
    byWell.set(r.wellId, f);
  }
  return [...byWell.values()].sort((a, b) =>
    a.wellName.localeCompare(b.wellName)
  );
}

export interface FacilityDaily {
  wellId: string;
  wellName: string;
  date: string;
  oil: number;
  oilSales: number;
  water: number;
  gas: number;
  /** Which streams this well/date carries a reading for. See {@link DailyTotals}. */
  measured: { oil: boolean; gas: boolean; water: boolean };
}

/** Per-well, per-day totals - well name, then date. */
export function facilityDailyTotals(
  rows: CompanyProductionRow[]
): FacilityDaily[] {
  const byKey = new Map<string, FacilityDaily>();
  for (const r of rows) {
    const key = `${r.wellId}|${r.date}`;
    const f =
      byKey.get(key) ??
      {
        wellId: r.wellId,
        wellName: r.wellName,
        date: r.date,
        oil: 0,
        oilSales: 0,
        water: 0,
        gas: 0,
        measured: { oil: false, gas: false, water: false },
      };
    f.oil += r.oilProduction;
    f.oilSales += r.oilSales;
    f.water += r.saltWater;
    f.gas += r.gasProduction;
    const m = r.measured ?? { oil: true, gas: true, water: true };
    f.measured.oil ||= m.oil;
    f.measured.gas ||= m.gas;
    f.measured.water ||= m.water;
    byKey.set(key, f);
  }
  return [...byKey.values()].sort(
    (a, b) => a.wellName.localeCompare(b.wellName) || byDateAsc(a.date, b.date)
  );
}

// --- windowed variance -----------------------------------------------------

/**
 * Percent change between the latest point in a date-sorted series and the point
 * `windowDays` earlier (the most recent reading on or before that target date).
 * Returns null when there is no comparable prior point or the prior value is 0
 * (an undefined ratio), so callers render " - " rather than Infinity/NaN.
 */
export function pctChange(
  series: { date: string; value: number }[],
  windowDays: number
): number | null {
  if (series.length < 2) return null;
  const sorted = [...series].sort((a, b) => byDateAsc(a.date, b.date));
  const latest = sorted[sorted.length - 1];
  const target = addDays(latest.date, -windowDays);
  let prior: { date: string; value: number } | null = null;
  for (const p of sorted) {
    if (p.date === latest.date) break;
    if (p.date <= target) prior = p;
  }
  if (!prior || prior.value === 0) return null;
  return ((latest.value - prior.value) / Math.abs(prior.value)) * 100;
}

/**
 * One scope's variance row: every commodity × every range as its own column, so
 * the reader compares oil against gas across 1/7/30 days on ONE line instead of
 * hunting four rows per scope (client spec, 2026-07-26).
 *
 * Oil stock is deliberately absent: it is an inventory level, not production, and
 * its "% change" moves with hauling schedules rather than with how the wells are
 * performing - which made it the most misread column on the report.
 */
export interface VarianceRow {
  /** "Company", a lease name, or a well name. */
  scope: string;
  /** Which level this row reports, for grouping and for the Excel tabs. */
  level: VarianceLevel;
  oil1: number | null;
  oil7: number | null;
  oil30: number | null;
  gas1: number | null;
  gas7: number | null;
  gas30: number | null;
  water1: number | null;
  water7: number | null;
  water30: number | null;
}

/** The three levels a variance row can report, in report order. */
export type VarianceLevel = "company" | "lease" | "well";

const VARIANCE_METRICS = [
  { key: "oil", pick: (d: DailyTotals) => d.oil, seen: (d: DailyTotals) => d.measured.oil },
  { key: "gas", pick: (d: DailyTotals) => d.gas, seen: (d: DailyTotals) => d.measured.gas },
  {
    key: "water",
    pick: (d: DailyTotals) => d.water,
    seen: (d: DailyTotals) => d.measured.water,
  },
] as const;

const VARIANCE_RANGES = [1, 7, 30] as const;

/** Every commodity × range change for one scope's rows. */
function varianceFor(
  scope: string,
  level: VarianceLevel,
  rows: CompanyProductionRow[]
): VarianceRow {
  const daily = companyDailyTotals(rows);
  const out = { scope, level } as VarianceRow;
  for (const m of VARIANCE_METRICS) {
    // Measured days only. Comparing today's oil against a day the tanks were
    // not gauged is a comparison with a blank, and it prints as a collapse.
    const series = daily
      .filter((d) => m.seen(d))
      .map((d) => ({ date: d.date, value: m.pick(d) }));
    for (const days of VARIANCE_RANGES) {
      // e.g. `oil7` - the key the column spec reads.
      (out as unknown as Record<string, number | null>)[`${m.key}${days}`] =
        pctChange(series, days);
    }
  }
  return out;
}

/** Group rows by well, preserving first-seen name, alphabetical. */
function groupByWell(
  rows: CompanyProductionRow[]
): { name: string; rows: CompanyProductionRow[] }[] {
  const byWell = new Map<string, { name: string; rows: CompanyProductionRow[] }>();
  for (const r of rows) {
    const g = byWell.get(r.wellId) ?? { name: r.wellName, rows: [] };
    g.rows.push(r);
    byWell.set(r.wellId, g);
  }
  return [...byWell.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Group rows by lease name, using the supplied well→lease map. */
function groupByLease(
  rows: CompanyProductionRow[],
  leaseByWell: Record<string, string>
): { name: string; rows: CompanyProductionRow[] }[] {
  const byLease = new Map<string, CompanyProductionRow[]>();
  for (const r of rows) {
    const name = leaseByWell[r.wellId];
    if (!name) continue; // unassigned wells appear at the well level only
    const list = byLease.get(name) ?? [];
    list.push(r);
    byLease.set(name, list);
  }
  return [...byLease.entries()]
    .map(([name, leaseRows]) => ({ name, rows: leaseRows }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 1-/7-/30-day % change for oil, gas and water, from the top down: the company,
 * then each lease, then each well. Reading order matches how an operator
 * escalates - company moved, which lease, which well.
 *
 * `leaseByWell` is optional; without it the lease level is simply absent (the
 * report still reads company → well) rather than inventing a grouping.
 */
export function productionVariance(
  rows: CompanyProductionRow[],
  leaseByWell: Record<string, string> = {}
): VarianceRow[] {
  if (rows.length === 0) return [];
  return [
    varianceFor("Company", "company", rows),
    ...groupByLease(rows, leaseByWell).map((g) =>
      varianceFor(g.name, "lease", g.rows)
    ),
    ...groupByWell(rows).map((g) => varianceFor(g.name, "well", g.rows)),
  ];
}

// --- exception scan --------------------------------------------------------

export interface ExceptionRow {
  wellId: string;
  wellName: string;
  date: string;
  metric: string;
  /** The moving-average baseline over `baselineDays`. */
  avg30: number;
  /** The recent average the baseline is compared against. */
  avg3: number;
  variancePct: number;
  comment: string;
  /** Length of the baseline window in days, so the report can name it. */
  baselineDays: number;
  /**
   * What this row IS.
   *
   * - `variance` - the stream was measured recently and the measurements are off
   *   the baseline. `avg3` is a measured average.
   * - `stale` - the stream was NOT measured in the recent window at all. There is
   *   no rate to compare; `avg3` is meaningless and `variancePct` is 0.
   *
   * These were one row type, and a well nobody had gauged for five days came out
   * as "-100%, at zero" - indistinguishable from a well that was shut in. It is
   * the difference between sending a pumper out and asking why he stopped
   * writing gauges down.
   */
  kind: "variance" | "stale";
  /** `stale` only: the last date this stream WAS measured, and how long ago. */
  lastMeasured?: string;
  daysSinceMeasured?: number;
}

export interface ExceptionScanOptions {
  /** Divergence that constitutes an exception (default 20%). */
  thresholdPct?: number;
  /** Days in the moving-average baseline (default 30). */
  baselineDays?: number;
  /** Days of recent production compared against the baseline (default 3). */
  recentDays?: number;
  /**
   * The date to measure staleness against (ISO). Passed in rather than read off
   * the clock so the scan is deterministic; defaults to the newest row, which
   * makes a whole-fleet gap invisible - the caller that knows today should say
   * so.
   */
  today?: string;
}

function mean(values: number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Flag wells whose recent 3-day average oil production diverges from their
 * 30-day baseline by more than `thresholdPct` percent - management-by-exception.
 * A well with no 30-day baseline (or a zero baseline) is skipped, since the
 * variance would be undefined. Sorted most-depressed first.
 */
export function exceptionReport(
  rows: CompanyProductionRow[],
  opts: ExceptionScanOptions = {}
): ExceptionRow[] {
  const {
    thresholdPct = 20,
    baselineDays = 30,
    recentDays = 3,
    today = rows.length > 0 ? rows[rows.length - 1].date : null,
  } = opts;
  const out: ExceptionRow[] = [];
  for (const g of groupByWell(rows)) {
    const daily = companyDailyTotals(g.rows);
    if (daily.length === 0) continue;

    /*
     * MEASURED days only. A row exists for every date ANY of this well's three
     * streams covers, so a day the gas meter was read and the tank was not
     * carries oil 0 - and averaging that as production is how a gauge gap
     * became a shut-in well.
     */
    const measuredDates = new Set(
      g.rows.filter((r) => r.measured?.oil ?? true).map((r) => r.date)
    );
    const gauged = daily.filter((d) => measuredDates.has(d.date));
    if (gauged.length === 0) continue;

    const last = gauged[gauged.length - 1];
    const recent = gauged.slice(-recentDays);
    const avg30 = mean(gauged.slice(-baselineDays).map((d) => d.oil));
    // No baseline means no band to be outside of, not a 100% collapse.
    if (avg30 === 0) continue;

    /*
     * Nothing gauged in the recent window: report the SILENCE, not a rate. The
     * comparison would be against days this well was never measured on.
     */
    const asOf = today ?? daily[daily.length - 1].date;
    const age = daysBetween(asOf, last.date);
    if (age >= recentDays) {
      out.push({
        wellId: g.rows[0].wellId,
        wellName: g.name,
        date: last.date,
        metric: "Oil",
        avg30,
        avg3: 0,
        variancePct: 0,
        comment: `No oil gauge in ${age} days; last measured ${last.date}`,
        baselineDays,
        kind: "stale",
        lastMeasured: last.date,
        daysSinceMeasured: age,
      });
      continue;
    }

    const avg3 = mean(recent.map((d) => d.oil));
    const variancePct = ((avg3 - avg30) / avg30) * 100;
    if (Math.abs(variancePct) < thresholdPct) continue;
    out.push({
      wellId: g.rows[0].wellId,
      wellName: g.name,
      date: last.date,
      metric: "Oil",
      avg30,
      avg3,
      variancePct,
      comment:
        variancePct < 0
          ? "Oil production below expected levels"
          : "Oil production above expected levels",
      baselineDays,
      kind: "variance",
    });
  }
  return out.sort((a, b) => a.variancePct - b.variancePct);
}
