/**
 * A small Graham-area operator, generated deterministically, in the exact shapes
 * the app's dashboard components take. Five leases, fourteen wells, three
 * years of monthly history and daily readings from April 1 to FIXTURE_TODAY,
 * so every figure on the screen (cards, chart, table, pie, decline) is computed
 * by the app's own code from one dataset, the way the real page computes them.
 *
 * The daily readings are the measured record. Every month they cover is the
 * sum of its days, so the chart's 3M view (daily, bucketed) and its 12M view
 * (monthly) draw the same barrels, and September here is September in the
 * Reports digest, the Form PR and anywhere else that reads `byWellMonthly`.
 */
import type {
  CommodityPrices,
  MonthlyProduction,
  WellDailySeries,
  WellMonthlySeries,
  WellProductionTotal,
} from "@/lib/analytics/types";
import type { LeaseSummaryRow, LeaseWellRow } from "@/lib/analytics/lease-summaries";
import type { ChartLease } from "@/components/analytics/company-charts";
import type { UnitStream } from "@/lib/analytics/fleet-decline";
import type { FleetDecline } from "@/lib/analytics/fleet-decline";
import { fleetDecline, unitDecline, wellUnitKey, wellUnitKeys } from "@/lib/analytics/fleet-decline";
import { DAYS_PER_MONTH } from "@/lib/analytics/summary-calc";
import { dueDate } from "@/lib/rrc/forms/schedule";
import { SMITH4_COMMENTS } from "./mobile-b-fixture";
import { EVENTS, FIXTURE_TODAY, LEASES, OPERATOR, PRICES, WELLS, leaseOf, type WellSpec } from "./operator";

export { FIXTURE_TODAY, LEASES, PRICES, WELLS };

const MONTHS = 36;
/** April 1 through FIXTURE_TODAY: the Monthly digest's six-month trend for September reaches back to April 4. */
const DAILY_DAYS = 210;
/** Months the daily record covers in full or to date (April onward); these are summed from the days. */
const DAILY_FROM_MONTH = MONTHS - 7;

/** Deterministic noise in [-1, 1). */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function monthLabel(offsetFromEnd: number): string {
  const [y, m] = FIXTURE_TODAY.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - offsetFromEnd, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

function dayLabel(offsetFromEnd: number): string {
  const [y, m, d] = FIXTURE_TODAY.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - offsetFromEnd));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * A well's underlying oil rate at a fractional month ordinal, bbl/d, without
 * noise: the curve the daily readings scatter around.
 */
function smoothOilRate(w: WellSpec, k: number): number {
  if (w.on != null && k < w.on) return 0;
  const age = w.on != null ? k - w.on : k;
  return w.oil0 * Math.pow(1 - w.decline, age / 12);
}

/** A date's fractional month ordinal on the 36-month axis. */
function monthOrdinalOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [ty, tm] = FIXTURE_TODAY.split("-").map(Number);
  const k = MONTHS - 1 - ((ty - y) * 12 + (tm - m));
  return k + (d - 1) / daysInMonth(date.slice(0, 7));
}

/** A well's oil rate on month ordinal `k` (0 = first of the 36), bbl/d. */
function oilRateAt(w: WellSpec, k: number, seed: number): number {
  if (w.on != null && k < w.on) return 0;
  const age = w.on != null ? k - w.on : k;
  const base = w.oil0 * Math.pow(1 - w.decline, age / 12);
  return Math.max(0.5, base * (1 + 0.06 * noise(seed * 7 + k)));
}

/** A load the purchaser's truck took off a lease's tanks, net barrels. */
export interface RunTicket {
  leaseId: string;
  date: string;
  bbl: number;
}

/** A lease is called in once its tanks hold this much, the truck comes this many days later, and leaves this much behind. */
const CALL_AT_BBL = 200;
const TRUCK_LAG_DAYS = 3;
const HAUL_HEEL_BBL = 35;

