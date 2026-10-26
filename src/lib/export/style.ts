/**
 * Shared visual tokens for the styled export formats (XLSX + PDF).
 *
 * The exports match the app's own primary treatment - near-black on near-white
 * (see `--primary` / `--primary-foreground` in globals.css) - rendered here as
 * a pure-black header row with white text, per the product requirement. Both
 * consumers need solid hex; ExcelJS wants 8-digit ARGB, react-pdf wants #RGB.
 */

/** Header row: black fill, white bold text. */
export const HEADER_FILL_ARGB = "FF000000";
export const HEADER_TEXT_ARGB = "FFFFFFFF";

export const HEADER_FILL_HEX = "#000000";
export const HEADER_TEXT_HEX = "#FFFFFF";

/** Body text + subtle rule/label colors (mirrors --foreground / --muted). */
export const BODY_TEXT_HEX = "#000000";
export const MUTED_TEXT_HEX = "#6B7280";
export const RULE_HEX = "#E5E7EB";
export const ZEBRA_FILL_ARGB = "FFF7F7F7";
/** A table's total row: a gray band, darker than the zebra stripe. */
export const TOTAL_FILL_HEX = "#E5E7EB";
export const TOTAL_FILL_ARGB = "FFE5E7EB";
