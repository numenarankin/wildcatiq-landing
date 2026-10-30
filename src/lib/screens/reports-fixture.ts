/**
 * The reports hub on fixture data, built on the shared operator
 * (`./operator`) and its generated production (`dashboardFixture()`): the
 * same fourteen wells, the same daily readings, the same run tickets and the
 * same pumper comments the dashboard reads, so September here is September on
 * the dashboard chart and Roy Corbett 4's shut-in is the same six days.
 *
 * Each document is rendered to markdown by the app's own builders, the way
 * `src/lib/reports/hub/sources.ts` does: `digestToMarkdown` for the digests,
 * `sheetsToMarkdown` over the report's own `ColumnSpec`s for the tables, and
 * `pumperReportToMarkdown` for the Pumper Report. What the fixture supplies is
 * what the loaders would have read from Supabase: the rows.
 */
import type {
  CompanyDigest,
  DigestComment,
  DigestDailyPoint,
  DigestLeaseSection,
  DigestPriceMove,
  DigestWellRow,
  KpiDelta,
  RevenueBasis,
} from "@/lib/reports/digest/types";
import { digestToMarkdown } from "@/lib/reports/digest/markdown";
import { CHART_TRAILING_DAYS } from "@/lib/reports/digest/build";
import { digestWindow, shiftDays, type DigestPeriod } from "@/lib/reports/digest/period";
import { scanExceptions } from "@/lib/reports/digest/exceptions";
import { narrateMarkdown } from "@/lib/reports/narration";
import type { NavGroup } from "@/components/reports/viewer/report-nav";
import { scheduleRowsFromHub, cellKey, type ScheduleRow } from "@/lib/reports/schedule/catalog";
import type { ReportSchedule } from "@/lib/reports/schedule/actions";
import type { ExportFormat } from "@/lib/export/mime";
import type { ColumnSpec } from "@/lib/export/columns";
import type { ExportSheet } from "@/lib/export/workbook-export";
import { sheetsToMarkdown, withoutSubtitle } from "@/lib/export/markdown";
import type { CompanyProductionRow } from "@/lib/reports/types";
import {
  PRODUCTION_REPORTS,
  PRODUCTION_REPORTS_BY_ID,
  REPORT_WINDOW_DAYS,
  asOfDate,
  windowFor,
  type ProductionReportId,
} from "@/lib/reports/report-specs";
import { periodOptions, periodSubtitle, resolvePeriod, type ProductionPeriodKind } from "@/lib/reports/periods";
import { resolveWindow } from "@/lib/reports/windows";
import { TANKS_CALLED_IN_COLUMNS } from "@/lib/reports/tanks/export";
import { summarizeTanksCalledIn } from "@/lib/reports/tanks/tanks-called-in";
import { buildPumperCoverage } from "@/lib/reports/pumper/coverage";
import { pumperReportToMarkdown } from "@/lib/reports/pumper/markdown";
import type { PumperFacility, PumperLog } from "@/lib/reports/pumper/types";
import type { ReportPicker } from "@/lib/reports/hub/params";
import { dashboardFixture, PUMPER_COMMENTS } from "./dashboard-fixture";
import { EVENTS, FIXTURE_TODAY, LEASES, OPERATOR, PRICES, PURCHASERS, SWD, TANKS, WELLS, leaseOf } from "./operator";

export const DIGEST_ID = "company-digest-monthly";
export const DAILY_DIGEST_ID = "company-digest-daily";

/** Realized prices on the settlements are the shared operator's; the benchmark and prior month live here. */
const OIL_PRICE = PRICES.oilPerBbl;
const GAS_PRICE = PRICES.gasPerMcf;
const PRIOR_OIL_PRICE = 61.4;
const PRIOR_GAS_PRICE = 2.28;
const BENCHMARK_OIL = 63.85;
const BENCHMARK_GAS = 2.74;

/** The 2am compile on FIXTURE_TODAY builds the daily digest for the day before. */
const DAILY_ANCHOR = shiftDays(FIXTURE_TODAY, -1);
/** The monthly digest is the Form PR month. */
const MONTHLY_ANCHOR = `${EVENTS.reportMonth}-30`;

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const inRange = (date: string, start: string, end: string) => date >= start && date <= end;