export interface DashboardFixture {
  monthly: MonthlyProduction[];
  byWellMonthly: WellMonthlySeries[];
  dailyByWell: WellDailySeries[];
  prices: CommodityPrices;
  leaseRows: LeaseSummaryRow[];
  wellRows: LeaseWellRow[];
  chartLeases: ChartLease[];
  nriByLease: Record<string, number>;
  companyNri: number;
  pieWells: (WellProductionTotal & { oilRevenue: number; gasRevenue: number })[];
  leaseByWell: Record<string, string>;
  streams: UnitStream[];
  /** Each lease's oil in its tanks at the end of each day of the daily record, bbl. */
  leaseStock: Record<string, { date: string; stock: number }[]>;
  /** Every load hauled off a lease's tanks over the daily record, oldest first. */
  runTickets: RunTicket[];
  /** Leases called in and still waiting on the truck at FIXTURE_TODAY, with the day they were called. */
  calledIn: { leaseId: string; calledInAt: string }[];
  /** The fleet decline the chart's history fetch returns (`/api/analytics/company`), computed here too so a screen can show it without the fetch. */
  fleet: FleetDecline;
  /** The lease table's Decline column: lease rows by key, well rows by `well:<id>`, as `DashboardOverview` derives it. */
  declineByRow: Record<string, number | null>;
  cards: {
    oilBblPerDay: number;
    gasMcfPerDay: number;
    oilChangePct: number | null;
    gasChangePct: number | null;
    oilChange30Pct: number | null;
    gasChange30Pct: number | null;
    netRevenueMonthly: number | null;
    netChangePct: number | null;
    netChange30Pct: number | null;
  };
}

