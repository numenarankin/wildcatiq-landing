"use client";

/**
 * Recon's map page on satellite, laid out as `scout-map.tsx` lays it out: the
 * app's `MapFilters` bar, then the map with `MapControls` and `WellLegend`,
 * with a dossier opening over it as the app's modal does (`DossierOverlay`).
 *
 * The map is the landing's `ReconMap` on the county's real RRC wellbores,
 * plus the simulated wells the site's fixtures name, so Sky's leases and Tonk
 * Creek's are on the map where the dossiers place them.
 */
import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ReconMap, type ReconMapHandle } from "../../recon-map";
import { MapControls, type Basemap } from "@/components/scout/map-controls";
import { MapFilters, type Filters } from "@/components/scout/map-filters";
import { WellLegend } from "@/components/scout/well-legend";
import { reconPrices, reconWellFilters } from "@/lib/screens/recon-fixture";
import { LEASES, WELLS, WELL_API } from "@/lib/screens/recon-rrc";
import { wellLngLat } from "@/lib/screens/recon-dossier-fixture";
import { TONK_WELLS } from "@/lib/screens/recon-tonk-fixture";
import { ScreenPanel } from "../../panel";

const noop = () => {};

/**
 * The fixtures' simulated wellbores in the points files' row shape
 * (`[api, lon, lat, og, plug, swd, dead]`), as a data URL `ReconMap` fetches
 * beside the county file.
 */
export function simulatedPointsUrl(): string {
  const sky = LEASES.flatMap((l) =>
    WELLS.filter((w) => w.lease === l.id).map((w, i) => {
      const [lon, lat] = wellLngLat(l.id, i);
      return [Number(WELL_API[w.id]), lon, lat, "O", 0, 0, 0];
    })
  );
  const tonk = TONK_WELLS.map((w) => [
    Number(w.api),
    w.lngLat[0],
    w.lngLat[1],
    "O",
    w.kind === "plugged" ? 1 : 0,
    w.kind === "injection" ? 1 : 0,
    w.kind === "plugged" || w.kind === "shut-in" ? 1 : 0,
  ]);
  return `data:application/json,${encodeURIComponent(JSON.stringify([...sky, ...tonk]))}`;
}

export function SatScene({
  w = 1280,
  h = 780,
  center,
  zoom,
  filters: initial = reconWellFilters,
  paneRef,
  onMapReady,
  onMapDrawn,
  children,
}: {
  w?: number;
  h?: number;
  center: [number, number];
  zoom: number;
  filters?: Filters;
  /** The map pane, for projecting a map point into the canvas. */
  paneRef?: RefObject<HTMLDivElement | null>;
  onMapReady?: (handle: ReconMapHandle) => void;
  onMapDrawn?: () => void;
  /** Overlays over the scene: the dossier and the pointer. */
  children?: ReactNode;
}) {
  const [filters, setFilters] = useState<Filters>(initial);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const handle = useRef<ReconMapHandle | null>(null);
  const points = useMemo(() => ["/recon/young.json", simulatedPointsUrl()], []);
  return (
    <ScreenPanel w={w} h={h} path="/recon" pad={false}>
      <div className="relative flex h-full w-full flex-col">
        <MapFilters
          filters={filters}
          prices={reconPrices}
          onSelectOperator={noop}
          onSelectPrincipal={noop}
          permitPurposes={[]}
          onOpenAlerts={noop}
          view="map"
          onView={noop}
          onChange={setFilters}
        />
        <div ref={paneRef} className="relative min-h-0 flex-1">
          <ReconMap
            center={center}
            zoom={zoom}
            basemap={basemap === "satellite" ? "satellite" : "map"}
            points={points}
            onReady={(m) => {
              handle.current = m;
              onMapReady?.(m);
            }}
            onDrawn={onMapDrawn}
          />
          <MapControls
            rightInset={0}
            basemap={basemap}
            onBasemap={setBasemap}
            onZoomIn={() => handle.current?.zoomIn()}
            onZoomOut={() => handle.current?.zoomOut()}
            drawTool="off"
            onDrawTool={noop}
          />
          {filters.mode === "wells" && <WellLegend />}
        </div>
        {children}
      </div>
    </ScreenPanel>
  );
}

/**
 * A dossier over the page, as the app's `SwipeUpModal` lays one out: the
 * shade over the whole canvas and the card in the middle. The dossier renders
 * `inline` inside the card, since the modal's portal would leave the scaled
 * canvas; `fixed` positions against the canvas because the canvas is
 * transformed.
 */
export function DossierOverlay({
  open,
  label,
  children,
  rootRef,
}: {
  open: boolean;
  label: string;
  children: ReactNode;
  rootRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="dossier"
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <motion.div
              ref={rootRef}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="flex h-full w-full flex-col overflow-hidden rounded-md bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10"
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Where a map point sits in the viewport, from the pane's corner and the map's own projection. */
export function mapPointInViewport(
  map: ReconMapHandle | null,
  pane: HTMLElement | null,
  lngLat: [number, number]
): { x: number; y: number; from: HTMLElement } | null {
  const p = map?.project(lngLat);
  if (!p || !pane) return null;
  const r = pane.getBoundingClientRect();
  // `project` is in the map's unscaled pixels; the pane's rect is scaled.
  const scale = r.width / (pane.offsetWidth || 1);
  return { x: r.left + p.x * scale, y: r.top + p.y * scale, from: pane };
}
