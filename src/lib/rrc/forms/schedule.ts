/**
 * When each RRC filing is due. Pure, no I/O.
 *
 * Every due date on the Filings page comes from `dueDate()` here, so the table,
 * the Due tab and a row's status cannot disagree about the same filing. The
 * rules, each from the RRC's own instructions (docs/plans/rrc-filings.md):
 *
 *  - Form PR: the last day of the month after the cycle (Form PR spec:817).
 *  - P-18: "on or before the 15th day of the month following the reporting
 *    period" (P-18 instructions, "When and where to file").
 *  - H-10: the RRC sets a cycle year per field; its examples (cycle 06/2019 to
 *    05/2020 due 07/01/2020; EDI sample cycle 202204 to 202303 due 05012023)
 *    are the first day of the second month after the cycle's last month.
 *  - W-10 annual, G-10 semi-annual (W-10/G-10 EDI spec, requirements 2 and 3);
 *    a survey is due "the first day of the month following the end of the test
 *    period" (w-10ins, g-10ins). Wildcat cannot see the RRC's survey letter, so
 *    it schedules from the well's latest test: 12 (or 6) months on, due the
 *    first of the following month. No test on file means due now.
 */

import { addCycles, cycleBounds, cycleDueDate, cycleLabel, isCycle } from "@/lib/rrc/form-pr/spec";

export type FormKind = "PR" | "H10" | "W10" | "G10" | "P18";

export const FORM_ORDER: FormKind[] = ["PR", "H10", "W10", "G10", "P18"];

/**
 * The forms the Filings page offers, one header tab each. Only the Form PR for
 * now (the user's call, 2026-10-15): the H-10, W-10/G-10 and P-18 builders stay
 * in the code but no row is docketed for them until they are added here.
 */
export const FILING_FORMS: FormKind[] = ["PR"];

export const FORM_LABELS: Record<FormKind, string> = {
  PR: "Form PR",
  H10: "H-10",
  W10: "W-10",
  G10: "G-10",
  P18: "P-18",
};

export const FORM_TITLES: Record<FormKind, string> = {
  PR: "Monthly Production Report",
  H10: "Annual Disposal/Injection Well Monitoring Report",
  W10: "Oil Well Status Report",
  G10: "Gas Well Status Report",
  P18: "Monthly Skim Oil/Condensate Report",
};

/** Months between the latest test and the next survey. */
export const TEST_WINDOW_MONTHS: Record<"W10" | "G10", number> = { W10: 12, G10: 6 };

/** ISO date `n` months after `iso`, clamped to the end of a short month. */
export function addMonths(iso: string, n: number): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1 + n;
  const d = Number(iso.slice(8, 10));
  const yy = y + Math.floor(m / 12);
  const mm = ((m % 12) + 12) % 12;
  const last = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
  return `${yy}-${String(mm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** First day of the month after the month `iso` falls in. */
export function firstOfNextMonth(iso: string): string {
  return `${addMonths(iso.slice(0, 7) + "-01", 1)}`;
}

/**
 * The due date of a filing for its period. `period` is `YYYYMM` for PR, P18
 * and H10 (the cycle year's LAST month), and the due date itself for W10/G10,
 * whose schedule is per well (see `nextTestDue`).
 */
export function dueDate(form: FormKind, period: string): string {
  switch (form) {
    case "PR":
      return cycleDueDate(period);
    case "P18":
      return `${cycleBounds(addCycles(period, 1)).from.slice(0, 8)}15`;
    case "H10":
      return cycleBounds(addCycles(period, 2)).from;
    case "W10":
    case "G10":
      return period;
  }
}

/** "August 2026", "Cycle year Jan 2026 to Dec 2026", or the due date's month. */
export function periodLabel(form: FormKind, period: string): string {
  if (form === "H10") {
    const first = addCycles(period, -11);
    return `${shortCycle(first)} to ${shortCycle(period)}`;
  }
  if (form === "W10" || form === "G10") {
    return cycleLabel(period.slice(0, 4) + period.slice(5, 7));
  }
  return cycleLabel(period);
}

function shortCycle(cycle: string): string {
  const y = Number(cycle.slice(0, 4));
  const m = Number(cycle.slice(4));
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** The twelve `YYYYMM` months of an H-10 cycle whose last month is `period`. */
export function h10Months(period: string): string[] {
  return Array.from({ length: 12 }, (_, i) => addCycles(period, i - 11));
}

/**
 * The most recent COMPLETED H-10 cycle for a well whose cycle year ends in
 * `endMonth` (1-12): the latest `YYYY{endMonth}` whose month has ended by
 * `today`. Returns the cycle's last month as `YYYYMM`.
 */
export function currentH10Period(endMonth: number, today: string): string {
  const mm = String(Math.min(12, Math.max(1, Math.round(endMonth)))).padStart(2, "0");
  const thisYear = `${today.slice(0, 4)}${mm}`;
  return thisYear < today.slice(0, 4) + today.slice(5, 7) ? thisYear : addCycles(thisYear, -12);
}

export interface TestSchedule {
  /** The due date the well's tests imply (ISO). */
  due: string;
  /** True when the latest test is older than the window, or there is none. */
  stale: boolean;
}

/**
 * When the next W-10 / G-10 is due, from the latest test date on file. A well
 * with no test is due today and stale.
 */
export function nextTestDue(form: "W10" | "G10", latestTestDate: string | null, today: string): TestSchedule {
  if (!latestTestDate) return { due: today, stale: true };
  const anniversary = addMonths(latestTestDate, TEST_WINDOW_MONTHS[form]);
  return { due: firstOfNextMonth(anniversary), stale: anniversary < today };
}

/** Is `period` well-formed for the form? */
export function isPeriod(form: FormKind, period: string): boolean {
  if (form === "W10" || form === "G10") return /^\d{4}-\d{2}-\d{2}$/.test(period);
  return isCycle(period);
}

/** `MM/DD/YYYY`, the W-10/G-10 date format. */
export function usDate(iso: string): string {
  return `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}`;
}

/** `MMDDYYYY`, the H-10 date format. */
export function compactDate(iso: string): string {
  return `${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(0, 4)}`;
}

/**
 * An RRC well number in its six-character form: positions 1-4 hold an optional
 * letter and the digits, right-justified; positions 5-6 hold trailing letters
 * (W-10/G-10 EDI spec, "Well Number Formatting Rules"; H-10 spec item 15).
 * `"1"` becomes `"   1  "`, `"2C"` becomes `"   2C "`, `"B124"` stays `"B124  "`.
 * A number the rule cannot express is returned trimmed for the validator to
 * refuse.
 */
export function formatWellNo(raw: string): string {
  const s = raw.replace(/[\s-]/g, "").toUpperCase();
  const m = /^([A-Z]?)(\d{1,4})([A-Z]{0,2})$/.exec(s);
  if (!m) return s.slice(0, 6);
  const left = (m[1] + m[2]).padStart(4, " ");
  if (left.length > 4) return s.slice(0, 6);
  return left + m[3].padEnd(2, " ");
}

/** The trailing well number in a well's name ("Roach 13W" gives "13W"). */
export function wellNoFromName(name: string): string {
  const m = /([A-Z]?\d{1,4}[A-Z]{0,2})\s*$/i.exec(name.trim());
  return m ? m[1].toUpperCase() : "";
}
