// landing: type-only mirror of the app's src/lib/statements/checks.ts (the
// checks themselves read the server-side extract types). The review grid only
// needs the finding shape.

export type WarningCode =
  /** netValue differs from gross - deducts - taxes (- fees on gas). */
  | "net-mismatch"
  /** |volume x price - gross| is outside tolerance. */
  | "price-mismatch"
  /** Sum of line netValue differs from the statement's own printed total. */
  | "total-mismatch"
  /** periodEnd is before periodStart, or a date isn't ISO. */
  | "period-invalid"
  /** A line carries value but no volume, usually a misread column. */
  | "zero-volume"
  /** A lease was printed on the line but resolved to nothing. */
  | "unmatched-lease"
  /** The transcription marked this line's source text illegible (`[?]`). */
  | "illegible-source";

/** One finding, addressed to a specific statement and (usually) a line. */
export interface StatementWarning {
  code: WarningCode;
  /** Index into the extracted `statements` array. */
  statement: number;
  /** Index into that statement's `lineItems`, or null for header-level. */
  line: number | null;
  /** Human-readable, shown next to the field it concerns. */
  message: string;
}
