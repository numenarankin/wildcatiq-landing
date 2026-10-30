/**
 * Recon's fixture: the filters bar in Permits mode over Young County and one
 * approved new-drill permit open in the panel. The permit key's counts and the
 * purpose menu are counted from the drawn permits (`recon/layer-data.ts`). Types are the app's own (`Filters`, `PurposeOption`); the permit
 * record carries the fields `PermitPanel` reads off `/api/scout/rrc/pending`.
 *
 * The permit is simulated: Tonk Creek Operating (a fictional operator) on its
 * Harlan Ranch lease, a vertical Caddo test half a mile west of Sky's
 * Johnson A 3. Its API and the operator's name and number are absent from the
 * RRC's Young County wellbores and P-5 list.
 */
import { DEFAULT_FILTERS, type Filters } from "@/components/scout/map-filters";
import type { CommodityPrices } from "@/lib/analytics/types";
import { OPERATOR, PRICES } from "./operator";
import { wellLngLat } from "./recon-dossier-fixture";

/** RRC county code for Young County (`COUNTY_NAMES`). */
export const YOUNG_COUNTY = Number(OPERATOR.countyCode);

export const reconFilters: Filters = {
  ...DEFAULT_FILTERS,
  mode: "permits",
  county: YOUNG_COUNTY,
};

/** The bar's WTI and Henry Hub quotes: the one price every page shows. */
export const reconPrices: CommodityPrices = PRICES;

/** The neighbour who filed it (fictional). */
export const PERMIT_OPERATOR = { name: "TONK CREEK OPERATING LLC", short: "Tonk Creek Operating", no: "854127" } as const;

/** Johnson A 3, the Sky well the permit sits beside: the third well on the Johnson A ring. */
export const A3_LNG_LAT = wellLngLat("l-johnson", 2);

/** The permit's surface location: 0.5 mi due west of Johnson A 3. */
export const PERMIT_LNG_LAT: [number, number] = [
  A3_LNG_LAT[0] - 0.5 / (69.17 * Math.cos((A3_LNG_LAT[1] * Math.PI) / 180)),
  A3_LNG_LAT[1],
];

/** Miles between two points, on a sphere. */
export function milesBetween(a: [number, number], b: [number, number]): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b[1] - a[1]);
  const dLng = r(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(h));
}

/**
 * The open permit: Tonk Creek's Harlan Ranch 3, approved three days ago, a
 * 4,400 ft vertical to the Caddo. No `permitNo` on the hero, so the panel does
 * not ask for the W-1 file. The Permits section opens the same permit with its
 * number (`reconPermitWithFile`) and the file listed.
 */
export const reconPermit: Record<string, unknown> = {
  kind: "approved",
  lease: "HARLAN RANCH",
  well: "3",
  county: "YOUNG",
  district: "09",
  days: 3,
  op: PERMIT_OPERATOR.name,
  opNo: PERMIT_OPERATOR.no,
  depth: 4400,
  submitted: "2026-10-13",
  api: "50385871",
  // The app's label for code 01 (`FILING_PURPOSE` in rrc-queries.ts).
  purpose: "New drill",
  horiz: 0,
  src: "gis",
};

/** The RRC permit number the alerts email cites for Harlan Ranch 3 (`recon-alerts-fixture.ts`). */
export const HARLAN_3_PERMIT_NO = "0912417";

/**
 * The same permit with its number, so `PermitPanel` lists the approved W-1 and
 * plats. The list is answered by `public/api/scout/rrc/permit/documents`, the
 * landing's static stand-in for the app's documents route.
 */
export const reconPermitWithFile: Record<string, unknown> = { ...reconPermit, permitNo: HARLAN_3_PERMIT_NO };

/** Wells mode over Young County, for the Layers section. */
export const reconWellFilters: Filters = { ...DEFAULT_FILTERS, mode: "wells", county: YOUNG_COUNTY };