function build(): DashboardFixture {
  // Monthly per well, oldest first.
  const byWellMonthly: WellMonthlySeries[] = WELLS.map((w, wi) => {
    const monthly: MonthlyProduction[] = [];
    for (let k = 0; k < MONTHS; k++) {
      const month = monthLabel(MONTHS - 1 - k);
      const days = daysInMonth(month);
      const oilRate = oilRateAt(w, k, wi + 1);
      const gasRate = oilRate * w.gor * (1 + 0.04 * noise(wi * 11 + k));
      const waterRate = w.on != null && k < w.on ? 0 : w.water * (1 + 0.05 * noise(wi * 13 + k));
      const oilBbl = oilRate * days;
      const gasMcf = gasRate * days;
      const revenue = oilBbl * PRICES.oilPerBbl + gasMcf * PRICES.gasPerMcf;
      monthly.push({
        month,
        oilBbl,
        gasMcf,
        water: waterRate * days,
        revenue,
        cashFlow: revenue * 0.62,
        official: k < MONTHS - 1,
        oilBblPerDay: oilRate,
        gasMcfPerDay: gasRate,
        waterBblPerDay: waterRate,
      });
    }
    const boe = monthly.reduce((a, m) => a + m.oilBbl + m.gasMcf / 6, 0);
    return { wellId: w.id, name: w.name, monthly, boe };
  });

  // Daily per well, oldest first, ending on FIXTURE_TODAY: the well's own
  // decline curve with day-to-day scatter, zero on its shut-in days.
  const dailyByWell: WellDailySeries[] = WELLS.map((w, wi) => {
    const daily = [];
    for (let d = DAILY_DAYS - 1; d >= 0; d--) {
      const date = dayLabel(d);
      const down = w.downDays && d >= w.downDays[0] && d <= w.downDays[1];
      const rate = smoothOilRate(w, monthOrdinalOf(date));
      const off = rate === 0;
      const oil = down || off ? 0 : rate * (1 + 0.09 * noise(wi * 17 + d));
      const gas = down || off ? 0 : rate * w.gor * (1 + 0.06 * noise(wi * 19 + d));
      const water = down || off ? 0 : w.water * (1 + 0.07 * noise(wi * 23 + d));
      daily.push({
        date,
        oilBbl: oil,
        gasMcf: gas,
        water,
        measured: { oil: true, gas: true, water: true },
        oilRevenue: oil * PRICES.oilPerBbl,
        gasRevenue: gas * PRICES.gasPerMcf,
      });
    }
    return { wellId: w.id, daily };
  });

  // The months the daily record covers are the sums of their days.
  byWellMonthly.forEach((series, wi) => {
    for (let k = DAILY_FROM_MONTH; k < MONTHS; k++) {
      const row = series.monthly[k];
      const days = dailyByWell[wi].daily.filter((p) => p.date.startsWith(row.month));
      const sum = (f: (p: (typeof days)[number]) => number) => days.reduce((a, p) => a + f(p), 0);
      const oilBbl = sum((p) => p.oilBbl);
      const gasMcf = sum((p) => p.gasMcf);
      const water = sum((p) => p.water);
      const revenue = oilBbl * PRICES.oilPerBbl + gasMcf * PRICES.gasPerMcf;
      series.monthly[k] = {
        ...row,
        oilBbl,
        gasMcf,
        water,
        revenue,
        cashFlow: revenue * 0.62,
        oilBblPerDay: oilBbl / days.length,
        gasMcfPerDay: gasMcf / days.length,
        waterBblPerDay: water / days.length,
      };
    }
    series.boe = series.monthly.reduce((a, m) => a + m.oilBbl + m.gasMcf / 6, 0);
  });

  const monthly: MonthlyProduction[] = [];
  for (let k = 0; k < MONTHS; k++) {
    const rows = byWellMonthly.map((s) => s.monthly[k]);
    // A month to date is divided by its days so far, as the wells' rows are.
    const days = rows[0].oilBblPerDay ? rows[0].oilBbl / rows[0].oilBblPerDay : daysInMonth(rows[0].month);
    const sum = (f: (m: MonthlyProduction) => number) => rows.reduce((a, m) => a + f(m), 0);
    monthly.push({
      month: rows[0].month,
      oilBbl: sum((m) => m.oilBbl),
      gasMcf: sum((m) => m.gasMcf),
      water: sum((m) => m.water),
      revenue: sum((m) => m.revenue),
      cashFlow: sum((m) => m.cashFlow),
      official: rows[0].official,
      oilBblPerDay: sum((m) => m.oilBbl) / days,
      gasMcfPerDay: sum((m) => m.gasMcf) / days,
      waterBblPerDay: sum((m) => m.water) / days,
    });
  }

  // The leases' tanks over the daily record: production fills them, a truck
  // takes a load the day after they reach HAUL_AT_BBL. The loads are the run
  // tickets, so the table's Runs 30d and the digest's oil sold count one set.
  const leaseStock: DashboardFixture["leaseStock"] = {};
  const runTickets: RunTicket[] = [];
  const calledIn: DashboardFixture["calledIn"] = [];
  LEASES.forEach((l, li) => {
    const idx = WELLS.map((w, wi) => (w.lease === l.id ? wi : -1)).filter((i) => i >= 0);
    let stock = 90 + 60 * (0.5 + 0.5 * noise(li * 31 + 5));
    let calledOn: number | null = null;
    const rows: { date: string; stock: number }[] = [];
    for (let d = 0; d < DAILY_DAYS; d++) {
      const date = dailyByWell[idx[0]].daily[d].date;
      if (calledOn != null && d - calledOn >= TRUCK_LAG_DAYS) {
        const bbl = Math.round((stock - HAUL_HEEL_BBL - 8 * (0.5 + 0.5 * noise(li * 37 + d))) * 10) / 10;
        runTickets.push({ leaseId: l.id, date, bbl });
        stock -= bbl;
        calledOn = null;
      }
      stock += idx.reduce((a, wi) => a + dailyByWell[wi].daily[d].oilBbl, 0);
      if (calledOn == null && stock >= CALL_AT_BBL) calledOn = d;
      rows.push({ date, stock });
    }
    if (calledOn != null) calledIn.push({ leaseId: l.id, calledInAt: rows[calledOn].date });
    leaseStock[l.id] = rows;
  });
  const runsSince = dayLabel(29);

  // The table's rows: last measured day, the day before, and the 30-day window.
  const dayAt = (wi: number, back: number) => dailyByWell[wi].daily[DAILY_DAYS - 1 - back];
  const avg = (wi: number, from: number, len: number, f: (d: ReturnType<typeof dayAt>) => number) => {
    let s = 0;
    for (let i = from; i < from + len; i++) s += f(dayAt(wi, i));
    return s / len;
  };

  const wellRows: LeaseWellRow[] = WELLS.map((w, wi) => {
    const lease = leaseOf(w);
    const now = dayAt(wi, 0);
    const prev = dayAt(wi, 1);
    const rev = (d: typeof now) => (d.oilRevenue ?? 0) + (d.gasRevenue ?? 0);
    return {
      wellId: w.id,
      name: w.name,
      lease: lease.name,
      leaseId: lease.id,
      oilBbl: now.oilBbl,
      gasMcf: now.gasMcf,
      revenue24: rev(now),
      oilRevenue24: now.oilRevenue ?? 0,
      gasRevenue24: now.gasRevenue ?? 0,
      nri: lease.nri,
      change: {
        oil: { now: now.oilBbl, prev: prev.oilBbl },
        gas: { now: now.gasMcf, prev: prev.gasMcf },
        revenue: { now: rev(now), prev: rev(prev) },
      },
      change30: {
        oil: { now: avg(wi, 0, 7, (d) => d.oilBbl), prev: avg(wi, 30, 7, (d) => d.oilBbl) },
        gas: { now: avg(wi, 0, 7, (d) => d.gasMcf), prev: avg(wi, 30, 7, (d) => d.gasMcf) },
        revenue: { now: avg(wi, 0, 7, rev), prev: avg(wi, 30, 7, rev) },
      },
    };
  });

  const leaseRows: LeaseSummaryRow[] = LEASES.map((l) => {
    const ws = wellRows.filter((r) => r.leaseId === l.id);
    const sum = (f: (r: LeaseWellRow) => number) => ws.reduce((a, r) => a + f(r), 0);
    const chg = (pick: (r: LeaseWellRow) => { now: number; prev: number }) => ({
      now: sum((r) => pick(r).now),
      prev: sum((r) => pick(r).prev),
    });
    const revenue24 = sum((r) => r.revenue24);
    return {
      key: l.id,
      leaseId: l.id,
      name: l.name,
      slug: l.slug,
      lastReportedAt: FIXTURE_TODAY,
      oil24: sum((r) => r.oilBbl),
      gas24: sum((r) => r.gasMcf),
      runs30d: runTickets.filter((t) => t.leaseId === l.id && t.date >= runsSince).length,
      revenue24,
      netRevenue24: revenue24 * l.nri,
      nri: l.nri,
      change: { oil: chg((r) => r.change.oil), gas: chg((r) => r.change.gas), revenue: chg((r) => r.change.revenue) },
      change30: {
        oil: chg((r) => r.change30.oil),
        gas: chg((r) => r.change30.gas),
        revenue: chg((r) => r.change30.revenue),
      },
    };
  });

  const chartLeases: ChartLease[] = leaseRows.map((r) => ({
    key: r.key,
    leaseId: r.leaseId,
    name: r.name,
    wellIds: wellRows.filter((w) => w.leaseId === r.leaseId).map((w) => w.wellId),
  }));

  const nriByLease = Object.fromEntries(leaseRows.map((r) => [r.key, r.nri as number]));
  const gross = leaseRows.reduce((a, r) => a + r.revenue24, 0);
  const net = leaseRows.reduce((a, r) => a + (r.netRevenue24 ?? 0), 0);
  const companyNri = net / gross;

  const pieWells = wellRows.map((r) => ({
    wellId: r.wellId,
    name: r.name,
    oilBbl: r.oilBbl,
    gasMcf: r.gasMcf,
    revenue: r.revenue24,
    oilRevenue: r.oilRevenue24,
    gasRevenue: r.gasRevenue24,
    cashFlow: 0,
  }));
  const leaseByWell = Object.fromEntries(wellRows.map((r) => [r.wellId, r.lease]));

  // Fleet decline streams: one per well and stream, fitted over the monthly rates.
  const streams: UnitStream[] = WELLS.flatMap((w, wi) => {
    const s = byWellMonthly[wi];
    const lease = leaseOf(w);
    return (["oil", "gas"] as const).map((stream) => ({
      unit: wellUnitKey(w.id),
      stream,
      rates: s.monthly.map((m) => ({ month: m.month, rate: stream === "oil" ? m.oilBblPerDay ?? 0 : m.gasMcfPerDay ?? 0 })),
      current: stream === "oil" ? wellRows[wi].change30.oil.now : wellRows[wi].change30.gas.now,
      nri: lease.nri,
      price: stream === "oil" ? PRICES.oilPerBbl : PRICES.gasPerMcf,
    }));
  });

  const fleet = fleetDecline(streams, PRICES, new Date(`${FIXTURE_TODAY}T12:00:00Z`), 60);
  const declineByRow: Record<string, number | null> = Object.fromEntries([
    ...chartLeases.map((l) => [l.key, unitDecline(fleet.byUnit, wellUnitKeys(l.wellIds))]),
    ...wellRows.map((w) => [wellUnitKey(w.wellId), unitDecline(fleet.byUnit, [wellUnitKey(w.wellId)])]),
  ]);

  const sumRows = (f: (r: LeaseSummaryRow) => number) => leaseRows.reduce((a, r) => a + f(r), 0);
  const pct = (now: number, prev: number) => (prev > 0 ? now / prev - 1 : null);
  const netChg = (pick: "change" | "change30") => {
    const now = sumRows((r) => r[pick].revenue.now * (r.nri ?? 0));
    const prev = sumRows((r) => r[pick].revenue.prev * (r.nri ?? 0));
    return pct(now, prev);
  };

  return {
    monthly,
    byWellMonthly,
    dailyByWell,
    prices: PRICES,
    leaseRows,
    wellRows,
    chartLeases,
    nriByLease,
    companyNri,
    pieWells,
    leaseByWell,
    streams,
    leaseStock,
    runTickets,
    calledIn,
    fleet,
    declineByRow,
    cards: {
      oilBblPerDay: sumRows((r) => r.oil24),
      gasMcfPerDay: sumRows((r) => r.gas24),
      oilChangePct: pct(sumRows((r) => r.change.oil.now), sumRows((r) => r.change.oil.prev)),
      gasChangePct: pct(sumRows((r) => r.change.gas.now), sumRows((r) => r.change.gas.prev)),
      oilChange30Pct: pct(sumRows((r) => r.change30.oil.now), sumRows((r) => r.change30.oil.prev)),
      gasChange30Pct: pct(sumRows((r) => r.change30.gas.now), sumRows((r) => r.change30.gas.prev)),
      netRevenueMonthly: net * DAYS_PER_MONTH,
      netChangePct: netChg("change"),
      netChange30Pct: netChg("change30"),
    },
  };
}

