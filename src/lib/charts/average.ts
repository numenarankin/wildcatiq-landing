/**
 * The mean of what is on screen.
 *
 * The "Average" line every dated chart can draw is the arithmetic mean of the
 * plotted series over the rows currently drawn: windowed by the range or
 * custom dates and, where the chart buckets, the bucket means. Null is a day
 * not measured and does not count; a row whose value is not a finite number is
 * skipped the same way. No countable rows means no line (null), never zero.
 */
export function meanOf<T>(rows: readonly T[], key: keyof T): number | null {
  let sum = 0;
  let count = 0;
  for (const row of rows) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      sum += v;
      count += 1;
    }
  }
  return count === 0 ? null : sum / count;
}

/** The color every average line draws in: red-600, the one color no series uses. */
export const AVERAGE_LINE_COLOR = "#dc2626";

/** The dash pattern of an average line. */
export const AVERAGE_LINE_DASH = "4 4";
