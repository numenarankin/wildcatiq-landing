/**
 * A well's LAST COMPLETE DAY of measured production, per stream — the "24 hr"
 * figure the dashboard reports.
 *
 * This is not an EMA. `getCompanyRates` (the /production table, the Facilities
 * cards, the AI brief) answers "what is this well running at" with a 14-day
 * exponential average, which is the right statistic for a rate that has to
 * survive one missed gauge. The dashboard asks a narrower question — what did
 * the field actually make in its last full day — and that is one day's volume,
 * not a smoothed one.
 *
 * ## Per STREAM, not per row
 *
 * A daily row exists because SOMETHING reported that day, so a day the gas meter
 * was read and no tank was gauged carries `oilBbl: 0` with `measured.oil` false
 * (see `DailyProduction`). Taking the newest row wholesale would read that zero
 * as a day of no oil. Each stream therefore walks to its own newest MEASURED
 * day, and the two can carry different dates.
 *
 * ## The rows are already trimmed
 *
 * The last day a tank series covers ends at its last gauge, not at midnight, so
 * it holds a few hours of barrels under a whole day's date. `getCompanyProduction`
 * cuts that partial tail at the source (`production-data.ts`, using the battery's
 * `measuredThrough`), which is what makes "the newest row" a whole day here. Do
 * not feed this a series that has not been through that cut.
 *
 * ## Each well answers on its own date
 *
 * Batteries are gauged on their own schedules, so this sums each well's own last
 * complete day rather than one calendar day across the fleet. Pinning every well
 * to the company's newest date reads every well that was not gauged that day as
 * zero, which collapses the total on the most ordinary day in the field.
 *
 * ## The day before it
 *
 * Each stream also carries the measured day BEFORE the one it reports, which is
 * what the day-over-day percentages on the cards and the table are built from.
 * "Before" means the previous day that stream MEASURED, not yesterday's date: a
 * battery gauged every third day would otherwise be compared against a day it
 * was not read on.
 *
 * Pure: no DB, no clock. The loader is the page.
 */
import type { DailyProduction, WellDailySeries } from "@/lib/analytics/types";

/** One well's last measured day, per stream, in bbl/day and MCF/day. */
export interface LastDayRate {
  oil: number;
  gas: number;
  /** The day `oil` was measured on, or null when the well has never gauged. */
  oilDate: string | null;
  /** The day `gas` was measured on, or null when the well has no meter. */
  gasDate: string | null;
  /**
   * The measured day before that one, or null when the well has only ever
   * reported once. Null is what keeps a brand-new well OUT of a day-over-day
   * comparison rather than reading as a jump from nothing.
   */
  oilPrev: number | null;
  gasPrev: number | null;
  /**
   * The day `oilPrev` / `gasPrev` was measured on, null with them. What the
   * dashboard prices that day's barrels at: the benchmark on THAT date, so the
   * revenue move carries the price move as well as the production's.
   */
  oilPrevDate: string | null;
  gasPrevDate: string | null;
}

/** A well with no series at all: zero, and no date to stand behind it. */
export const NO_LAST_DAY: LastDayRate = {
  oil: 0,
  gas: 0,
  oilDate: null,
  gasDate: null,
  oilPrev: null,
  gasPrev: null,
  oilPrevDate: null,
  gasPrevDate: null,
};

/** The newest measured day of each stream in one well's daily series. */
export function lastMeasuredDay(
  daily: readonly DailyProduction[]
): LastDayRate {
  const out: LastDayRate = { ...NO_LAST_DAY };
  // Scanned rather than indexed off the end: the caller's series is sorted by
  // date, but the newest OIL day and the newest GAS day are different rows.
  // Each stream keeps its newest two, which is all a day-over-day move needs.
  for (const d of daily) {
    if (d.measured.oil) {
      if (out.oilDate === null || d.date > out.oilDate) {
        out.oilPrevDate = out.oilDate;
        out.oilPrev = out.oilDate === null ? null : out.oil;
        out.oilDate = d.date;
        out.oil = d.oilBbl;
      } else if (out.oilPrevDate === null || d.date > out.oilPrevDate) {
        out.oilPrevDate = d.date;
        out.oilPrev = d.oilBbl;
      }
    }
    if (d.measured.gas) {
      if (out.gasDate === null || d.date > out.gasDate) {
        out.gasPrevDate = out.gasDate;
        out.gasPrev = out.gasDate === null ? null : out.gas;
        out.gasDate = d.date;
        out.gas = d.gasMcf;
      } else if (out.gasPrevDate === null || d.date > out.gasPrevDate) {
        out.gasPrevDate = d.date;
        out.gasPrev = d.gasMcf;
      }
    }
  }
  return out;
}

/**
 * A day-over-day move, held as the two sides rather than as a percentage.
 *
 * Both sides are restricted to the SAME WELLS — only the ones that have a
 * previous measured day count, on either side — so the move is a change in
 * production and not a change in who reported. A well that came online
 * yesterday would otherwise arrive as a jump out of nothing.
 *
 * Carried unreduced so the cards can be the table added up here too: summing
 * the rows' two sides and dividing once is the company's move, while averaging
 * the rows' percentages is not.
 */
export interface DayChange {
  /** The comparable wells' latest measured day. */
  now: number;
  /** The same wells' day before that. */
  prev: number;
}

export const NO_CHANGE: DayChange = { now: 0, prev: 0 };

/** Add two sides of a move — the lease's rows, or the whole company's. */
export function addChange(a: DayChange, b: DayChange): DayChange {
  return { now: a.now + b.now, prev: a.prev + b.prev };
}

/**
 * One well's move on one stream: both of its days, or nothing.
 *
 * A stream joins a comparison only when the well measured it TWICE, and then
 * both of its days do. A well with one day contributes to a rate column but to
 * neither side of the move, which is what stops a new well from reading as a
 * jump out of nothing. The ONE rule behind the dashboard's rows and the lease
 * and well pages' cards, so a lease reads the same move on both.
 */
export function wellDayChange(last: LastDayRate, stream: "oil" | "gas"): DayChange {
  const prev = stream === "oil" ? last.oilPrev : last.gasPrev;
  if (prev === null) return NO_CHANGE;
  return { now: stream === "oil" ? last.oil : last.gas, prev };
}

/** Some wells' move, per stream — a lease's, or a single well's. */
export function wellsDayChange(
  lasts: readonly LastDayRate[]
): { oil: DayChange; gas: DayChange } {
  return {
    oil: lasts.map((l) => wellDayChange(l, "oil")).reduce(addChange, NO_CHANGE),
    gas: lasts.map((l) => wellDayChange(l, "gas")).reduce(addChange, NO_CHANGE),
  };
}

/**
 * The move as a fraction (0.0125 = up 1.25%), or null when there is nothing
 * honest to report: no comparable well, or a previous day of zero, where the
 * percentage is undefined however far production actually rose.
 */
export function changePct(change: DayChange): number | null {
  if (change.prev === 0) return null;
  return (change.now - change.prev) / change.prev;
}

/** Every well's last measured day, keyed by well id. */
export function lastDayRatesByWell(
  series: readonly WellDailySeries[]
): Map<string, LastDayRate> {
  return new Map(series.map((s) => [s.wellId, lastMeasuredDay(s.daily)]));
}
