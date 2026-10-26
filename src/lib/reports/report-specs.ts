/**
 * The catalog of derivable production reports (GBC-3): id, display name, the
 * shared {@link ColumnSpec} table definition, and the pure `build` that turns
 * company production rows into that table's rows.
 *
 * One catalog drives all three consumers - the CSV/XLSX/PDF export route, the
 * View modal, and the registry modules - so a report's columns and math can
 * never drift between what you see and what you download. Pure and isomorphic
 * (no React, no Node): safe to import on the server or the client.
 */

import type { ColumnSpec } from "@/lib/export/columns";
import type { CompanyProductionRow } from "@/lib/reports/types";
import {
  companyDailyTotals,
  facilityPeriodTotals,
  facilityDailyTotals,
  productionVariance,
  exceptionReport,
} from "@/lib/reports/derive";
import {
  latestCompletePeriod,
  type ProductionPeriodKind,
} from "@/lib/reports/periods";

export type ProductionReportId =
  | "company-daily-summary"
  | "weekly-production"
  | "production-overview"
  | "quarterly-production"
  | "annual-production"
  | "production-overview-daily"
  | "production-variance"
  | "exception-report";

/**
 * Trailing window every derivable report covers, in days.
 *
 * These reports used to summarize ALL history, which made a period total mean
 * something different every month and made two runs incomparable. Every
 * windowed report now states its window and covers the last 30 days (client spec,
 * 2026-07-26); `windowFor` is exported so the document header and the row
 * subtitle quote the same range.
 */
export const REPORT_WINDOW_DAYS = 30;

