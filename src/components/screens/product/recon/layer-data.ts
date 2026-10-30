"use client";

/**
 * The Recon demos' data for the four non-well Show modes, read once per page
 * from the landing's extracts of the RRC mirror (public/recon/*.json, written
 * from the same tables `scout-sync-data.mjs` and `/api/scout/rrc/*` read):
 *
 *   young-leases.json   [og, dist, lease_no, name, op, w, lon, lat, o12, g12, m12, cty]
 *                       leases-points rows in the Young County view
 *   operators.json      [n, name, lng, lat, w, o12, g12, m12], every operator
 *                       at its mailing-ZIP centroid
 *   young-orphans.json  [api, lon, lat, plugged, operator, lease, well, months]
 *                       the RRC orphan list in the Young County view
 *   young-permits.json  [permitNo, kind, lon, lat, lease, well, op, opNo,
 *                       depth, purpose, horiz, api, date] from the pending
 *                       feed in the Young County view, decided and pending
 *
 * Collections are built with the feature properties the app's routes put on
 * them, so the app's own filters and legends read them unchanged. The Recon
 * permit (`reconPermitWithFile`, simulated) joins the decided history at its
 * pin, so it is counted where it is drawn.
 */
import { useEffect, useState } from "react";
import type { ReconMapLayers } from "../../recon-map";
import { PERMIT_LNG_LAT, reconPermitWithFile } from "@/lib/screens/recon-fixture";
import { FIXTURE_TODAY } from "@/lib/screens/operator";

type FC = GeoJSON.FeatureCollection;
type Lease = [string, number, string, string, number, number, number, number, number, number, number, number];
type Operator = [number, string, number, number, number, number, number, number];
type Orphan = [string, number, number, number, string, string, string, number];
type Permit = [string, string, number, number, string, string, string, string, number, string, number, string | null, string];

export interface ReconLayerData {
  leases: FC;
  operators: FC;
  orphans: FC;
  permits: { pending: FC; history: FC };
}

const point = (lon: number, lat: number, properties: Record<string, unknown>) => ({
  type: "Feature" as const,
  geometry: { type: "Point" as const, coordinates: [lon, lat] },
  properties,
});
const fc = (features: GeoJSON.Feature[]): FC => ({ type: "FeatureCollection", features });

/** Whole days from `date` (YYYY-MM-DD) to the fixture's today. */
function daysSince(date: string): number {
  return Math.round((Date.parse(`${FIXTURE_TODAY}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000);
}

let cache: Promise<ReconLayerData> | null = null;

export function loadReconLayers(): Promise<ReconLayerData> {
  if (cache) return cache;
  const get = <T,>(url: string) => fetch(url).then((r) => r.json() as Promise<T>);
  cache = Promise.all([
    get<Lease[]>("/recon/young-leases.json"),
    get<Operator[]>("/recon/operators.json"),
    get<Orphan[]>("/recon/young-orphans.json"),
    get<Permit[]>("/recon/young-permits.json"),
  ]).then(([leases, operators, orphans, permits]) => {
    const permitFeatures = permits.map(
      ([permitNo, kind, lon, lat, lease, well, op, opNo, depth, purpose, horiz, api, date]) =>
        point(lon, lat, {
          permitNo,
          kind,
          lease,
          well,
          op,
          opNo,
          depth,
          purpose,
          horiz,
          api,
          submitted: date,
          days: daysSince(date),
          county: "YOUNG",
          district: "09",
          src: "gis",
        })
    );
    return {
      leases: fc(
        leases.map(([og, dist, lease, name, op, w, lon, lat, o12, g12, m12, cty]) =>
          point(lon, lat, { og, dist, lease, name, op, w, o12, g12, m12, cty })
        )
      ),
      operators: fc(
        operators.map(([n, nm, lng, lat, w, o12, g12, m12]) => point(lng, lat, { n, nm, w, o12, g12, m12 }))
      ),
      orphans: fc(
        orphans.map(([api, lon, lat, plugged, operator, lease, well, months]) =>
          point(lon, lat, { api, plugged: plugged === 1, operator, lease, well, months, county: "YOUNG" })
        )
      ),
      permits: {
        pending: fc(permitFeatures.filter((f) => f.properties.kind === "pending")),
        history: fc([
          ...permitFeatures.filter((f) => f.properties.kind !== "pending"),
          point(PERMIT_LNG_LAT[0], PERMIT_LNG_LAT[1], reconPermitWithFile),
        ]),
      },
    };
  });
  return cache;
}

/** The layers once loaded; null until then. */
export function useReconLayers(): ReconLayerData | null {
  const [data, setData] = useState<ReconLayerData | null>(null);
  useEffect(() => {
    let live = true;
    void loadReconLayers().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);
  return data;
}

/** The permit key's counts, of what is drawn: pending, decided (all), drilled. */
export function permitCounts(d: ReconLayerData | null) {
  if (!d) return null;
  const history = d.permits.history.features;
  return {
    total: d.permits.pending.features.length,
    approved: history.length,
    drilled: history.filter((f) => f.properties?.kind === "drilled").length,
  };
}

export type { ReconMapLayers };
