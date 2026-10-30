"use client";

/**
 * Orion on Recon: the Recon map on satellite with the Orion drawer docked
 * beside it, as `OrionRrcScreen` lays it out, played on a loop. Jim asks what
 * Tonk Creek holds near Sky's wells and what it makes; Orion reads the RRC
 * record (`rrc_search`, `rrc_operator`, `rrc_wells_near`, `rrc_lease`,
 * `rrc_permits`), answers with the leases, their distance and their last
 * twelve months, and moves the map (`scout_set_view`): when that step lands
 * the camera eases in to Harlan Ranch. Each loop starts back over the county.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { MapControls, type Basemap } from "@/components/scout/map-controls";
import { MapFilters, type Filters } from "@/components/scout/map-filters";
import { WellLegend } from "@/components/scout/well-legend";
import { reconPrices, reconWellFilters } from "@/lib/screens/recon-fixture";
import { RECON_ORION_VIEW, reconOrionThread } from "@/lib/screens/recon-orion-fixture";
import { ReconMap, type ReconMapHandle } from "../../recon-map";
import { OrionDrawerScreen } from "../orion/drawer";
import { simulatedPointsUrl } from "./sat-scene";

const noop = () => {};
/** Sky's leases and Tonk Creek's west of them, at the county's scale. */
const START = { center: [-98.69, 33.12] as [number, number], zoom: 11.2 };

export function ReconOrionScreen() {
  const [conversation] = useState(reconOrionThread);
  const [filters, setFilters] = useState<Filters>(reconWellFilters);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const map = useRef<ReconMapHandle | null>(null);
  const moved = useRef(false);
  const points = useMemo(() => ["/recon/young.json", simulatedPointsUrl()], []);

  // Orion's `scout_set_view` is the one step the reply shows after its text:
  // the camera moves when it lands and goes back when the loop restarts.
  const onPhase = useCallback((phase: string) => {
    if (phase === "show" && !moved.current) {
      moved.current = true;
      map.current?.flyTo({ ...RECON_ORION_VIEW, duration: 2600 });
    } else if (phase === "empty" && moved.current) {
      moved.current = false;
      map.current?.flyTo({ ...START, duration: 1200 });
    }
  }, []);

  return (
    <OrionDrawerScreen path="/recon" crumbs={["Recon"]} conversation={conversation} onPhase={onPhase} holdMs={9000}>
      <div className="flex h-full w-full flex-col">
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
        <div className="relative min-h-0 flex-1">
          <ReconMap
            center={START.center}
            zoom={START.zoom}
            basemap={basemap === "satellite" ? "satellite" : "map"}
            points={points}
            onReady={(h) => (map.current = h)}
          />
          <MapControls
            rightInset={0}
            basemap={basemap}
            onBasemap={setBasemap}
            onZoomIn={() => map.current?.zoomIn()}
            onZoomOut={() => map.current?.zoomOut()}
            drawTool="off"
            onDrawTool={noop}
          />
          {filters.mode === "wells" && <WellLegend />}
        </div>
      </div>
    </OrionDrawerScreen>
  );
}