let cached: DashboardFixture | null = null;
export function dashboardFixture(): DashboardFixture {
  return (cached ??= build());
}

/**
 * The comments on file, newest first, as the brief and the Daily Company
 * Digest both read them: Smith 4's thread from the Mobile page
 * (`SMITH4_COMMENTS`), Luis's reading remark on the Oct 26 Smith T201 gauge,
 * his Johnson A W1 note the same day, and his Roy Corbett 4 note the day
 * the well came back from its shut-in (`EVENTS.rc4Downtime`, the zero days in
 * the daily series).
 */
export interface FieldComment {
  date: string;
  facilityType: "well" | "tank";
  facilityName: string;
  /** Empty for a remark typed on a reading. */
  author: string;
  body: string;
}

/** A thread timestamp's calendar day, in the zone it was written in. */
function localDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const smith4 = WELLS.find((w) => w.id === "w-s4")!;
const smith4Thread: FieldComment[] = SMITH4_COMMENTS.flatMap((c) => [c, ...c.replies]).map((c) => ({
  date: localDay(c.createdAt),
  facilityType: "well" as const,
  facilityName: smith4.name,
  author: c.author,
  body: c.body,
}));

export const PUMPER_COMMENTS: FieldComment[] = [
  ...smith4Thread,
  {
    date: EVENTS.smithGauge.date,
    facilityType: "tank" as const,
    facilityName: "Smith T201",
    author: "",
    body: `Gauged ${EVENTS.smithGauge.feet}' ${EVENTS.smithGauge.inches}".`,
  },
  {
    date: EVENTS.smithGauge.date,
    facilityType: "tank" as const,
    facilityName: "Johnson A W1",
    author: OPERATOR.pumper,
    body: "Thief hatch leaking on the water tank. New gasket on order.",
  },
  {
    date: EVENTS.rc4Downtime.to,
    facilityType: "well" as const,
    facilityName: "Roy Corbett 4",
    author: OPERATOR.pumper,
    body: "Rod part. Pump pulled and rerun, well back on.",
  },
].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/**
 * The two comments the brief names (it names at most two), and how it words
 * them. The model picks; this is what it picked for the fixture morning.
 */
