/**
 * Calendar periods for the period production reports (Weekly, Monthly,
 * Quarterly, Annual Production) - pure, no I/O, no clock reads.
 *
 * Each report covers ONE named period the reader picks, defaulting to the most
 * recent complete one. A trailing window ("the last 30 days") means something
 * different every day; "September 2026" means the same thing every time it is
 * opened, which is what makes it comparable to a purchaser statement or last
 * year's run.
 *
 * Weeks run Monday to Sunday. A period is identified by its key, which is what
 * the `?period=` query param and the export filename carry:
 *
 *   week     2026-09-21   (the Monday)
 *   month    2026-09
 *   quarter  2026-Q3
 *   year     2026
 */

export type ProductionPeriodKind = "week" | "month" | "quarter" | "year";

export interface ProductionPeriod {
  kind: ProductionPeriodKind;
  key: string;
  /** Inclusive first ISO date. */
  start: string;
  /** Inclusive last ISO date. */
  end: string;
  /** "Sep 21 to Sep 27, 2026" / "September 2026" / "Q3 2026" / "2026". */
  label: string;
}

/** How many periods the picker offers, newest first. */
const PICKER_DEPTH: Record<ProductionPeriodKind, number> = {
  week: 104,
  month: 60,
  quarter: 20,
  year: 10,
};

const DAY_MS = 86_400_000;

function shift(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function iso(y: number, m: number, d: number): string {
  return new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
}

/** Last day of month `m` (1-based) of year `y`. */
function monthEnd(y: number, m: number): string {
  return iso(y, m + 1, 0);
}

const MONTH = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function weekLabel(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const sy = s.getUTCFullYear();
  const ey = e.getUTCFullYear();
  return sy === ey
    ? `${DAY.format(s)} to ${DAY.format(e)}, ${ey}`
    : `${DAY.format(s)}, ${sy} to ${DAY.format(e)}, ${ey}`;
}

/** The period of `kind` that contains the ISO date `day`. */
export function periodContaining(
  kind: ProductionPeriodKind,
  day: string
): ProductionPeriod {
  const y = Number(day.slice(0, 4));
  const m = Number(day.slice(5, 7));
  if (kind === "year") {
    return { kind, key: String(y), start: iso(y, 1, 1), end: iso(y, 12, 31), label: String(y) };
  }
  if (kind === "quarter") {
    const q = Math.ceil(m / 3);
    const first = (q - 1) * 3 + 1;
    return {
      kind,
      key: `${y}-Q${q}`,
      start: iso(y, first, 1),
      end: monthEnd(y, first + 2),
      label: `Q${q} ${y}`,
    };
  }
  if (kind === "month") {
    const start = iso(y, m, 1);
    return {
      kind,
      key: start.slice(0, 7),
      start,
      end: monthEnd(y, m),
      label: MONTH.format(new Date(`${start}T00:00:00Z`)),
    };
  }
  // getUTCDay: 0 = Sunday. Monday-based offset back to the week's first day.
  const back = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7;
  const start = shift(day, -back);
  const end = shift(start, 6);
  return { kind, key: start, start, end, label: weekLabel(start, end) };
}

/** The period immediately before `p`. */
export function previousPeriod(p: ProductionPeriod): ProductionPeriod {
  return periodContaining(p.kind, shift(p.start, -1));
}

/**
 * The newest period that ended before `today`. The one containing today is
 * still filling in, so it is never the default.
 */
export function latestCompletePeriod(
  kind: ProductionPeriodKind,
  today: string
): ProductionPeriod {
  return previousPeriod(periodContaining(kind, today));
}

/** A period from its key, or null when the key is not one of `kind`'s. */
export function parsePeriodKey(
  kind: ProductionPeriodKind,
  key: string | null | undefined
): ProductionPeriod | null {
  if (!key) return null;
  const shape: Record<ProductionPeriodKind, RegExp> = {
    week: /^\d{4}-\d{2}-\d{2}$/,
    month: /^\d{4}-(0[1-9]|1[0-2])$/,
    quarter: /^\d{4}-Q[1-4]$/,
    year: /^\d{4}$/,
  };
  if (!shape[kind].test(key)) return null;
  const day =
    kind === "year"
      ? `${key}-01-01`
      : kind === "quarter"
        ? `${key.slice(0, 4)}-${String((Number(key.slice(6)) - 1) * 3 + 1).padStart(2, "0")}-01`
        : kind === "month"
          ? `${key}-01`
          : key;
  if (Number.isNaN(Date.parse(`${day}T00:00:00Z`))) return null;
  const p = periodContaining(kind, day);
  // A week is named by its Monday; any other day is not that week's key.
  return p.key === key ? p : null;
}

/** The requested period, else the latest complete one. */
export function resolvePeriod(
  kind: ProductionPeriodKind,
  key: string | null | undefined,
  today: string
): ProductionPeriod {
  return parsePeriodKey(kind, key) ?? latestCompletePeriod(kind, today);
}

/** The picker's choices: complete periods, newest first. */
export function periodOptions(
  kind: ProductionPeriodKind,
  today: string
): ProductionPeriod[] {
  const out = [latestCompletePeriod(kind, today)];
  while (out.length < PICKER_DEPTH[kind]) out.push(previousPeriod(out[out.length - 1]));
  return out;
}

/** Document subtitle: the period's name plus its exact bounds. */
export function periodSubtitle(p: ProductionPeriod): string {
  return `${p.label} (${p.start} to ${p.end})`;
}
