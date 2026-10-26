/**
 * Render exportable tables as GitHub-flavored markdown.
 *
 * A fourth view of the same `ColumnSpec[]` the CSV / XLSX / PDF serializers read
 * (see `columns.ts`), for reading a report as text: no PDF engine, no embedded
 * viewer, and no binary - just a heading per table and a pipe table under it.
 * Cells are formatted with the shared `formatCell`, so a value reads exactly as
 * it does in the PDF, and numeric/money columns carry GFM right-alignment.
 *
 * Pure module (no DOM, no Node, no deps) - safe to import anywhere.
 */

import {
  cellsOf,
  formatCell,
  headersOf,
  isRightAligned,
  isTotalRow,
  type ColumnSpec,
} from "@/lib/export/columns";
import type { ExportSheet } from "@/lib/export/workbook-export";

/**
 * Escape a cell for a pipe table: `|` would end the cell, and a newline would
 * end the row. A `<br>` would be the usual in-cell break, but renderers that
 * (rightly) don't allow raw HTML drop it and silently glue the two halves
 * together - so a newline collapses to a space instead.
 */
function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\s*\r?\n\s*/g, " ");
}

const row = (cells: string[]): string => `| ${cells.join(" | ")} |`;

/** One table as a GFM pipe table (header, alignment rule, then the rows). */
export function tableToMarkdown<T>(
  columns: ColumnSpec<T>[],
  rows: T[]
): string {
  if (columns.length === 0) return "";
  const lines = [
    row(headersOf(columns).map(escapeCell)),
    // `---:` right-aligns numeric and money columns, matching the PDF.
    row(columns.map((col) => (isRightAligned(col) ? "---:" : ":---"))),
    // A total row's cells are bold, which is how the viewer and the narration
    // know it (see `isMarkdownTotalRow`).
    ...rows.map((r) =>
      row(
        cellsOf(columns, r).map((value, i) => {
          const text = escapeCell(formatCell(value, columns[i]));
          return isTotalRow(r) && text ? `**${text}**` : text;
        })
      )
    ),
  ];
  return lines.join("\n");
}

/** True when every filled cell of a parsed markdown row is bold: a total row. */
export function isMarkdownTotalRow(cells: (string | null | undefined)[]): boolean {
  const filled = cells.filter((c): c is string => !!c && c.trim() !== "");
  return filled.length > 0 && filled.every((c) => /^\*\*.+\*\*$/.test(c.trim()));
}

/**
 * A whole document: `# title`, an optional subtitle line, then `## name` +
 * pipe table per sheet. A sheet with no rows says so rather than emitting a
 * headers-only table that reads as if data were missing from the renderer.
 */
export function sheetsToMarkdown(
  sheets: ExportSheet<unknown>[],
  opts: { title: string; subtitle?: string } = { title: "" }
): string {
  const blocks: string[] = [];
  if (opts.title) blocks.push(`# ${opts.title}`);
  if (opts.subtitle) blocks.push(`_${opts.subtitle}_`);
  for (const sheet of sheets) {
    blocks.push(`## ${sheet.name}`);
    blocks.push(
      sheet.rows.length === 0
        ? "_No rows._"
        : tableToMarkdown(sheet.columns, sheet.rows)
    );
  }
  return blocks.join("\n\n");
}

/**
 * A `sheetsToMarkdown` document without its subtitle line (the `_…_` paragraph
 * straight after the `# title`), for a screen whose pickers already say it.
 */
export function withoutSubtitle(markdown: string): string {
  return markdown.replace(/^(# [^\n]*\n\n)_[^\n]*_\n\n/, "$1");
}
