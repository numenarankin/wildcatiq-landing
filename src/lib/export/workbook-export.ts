// landing: type-only mirror of the app's src/lib/export/workbook-export.tsx
// (the builder itself needs ExcelJS, JSZip and react-pdf).
import type { ColumnSpec } from "@/lib/export/columns";

/** One table in a workbook: its sheet/section name, columns, and rows. */
export interface ExportSheet<T> {
  name: string;
  columns: ColumnSpec<T>[];
  rows: T[];
}