/** A lease's battery, named the way the app names a lease's battery. */
const batteryName = (leaseName: string) => `${leaseName} Battery`;

/**
 * Every well's daily readings as the report loaders read them
 * (`getCompanyProduction`): production from the daily record, and each
 * lease's tank stock and hauled loads shared to its wells by that day's oil.
 */
export function productionRows(): CompanyProductionRow[] {
  const fx = dashboardFixture();
  const out: CompanyProductionRow[] = [];
  for (const lease of LEASES) {
    const idx = WELLS.map((w, wi) => (w.lease === lease.id ? wi : -1)).filter((i) => i >= 0);
    const stock = fx.leaseStock[lease.id];
    stock.forEach((day, d) => {
      const leaseOil = idx.reduce((a, wi) => a + fx.dailyByWell[wi].daily[d].oilBbl, 0);
      const sold = fx.runTickets
        .filter((t) => t.leaseId === lease.id && t.date === day.date)
        .reduce((a, t) => a + t.bbl, 0);
      for (const wi of idx) {
        const p = fx.dailyByWell[wi].daily[d];
        const share = leaseOil > 0 ? p.oilBbl / leaseOil : 1 / idx.length;
        out.push({
          wellId: WELLS[wi].id,
          wellName: WELLS[wi].name,
          date: p.date,
          oilProduction: p.oilBbl,
          oilStock: day.stock * share,
          oilSales: sold * share,
          gasProduction: p.gasMcf,
          saltWater: p.water,
          measured: p.measured,
        });
      }
    });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.wellName.localeCompare(b.wellName)));
}

/** The pumpers' comments as the digest's comment loader returns them. */
function digestComments(start: string, end: string): DigestComment[] {
  return PUMPER_COMMENTS.filter((c) => inRange(c.date, start, end)).map((c) => ({
    facilityType: c.facilityType,
    facilityName: c.facilityName,
    date: c.date,
    author: c.author,
    body: c.body,
  }));
}

function delta(value: number, prior: number, days: number, priorDays: number): KpiDelta {
  const rate = value / days;
  const priorRate = prior / priorDays;
  return {
    value,
    prior,
    changePct: priorRate > 0 ? r1(((rate - priorRate) / priorRate) * 100) : null,
    measuredDays: days,
    priorMeasuredDays: priorDays,
    windowDays: days,
  };
}

const spanDays = (start: string, end: string) =>
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;

const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const n0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const n1 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * One Company Digest from the shared rows, in the shape the 2am compile
 * stores: daily and weekly value each day's barrels at the realized price,
 * the monthly uses the run tickets the statements settled.
 */
