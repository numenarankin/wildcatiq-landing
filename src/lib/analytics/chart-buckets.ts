import type { WellDailySeries } from "@/lib/analytics/types";

/**
 * Daily and weekly bucketing for the production charts — pure, so the rule that
 * decides what an unread day means can be checked against a hand-computed
 * oracle instead of by eye on a chart.
 *
 * ## What a missing reading means, and why it depends on the view
 *
 * A day with no reading is not a day of no production. It is a day nobody wrote
 * a number down, and the two must not render the same. What to DO about it
 * differs by what is being drawn:
 *
 *   AGGREGATE (the company)  carry each well's last measured rate forward. The
 *                            well is producing between gauges, and dropping it
 *                            makes every unread well quietly subtract itself, so
 *                            the newest buckets dive as the pumper falls behind.
 *   ONE FACILITY             leave the bucket out. There is no total to keep
 *                            whole here, and the honest answer is that we have
 *                            no reading — so the line ends where the readings
 *                            end rather than continuing on an assumption.
 *
 * A reading that exists and says zero is a measurement either way, and counts.
 */

export interface BucketPreset {
  /** Days of history to cover, ending at the newest reported day. */
  days: number;
  bucket: "day" | "week";
}

export interface BucketTotals {
  /** Bucket key: the day, or the Monday of the week. */
  key: string;
  oil: number;
  gas: number;
  water: number;
  /**
   * USD/day at each day's own realized price (`DailyProduction.oilRevenue` +
   * `gasRevenue`), carried and summed the way the volumes are. Null when no day
   * in the series was priced, and the caller values the volumes at today's
   * price instead.
   */
  revenue: number | null;
  /** True when at least one well was actually read in this bucket. */
  reported: boolean;
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** The Monday of a date's week. */
export function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -back);
}

interface Streams {
  oil: { total: number; days: number };
  gas: { total: number; days: number };
  water: { total: number; days: number };
  /** Priced days only: a day's dollars count where the day carried a price. */
  oilRevenue: { total: number; days: number };
  gasRevenue: { total: number; days: number };
}

const blank = (): Streams => ({
  oil: { total: 0, days: 0 },
  gas: { total: 0, days: 0 },
  water: { total: 0, days: 0 },
  oilRevenue: { total: 0, days: 0 },
  gasRevenue: { total: 0, days: 0 },
});

/**
 * Bucket a set of per-well daily series into per-bucket daily RATES.
 *
 * Each stream is divided by the days THAT stream was measured, never by the
 * bucket's length: a week with two gauges is a two-day average, not a week's
 * volume spread over seven.
 *
 * `aggregate` is the company view. See the module comment for what it changes.
 */
export function bucketWellSeries(
  series: WellDailySeries[],
  preset: BucketPreset,
  aggregate: boolean
): BucketTotals[] {
  if (series.length === 0) return [];
  const bucketOf = (date: string) =>
    preset.bucket === "week" ? weekStart(date) : date;

  // The window ends at the newest day anything was reported, not at today.
  const newest = series.reduce((max, w) => {
    const last = w.daily[w.daily.length - 1]?.date;
    return last && last > max ? last : max;
  }, "");
  if (!newest) return [];
  const cutoff = addDays(newest, -(preset.days - 1));

  const keys: string[] = [];
  for (let d = bucketOf(cutoff); d <= newest; d = addDays(d, 1)) {
    const key = bucketOf(d);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }

  const totals = new Map<string, BucketTotals>(
    keys.map((key) => [key, { key, oil: 0, gas: 0, water: 0, revenue: null, reported: false }])
  );

  for (const well of series) {
    const byKey = new Map<string, Streams>();
    for (const d of well.daily) {
      if (d.date < cutoff) continue;
      const key = bucketOf(d.date);
      const b = byKey.get(key) ?? blank();
      const m = d.measured ?? { oil: true, gas: true, water: true };
      if (m.oil) {
        b.oil.total += d.oilBbl;
        b.oil.days += 1;
        if (d.oilRevenue != null) {
          b.oilRevenue.total += d.oilRevenue;
          b.oilRevenue.days += 1;
        }
      }
      if (m.gas) {
        b.gas.total += d.gasMcf;
        b.gas.days += 1;
        if (d.gasRevenue != null) {
          b.gasRevenue.total += d.gasRevenue;
          b.gasRevenue.days += 1;
        }
      }
      if (m.water) {
        b.water.total += d.water;
        b.water.days += 1;
      }
      byKey.set(key, b);
    }

    const carried = {
      oil: null as number | null,
      gas: null as number | null,
      water: null as number | null,
      oilRevenue: null as number | null,
      gasRevenue: null as number | null,
    };
    for (const key of keys) {
      const b = byKey.get(key);
      const rate = (
        stream: { total: number; days: number } | undefined,
        held: number | null
      ) =>
        stream && stream.days > 0
          ? stream.total / stream.days
          : aggregate
            ? held
            : null;
      carried.oil = rate(b?.oil, carried.oil);
      carried.gas = rate(b?.gas, carried.gas);
      carried.water = rate(b?.water, carried.water);
      // Dollars carry with their volume: an unread well keeps earning its last
      // measured day's take, at that day's price, until it is read again.
      carried.oilRevenue = rate(b?.oilRevenue, carried.oilRevenue);
      carried.gasRevenue = rate(b?.gasRevenue, carried.gasRevenue);
      const t = totals.get(key)!;
      if (carried.oil != null) t.oil += carried.oil;
      if (carried.gas != null) t.gas += carried.gas;
      if (carried.water != null) t.water += carried.water;
      if (carried.oilRevenue != null) t.revenue = (t.revenue ?? 0) + carried.oilRevenue;
      if (carried.gasRevenue != null) t.revenue = (t.revenue ?? 0) + carried.gasRevenue;
      if (b) t.reported = true;
    }
  }

  // On one facility, a bucket nobody read is not a point. On the company line
  // every bucket stands, carried.
  return keys
    .map((key) => totals.get(key)!)
    .filter((t) => aggregate || t.reported);
}