const BRIEF_COMMENTS: Record<string, string> = {
  [smith4.name]: "it is pumping off again, with 2 hours cut from the timer",
  "Roy Corbett 4": "a rod part, with the pump pulled and rerun",
};

const BRIEF_EXCEPTION_PCT = 25;
const BRIEF_COMMENT_DAYS = 14;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Days from `a` to `b`, both ISO dates. */
function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * Wells whose last three gauged days average more than 25% off their own
 * 30-day average: the brief route's exception rule (`exceptionReport` with the
 * brief's threshold), run on the fixture's daily readings.
 */
export function briefExceptions(fx: DashboardFixture): { name: string; avg3: number; avg30: number; pct: number }[] {
  return fx.dailyByWell.flatMap((s) => {
    const gauged = s.daily.filter((p) => p.measured?.oil ?? true);
    const mean = (xs: typeof gauged) => xs.reduce((a, p) => a + p.oilBbl, 0) / Math.max(1, xs.length);
    const avg30 = mean(gauged.slice(-30));
    if (avg30 === 0) return [];
    const avg3 = mean(gauged.slice(-3));
    const pct = ((avg3 - avg30) / avg30) * 100;
    if (Math.abs(pct) < BRIEF_EXCEPTION_PCT) return [];
    return [{ name: WELLS.find((w) => w.id === s.wellId)!.name, avg3, avg30, pct }];
  });
}

