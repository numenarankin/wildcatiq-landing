// landing: the types from the app's src/lib/reports/schedule/actions.ts and
// no-op stand-ins for its server actions (the app's write
// `report_subscriptions` and revalidate the page).
import type { DigestPeriod } from "@/lib/reports/digest/period";

/**
 * How a report is delivered. One setting for the whole grid.
 *
 * No format: everything goes out as a PDF (`SCHEDULED_FORMAT`).
 */
export interface ReportDelivery {
  /** Local hour of day, 0-23. */
  sendHour: number;
  timezone: string;
}

export interface ReportSchedule extends ReportDelivery {
  /** `${reportId}:${frequency}` to on. Absent keys are off. */
  cells: Record<string, boolean>;
}

export async function loadReportSchedule(): Promise<ReportSchedule> {
  return { sendHour: 8, timezone: "America/Chicago", cells: {} };
}

export async function setReportScheduleCell(
  reportId: string,
  frequency: DigestPeriod,
  on: boolean
): Promise<void> {
  void reportId;
  void frequency;
  void on;
}

export async function saveReportDelivery(delivery: ReportDelivery): Promise<void> {
  void delivery;
}
