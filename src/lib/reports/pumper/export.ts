/**
 * Column models + CSV for the Pumper Report.
 *
 * Two tables, because the report answers the question at two grains: the
 * per-facility visitation rate (the table the client asked for) and the daily
 * aggregate (the series the line chart plots). One `ColumnSpec` set each drives
 * CSV, XLSX and PDF, so the file, the spreadsheet and the page can never disagree
 * on a header or a cell.
 *
 * The CSV is the per-facility table - that is the report's subject. The XLSX
 * carries both as separate sheets, so the chart's underlying numbers are
 * auditable without re-deriving them.
 *
 * Rates are rounded to one decimal at the presentation edge only; the report
 * itself keeps full precision so the headline stat and the chart still reconcile.
 *
 * Pure module (no DOM, no Node) - safe to import anywhere.
 */

import { columnsToCsv } from "@/lib/export/csv";
import { sanitizeFilename } from "@/lib/export/download";
import { EXPORT_EXT, type ExportFormat } from "@/lib/export/mime";
import type { ColumnSpec } from "@/lib/export/columns";
import type {
  PumperCoverageReport,
  PumperDailyCoverage,
  PumperFacilityCoverage,
} from "@/lib/reports/pumper/types";

/** One decimal, for a rate that is read rather than recomputed. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export const PUMPER_FACILITY_COLUMNS: ColumnSpec<PumperFacilityCoverage>[] = [
  { header: "Facility", value: (r) => r.facilityName, width: 30 },
  { header: "Type", value: (r) => r.kindLabel, width: 16 },
  { header: "Days Visited", value: (r) => r.daysLogged, numeric: true, width: 14 },
  { header: "Days in Range", value: (r) => r.daysInWindow, numeric: true, width: 15 },
  {
    header: "Visitation Rate (%)",
    value: (r) => round1(r.coveragePct),
    numeric: true,
    width: 19,
  },
  { header: "Last Visit", value: (r) => r.lastLogged, width: 14 },
  {
    header: "Days Since",
    value: (r) => r.daysSinceLast,
    numeric: true,
    width: 12,
  },
];

export const PUMPER_DAILY_COLUMNS: ColumnSpec<PumperDailyCoverage>[] = [
  { header: "Date", value: (r) => r.date, width: 14 },
  {
    header: "Facilities Visited",
    value: (r) => r.facilitiesLogged,
    numeric: true,
    width: 18,
  },
  { header: "Facilities", value: (r) => r.facilityCount, numeric: true, width: 12 },
  {
    header: "Coverage (%)",
    value: (r) => round1(r.coveragePct),
    numeric: true,
    width: 14,
  },
];

/** The per-facility table - the CSV a reader expects from this report. */
export function pumperFacilitiesToCsv(report: PumperCoverageReport): string {
  return columnsToCsv(PUMPER_FACILITY_COLUMNS, report.facilities);
}

/** The daily aggregate series (the chart's numbers). */
export function pumperDailyToCsv(report: PumperCoverageReport): string {
  return columnsToCsv(PUMPER_DAILY_COLUMNS, report.daily);
}

/** Export filename, window-slugged so a 7-day file can't be mistaken for MTD. */
export function pumperReportFilename(
  format: ExportFormat,
  windowSlug: string
): string {
  return `${sanitizeFilename(`pumper-report-${windowSlug}`)}.${EXPORT_EXT[format]}`;
}
