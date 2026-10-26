/**
 * The 30-DAY move: a week's average now against a week's average a month ago.
 *
 * Day-to-day production is noisy — a haul, a missed gauge, a well down for an
 * afternoon — so one day against one day thirty days earlier would swing on
 * whatever happened to be going on those two days. Two seven-day windows do
 * not: a week is the field's own cycle (haul schedules, gauge rounds), wide
 * enough to absorb a bad day and short enough that the two windows never
 * overlap.
 *
 * ## Simple averages, measured days only
 *
 * Each window is the plain mean of the well's last `WINDOW_DAYS` MEASURED days
 * of the stream — the days it was actually gauged or metered, however far apart
 * they fall. A battery gauged every third day has its seven days spread over
 * three weeks, and that is still its week of readings. An unmeasured day is not
 * a zero and is not carried forward; it is simply not one of the seven. A
 * simple average, not an EMA: the question is what those days made, and an EMA
 * "as of 30 days ago" drags in days before its window and depends on where it
 * was seeded.
 *
 * ## Then
 *
 * The earlier window ends `LOOKBACK_DAYS` before the later one's last measured
 * day: its seven days are the last seven measured on or before that date.
 *
 * ## Same wells on both sides
 *
 * A well joins the comparison only when it has at least one measured day in
 * EACH window; otherwise it is out of both (`NO_CHANGE`), the same rule the
 * day-over-day move applies (`wellDayChange`). Held as the two sides
 * (`DayChange`) so a lease's move is its wells' sides added and divided once,
 * never its wells' percentages averaged.
 *
 * Pure: no DB, no clock. The loader is the page.
 */
import { addChange, NO_CHANGE, type DayChange } from "@/lib/analytics/last-day-rates";
import type { DailyProduction, WellDailySeries } from "@/lib/analytics/types";

/** Measured days in each window. */
export const WINDOW_DAYS = 7;
/** Days between the two windows' ends. */
export const LOOKBACK_DAYS = 30;

export interface WindowChange {
  oil: DayChange;
  gas: DayChange;
  /**
   * The day each stream's EARLIER window ends (`LOOKBACK_DAYS` before its last
   * measured day), null when the stream has no move. The dashboard prices the
   * earlier week at the benchmarks of the week ending here, so the revenue move
   * carries the month's price move as well as the production's.
   */
  oilPrevEnd: string | null;
  gasPrevEnd: string | null;
}

export const NO_WINDOW_CHANGE: WindowChange = {
  oil: NO_CHANGE,
  gas: NO_CHANGE,
  oilPrevEnd: null,
  gasPrevEnd: null,
};

/** `YYYY-MM-DD` minus `days`, as `YYYY-MM-DD`. */
export function daysBefore(date: string, days: number): string {
  const ms = Date.parse(`${date}T00:00:00Z`) - days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Mean of the last `WINDOW_DAYS` values, or null with nothing to average. */
function tailMean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const tail = values.slice(-WINDOW_DAYS);
  return tail.reduce((s, v) => s + v, 0) / tail.length;
}

function streamChange(
  daily: readonly DailyProduction[],
  measured: (d: DailyProduction) => boolean,
  valueOf: (d: DailyProduction) => number
): { change: DayChange; prevEnd: string | null } {
  const days = daily
    .filter(measured)
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (days.length === 0) return { change: NO_CHANGE, prevEnd: null };
  const nowEnd = days[days.length - 1].date;
  const thenEnd = daysBefore(nowEnd, LOOKBACK_DAYS);
  const now = tailMean(days.map(valueOf));
  const prev = tailMean(days.filter((d) => d.date <= thenEnd).map(valueOf));
  if (now === null || prev === null) return { change: NO_CHANGE, prevEnd: null };
  return { change: { now, prev }, prevEnd: thenEnd };
}

/** One well's 30-day move per stream, from its daily series. */
export function thirtyDayChange(daily: readonly DailyProduction[]): WindowChange {
  const oil = streamChange(daily, (d) => d.measured.oil, (d) => d.oilBbl);
  const gas = streamChange(daily, (d) => d.measured.gas, (d) => d.gasMcf);
  return { oil: oil.change, gas: gas.change, oilPrevEnd: oil.prevEnd, gasPrevEnd: gas.prevEnd };
}

/** Every well's 30-day move, keyed by well id. */
export function thirtyDayChangeByWell(
  series: readonly WellDailySeries[]
): Map<string, WindowChange> {
  return new Map(series.map((s) => [s.wellId, thirtyDayChange(s.daily)]));
}

/** Some wells' 30-day move added — a lease's, or the company's. */
export function sumWindowChange(changes: readonly WindowChange[]): WindowChange {
  return {
    oil: changes.map((c) => c.oil).reduce(addChange, NO_CHANGE),
    gas: changes.map((c) => c.gas).reduce(addChange, NO_CHANGE),
    // A sum spans many wells' windows; it has no single earlier date.
    oilPrevEnd: null,
    gasPrevEnd: null,
  };
}
