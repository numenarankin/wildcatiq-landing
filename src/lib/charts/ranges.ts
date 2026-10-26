/**
 * The window presets shared by every dated chart — the well/lease production
 * chart and the SWD disposal chart both slice their series with these, so
 * "3M" means the same span wherever the reader sees the buttons.
 *
 * `amount` is a count of DAILY rows (the daily views slice the tail); `months`
 * is the same window for the monthly views, which have one row per month and
 * would otherwise read 30 months as 30 days. 5Y is here because a lease's
 * public-record history goes back years and "12M or everything" made the middle
 * of that history unreachable.
 */
export const PRODUCTION_RANGES = [
  { value: "1M", amount: 30, months: 1 },
  { value: "3M", amount: 90, months: 3 },
  { value: "12M", amount: 365, months: 12 },
  { value: "5Y", amount: 1826, months: 60 },
  {
    value: "All",
    amount: Number.POSITIVE_INFINITY,
    months: Number.POSITIVE_INFINITY,
  },
] as const;

/**
 * Every preset label any chart offers, with its span in months. One table so
 * the user's global default (Settings > Charts) can be mapped onto whichever
 * presets a given chart has: the setting says "3M", the Recon production chart
 * offers 12M/5Y/10Y/All, and the chart opens on the nearest of those.
 */
export const RANGE_MONTHS: Record<string, number> = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "12M": 12,
  "24M": 24,
  "3Y": 36,
  "5Y": 60,
  "10Y": 120,
  All: Number.POSITIVE_INFINITY,
};

/** The values Settings > Charts offers for the default range. */
export const CHART_RANGE_OPTIONS = ["1M", "3M", "6M", "12M", "5Y", "10Y", "All"] as const;

export type ChartRangeOption = (typeof CHART_RANGE_OPTIONS)[number];

export function isChartRangeOption(value: unknown): value is ChartRangeOption {
  return typeof value === "string" && (CHART_RANGE_OPTIONS as readonly string[]).includes(value);
}

/**
 * The preset a chart opens on, given the user's global preference.
 *
 * An offered preset equal to the preference wins outright. Otherwise the
 * offered preset nearest in months wins, ties to the shorter. "All" is only
 * ever nearest to "All": a preference of All on a chart without it resolves to
 * the longest finite preset, and a chart offering All never opens on it for a
 * finite preference (nothing finite is nearer to infinity than to a number).
 * No preference, or a preference no table knows, yields `fallback`.
 */
export function resolveDefaultRange<V extends string>(
  offered: readonly { value: V }[],
  preferred: string | null | undefined,
  fallback: V
): V {
  if (!preferred) return fallback;
  const want = RANGE_MONTHS[preferred];
  if (want === undefined) return fallback;
  let best: V | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const { value } of offered) {
    const have = RANGE_MONTHS[value];
    if (have === undefined) continue;
    if (value === preferred) return value;
    const distance =
      Number.isFinite(want) && Number.isFinite(have)
        ? Math.abs(have - want)
        : Number.isFinite(want) === Number.isFinite(have)
          ? 0
          : Number.POSITIVE_INFINITY;
    if (distance < bestDistance) {
      best = value;
      bestDistance = distance;
    }
  }
  if (best !== null && Number.isFinite(bestDistance)) return best;
  // Preference is All and nothing offered is All: the longest finite preset.
  if (!Number.isFinite(want)) {
    let longest: V | null = null;
    let longestMonths = -1;
    for (const { value } of offered) {
      const have = RANGE_MONTHS[value];
      if (have !== undefined && Number.isFinite(have) && have > longestMonths) {
        longest = value;
        longestMonths = have;
      }
    }
    if (longest !== null) return longest;
  }
  return fallback;
}

/** A custom window, both ends inclusive, as `YYYY-MM-DD`. */
export interface CustomRange {
  from: string;
  to: string;
}

/** Keep only rows within the selected preset window or the custom range. */
export function windowRows<T extends { date: string }>(
  rows: T[],
  range: string,
  custom: CustomRange | null
): T[] {
  if (custom) {
    return rows.filter((r) => r.date >= custom.from && r.date <= custom.to);
  }
  const amount =
    PRODUCTION_RANGES.find((r) => r.value === range)?.amount ??
    Number.POSITIVE_INFINITY;
  return Number.isFinite(amount) ? rows.slice(-amount) : rows;
}

/**
 * How many days one drawn point averages over, per range: daily at 1M and 3M,
 * a week at 12M, a month at 5Y and All. A year of daily gauges is 365 jagged
 * points on a 900px card; averaged by the week it reads as a trend. A custom
 * range picks by its span, on the same breaks the presets sit at.
 */
export function bucketDaysFor(range: string, custom: CustomRange | null): number {
  const days = custom
    ? Math.round((Date.parse(`${custom.to}T00:00:00Z`) - Date.parse(`${custom.from}T00:00:00Z`)) / 86_400_000) + 1
    : (PRODUCTION_RANGES.find((r) => r.value === range)?.amount ?? Number.POSITIVE_INFINITY);
  if (days <= 90) return 1;
  if (days <= 365) return 7;
  return 30;
}

/** A row averaged over a bucket: `date` is the bucket's last day, `from` its first. */
export type Bucketed<T> = T & { from: string };

/**
 * Consecutive `days`-day buckets over a dated series, each numeric field the
 * MEAN of the rows that carry it (a null is a day not measured, and is not a
 * zero). Buckets are counted back from the LAST row, so the newest point is
 * always a whole bucket ending on the newest date rather than a stub at the
 * front of a calendar week. `days` of 1 returns the rows as they are. Pure.
 */
export function bucketRows<T extends { date: string }>(
  rows: readonly T[],
  days: number
): Bucketed<T>[] {
  if (rows.length === 0) return [];
  if (days <= 1) return rows.map((r) => ({ ...r, from: r.date }));
  const dayOf = (d: string) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 86_400_000);
  const last = dayOf(rows[rows.length - 1].date);
  const groups = new Map<number, T[]>();
  for (const r of rows) {
    // 0 is the bucket ending on the last row; -1 the one before, and so on.
    const g = -Math.floor((last - dayOf(r.date)) / days);
    const at = groups.get(g);
    if (at) at.push(r);
    else groups.set(g, [r]);
  }
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .map((g) => {
      const members = groups.get(g)!;
      const out = { ...members[members.length - 1], from: members[0].date } as Record<string, unknown>;
      for (const key of Object.keys(out)) {
        if (key === "date" || key === "from") continue;
        const values = members
          .map((m) => (m as Record<string, unknown>)[key])
          .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
        if (values.length > 0) out[key] = values.reduce((a, b) => a + b, 0) / values.length;
        else if (members.some((m) => typeof (m as Record<string, unknown>)[key] === "number" || (m as Record<string, unknown>)[key] === null)) out[key] = null;
      }
      return out as Bucketed<T>;
    });
}
