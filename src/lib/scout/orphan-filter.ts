/**
 * Orphans mode: the cut, and the count.
 *
 * Pure on purpose, for the same reason `permit-filter.ts` is: the orphan
 * source is CLUSTERED, and clustering happens at the source, so the only way
 * to filter it is to hand the map a different FeatureCollection. The payload
 * (`/api/scout/rrc/orphans`, ~12,000 points) is already in the browser, so
 * every cut here is a pass over memory, never a trip to the mirror.
 *
 * Two properties matter here. `plugged` is the state's own answer to whether
 * the hole has since been plugged (a W-3 or wellbore plug date not older than
 * the lease's last production), and it is what the dots are coloured by: the
 * list is a roster of liabilities, and a plugged one is no longer one.
 * `lastProd` is the lease's last month with nonzero production (`YYYY-MM`),
 * the filter a buyer uses to separate "stopped last year" from "stopped in
 * 1998". Production is lease-level at the RRC, so it is the lease's month.
 */
import type { Shape } from "./geo-shapes";
import { pointInShape } from "./geo-shapes";

export const ORPHAN_COLORS = {
  unplugged: "#dc2626",
  plugged: "#6b7280",
} as const;

export interface OrphanCounts {
  total: number;
  plugged: number;
  unplugged: number;
}

export interface OrphanCut {
  /** County names as the list writes them (upper case), or null for all. */
  countyNames: ReadonlySet<string> | null;
  /** One operator number, or null for all. */
  operatorNumber: number | null;
  shapes: readonly Shape[];
  /** Last-production bounds, inclusive `YYYY-MM-DD` (null = unbounded). */
  prodSince?: string | null;
  prodUntil?: string | null;
}

/** True when the feature's `plugged` property says so. */
export function isPlugged(p: GeoJSON.GeoJsonProperties): boolean {
  const v = p?.plugged;
  return v === true || v === 1 || v === "true";
}

/**
 * The payload narrowed to the bar's filters. County is matched by NAME,
 * case-insensitively, because the list carries names and not codes; a well
 * with no county on file fails a set county filter rather than passing.
 * Operator is compared numerically so the list's six-character padding
 * cannot split one operator in two. A last-production bound is applied to
 * the lease's month (`lastProd`, `YYYY-MM`) against the bound's month; a well
 * whose lease never reported production fails a set bound.
 */
export function filterOrphans(
  fc: GeoJSON.FeatureCollection,
  cut: OrphanCut
): GeoJSON.FeatureCollection {
  const { countyNames, operatorNumber, shapes } = cut;
  const since = cut.prodSince ? cut.prodSince.slice(0, 7) : null;
  const until = cut.prodUntil ? cut.prodUntil.slice(0, 7) : null;
  if (countyNames == null && operatorNumber == null && shapes.length === 0 && !since && !until) {
    return fc;
  }
  const wanted = countyNames
    ? new Set([...countyNames].map((c) => c.toUpperCase()))
    : null;
  return {
    ...fc,
    features: fc.features.filter((f) => {
      if (f.geometry.type !== "Point") return false;
      const p = f.properties ?? {};
      if (wanted && !wanted.has(String(p.county ?? "").toUpperCase())) return false;
      if (operatorNumber != null) {
        const raw = p.opNo;
        if (raw == null || raw === "" || Number(raw) !== operatorNumber) return false;
      }
      if (since || until) {
        const m = typeof p.lastProd === "string" ? p.lastProd.slice(0, 7) : "";
        if (!m) return false;
        if (since && m < since) return false;
        if (until && m > until) return false;
      }
      if (shapes.length > 0) {
        const [lon, lat] = f.geometry.coordinates;
        if (!shapes.some((sh) => pointInShape(sh, lon, lat))) return false;
      }
      return true;
    }),
  };
}

/** Count what is drawn inside `contains` (the viewport), plugged and not. */
export function countOrphans(
  fc: GeoJSON.FeatureCollection,
  contains: (lon: number, lat: number) => boolean
): OrphanCounts {
  const out: OrphanCounts = { total: 0, plugged: 0, unplugged: 0 };
  for (const f of fc.features) {
    if (f.geometry.type !== "Point") continue;
    const [lon, lat] = f.geometry.coordinates;
    if (!contains(lon, lat)) continue;
    out.total++;
    if (isPlugged(f.properties)) out.plugged++;
    else out.unplugged++;
  }
  return out;
}
