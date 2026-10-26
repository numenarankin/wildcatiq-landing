import { ymd8ToIso } from "./completion-codes";
import type { CompletionReport, WellboreFiling, WellboreRow } from "./rrc-types";

/**
 * The Completions tab's date range, applied to the three dated lists it shows.
 *
 * Each list dates a completion its own way: the EWA wellbore row by its
 * `completion_date` (CCYYMMDD), the Well Bore Database filing by the
 * completion date it states (falling back to its file date), the W-2/G-1
 * packet by the completion date filed (falling back to approval). All three
 * are compared as `YYYY-MM-DD`, inclusive at both ends. An undated record is
 * EXCLUDED once either bound is set, as every other date band on the map
 * treats a missing date: unfiled is not "any time".
 */
export interface DateRange {
  since: string | null;
  until: string | null;
}

export function inDateRange(iso: string | null | undefined, r: DateRange): boolean {
  if (!r.since && !r.until) return true;
  if (!iso) return false;
  return (!r.since || iso >= r.since) && (!r.until || iso <= r.until);
}

export function completionsInRange(rows: WellboreRow[], r: DateRange): WellboreRow[] {
  return rows.filter((row) => inDateRange(ymd8ToIso(row.completion_date), r));
}

export function filingsInRange(filings: WellboreFiling[], r: DateRange): WellboreFiling[] {
  return filings.filter((f) => inDateRange(f.completion_date ?? f.file_date, r));
}

export function reportsInRange(reports: CompletionReport[], r: DateRange): CompletionReport[] {
  return reports.filter((p) => inDateRange(p.completion_date ?? p.approved_date, r));
}

/**
 * A band typed as months (`YYYY-MM`, "" for open) as the day range it means:
 * the first of the From month through the last day of the To month. The
 * Completions tab takes months because that is how a date is typed everywhere
 * else on Recon (`MonthInput`); completions carry a day, so the month is
 * widened to cover all of it.
 */
export function monthRange(from: string, to: string): DateRange {
  const since = /^\d{4}-\d{2}$/.test(from) ? `${from}-01` : null;
  let until: string | null = null;
  if (/^\d{4}-\d{2}$/.test(to)) {
    const [y, m] = to.split("-").map(Number);
    // Day 0 of the next month is this month's last day; local, no UTC shift.
    const last = new Date(y, m, 0).getDate();
    until = `${to}-${String(last).padStart(2, "0")}`;
  }
  return { since, until };
}
