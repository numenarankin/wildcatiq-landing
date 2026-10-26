/** Shared MIME types + file extensions for the three export formats. */

export type ExportFormat = "csv" | "xlsx" | "pdf";

export const EXPORT_MIME: Record<ExportFormat, string> = {
  csv: "text/csv;charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

export const EXPORT_EXT: Record<ExportFormat, string> = {
  csv: "csv",
  xlsx: "xlsx",
  pdf: "pdf",
};

/** Narrow an arbitrary string (e.g. a query param) to a known export format. */
export function parseFormat(value: string | null | undefined): ExportFormat | null {
  return value === "csv" || value === "xlsx" || value === "pdf" ? value : null;
}
