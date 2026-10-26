"use client";

/**
 * Recon's map page at a fixed camera, laid out as `scout-map.tsx` lays it out:
 * the app's `MapFilters` bar, then the map with `MapControls`, the mode's
 * legend and, when a permit is open, `PermitPanel` down the right edge. The
 * map is the landing's `ReconMap` (Mapbox GL on the county's real RRC
 * wellbores), the same one the hero draws.
 */
import { useRef, useState, type ReactNode } from "react";
import { ReconMap, type ReconMapHandle } from "../../recon-map";
import { MapControls, type Basemap } from "@/components/scout/map-controls";
import { MapFilters, type Filters } from "@/components/scout/map-filters";
import { PermitLegend } from "@/components/scout/permit-legend";
import { PermitPanel } from "@/components/scout/permit-panel";
import { WellLegend } from "@/components/scout/well-legend";
import { reconPermitCounts, reconPermitPurposes, reconPrices } from "@/lib/screens/recon-fixture";
import { ScreenPanel } from "../../panel";

const PANEL_PX = 384;

export function ReconMapScene({
  filters: initial,
  center,
  zoom,
  permit = null,
  pin,
  permitOpen: openProp,
  onPermitClose,
  pinShown,
  onMapReady,
  onMapDrawn,
  children,
}: {
  filters: Filters;
  center: [number, number];
  zoom: number;
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
  const [filters, setFilters] = useState<Filters>(initial);
  const [basemap, setBasemap] = useState<Basemap>("map");
  const [permitOpenState, setPermitOpen] = useState(permit != null);
  const scripted = openProp !== undefined;
  const permitOpen = scripted ? openProp : permitOpenState;
  const mapHandle = useRef<ReconMapHandle | null>(null);
  const showPermit = permitOpen && permit != null && filters.mode === "permits";

  return (
    <ScreenPanel w={1280} h={760} path="/recon" pad={false}>
      <div className="flex h-full w-full flex-col">
        <MapFilters
          filters={filters}
          prices={reconPrices}
          onSelectOperator={() => {}}
          onSelectPrincipal={() => {}}
          permitPurposes={filters.mode === "permits" ? reconPermitPurposes : []}
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
            pin={pin}
            pinShown={pinShown}
            onReady={(h) => {
              mapHandle.current = h;
              onMapReady?.(h);
            }}
            onDrawn={onMapDrawn}
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
          {filters.mode === "wells" && <WellLegend />}
          {filters.mode === "permits" && <PermitLegend counts={reconPermitCounts} />}
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
