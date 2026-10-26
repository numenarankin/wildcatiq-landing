"use client";

/**
 * Recon as the app lays it out (`scout-map.tsx`): the app's own `MapFilters`
 * bar on top, then the map with the app's `MapControls` and `WellLegend` over
 * it, played as a loop: the whole state on satellite, the camera flies to
 * Graham in Young County, the cursor picks Kirby G. H. 1 and the app's well
 * dossier (`WellModal`) opens on its Summary tab, then the cursor opens
 * Production. The dossier is the mirror's real record for API 50300573
 * (public/api/scout/rrc/well); the wells are the RRC's.
 *
 * The map is Mapbox GL on the app's basemap (`ReconMap`), the one part that
 * is not the app's own component. The modal is the app's, in its inline mode:
 * its portal would leave the scaled canvas, so the card and backdrop are laid
 * here with the modal's own classes; `fixed` positions against the canvas
 * because the canvas is transformed. The cursor is `fixed` for the same
 * reason, in canvas coordinates, so it can cross the sidebar to the modal.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ReconMap, type ReconMapHandle } from "./recon-map";
import { MapControls, type Basemap } from "@/components/scout/map-controls";
import { DEFAULT_FILTERS, MapFilters, type Filters } from "@/components/scout/map-filters";
import { WellLegend } from "@/components/scout/well-legend";
import { ScoutWellModal, loadWellDossier } from "@/components/scout/scout-well-modal";
import type { WellTabKey } from "@/components/scout/well-modal";
import { reconPrices } from "@/lib/screens/recon-fixture";
import { AppFrame } from "./app-frame";

/** RRC county code for Young County (`COUNTY_NAMES`). */
const YOUNG_COUNTY = 503;
const WELL_FILTERS: Filters = { ...DEFAULT_FILTERS, mode: "wells", county: YOUNG_COUNTY };

/** Kirby G. H. 1: a producing oil well five miles northeast of Graham. */
const KIRBY_API = 50300573;
const KIRBY_LNG_LAT: [number, number] = [-98.51215, 33.169529];
const TEXAS = { center: [-99.6, 31.3] as [number, number], zoom: 5.3 };
const GRAHAM = { center: [-98.54, 33.13] as [number, number], zoom: 10.8 };

/** The app header's height (h-14) and the open sidebar's width (16rem), which the backdrop cuts around. */
const HEADER_H = 56;
const SIDEBAR_W = 256;

type Phase = "texas" | "fly" | "aim" | "summary" | "toTab" | "production" | "back";
const HOLD: Record<Phase, number> = {
  texas: 2400,
  fly: 3400,
  aim: 1000,
  summary: 2800,
  toTab: 900,
  production: 5200,
  back: 3000,
};
const NEXT: Record<Phase, Phase> = {
  texas: "fly",
  fly: "aim",
  aim: "summary",
  summary: "toTab",
  toTab: "production",
  production: "back",
  back: "texas",
};

const noop = () => {};

type Point = { x: number; y: number };