/** `[start, end]` ISO dates for a trailing window ending at `end` (inclusive). */
export function windowFor(
  end: string,
  days = REPORT_WINDOW_DAYS
): { start: string; end: string; label: string } {
  const d = new Date(`${end}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  const start = d.toISOString().slice(0, 10);
  return { start, end, label: `${start} to ${end} (${days} days)` };
}

/** Rows inside a trailing window, for the windowed reports. */
export function withinWindow(
  rows: CompanyProductionRow[],
  end: string,
  days = REPORT_WINDOW_DAYS
): CompanyProductionRow[] {
  const { start } = windowFor(end, days);
  return rows.filter((r) => r.date >= start && r.date <= end);
}

export interface ProductionReport<T> {
  id: ProductionReportId;
  /** Display + document title. */
  name: string;
  /** Export filename stem (before date + extension). */
  filenameBase: string;
  columns: ColumnSpec<T>[];
  /**
   * Turn company production rows into this report's rows. `ctx` carries the
   * as-of date (so windowing never reads the wall clock) and the well→lease map
   * the multi-level reports need.
   */
  build: (rows: CompanyProductionRow[], ctx?: ReportBuildContext) => T[];
  /** True when the report covers a trailing window rather than all history. */
  windowed?: boolean;
  /**
   * Set when the report covers one calendar period the reader picks (Weekly /
   * Monthly / Quarterly / Annual Production). `build` reads `ctx.period`.
   */
  period?: ProductionPeriodKind;
  /**
   * True when the report can be narrowed to one lease and/or one well (see
   * `@/lib/reports/well-scope`). The caller reads only those wells' production.
   */
  wellScoped?: boolean;
  /** Landscape PDF (wide column sets). */
  landscape?: boolean;
}

/** Context for building a report: the as-of date plus grouping maps. */
export interface ReportBuildContext {
  /** Last day the report covers, ISO. Defaults to the newest row's date. */
  asOf?: string;
  /** well id → lease name, for the reports that report a lease level. */
  leaseByWell?: Record<string, string>;
  /** Trailing window length; defaults to {@link REPORT_WINDOW_DAYS}. */
  windowDays?: number;
  /**
   * The calendar period a period report covers, inclusive ISO bounds. Absent,
   * it is the latest one complete as of the day after `asOf`.
   */
  period?: { start: string; end: string };
}

/** The report's effective as-of date: the caller's, else the latest row. */
export function asOfDate(
  rows: CompanyProductionRow[],
  ctx?: ReportBuildContext
): string {
  if (ctx?.asOf) return ctx.asOf;
  return rows.reduce((max, r) => (r.date > max ? r.date : max), "");
}

/** Round to one decimal for display without dragging float noise into cells. */
const r1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * A volume cell that goes BLANK when the stream was not measured that day.
 *
 * A daily row exists for the union of the three streams, so a date the gas meter
 * was read and no tank gauged carries oil 0 - and "0.0" in the oil column reads
 * as a well that made nothing. The Exception Report already blanks its cells for
 * exactly this reason; these tables printed the zero.
 */
const measuredCell =
  <T extends { measured?: { oil: boolean; gas: boolean; water: boolean } }>(
    stream: "oil" | "gas" | "water",
    value: (row: T) => number
  ) =>
  (row: T): number | null =>
    (row.measured?.[stream] ?? true) ? r1(value(row)) : null;

/** A signed one-decimal percentage, or null (renders " - "). */
const pct = (n: number | null): number | null => (n == null ? null : r1(n));

const companyDailySummary: ProductionReport<
  ReturnType<typeof companyDailyTotals>[number]
> = {
  id: "company-daily-summary",
  name: "Daily Production",
  filenameBase: "company-daily-summary",
  wellScoped: true,
  columns: [
    { header: "Date", value: (r) => r.date, width: 14 },
    { header: "Oil (bbl)", value: measuredCell("oil", (r) => r.oil), numeric: true },
    { header: "Oil Stock (bbl)", value: (r) => r1(r.oilStock), numeric: true },
    { header: "Oil Sales (bbl)", value: (r) => r1(r.oilSales), numeric: true },
    { header: "Water (bbl)", value: measuredCell("water", (r) => r.water), numeric: true },
    { header: "Gas (mcf)", value: measuredCell("gas", (r) => r.gas), numeric: true },
  ],
  build: companyDailyTotals,
};

/** The day after an ISO date. */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** A period report's row: one well's totals, or (`isTotal`) the company's. */
type PeriodRow = ReturnType<typeof facilityPeriodTotals>[number] & {
  isTotal?: true;
};

/**
 * Per-well totals for one calendar period: Weekly, Monthly, Quarterly and
 * Annual Production are this one table over a different span.
 *
 * The company total leads the table as its first row (`isTotal`), so the
 * screen, the PDF, the workbook and the CSV all carry the same figure. Summed
 * from the unrounded well totals, so it can differ from the sum of the
 * displayed cells by a tenth.
 */
function periodProduction(
  id: ProductionReportId,
  name: string,
  filenameBase: string,
  period: ProductionPeriodKind
): ProductionReport<PeriodRow> {
  return {
    id,
    name,
    filenameBase,
    period,
    wellScoped: true,
    columns: [
      { header: "Well", value: (r) => r.wellName, width: 24 },
      { header: "Oil (bbl)", value: (r) => r1(r.oil), numeric: true },
      { header: "Gas (mcf)", value: (r) => r1(r.gas), numeric: true },
      { header: "Water (bbl)", value: (r) => r1(r.water), numeric: true },
    ],
    build: (rows, ctx) => {
      const { start, end } =
        ctx?.period ?? latestCompletePeriod(period, nextDay(asOfDate(rows, ctx)));
      const wells = facilityPeriodTotals(
        rows.filter((r) => r.date >= start && r.date <= end)
      );
      if (wells.length === 0) return [];
      const total: PeriodRow = {
        wellId: "",
        wellName: "Total",
        oil: 0,
        gas: 0,
        water: 0,
        oilSales: 0,
        isTotal: true,
      };
      for (const w of wells) {
        total.oil += w.oil;
        total.gas += w.gas;
        total.water += w.water;
        total.oilSales += w.oilSales;
      }
      return [total, ...wells];
    },
  };
}

const weeklyProduction = periodProduction(
  "weekly-production",
  "Weekly Production",
  "weekly-production",
  "week"
);
// Still `production-overview`: saved schedules store this id.
const monthlyProduction = periodProduction(
  "production-overview",
  "Monthly Production",
  "monthly-production",
  "month"
);
const quarterlyProduction = periodProduction(
  "quarterly-production",
  "Quarterly Production",
  "quarterly-production",
  "quarter"
);
const annualProduction = periodProduction(
  "annual-production",
  "Annual Production",
  "annual-production",
  "year"
);

const productionOverviewDaily: ProductionReport<
  ReturnType<typeof facilityDailyTotals>[number]
> = {
  id: "production-overview-daily",
  name: "Production Overview (Daily)",
  filenameBase: "production-overview-daily",
  windowed: true,
  columns: [
    { header: "Well", value: (r) => r.wellName, width: 24 },
    { header: "Date", value: (r) => r.date, width: 14 },
    { header: "Oil (bbl)", value: measuredCell("oil", (r) => r.oil), numeric: true },
    { header: "Oil Sales (bbl)", value: (r) => r1(r.oilSales), numeric: true },
    { header: "Water (bbl)", value: measuredCell("water", (r) => r.water), numeric: true },
    { header: "Gas (mcf)", value: measuredCell("gas", (r) => r.gas), numeric: true },
  ],
  build: (rows, ctx) =>
    facilityDailyTotals(
      withinWindow(rows, asOfDate(rows, ctx), ctx?.windowDays)
    ),
};

/**
 * Production Variance: one row per scope, one column per commodity × range, read
 * top-down (company → lease → well). Landscape, because nine numeric columns plus
 * a name do not fit a portrait page without shrinking the type past readable.
 */
const productionVarianceReport: ProductionReport<
  ReturnType<typeof productionVariance>[number]
> = {
  id: "production-variance",
  name: "Production Variance",
  filenameBase: "production-variance",
  landscape: true,
  columns: [
    { header: "Scope", value: (r) => r.scope, width: 30 },
    { header: "Level", value: (r) => r.level, width: 10 },
    { header: "Oil 1-Day %", value: (r) => pct(r.oil1), numeric: true },
    { header: "Oil 7-Day %", value: (r) => pct(r.oil7), numeric: true },
    { header: "Oil 30-Day %", value: (r) => pct(r.oil30), numeric: true },
    { header: "Gas 1-Day %", value: (r) => pct(r.gas1), numeric: true },
    { header: "Gas 7-Day %", value: (r) => pct(r.gas7), numeric: true },
    { header: "Gas 30-Day %", value: (r) => pct(r.gas30), numeric: true },
    { header: "Water 1-Day %", value: (r) => pct(r.water1), numeric: true },
    { header: "Water 7-Day %", value: (r) => pct(r.water7), numeric: true },
    { header: "Water 30-Day %", value: (r) => pct(r.water30), numeric: true },
  ],
  build: (rows, ctx) => productionVariance(rows, ctx?.leaseByWell ?? {}),
};

const exceptionReportSpec: ProductionReport<
  ReturnType<typeof exceptionReport>[number]
> = {
  id: "exception-report",
  name: "Exception Report",
  filenameBase: "exception-report",
  columns: [
    { header: "Date", value: (r) => r.date, width: 14 },
    { header: "Facility", value: (r) => r.wellName, width: 22 },
    { header: "Metric", value: (r) => r.metric, width: 10 },
    { header: "Baseline Avg", value: (r) => r1(r.avg30), numeric: true },
    // Blank, not 0, on a row that exists BECAUSE the stream was not measured -     // a zero there reads as "it produced nothing", which is the confusion this
    // row kind exists to end.
    {
      header: "Recent Avg (3d)",
      value: (r) => (r.kind === "stale" ? "" : r1(r.avg3)),
      numeric: true,
    },
    {
      header: "Variance %",
      value: (r) => (r.kind === "stale" ? "" : r1(r.variancePct)),
      numeric: true,
    },
    { header: "Comment", value: (r) => r.comment, width: 30 },
  ],
  windowed: true,
  // The window IS the baseline: the 30-day report compares the last 3 days
  // against a 30-day moving average, the 7-day report against a 7-day one.
  build: (rows, ctx) => {
    const days = ctx?.windowDays ?? REPORT_WINDOW_DAYS;
    return exceptionReport(withinWindow(rows, asOfDate(rows, ctx), days), {
      baselineDays: days,
    });
  },
};

/**
 * Every report, erased to `ProductionReport<unknown>` for a heterogeneous list.
 * The `as` mirrors the codebase's `SheetSpec<unknown>` cast - `columns` and
 * `build` still share the same concrete T inside each entry, so a consumer that
 * does `columnsToCsv(r.columns, r.build(rows))` stays type-safe per report.
 */
export const PRODUCTION_REPORTS: ProductionReport<unknown>[] = [
  companyDailySummary,
  weeklyProduction,
  monthlyProduction,
  quarterlyProduction,
  annualProduction,
  productionOverviewDaily,
  productionVarianceReport,
  exceptionReportSpec,
] as ProductionReport<unknown>[];

export const PRODUCTION_REPORTS_BY_ID: Record<
  ProductionReportId,
  ProductionReport<unknown>
> = Object.fromEntries(PRODUCTION_REPORTS.map((r) => [r.id, r])) as Record<
  ProductionReportId,
  ProductionReport<unknown>
>;