/**
 * The brief as the route writes it: the computed greeting, then at most three
 * sentences on exceptions, the next seven days and the pumpers' comments, in
 * that order. Never production, revenue, decline or prices, never a cause.
 */
export function morningBrief(fx: DashboardFixture): string {
  const lines: string[] = [];

  const ex = briefExceptions(fx).slice(0, 3);
  if (ex.length > 0) {
    lines.push(
      ex
        .map(
          (e) =>
            `**${e.name}** averaged **${e.avg3.toFixed(1)} bbl/d** over its last three gauged days against **${e.avg30.toFixed(1)} bbl/d** over the last 30`
        )
        .join(", and ") + "."
    );
  }

  // The docket keys a Form PR cycle as YYYYMM.
  const due = dueDate("PR", EVENTS.reportMonth.replace("-", ""));
  const until = daysBetween(FIXTURE_TODAY, due);
  if (until >= 0 && until <= 7) {
    const day = WEEKDAYS[new Date(`${due}T12:00:00Z`).getUTCDay()];
    const month = new Date(`${EVENTS.reportMonth}-01T12:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
    lines.push(`The **Form PR** for ${month} is due **${day}**.`);
  }

  const recent = PUMPER_COMMENTS.filter(
    (c) =>
      c.author === OPERATOR.pumper &&
      c.facilityName in BRIEF_COMMENTS &&
      daysBetween(c.date, FIXTURE_TODAY) <= BRIEF_COMMENT_DAYS
  )
    .filter((c, i, all) => all.findIndex((x) => x.facilityName === c.facilityName) === i)
    .slice(0, 2);
  if (recent.length > 0) {
    lines.push(
      recent
        .map((c, i) =>
          i === 0
            ? `On **${c.facilityName}**, the pumper noted ${BRIEF_COMMENTS[c.facilityName]}`
            : `on **${c.facilityName}**, ${BRIEF_COMMENTS[c.facilityName]}`
        )
        .join(", and ") + "."
    );
  }

  return `Good morning, ${OPERATOR.ownerFirst}.\n\n${lines.join(" ")}`.trimEnd();
}
