/**
 * Sky Resources' tanks, day by day, read off the dashboard fixture's own tank
 * record (`leaseStock` and `runTickets`), so every gauge, haul and statement
 * line on the Documents, Orion and Reports pages is the one set of loads the
 * Dashboard's Runs 30d and the digest's oil sold count.
 *
 * Each lease's oil runs into its first oil tank (operator.ts `TANKS`). The
 * morning gauge at 07:00 is the stock the day before ended on, the truck takes
 * its load at 10:40, and the day's production lands after. So for any month:
 * production = hauled + (closing stock - opening stock), exactly.
 */
import { dashboardFixture } from "./dashboard-fixture";
import { EVENTS, FIXTURE_TODAY, LEASES, TANKS, WELLS, type TankSpec } from "./operator";

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

export const GAUGE_TIME = "07:00";
export const HAUL_TIME = "10:40";
/** The September run statement month. */
export const SEPTEMBER = EVENTS.reportMonth;

/** The oil tank a lease's production runs into. */
export function leaseTank(leaseId: string): TankSpec {
  return TANKS.find((t) => t.lease === leaseId && t.kind === "oil")!;
}

/** A lease's oil per day (bbl) from the dashboard's daily series, keyed by ISO date. */
function leaseDailyOil(leaseId: string): Map<string, number> {
  const fx = dashboardFixture();
  const out = new Map<string, number>();
  WELLS.forEach((w, wi) => {
    if (w.lease !== leaseId) return;
    for (const d of fx.dailyByWell[wi].daily) out.set(d.date, (out.get(d.date) ?? 0) + d.oilBbl);
  });
  return out;
}

/** A well's oil for a month (bbl), as the dashboard's monthly series carries it. */
export function wellMonthOil(wellId: string, month: string): number {
  const fx = dashboardFixture();
  const s = fx.byWellMonthly.find((m) => m.wellId === wellId)!;
  return s.monthly.find((m) => m.month === month)?.oilBbl ?? 0;
}

/** A lease's oil for a month (bbl), the sum of its wells' monthly volumes. */
export function leaseMonthOil(leaseId: string, month: string): number {
  return WELLS.filter((w) => w.lease === leaseId).reduce((s, w) => s + wellMonthOil(w.id, month), 0);
}

function datesOf(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const n = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

export interface TankGauge {
  date: string;
  time: string;
  /** Top gauge, inches. */
  gaugeIn: number;
}

export interface TankHaul {
  date: string;
  time: string;
  ticketNo: string;
  /** Net barrels hauled. */
  volume: number;
  /** Gauges before and after the haul, inches. */
  openIn: number;
  closeIn: number;
}

export interface TankMonth {
  tank: TankSpec;
  leaseId: string;
  gauges: TankGauge[];
  hauls: TankHaul[];
  produced: number;
  openingBbl: number;
  closingBbl: number;
}

const quarter = (n: number) => Math.round(n * 4) / 4;

function dayBefore(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** A lease's oil in its tank at the end of a day, bbl, off the dashboard's record. */
function stockAtEnd(leaseId: string, date: string): number {
  return dashboardFixture().leaseStock[leaseId]?.find((r) => r.date === date)?.stock ?? 0;
}

/** A lease's oil at the 07:00 gauge: where the day before ended. */
export function morningStock(leaseId: string, date: string): number {
  return stockAtEnd(leaseId, dayBefore(date));
}

/**
 * The purchaser's ticket number for every load in the dashboard's record:
 * one sequence over the whole record, in haul order across leases.
 */
function ticketNumbers(): Map<string, string> {
  const fx = dashboardFixture();
  const order = LEASES.map((l) => l.id);
  const loads = [...fx.runTickets].sort((a, b) => a.date.localeCompare(b.date) || order.indexOf(a.leaseId) - order.indexOf(b.leaseId));
  return new Map(loads.map((t, i) => [`${t.leaseId}|${t.date}`, String(769004 + i * 43 + ((i * 17) % 11))]));
}

let tickets: Map<string, string> | null = null;
const ticketOf = (leaseId: string, date: string) => (tickets ??= ticketNumbers()).get(`${leaseId}|${date}`)!;

function build(leaseId: string, month: string): TankMonth {
  const fx = dashboardFixture();
  const tank = leaseTank(leaseId);
  const bpi = tank.bblPerInch;
  const daily = leaseDailyOil(leaseId);
  const dates = datesOf(month).filter((d) => d <= FIXTURE_TODAY);
  const gauges = dates.map((date) => ({ date, time: GAUGE_TIME, gaugeIn: quarter(morningStock(leaseId, date) / bpi) }));
  const hauls = fx.runTickets
    .filter((t) => t.leaseId === leaseId && t.date.startsWith(month))
    .map((t) => {
      const before = morningStock(leaseId, t.date);
      return {
        date: t.date,
        time: HAUL_TIME,
        ticketNo: ticketOf(leaseId, t.date),
        volume: t.bbl,
        openIn: quarter(before / bpi),
        closeIn: quarter((before - t.bbl) / bpi),
      };
    });
  return {
    tank,
    leaseId,
    gauges,
    hauls,
    produced: dates.reduce((a, d) => a + (daily.get(d) ?? 0), 0),
    openingBbl: morningStock(leaseId, dates[0]),
    closingBbl: stockAtEnd(leaseId, dates[dates.length - 1]),
  };
}

const cache = new Map<string, TankMonth[]>();

/** Every lease's tank month. */
export function tankMonths(month: string = SEPTEMBER): TankMonth[] {
  const hit = cache.get(month);
  if (hit) return hit;
  const out = LEASES.map((l) => build(l.id, month));
  cache.set(month, out);
  return out;
}

export function tankMonthOf(leaseId: string, month: string = SEPTEMBER): TankMonth {
  return tankMonths(month).find((t) => t.leaseId === leaseId)!;
}

export const haulTotal = (m: TankMonth) => r1(m.hauls.reduce((s, h) => s + h.volume, 0));

/* ---- Smith T201, the week of Oct 20 to 26 ------------------------------- */

const SMITH_WEEK = ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"];

/** Smith T201's morning gauges Oct 20 to 26, the last of them EVENTS.smithGauge. */
export function smithWeekGauges(): TankGauge[] {
  return tankMonthOf("l-smith", "2026-10").gauges.filter((g) => SMITH_WEEK.includes(g.date));
}

/** The one load off Smith T201 that week, the run already on file. */
export const SMITH_OCT_HAUL: TankHaul = (() => {
  const h = tankMonthOf("l-smith", "2026-10").hauls.find((x) => SMITH_WEEK.includes(x.date));
  if (!h) throw new Error("documents-tanks: no Smith load in the week of Oct 20");
  return h;
})();

/** Smith T201's barrels at a gauge. */
export function smithBbl(gaugeIn: number): number {
  return r1(gaugeIn * leaseTank("l-smith").bblPerInch);
}

/** Feet and inches as a pumper writes them: 40.5 -> 3' 4.5". */
export function feetInches(inches: number): { ft: number; in: number } {
  const ft = Math.floor(inches / 12);
  return { ft, in: r2(inches - ft * 12) };
}
