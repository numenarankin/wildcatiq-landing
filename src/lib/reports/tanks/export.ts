/**
 * Column models + CSV serialization for the three tank reports (GBC-10).
 *
 * Each report's one `ColumnSpec` set drives all three export formats (CSV here,
 * XLSX and PDF in the export routes) plus the on-screen View modal, so headers
 * and cell values can never drift apart. Pure module (no DOM, no Node) - safe to
 * import anywhere and unit-testable.
 */

import { columnsToCsv } from "@/lib/export/csv";
import { sanitizeFilename } from "@/lib/export/download";
import { EXPORT_EXT, type ExportFormat } from "@/lib/export/mime";
import type { ColumnSpec } from "@/lib/export/columns";
import type {
  BatteryCapacityTank,
  CalledInTankRow,
  TankAuditRow,
  TankMeasurementRow,
} from "@/lib/reports/tanks/types";

/** Round a nullable number to 1 decimal for display, or null. */
function round1(n: number | null | undefined): number | null {
  return n == null ? null : Math.round(n * 10) / 10;
}

// --- Battery Capacity -------------------------------------------------------

/** One flattened battery-capacity row: a tank with its battery name. */
export type BatteryCapacityExportRow = BatteryCapacityTank & { battery: string };

export const BATTERY_CAPACITY_COLUMNS: ColumnSpec<BatteryCapacityExportRow>[] = [
  { header: "Battery", value: (r) => r.battery || "Standalone", width: 24 },
  { header: "Tank", value: (r) => r.tankName, width: 24 },
  { header: "Product", value: (r) => r.product, width: 10 },
  { header: "Capacity (bbl)", value: (r) => round1(r.capacityBbls), numeric: true, width: 16 },
  { header: "Used (bbl)", value: (r) => round1(r.usedBbls), numeric: true, width: 14 },
  { header: "Capacity (in)", value: (r) => round1(r.capacityInches), numeric: true, width: 15 },
  { header: "Used (in)", value: (r) => round1(r.usedInches), numeric: true, width: 13 },
  { header: "% Full", value: (r) => round1(r.pctFull), numeric: true, width: 10 },
];

export function batteryCapacityToCsv(rows: BatteryCapacityExportRow[]): string {
  return columnsToCsv(BATTERY_CAPACITY_COLUMNS, rows);
}

// --- Tanks Called In --------------------------------------------------------

export const TANKS_CALLED_IN_COLUMNS: ColumnSpec<CalledInTankRow>[] = [
  { header: "Tank", value: (r) => r.tankName, width: 24 },
  { header: "Battery", value: (r) => r.battery || "Standalone", width: 22 },
  { header: "Product", value: (r) => r.product, width: 10 },
  { header: "Stock (bbl)", value: (r) => round1(r.stockBbls), numeric: true, width: 14 },
  { header: "% Full", value: (r) => round1(r.pctFull), numeric: true, width: 10 },
  { header: "Gatherer", value: (r) => r.gatherer, width: 22 },
  { header: "Called In", value: (r) => r.calledInAt.slice(0, 10), width: 14 },
  { header: "Days Since", value: (r) => r.daysSinceCalledIn, numeric: true, width: 12 },
];

export function tanksCalledInToCsv(rows: CalledInTankRow[]): string {
  return columnsToCsv(TANKS_CALLED_IN_COLUMNS, rows);
}

// --- Tank Measurement Audit -------------------------------------------------

/** Format an ISO timestamp to `YYYY-MM-DD HH:MM`, or "" when absent. */
function stampMinute(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16).replace("T", " ");
}

export const TANK_AUDIT_COLUMNS: ColumnSpec<TankAuditRow>[] = [
  { header: "Battery", value: (r) => r.battery || "Standalone", width: 20 },
  { header: "Tank", value: (r) => r.tankName, width: 20 },
  { header: "Reading Date", value: (r) => r.readingDate, width: 14 },
  { header: "Gauge (in)", value: (r) => round1(r.gauge), numeric: true, width: 12 },
  { header: "Bbls", value: (r) => round1(r.bbls), numeric: true, width: 12 },
  { header: "Status", value: (r) => r.status, width: 10 },
  { header: "Created By", value: (r) => r.createdBy, width: 20 },
  { header: "Created At", value: (r) => stampMinute(r.createdAt), width: 18 },
  { header: "Updated By", value: (r) => r.updatedBy, width: 20 },
  { header: "Updated At", value: (r) => stampMinute(r.updatedAt), width: 18 },
  { header: "Deleted By", value: (r) => r.deletedBy, width: 20 },
  { header: "Deleted At", value: (r) => stampMinute(r.deletedAt), width: 18 },
];

export function tankAuditToCsv(rows: TankAuditRow[]): string {
  return columnsToCsv(TANK_AUDIT_COLUMNS, rows);
}

// --- Tank Measurements (raw gauge listing) ---------------------------------

export const TANK_MEASUREMENTS_COLUMNS: ColumnSpec<TankMeasurementRow>[] = [
  { header: "Battery", value: (r) => r.battery || "Standalone", width: 20 },
  { header: "Tank", value: (r) => r.tankName, width: 20 },
  { header: "Product", value: (r) => r.product, width: 10 },
  { header: "Date", value: (r) => r.readingDate, width: 14 },
  { header: "Time", value: (r) => r.readingTime, width: 10 },
  { header: "Gauge (in)", value: (r) => round1(r.gauge), numeric: true, width: 12 },
  { header: "Bbls", value: (r) => round1(r.bbls), numeric: true, width: 12 },
  { header: "Change (bbl)", value: (r) => round1(r.changeBbls), numeric: true, width: 14 },
];

export function tankMeasurementsToCsv(rows: TankMeasurementRow[]): string {
  return columnsToCsv(TANK_MEASUREMENTS_COLUMNS, rows);
}

// --- Filenames --------------------------------------------------------------

export function tankReportFilename(
  slug:
    | "battery-capacity"
    | "tanks-called-in"
    | "tank-audit"
    | "tank-measurements",
  format: ExportFormat
): string {
  return `${sanitizeFilename(slug)}.${EXPORT_EXT[format]}`;
}
