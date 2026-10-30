"use client";

/**
 * Recon's map page, laid out as `scout-map.tsx` lays it out: the app's
 * `MapFilters` bar, then the map with `MapControls`, the mode's legend and,
 * when a permit is open, `PermitPanel` down the right edge. The map is the
 * landing's `ReconMap` (Mapbox GL on real RRC records), the same one the hero
 * draws, on satellite unless told otherwise.
 *
 * Every Show mode draws: wells from the points files, and leases, permits,
 * orphans and operators from the landing's extracts (`layer-data.ts`), with
 * the operator mode's well-count range and the wells mode's Type applied the
 * way the app applies them. Legends wait for the map to draw, as the app's do.
 */
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ReconMap, type ReconMapHandle, type ReconMapLayers } from "../../recon-map";
import { MapControls, type Basemap } from "@/components/scout/map-controls";
import { MapFilters, type Filters } from "@/components/scout/map-filters";
import { OrphanLegend } from "@/components/scout/orphan-legend";
import { PermitLegend } from "@/components/scout/permit-legend";
import { PermitPanel } from "@/components/scout/permit-panel";
import { WellLegend } from "@/components/scout/well-legend";
import { countOrphans } from "@/lib/scout/orphan-filter";
import { filterPermitFeatures, purposeCounts } from "@/lib/scout/permit-filter";
import { reconPrices } from "@/lib/screens/recon-fixture";
import { ScreenPanel } from "../../panel";
import { permitCounts, useReconLayers } from "./layer-data";

const PANEL_PX = 384;

export function ReconMapScene({
  filters: initial,
  value,
  onFilters,
  center,
  zoom,
  basemap: initialBasemap = "satellite",
  points,
  permit = null,
  pin,
  permitOpen: openProp,
  onPermitClose,
  pinShown,
  onMapReady,
  onMapDrawn,
  children,
}: {
  /** The bar's starting filters. */
  filters: Filters;
  /** landing: set to drive the bar from a script; the bar's own edits go to `onFilters`. */
  value?: Filters;
  onFilters?: (f: Filters) => void;
  center: [number, number];
  zoom: number;
  /** Starting basemap; satellite when unset. */
  basemap?: Basemap;
  /** Wells mode's points files (`ReconMap`'s `points`). */
  points?: string[];
  permit?: Record<string, unknown> | null;
  pin?: { lngLat: [number, number]; color: string; label: string };
  /**
   * A scripted screen opens and closes the permit itself. When set, the panel
   * stays mounted with the permit and slides in and out from the right edge,
   * so its W-1 and plats are fetched once and the close reads as a close.
   * Unset, the panel shows while open, as before.
   */
  permitOpen?: boolean;
  onPermitClose?: () => void;
  /** Whether the permit pin shows (`ReconMap`'s `pinShown`). */
  pinShown?: boolean;
  onMapReady?: (handle: ReconMapHandle) => void;
  /** `ReconMap`'s `onDrawn`: the wells are on the map. */
  onMapDrawn?: () => void;
  /** Overlays drawn over the scene, such as a scripted cursor. */
  children?: ReactNode;
}) {
  const [own, setOwn] = useState<Filters>(initial);
  const filters = value ?? own;
  const setFilters = (f: Filters) => (value ? onFilters?.(f) : setOwn(f));
  const [basemap, setBasemap] = useState<Basemap>(initialBasemap);
  const [permitOpenState, setPermitOpen] = useState(permit != null);
  const [drawn, setDrawn] = useState(false);
  const scripted = openProp !== undefined;
  const permitOpen = scripted ? openProp : permitOpenState;
  const mapHandle = useRef<ReconMapHandle | null>(null);
  const showPermit = permitOpen && permit != null && filters.mode === "permits";
  const data = useReconLayers();

  // The operator mode's well-count range, as scout-map applies it.
  const { minWells, maxWells } = filters;
  const layers: ReconMapLayers | undefined = useMemo(() => {
    if (!data) return undefined;
    const lo = minWells ?? 0;
    const hi = maxWells ?? Infinity;
    return {
      leases: data.leases,
      orphans: data.orphans,
      permits: filterPermitFeatures(data.permits, filters.permitPurpose),
      operators: {
        ...data.operators,
        features: data.operators.features.filter((f) => {
          const w = Number(f.properties?.w ?? 0);
          return w >= lo && w <= hi;
        }),
      },
    };
  }, [data, minWells, maxWells, filters.permitPurpose]);

  // The orphan key counts what is in view, as the app's does.
  const [view, setView] = useState<[number, number, number, number] | null>(null);
  const orphanCounts = useMemo(() => {
    if (!data || !view) return null;
    const [w, s, e, n] = view;
    return countOrphans(data.orphans, (lon, lat) => lon >= w && lon <= e && lat >= s && lat <= n);
  }, [data, view]);

  return (
    <ScreenPanel w={1280} h={760} path="/recon" pad={false}>
      <div className="flex h-full w-full flex-col">
        <MapFilters
          filters={filters}
          prices={reconPrices}
          onSelectOperator={() => {}}
          onSelectPrincipal={() => {}}
          permitPurposes={filters.mode === "permits" && data ? purposeCounts(data.permits) : []}
          onOpenAlerts={() => {}}
          view="map"
          onView={() => {}}
          onChange={setFilters}
        />
        <div className="relative min-h-0 flex-1">
          <ReconMap
            center={center}
            zoom={zoom}
            basemap={basemap === "satellite" ? "satellite" : "map"}
            points={points}
            mode={filters.mode}
            layers={layers}
            wellsOilGas={filters.oilGas}
            pin={pin}
            pinShown={pinShown}
            onReady={(h) => {
              mapHandle.current = h;
              onMapReady?.(h);
            }}
            onDrawn={() => {
              setDrawn(true);
              onMapDrawn?.();
            }}
            onMoveEnd={setView}
          />
          <MapControls
            rightInset={showPermit ? PANEL_PX : 0}
            basemap={basemap}
            onBasemap={setBasemap}
            onZoomIn={() => mapHandle.current?.zoomIn()}
            onZoomOut={() => mapHandle.current?.zoomOut()}
            drawTool="off"
            onDrawTool={() => {}}
          />
          {drawn && filters.mode === "wells" && <WellLegend />}
          {drawn && filters.mode === "permits" && <PermitLegend counts={permitCounts(data)} />}
          {drawn && filters.mode === "orphans" && <OrphanLegend counts={orphanCounts} />}
          <div
            data-permit-stack
            className={
              scripted
                ? `absolute right-0 top-0 z-10 flex h-full transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)] ${showPermit ? "translate-x-0" : "translate-x-full"}`
                : "absolute right-0 top-0 z-10 flex h-full"
            }
          >
            <PermitPanel
              permit={showPermit || (scripted && filters.mode === "permits") ? permit : null}
              onClose={() => (scripted ? onPermitClose?.() : setPermitOpen(false))}
              onSelectOperator={() => {}}
              onSelectWell={() => {}}
            />
          </div>
        </div>
        {children}
      </div>
    </ScreenPanel>
  );
}
