/**
 * Date labels for chart axes — one rule, so every chart's x-axis reads the same.
 *
 * A tick has room for about six characters. "Mar 15" answers "which day?" and
 * "Mar '26" answers "which year?", and there is no room to ask both — so the
 * axis asks whichever question its window leaves open. Inside a year the days
 * are what distinguish the ticks; across a year boundary a bare "Mar" is
 * ambiguous, and repeating the year on every tick is the clutter that made us
 * leave it off in the first place.
 *
 * The switch is the SPAN of what is on screen, not the range preset that
 * produced it: the presets window by row count, so a sparse series' "12M" can
 * reach back years, and a lease with three months of readings shows the same
 * three months under "All" as under "3M".
 *
 * Pure module (no DOM, no React) so charts and their tests share it.
 */

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});

const yearFormatter = new Intl.DateTimeFormat("en-US", {
  year: "2-digit",
  timeZone: "UTC",
});

/** Parse `YYYY-MM-DD` or `YYYY-MM` as UTC midnight. */
function parse(date: string): number {
  return Date.parse(
    date.length === 7 ? `${date}-01T00:00:00Z` : `${date}T00:00:00Z`
  );
}

/** "Mar 15" — the day, for a window inside a single year. */
export function dayTickLabel(date: string): string {
  return dayFormatter.format(parse(date));
}

/** "Dec '25" — the month and its year, for a window that crosses one. */
export function monthTickLabel(date: string): string {
  const ms = parse(date);
  return `${monthFormatter.format(ms)} '${yearFormatter.format(ms)}`;
}

/** Whole months between two dates ("2025-12-31" → "2026-01-01" is 1). */
function monthsApart(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/**
 * Does a window running `first`..`last` need the year on its ticks?
 *
 * True from about a year of span onward — the 12M window included, which lands
 * a day or two short of twelve whole months and would otherwise fall through to
 * day labels. Anything shorter stays on days, whichever preset or custom range
 * produced it.
 */
export function needsYearTicks(
  first: string | undefined,
  last: string | undefined
): boolean {
  if (!first || !last) return false;
  return monthsApart(first, last) >= 11;
}

/**
 * The label for one tick, given whether this axis is showing the year.
 * `withYear` comes from {@link needsYearTicks} over the same visible rows.
 */
export function dateTickLabel(date: string, withYear: boolean): string {
  return withYear ? monthTickLabel(date) : dayTickLabel(date);
}