function buildDigest(period: DigestPeriod, anchor: string): CompanyDigest {
  const fx = dashboardFixture();
  const rows = productionRows();
  const w = digestWindow(period, anchor);
  const basis: RevenueBasis = period === "monthly" ? "settled" : "estimated";
  const trailingStart = shiftDays(w.end, -(CHART_TRAILING_DAYS[period] - 1));
  const days = spanDays(w.start, w.end);
  const priorDays = spanDays(w.priorStart, w.priorEnd);

  const sum = (wellId: string, start: string, end: string, f: (r: CompanyProductionRow) => number) =>
    rows.filter((r) => r.wellId === wellId && inRange(r.date, start, end)).reduce((a, r) => a + f(r), 0);
  const ticketsFor = (leaseId: string, start: string, end: string) =>
    fx.runTickets.filter((t) => t.leaseId === leaseId && inRange(t.date, start, end)).reduce((a, t) => a + t.bbl, 0);
  const series = (wellIds: string[], f: (r: CompanyProductionRow) => number): DigestDailyPoint[] => {
    const byDate = new Map<string, number>();
    for (const r of rows) {
      if (!wellIds.includes(r.wellId) || !inRange(r.date, trailingStart, w.end)) continue;
      byDate.set(r.date, (byDate.get(r.date) ?? 0) + f(r));
    }
    return [...byDate.entries()].map(([date, value]) => ({ date, value: r1(value) }));
  };

  /** Revenue to the operator's interest for a lease over a window, on a basis. */
  const leaseRevenue = (leaseId: string, nri: number, start: string, end: string, b: RevenueBasis, oilPrice: number, gasPrice: number) => {
    const ids = WELLS.filter((x) => x.lease === leaseId).map((x) => x.id);
    const gas = ids.reduce((a, id) => a + sum(id, start, end, (r) => r.gasProduction), 0);
    const oil =
      b === "settled"
        ? ticketsFor(leaseId, start, end)
        : ids.reduce((a, id) => a + sum(id, start, end, (r) => r.oilProduction), 0);
    return r2(nri * (oil * oilPrice + gas * gasPrice));
  };

  const leases: DigestLeaseSection[] = LEASES.map((lease) => {
    const specs = WELLS.filter((x) => x.lease === lease.id);
    const ids = specs.map((x) => x.id);
    const oilSales = period === "monthly" ? r1(ticketsFor(lease.id, w.start, w.end)) : 0;
    const revenue = leaseRevenue(lease.id, lease.nri, w.start, w.end, basis, OIL_PRICE, GAS_PRICE);
    const wellOil = (id: string) => sum(id, w.start, w.end, (r) => r.oilProduction);
    const oil = r1(ids.reduce((a, id) => a + wellOil(id), 0));
    const wells: DigestWellRow[] = specs
      .map((s) => {
        const o = wellOil(s.id);
        const g = sum(s.id, w.start, w.end, (r) => r.gasProduction);
        const share = oil > 0 ? o / oil : 0;
        return {
          wellId: s.id,
          wellName: s.name,
          oil: r1(o),
          gas: r1(g),
          water: r1(sum(s.id, w.start, w.end, (r) => r.saltWater)),
          oilSales: r1(oilSales * share),
          revenue: basis === "settled" ? r2(revenue * share) : r2(lease.nri * (o * OIL_PRICE + g * GAS_PRICE)),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
    // The largest well absorbs the rounding residual, so the wells sum to the
    // lease to the cent and the tenth of a barrel, as the builder allocates them.
    const residual = (k: "oil" | "oilSales" | "revenue", total: number) => {
      wells[0][k] = r2(wells[0][k] + total - wells.reduce((a, x) => a + x[k], 0));
    };
    residual("oil", oil);
    residual("oilSales", oilSales);
    residual("revenue", revenue);
    return {
      name: lease.name,
      oil,
      gas: r1(wells.reduce((a, x) => a + x.gas, 0)),
      water: r1(wells.reduce((a, x) => a + x.water, 0)),
      oilSales,
      revenue,
      wells,
      daily: {
        oil: series(ids, (r) => r.oilProduction),
        gas: series(ids, (r) => r.gasProduction),
        water: series(ids, (r) => r.saltWater),
      },
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const all = WELLS.map((x) => x.id);
  const total = (k: "oil" | "gas" | "water" | "oilSales" | "revenue") => r2(leases.reduce((a, l) => a + l[k], 0));
  const prior = (f: (r: CompanyProductionRow) => number) => r1(all.reduce((a, id) => a + sum(id, w.priorStart, w.priorEnd, f), 0));
  const priorSales = r1(LEASES.reduce((a, l) => a + ticketsFor(l.id, w.priorStart, w.priorEnd), 0));
  const revenue = total("revenue");
  const priorRevenue = r2(
    LEASES.reduce(
      (a, l) =>
        a +
        leaseRevenue(l.id, l.nri, w.priorStart, w.priorEnd, basis, basis === "settled" ? PRIOR_OIL_PRICE : OIL_PRICE, basis === "settled" ? PRIOR_GAS_PRICE : GAS_PRICE),
      0
    )
  );
  const revenueEstimate =
    basis === "settled"
      ? r2(LEASES.reduce((a, l) => a + leaseRevenue(l.id, l.nri, w.start, w.end, "estimated", OIL_PRICE, GAS_PRICE), 0))
      : null;

  const batteryByWell = Object.fromEntries(WELLS.map((x) => [x.id, batteryName(leaseOf(x).name)]));
  const comments = period === "daily" ? digestComments(w.start, w.end) : [];
  const exceptions =
    period === "monthly"
      ? []
      : scanExceptions({
          rows: rows.filter((r) => r.date <= w.end),
          windowEnd: w.end,
          batteryByWell,
          window: w,
          comments: digestComments(w.start, w.end),
        });

  const oilSeries = series(all, (r) => r.oilProduction);
  const gasSeries = series(all, (r) => r.gasProduction);
  const nriBlend = (() => {
    const gross = LEASES.reduce((a, l) => a + leaseRevenue(l.id, 1, w.start, w.end, "estimated", OIL_PRICE, GAS_PRICE), 0);
    const net = LEASES.reduce((a, l) => a + leaseRevenue(l.id, l.nri, w.start, w.end, "estimated", OIL_PRICE, GAS_PRICE), 0);
    return gross > 0 ? net / gross : 0;
  })();

  const priceMoves: DigestPriceMove[] = [
    {
      product: "oil",
      average: OIL_PRICE,
      priorAverage: PRIOR_OIL_PRICE,
      benchmarkAverage: BENCHMARK_OIL,
      realizedVsBenchmarkPct: r1(((OIL_PRICE - BENCHMARK_OIL) / BENCHMARK_OIL) * 100),
    },
    {
      product: "gas",
      average: GAS_PRICE,
      priorAverage: PRIOR_GAS_PRICE,
      benchmarkAverage: BENCHMARK_GAS,
      realizedVsBenchmarkPct: r1(((GAS_PRICE - BENCHMARK_GAS) / BENCHMARK_GAS) * 100),
    },
  ];

  const oilKpi = delta(total("oil"), prior((r) => r.oilProduction), days, priorDays);
  const top = leases[0];
  const topShare = revenue > 0 ? Math.round((top.revenue / revenue) * 100) : 0;
  const move = (pct: number | null) =>
    pct == null ? "" : `${pct >= 0 ? "up" : "down"} ${n1.format(Math.abs(pct))}%`;
  const loads = fx.runTickets.filter((t) => inRange(t.date, w.start, w.end)).length;
  const soldLeases = new Set(fx.runTickets.filter((t) => inRange(t.date, w.start, w.end)).map((t) => t.leaseId)).size;
  const soldLeasesLabel = soldLeases === LEASES.length ? `the ${["", "one", "two", "three", "four", "five", "six"][soldLeases]} leases` : `${["no", "one", "two", "three", "four", "five", "six"][soldLeases]} of the ${["", "one", "two", "three", "four", "five", "six"][LEASES.length]} leases`;

  const summary =
    period === "monthly"
      ? `${OPERATOR.name} settled ${w.label} at a realized $${OIL_PRICE.toFixed(2)} per barrel against a $${BENCHMARK_OIL.toFixed(2)} WTI benchmark, with ${PURCHASERS.oil} running ${n0.format(total("oilSales"))} barrels on ${loads} loads across ${soldLeasesLabel}. Oil production averaged ${n1.format(total("oil") / days)} bbl/d, ${move(oilKpi.changePct)} on the prior month's daily rate. ${top.name} carried ${topShare}% of settled revenue, ${usd0.format(top.revenue)} of ${usd0.format(revenue)}.`
      : `${OPERATOR.name} produced ${n0.format(total("oil"))} bbl of oil and ${n0.format(total("gas"))} mcf of gas on ${w.label}, oil ${move(oilKpi.changePct)} on the day before. ${top.name} made ${topShare}% of the day's estimated revenue, ${usd0.format(top.revenue)} of ${usd0.format(revenue)}.`;

  return {
    period,
    window: w,
    kpis: {
      oil: oilKpi,
      gas: delta(total("gas"), prior((r) => r.gasProduction), days, priorDays),
      water: delta(total("water"), prior((r) => r.saltWater), days, priorDays),
      oilSales: delta(total("oilSales"), priorSales, days, priorDays),
      revenue: delta(revenue, priorRevenue, days, priorDays),
      revenueBasis: basis,
      revenueEstimate,
      revenueVariancePct: revenueEstimate ? r1(((revenue - revenueEstimate) / revenueEstimate) * 100) : null,
    },
    leases,
    unallocatedRevenue: 0,
    charts: {
      oil: oilSeries,
      gas: gasSeries,
      water: series(all, (r) => r.saltWater),
      revenue: oilSeries.map((p, i) => ({
        date: p.date,
        value: r2((p.value * OIL_PRICE + gasSeries[i].value * GAS_PRICE) * nriBlend),
      })),
    },
    exceptions,
    comments,
    // The app's model writes this from the comments; this is what it wrote.
    commentsSummary:
      comments.length > 0
        ? `${OPERATOR.pumper} gauged Smith T201 at ${EVENTS.smithGauge.feet} ft ${EVENTS.smithGauge.inches} in and reported the thief hatch leaking on Johnson A W1, with a new gasket on order. ${OPERATOR.ownerFirst} noted a dry polish rod on Smith 4 and asked for the stuffing box to be greased.`
        : "",
    priceMoves,
    prices: { oilPerBbl: OIL_PRICE, gasPerMcf: GAS_PRICE, measured: true },
    summary,
  };
}

export function reportsDigest(): CompanyDigest {
  return buildDigest("monthly", MONTHLY_ANCHOR);
}

export function reportsDailyDigest(): CompanyDigest {
  return buildDigest("daily", DAILY_ANCHOR);
}

/** Every report in the hub, in `listHubReports` order, as the nav and the schedule grid see it. */
export const HUB_REPORTS: { id: string; title: string; group: string }[] = [
  { id: DAILY_DIGEST_ID, title: "Daily Company Digest", group: "Company" },
  { id: "company-digest-weekly", title: "Weekly Company Digest", group: "Company" },
  { id: DIGEST_ID, title: "Monthly Company Digest", group: "Company" },
  ...PRODUCTION_REPORTS.map((r) => ({
    id: `production-${r.id}`,
    title: r.windowed ? `${r.name} (last ${REPORT_WINDOW_DAYS} days)` : r.name,
    group: "Production",
  })),
  { id: "tank-measurements", title: "Gauge History", group: "Tanks" },
  { id: "simplified-production", title: "Simplified Production", group: "Tanks" },
  { id: "battery-capacity", title: "Battery Capacity", group: "Tanks" },
  { id: "tanks-called-in", title: "Tanks Called In", group: "Tanks" },
  { id: "tank-audit", title: "Tank Measurement Audit", group: "Tanks" },
  { id: "transport-tickets", title: "Transport Tickets", group: "Tanks" },
  { id: "water-disposed-30d", title: "Water Disposed (last 30 days)", group: "Tanks" },
  { id: "water-disposed-7d", title: "Water Disposed (last 7 days)", group: "Tanks" },
  { id: "well-performance", title: "Well Test Report", group: "Wells" },
  { id: "gross-vs-net", title: "Gross vs Net Production", group: "Wells" },
  { id: "rrc-reconciliation", title: "RRC Monthly Reconciliation", group: "RRC" },
  { id: "rrc-well-detail", title: "RRC Monthly Well Detail", group: "RRC" },
  { id: "pumper-coverage", title: "Pumper Report", group: "Pumper" },
  ...WELLS.map((w) => ({ id: `production-history-${w.id}`, title: w.name, group: "Wells" })),
];

const HUB_GROUPS = ["Company", "Production", "Tanks", "Wells", "RRC", "Pumper"];

export function reportsNavGroups(): NavGroup[] {
  return HUB_GROUPS.map((group) => ({
    group,
    items: HUB_REPORTS.filter((r) => r.group === group).map((r) => ({ id: r.id, title: r.title })),
  })).filter((g) => g.items.length > 0);
}

export function reportsScheduleRows(): ScheduleRow[] {
  return scheduleRowsFromHub(HUB_REPORTS);
}

/** What Sky Resources has switched on: the digest daily and monthly, Daily Production daily, the variance weekly, at 8am Central. */
export function reportsSchedule(): ReportSchedule {
  return {
    sendHour: 8,
    timezone: "America/Chicago",
    cells: {
      [cellKey("company-digest", "daily")]: true,
      [cellKey("company-digest", "monthly")]: true,
      [cellKey("production-company-daily-summary", "daily")]: true,
      [cellKey("production-production-variance", "weekly")]: true,
    },
  };
}

export function reportsDownloadHrefs(period: DigestPeriod = "monthly"): Record<ExportFormat, string> {
  const basis = period === "monthly" ? "settled" : "estimated";
  const url = (format: ExportFormat) =>
    `/api/reports/company-digest/export?format=${format}&period=${period}&basis=${basis}`;
  return { pdf: url("pdf"), xlsx: url("xlsx"), csv: url("csv") };
}

/** A report document the hub renders: its markdown, the narration built from it, its pickers and downloads. */
export interface HubDocument {
  id: string;
  markdown: string;
  narration: string;
  pickers: ReportPicker[];
  downloadHrefs: Record<ExportFormat, string>;
  csvLabel: string;
}

function doc(id: string, full: string, pickers: ReportPicker[], exportBase: string, csvIsZip = false): HubDocument {
  // With pickers the page drops the subtitle line, which only restates them.
  const markdown = pickers.length > 0 ? withoutSubtitle(full) : full;
  const href = (format: ExportFormat) => `${exportBase}${exportBase.includes("?") ? "&" : "?"}format=${format}`;
  return {
    id,
    markdown,
    narration: narrateMarkdown(markdown),
    pickers,
    downloadHrefs: { pdf: href("pdf"), xlsx: href("xlsx"), csv: href("csv") },
    csvLabel: csvIsZip ? "CSV (.zip)" : "CSV",
  };
}

/** `tableMarkdown` from the hub: a single-table report under its own title. */
function tableMarkdown<T>(title: string, subtitle: string | undefined, columns: ColumnSpec<T>[], rows: T[]): string {
  return sheetsToMarkdown([{ name: title, columns, rows } as ExportSheet<unknown>], { title, subtitle });
}

/** A production report's lease and well pickers, both on "All". */
function wellScopePickers(): ReportPicker[] {
  return [
    {
      param: "lease",
      value: "",
      allLabel: "All leases",
      filter: true,
      options: [...LEASES].sort((a, b) => a.name.localeCompare(b.name)).map((l) => ({ value: l.id, label: l.name })),
      clears: ["well"],
    },
    {
      param: "well",
      value: "",
      allLabel: "All wells",
      filter: true,
      options: [...WELLS].sort((a, b) => a.name.localeCompare(b.name)).map((w) => ({ value: w.id, label: w.name })),
    },
  ];
}

/**
 * A production report's period picker, on its latest complete period, as the
 * hub's `periodParams` offers it.
 */
function periodPicker(kind: ProductionPeriodKind, current: string): ReportPicker {
  return {
    param: "period",
    value: current,
    options: periodOptions(kind, FIXTURE_TODAY).map((p) => ({ value: p.key, label: p.label })),
  };
}

/**
 * A derivable production report as the hub's production loader builds it:
 * a period report on its latest complete period, the lease and well pickers
 * only where the report is well-scoped (Production Variance and the Exception
 * Report have neither), and a windowed report's window as its subtitle.
 */
export function productionDoc(reportId: ProductionReportId): HubDocument {
  const report = PRODUCTION_REPORTS_BY_ID[reportId];
  const rows = productionRows();
  const leaseByWell = Object.fromEntries(WELLS.map((w) => [w.id, leaseOf(w).name]));
  const asOf = asOfDate(rows);
  const period = report.period ? resolvePeriod(report.period, undefined, FIXTURE_TODAY) : undefined;
  const built = report.build(rows, { asOf, leaseByWell, windowDays: REPORT_WINDOW_DAYS, period });
  const subtitle = period
    ? periodSubtitle(period)
    : report.windowed
      ? windowFor(asOf || FIXTURE_TODAY, REPORT_WINDOW_DAYS).label
      : undefined;
  const pickers = [
    ...(report.period && period ? [periodPicker(report.period, period.key)] : []),
    ...(report.wellScoped ? wellScopePickers() : []),
  ];
  return doc(
    `production-${reportId}`,
    tableMarkdown(report.name, subtitle, report.columns, built),
    pickers,
    `/api/reports/production/export?report=${reportId}`
  );
}

export function dailyProductionDoc(): HubDocument {
  return productionDoc("company-daily-summary");
}

export function productionVarianceDoc(): HubDocument {
  return productionDoc("production-variance");
}

export function dailyDigestDoc(): HubDocument {
  const markdown = digestToMarkdown(reportsDailyDigest());
  return {
    id: DAILY_DIGEST_ID,
    markdown,
    narration: narrateMarkdown(markdown),
    pickers: [],
    downloadHrefs: reportsDownloadHrefs("daily"),
    csvLabel: "CSV (.zip)",
  };
}

const tankById = (id: string) => TANKS.find((t) => t.id === id)!;

/**
 * The pickup queue on FIXTURE_TODAY: the leases called in and still waiting
 * on the truck (`dashboardFixture().calledIn`). Smith's call went in on
 * T201 after the Oct 26 gauge, so its stock is that gauge. Roy Corbett's one
 * tank holds the lease's stock.
 */
export function tanksCalledInDoc(): HubDocument {
  const fx = dashboardFixture();
  const smithGaugeBbl = (EVENTS.smithGauge.feet * 12 + EVENTS.smithGauge.inches) * tankById(EVENTS.smithGauge.tank).bblPerInch;
  const tanks = fx.calledIn.map((c) => {
    const tank =
      c.leaseId === tankById(EVENTS.smithGauge.tank).lease
        ? tankById(EVENTS.smithGauge.tank)
        : TANKS.find((t) => t.lease === c.leaseId && t.kind === "oil")!;
    const stock =
      tank.id === EVENTS.smithGauge.tank ? smithGaugeBbl : fx.leaseStock[c.leaseId].at(-1)!.stock;
    const lease = LEASES.find((l) => l.id === c.leaseId)!;
    return {
      tankId: tank.id,
      tankName: tank.name,
      battery: batteryName(lease.name),
      product: tank.kind,
      capacityBbls: tank.capacityBbl,
      stockBbls: r2(stock),
      gatherer: PURCHASERS.oil,
      calledInAt: `${c.calledInAt}T07:40:00Z`,
    };
  });
  const range = resolveWindow("mtd", FIXTURE_TODAY);
  const queue = summarizeTanksCalledIn(tanks, FIXTURE_TODAY).tanks.filter((t) =>
    inRange(t.calledInAt.slice(0, 10), range.from, range.to)
  );
  return doc("tanks-called-in", tableMarkdown("Tanks Called In", range.label, TANKS_CALLED_IN_COLUMNS, queue), [], "/api/reports/tanks-called-in/export");
}

/**
 * The Pumper Report over the last 30 days, on the app's roster: each lease's
 * oil tanks are one tank battery stop, the water tanks and the SWD meter count
 * on their own. Luis's route reads all of them daily, with two stops missed:
 * Roach Parrott Battery on Oct 11 and Johnson A W1 on Oct 20.
 */
export function pumperDoc(): HubDocument {
  const window = resolveWindow("30d", FIXTURE_TODAY);
  const facilities: PumperFacility[] = [
    ...LEASES.map((l) => ({ id: `battery-${l.slug}`, name: batteryName(l.name), kind: "oil-battery" as const })),
    ...TANKS.filter((t) => t.kind === "water").map((t) => ({ id: t.id, name: t.name, kind: "water-tank" as const })),
    { id: SWD.id, name: SWD.name, kind: "water-meter" },
  ];
  const missed = new Set(["battery-roach-parrott|2026-10-11", "t-ja-w1|2026-10-20"]);
  const logs: PumperLog[] = [];
  for (let d = window.from; d <= window.to; d = shiftDays(d, 1)) {
    for (const f of facilities) if (!missed.has(`${f.id}|${d}`)) logs.push({ facilityId: f.id, date: d });
  }
  const report = buildPumperCoverage({ facilities, logs, window });
  return doc("pumper-coverage", pumperReportToMarkdown(report), [], "/api/reports/pumper/export?window=30d", true);
}

export function reportsFixture() {
  const digest = reportsDigest();
  const markdown = digestToMarkdown(digest);
  return {
    digest,
    markdown,
    narration: narrateMarkdown(markdown),
    navGroups: reportsNavGroups(),
    scheduleRows: reportsScheduleRows(),
    schedule: reportsSchedule(),
    downloadHrefs: reportsDownloadHrefs(),
  };
}
