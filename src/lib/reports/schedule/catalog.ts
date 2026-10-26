/**
 * The schedulable-report catalog: which reports the Reports schedule table
 * offers, and which of them the cron can actually build and email today.
 *
 * Pure and client-safe - the rows are DERIVED from the reports hub
 * (`@/lib/reports/hub/sources`) rather than listed again here, so the table
 * gains a report the moment the hub does and the two can never drift. The server
 * passes `listHubReports(can)` through {@link scheduleRowsFromHub}; capability
 * filtering has already happened there, so a reader is never offered a schedule
 * for a report they cannot open.
 *
 * A row's `id` is what `report_subscriptions.report_id` stores.
 */

import type { DigestPeriod } from "@/lib/reports/digest/period";
import type { ExportFormat } from "@/lib/export/mime";

/**
 * Every scheduled report is emailed as a PDF.
 *
 * The subscription row still carries a format column (xlsx / csv were once
 * offered, and an old row may still say so), but nothing writes anything else
 * and the cron attaches this regardless - one answer, so a reader cannot be
 * surprised by the file they get. Offering the choice again means putting the
 * picker back and dropping this constant, not editing rows.
 */
export const SCHEDULED_FORMAT: ExportFormat = "pdf";

/** The columns of the schedule grid, in order. */
export const SCHEDULE_FREQUENCIES: DigestPeriod[] = [
  "daily",
  "weekly",
  "monthly",
];

export const FREQUENCY_LABEL: Record<DigestPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** The company digest: three hub reports (one per period), ONE schedule row. */
export const COMPANY_DIGEST_ID = "company-digest";

/** Per-well production history - a report per well, so never a schedule row. */
const WELL_HISTORY_PREFIX = "production-history-";

/**
 * Reports the cron can build for an org with no RLS session (see
 * `@/lib/reports/schedule/build`). Everything else is listed in the table but
 * cannot be switched on: an operator who can see a schedule that silently never
 * sends has been lied to, so the row says so instead.
 */
function isDeliverable(id: string): boolean {
  return id === COMPANY_DIGEST_ID || id.startsWith("production-");
}

export interface ScheduleRow {
  /** Stored in `report_subscriptions.report_id`. */
  id: string;
  title: string;
  /** The hub group it lives under ("Company", "Tanks", …). */
  group: string;
  /** False while the cron has no org-scoped builder for this report. */
  deliverable: boolean;
}

interface HubLike {
  id: string;
  title: string;
  group: string;
}

/**
 * Collapse the hub's report list into schedule rows.
 *
 * The three `company-digest-*` hub reports ARE the digest at three frequencies,
 * so they become one row whose columns carry the period. Per-well history is
 * dropped. Everything else is one row, one report.
 */
export function scheduleRowsFromHub(reports: HubLike[]): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let digestAdded = false;
  for (const r of reports) {
    if (r.id.startsWith(WELL_HISTORY_PREFIX)) continue;
    if (r.id.startsWith(`${COMPANY_DIGEST_ID}-`)) {
      if (digestAdded) continue;
      digestAdded = true;
      rows.push({
        id: COMPANY_DIGEST_ID,
        title: "Company Digest",
        group: r.group,
        deliverable: true,
      });
      continue;
    }
    rows.push({
      id: r.id,
      title: r.title,
      group: r.group,
      deliverable: isDeliverable(r.id),
    });
  }
  return rows;
}

/** The hub report a schedule cell opens: the digest's period picks its own. */
export function hubReportIdFor(reportId: string, frequency: DigestPeriod): string {
  return reportId === COMPANY_DIGEST_ID
    ? `${COMPANY_DIGEST_ID}-${frequency}`
    : reportId;
}

/** One cell's key in the schedule map. */
export function cellKey(reportId: string, frequency: DigestPeriod): string {
  return `${reportId}:${frequency}`;
}
