/**
 * Stat tiles inside markdown.
 *
 * Same trick as `./chart-embed`: a block that isn't text is emitted as a fenced
 * ```kpi block holding its data, and the markdown renderer swaps the fence for
 * the real cards. Keeps the document one string - narratable, diffable - while
 * the headline still reads as tiles rather than as a table of four numbers.
 *
 * Pure module - safe to import anywhere.
 */

import type { KpiTile } from "@/lib/reports/digest/kpi-tiles";

export interface KpiRowSpec {
  tiles: KpiTile[];
}

/** The fence language the renderer looks for (`language-kpi`). */
export const KPI_FENCE = "kpi";

/** A row of tiles as a fenced markdown block. */
export function kpiFence(tiles: KpiTile[]): string {
  return ["```" + KPI_FENCE, JSON.stringify({ tiles }), "```"].join("\n");
}

/** Parse a fence body back into tiles; null when it isn't a tile row. */
export function parseKpiSpec(body: string): KpiRowSpec | null {
  try {
    const spec = JSON.parse(body) as KpiRowSpec;
    return Array.isArray(spec?.tiles) ? spec : null;
  } catch {
    return null;
  }
}