function Cursor({ x, y, down }: Point & { down: boolean }) {
  return (
    <div
      className="pointer-events-none fixed z-[120] transition-[left,top] duration-700 ease-[cubic-bezier(.22,.61,.36,1)]"
      style={{ left: x, top: y }}
    >
      {down && <span className="absolute -left-3 -top-3 size-6 animate-ping rounded-full bg-black/40" />}
      <svg
        width="22"
        height="26"
        viewBox="0 0 22 26"
        className="-translate-x-[3px] -translate-y-[2px] drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]"
      >
        <path
          d="M3 2 L3 20 L8 15.5 L11.5 23 L14.5 21.7 L11 14.2 L18 14 Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function ReconLive() {
  const [filters, setFilters] = useState<Filters>(WELL_FILTERS);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [phase, setPhase] = useState<Phase>("texas");
  const [cursor, setCursor] = useState<(Point & { down: boolean }) | null>(null);
  const mapHandle = useRef<ReconMapHandle | null>(null);
  const mapPane = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // Warm the dossier so the modal opens on the record, not a spinner.
  useEffect(() => {
    void loadWellDossier(KIRBY_API);
  }, []);

  /**
   * A viewport point in the canvas's own coordinates (what `fixed` positions
   * against here), undoing the screen's scale.
   */
  const toCanvas = useCallback((vx: number, vy: number): Point | null => {
    const canvas = root.current?.closest<HTMLElement>("[data-screen-canvas]");
    if (!canvas) return null;
    const cr = canvas.getBoundingClientRect();
    const scale = cr.width / canvas.offsetWidth;
    return { x: (vx - cr.left) / scale, y: (vy - cr.top) / scale };
  }, []);

  useEffect(() => {
    // On the next frame, not in the effect body: the Production tab is
    // measured after the modal has painted, and the cursor is set the same way.
    const frame = requestAnimationFrame(() => {
      const map = mapHandle.current;
      const pane = mapPane.current?.getBoundingClientRect();
      switch (phase) {
        case "texas":
          map?.highlight(null);
          setCursor(null);
          break;
        case "fly": {
          map?.flyTo({ ...GRAHAM, duration: HOLD.fly - 200 });
          // The cursor comes in from the lower right so the aim reads as a move.
          const c = pane && toCanvas(pane.left + pane.width * 0.72, pane.top + pane.height * 0.82);
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "aim": {
          // `project` is in the map's own (unscaled) pixels from the pane's corner.
          const p = map?.project(KIRBY_LNG_LAT);
          const origin = pane && toCanvas(pane.left, pane.top);
          if (p && origin) setCursor({ x: origin.x + p.x, y: origin.y + p.y, down: false });
          break;
        }
        case "summary":
          map?.highlight(KIRBY_LNG_LAT);
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "toTab": {
          const tab = Array.from(root.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []).find(
            (t) => t.offsetWidth > 0 && t.textContent?.trim().startsWith("Production")
          );
          const b = tab?.getBoundingClientRect();
          const c = b && toCanvas(b.left + b.width / 2, b.top + b.height / 2);
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "production":
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "back":
          setCursor(null);
          map?.highlight(null);
          map?.flyTo({ ...TEXAS, duration: HOLD.back - 200 });
          break;
      }
    });
    const id = setTimeout(() => setPhase(NEXT[phase]), HOLD[phase]);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(id);
    };
  }, [phase, toCanvas]);

  const modalOpen = phase === "summary" || phase === "toTab" || phase === "production";
  const tab: WellTabKey = phase === "production" ? "production" : "summary";

  return (
    <AppFrame path="/recon" crumbs={["Recon"]} fullBleed>
      <div ref={root} data-phase={phase} className="relative flex h-full w-full flex-col">
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
        <div ref={mapPane} className="relative min-h-0 flex-1">
          <ReconMap
            center={TEXAS.center}
            zoom={TEXAS.zoom}
            basemap={basemap === "satellite" ? "satellite" : "map"}
            points={["/recon/texas.json", "/recon/young.json"]}
            onReady={(h) => (mapHandle.current = h)}
          />
          <MapControls
            rightInset={0}
            basemap={basemap}
            onBasemap={setBasemap}
            onZoomIn={() => mapHandle.current?.zoomIn()}
            onZoomOut={() => mapHandle.current?.zoomOut()}
            drawTool="off"
            onDrawTool={noop}
          />
          {filters.mode === "wells" && <WellLegend />}
        </div>

        {modalOpen ? (
          <>
            {/* The backdrop, in the modal's pieces: the page below the header
                and the strip beside it over the sidebar's top. */}
            <div className="pointer-events-none fixed inset-0 z-[100]">
              <div
                className="pointer-events-auto absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm"
                style={{ top: HEADER_H }}
              />
              <div
                className="pointer-events-auto absolute top-0 left-0 bg-black/50 backdrop-blur-sm"
                style={{ width: SIDEBAR_W, height: HEADER_H }}
              />
            </div>
            <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Well"
                className="pointer-events-auto flex h-[880px] w-full max-w-[1500px] flex-col overflow-hidden rounded-md bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10"
              >
                <ScoutWellModal
                  api={KIRBY_API}
                  inline
                  tab={tab}
                  onClose={noop}
                  onSelectOperator={noop}
                  onSelectPrincipal={noop}
                  onSelectLease={noop}
                />
              </div>
            </div>
          </>
        ) : null}

        {cursor && <Cursor {...cursor} />}
      </div>
    </AppFrame>
  );
}
