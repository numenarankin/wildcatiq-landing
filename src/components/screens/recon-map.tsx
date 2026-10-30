"use client";

/**
 * The Recon map, for real: Mapbox GL on the app's basemap, RRC wellbores from
 * the landing's Recon points files (public/recon/*.json,
 * [api, lon, lat, og, plug, swd, dead]), clustered with the app's bubble
 * colours and radii, and the app's well glyphs (`well-glyphs.ts`) once the
 * bubbles break. The other four Show modes (leases, permits, orphans,
 * operators) draw with `scout-map.tsx`'s own layer ids and paint, from the
 * collections the caller hands in. A permit sits on it as a pin; the handle
 * lets a scripted screen fly the camera and ring the well it is about to open.
 */
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { addWellGlyphs, wellGlyphLayout } from "@/lib/scout/well-glyphs";
import { ORPHAN_COLORS } from "@/lib/scout/orphan-filter";

const STYLE = { map: "mapbox://styles/mapbox/light-v11", satellite: "mapbox://styles/mapbox/satellite-streets-v12" } as const;
const CLUSTER_MAX_ZOOM = 9;
const DEFAULT_POINTS = ["/recon/wells.json"];

type Row = [number, number, number, string, number, number, number];
type FC = GeoJSON.FeatureCollection;

export type ReconMapMode = "wells" | "leases" | "permits" | "orphans" | "operators";

/** The non-well modes' data, in the shapes `scout-map.tsx` sets on its sources. */
export interface ReconMapLayers {
  leases?: FC;
  permits?: { pending: FC; history: FC };
  orphans?: FC;
  operators?: FC;
}

export interface ReconMapHandle {
  zoomIn(): void;
  zoomOut(): void;
  /** The app's camera move, with Mapbox's own easing. */
  flyTo(opts: { center: [number, number]; zoom: number; duration: number }): void;
  /** Where a point lands in the map's own pixels, for a cursor to aim at. */
  project(lngLat: [number, number]): { x: number; y: number } | null;
  /** Ring one well (the one about to be opened), or clear the ring. */
  highlight(lngLat: [number, number] | null): void;
  /** landing: whether a point is inside the current view, for in-view counts. */
  contains(lngLat: [number, number]): boolean;
}

type Expr = mapboxgl.ExpressionSpecification;
const CLUSTER_RADIUS = ["step", ["get", "point_count"], 12, 100, 16, 1000, 22, 10000, 30] as unknown as Expr;
const PERMIT_DOT_RADIUS = ["interpolate", ["linear"], ["zoom"], 5, 3, 12, 7] as unknown as Expr;
const PERMIT_HALO_RADIUS = ["interpolate", ["linear"], ["zoom"], 5, 8, 12, 22] as unknown as Expr;
const PERMIT_HALO_OPACITY = 0.28;
const EMPTY: FC = { type: "FeatureCollection", features: [] };

/** Layer ids per mode, as `scout-map.tsx` names them. */
const MODE_LAYERS: Record<ReconMapMode, string[]> = {
  wells: ["clusters", "cluster-count", "well-marks"],
  leases: ["lease-clusters", "lease-cluster-count", "lease-points"],
  permits: [
    "permit-clusters",
    "permit-cluster-count",
    "permit-history-halo",
    "permit-history",
    "permit-pending-clusters",
    "permit-pending-count",
    "permit-halo",
    "permit-points",
  ],
  orphans: ["orphan-clusters", "orphan-cluster-count", "orphan-halo", "orphan-points"],
  operators: ["op-clusters", "op-cluster-count", "op-points"],
};

/** Each points file is fetched once per page, however many maps draw it. */
const pointsCache = new Map<string, Promise<Row[]>>();
function loadPoints(url: string): Promise<Row[]> {
  let p = pointsCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => r.json() as Promise<Row[]>);
    pointsCache.set(url, p);
  }
  return p;
}

function wellsCollection(files: Row[][], oilGas: "all" | "O" | "G"): FC {
  return {
    type: "FeatureCollection",
    features: files
      .flat()
      .filter((r) => oilGas === "all" || r[3] === oilGas)
      .map(([api, lon, lat, og, plug, swd, dead]) => ({
        type: "Feature" as const,
        properties: { api, og, plug, swd, dead },
        geometry: { type: "Point" as const, coordinates: [lon, lat] },
      })),
  };
}

export function ReconMap({
  center,
  zoom,
  basemap,
  pin,
  points = DEFAULT_POINTS,
  pinShown = true,
  mode = "wells",
  layers,
  wellsOilGas = "all",
  onReady,
  onDrawn,
  onMoveEnd,
}: {
  center: [number, number];
  zoom: number;
  basemap: "map" | "satellite";
  /** The open permit's position and the colour of its pin. */
  pin?: { lngLat: [number, number]; color: string; label: string };
  /** The points files to draw, all into one clustered source. */
  points?: string[];
  /** landing: whether the pin shows; it fades in and out on change. Shown when unset. */
  pinShown?: boolean;
  /** landing: the Show mode drawn. Wells when unset. */
  mode?: ReconMapMode;
  /** landing: the data the non-well modes draw. */
  layers?: ReconMapLayers;
  /** landing: wells mode's Type filter, on the points' `og`. */
  wellsOilGas?: "all" | "O" | "G";
  onReady?: (handle: ReconMapHandle) => void;
  /** landing: called once the wells are drawn, for a scripted screen to start its clock. */
  onDrawn?: () => void;
  /** landing: the view's [west, south, east, north] once drawn and after each move, for in-view counts. */
  onMoveEnd?: (bounds: [number, number, number, number]) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // landing: the pin's element, so `pinShown` can fade it after it is placed.
  const pinRef = useRef<HTMLDivElement | null>(null);
  const pinShownRef = useRef(pinShown);
  // Current props for `draw`, which reruns on every basemap swap.
  const modeRef = useRef(mode);
  const layersRef = useRef(layers);
  const wellsRef = useRef<FC>(EMPTY);
  const moveEndRef = useRef(onMoveEnd);
  const wellsOilGasRef = useRef(wellsOilGas);
  const pointsKey = points.join(",");

  useEffect(() => {
    moveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);

  useEffect(() => {
    const container = el.current;
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!container || !token) return;
    let disposed = false;
    let map: mapboxgl.Map | null = null;
    let ring: mapboxgl.Marker | null = null;

    (async () => {
      const mod = await import("mapbox-gl");
      const gl = mod.default;
      if (disposed) return;
      gl.accessToken = token;
      map = new gl.Map({
        container,
        style: STYLE[basemap],
        center,
        zoom,
        attributionControl: false,
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      mapRef.current = map;
      // Mapbox sizes its canvas from getBoundingClientRect(), which the scaled
      // canvas shrinks; the layout size is the one the map must fill.
      (map as unknown as { _containerDimensions: () => [number, number] })._containerDimensions = () => [
        container.clientWidth,
        container.clientHeight,
      ];
      map.resize();
      map.on("error", (e) => console.error("[recon-map]", e.error ?? e));
      const reportView = () => {
        const b = map?.getBounds();
        if (b) moveEndRef.current?.([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
      };
      map.on("moveend", reportView);
      onReady?.({
        zoomIn: () => map?.zoomIn(),
        zoomOut: () => map?.zoomOut(),
        flyTo: (opts) => map?.flyTo({ ...opts, essential: true }),
        project: (lngLat) => {
          if (!map) return null;
          const p = map.project(lngLat);
          return { x: p.x, y: p.y };
        },
        highlight: (lngLat) => {
          ring?.remove();
          ring = null;
          if (!lngLat || !map) return;
          const ringEl = document.createElement("div");
          ringEl.className = "relative flex size-9 items-center justify-center";
          ringEl.innerHTML = `
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-white/70"></span>
            <span class="relative inline-flex size-5 rounded-full border-[3px] border-white shadow-[0_0_0_2px_rgba(0,0,0,.45)]"></span>`;
          ring = new gl.Marker({ element: ringEl }).setLngLat(lngLat).addTo(map);
        },
        contains: (lngLat) => map?.getBounds()?.contains(lngLat) ?? false,
      });

      // Taken before the fetch: the style usually loads first, and a listener
      // attached afterwards would wait for a `style.load` that already fired.
      const styleLoaded = map.once("style.load");
      const files = await Promise.all(points.map(loadPoints));
      if (disposed) return;
      wellsRef.current = wellsCollection(files, wellsOilGasRef.current);

      const clustered = (id: string, data: FC, extra?: Record<string, unknown>) => {
        if (!map || map.getSource(id)) return;
        map.addSource(id, {
          type: "geojson",
          data,
          cluster: true,
          clusterRadius: 45,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
          ...extra,
        } as mapboxgl.SourceSpecification);
      };
      const count = (id: string, source: string, size = 11): mapboxgl.LayerSpecification => ({
        id,
        type: "symbol",
        source,
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": size },
        paint: { "text-color": "#ffffff" },
      });
      const POINT = ["!", ["has", "point_count"]] as mapboxgl.FilterSpecification;

      const draw = () => {
        if (!map || map.getSource("wells")) return;
        const L = layersRef.current;
        map.addSource("wells", {
          type: "geojson",
          data: wellsRef.current,
          cluster: true,
          clusterRadius: 50,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
        });
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "wells",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#93c5fd", 100, "#60a5fa", 1000, "#3b82f6", 10000, "#1d4ed8"],
            "circle-radius": ["step", ["get", "point_count"], 12, 100, 16, 1000, 22, 10000, 30],
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer(count("cluster-count", "wells", 12));
        addWellGlyphs(map);
        map.addLayer({
          id: "well-marks",
          type: "symbol",
          source: "wells",
          filter: POINT,
          layout: wellGlyphLayout() as mapboxgl.SymbolLayerSpecification["layout"],
        });

        // LEASES: oil green, gas orange, sized by the lease's well count.
        clustered("leases", L?.leases ?? EMPTY);
        map.addLayer({
          id: "lease-clusters",
          type: "circle",
          source: "leases",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#6ee7b7", 100, "#34d399", 1000, "#10b981", 10000, "#047857"],
            "circle-radius": CLUSTER_RADIUS,
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer(count("lease-cluster-count", "leases", 12));
        map.addLayer({
          id: "lease-points",
          type: "circle",
          source: "leases",
          filter: POINT,
          paint: {
            "circle-color": ["match", ["get", "og"], "G", "#f97316", "#10b981"],
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              4, ["step", ["get", "w"], 3, 5, 4, 20, 5],
              13, ["step", ["get", "w"], 6, 5, 8, 20, 11],
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        } as unknown as mapboxgl.LayerSpecification);

        // OPERATORS: purple, at the mailing address, sized by wells operated.
        clustered("operators", L?.operators ?? EMPTY);
        map.addLayer({
          id: "op-clusters",
          type: "circle",
          source: "operators",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#c4b5fd", 50, "#a78bfa", 200, "#8b5cf6", 1000, "#6d28d9"],
            "circle-radius": ["step", ["get", "point_count"], 14, 50, 18, 200, 24, 1000, 32],
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer(count("op-cluster-count", "operators", 12));

        // PERMITS: the decided history clustered, the pending queue on top.
        clustered("permit-history", L?.permits?.history ?? EMPTY, {
          clusterProperties: { drilled: ["+", ["case", ["==", ["get", "kind"], "drilled"], 1, 0]] },
        });
        clustered("permit-pending", L?.permits?.pending ?? EMPTY);
        const decidedColor = ["case", ["==", ["get", "kind"], "drilled"], "#16a34a", "#111827"] as unknown as Expr;
        map.addLayer({
          id: "permit-clusters",
          type: "circle",
          source: "permit-history",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": ["case", [">", ["*", 2, ["get", "drilled"]], ["get", "point_count"]], "#16a34a", "#111827"],
            "circle-radius": CLUSTER_RADIUS,
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer(count("permit-cluster-count", "permit-history"));
        map.addLayer({
          id: "permit-history-halo",
          type: "circle",
          source: "permit-history",
          filter: POINT,
          paint: { "circle-color": decidedColor, "circle-radius": PERMIT_HALO_RADIUS, "circle-opacity": PERMIT_HALO_OPACITY },
        });
        map.addLayer({
          id: "permit-history",
          type: "circle",
          source: "permit-history",
          filter: POINT,
          paint: {
            "circle-color": decidedColor,
            "circle-radius": PERMIT_DOT_RADIUS,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "permit-pending-clusters",
          type: "circle",
          source: "permit-pending",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#f59e0b",
            "circle-radius": CLUSTER_RADIUS,
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer(count("permit-pending-count", "permit-pending"));
        map.addLayer({
          id: "permit-halo",
          type: "circle",
          source: "permit-pending",
          filter: POINT,
          paint: { "circle-color": "#f59e0b", "circle-radius": PERMIT_HALO_RADIUS, "circle-opacity": PERMIT_HALO_OPACITY },
        });
        map.addLayer({
          id: "permit-points",
          type: "circle",
          source: "permit-pending",
          filter: POINT,
          paint: {
            "circle-color": ["case", ["==", ["get", "horiz"], 1], "#b45309", "#f59e0b"],
            "circle-radius": PERMIT_DOT_RADIUS,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });

        // ORPHANS: red until the state's record shows the hole plugged.
        clustered("orphans", L?.orphans ?? EMPTY, {
          clusterProperties: { plugged: ["+", ["case", ["==", ["get", "plugged"], true], 1, 0]] },
        });
        const orphanColor = [
          "case", ["==", ["get", "plugged"], true], ORPHAN_COLORS.plugged, ORPHAN_COLORS.unplugged,
        ] as unknown as Expr;
        map.addLayer({
          id: "orphan-clusters",
          type: "circle",
          source: "orphans",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "case",
              [">", ["*", 2, ["get", "plugged"]], ["get", "point_count"]],
              ORPHAN_COLORS.plugged,
              ORPHAN_COLORS.unplugged,
            ],
            "circle-radius": CLUSTER_RADIUS,
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer(count("orphan-cluster-count", "orphans"));
        map.addLayer({
          id: "orphan-halo",
          type: "circle",
          source: "orphans",
          filter: POINT,
          paint: { "circle-color": orphanColor, "circle-radius": PERMIT_HALO_RADIUS, "circle-opacity": PERMIT_HALO_OPACITY },
        });
        map.addLayer({
          id: "orphan-points",
          type: "circle",
          source: "orphans",
          filter: POINT,
          paint: {
            "circle-color": orphanColor,
            "circle-radius": PERMIT_DOT_RADIUS,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.95,
          },
        });

        map.addLayer({
          id: "op-points",
          type: "circle",
          source: "operators",
          filter: POINT,
          paint: {
            "circle-color": "#7c3aed",
            "circle-radius": ["interpolate", ["linear"], ["get", "w"], 1, 4, 50, 8, 500, 13, 5000, 20],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.9,
          },
        } as unknown as mapboxgl.LayerSpecification);

        showMode(map, modeRef.current);
      };

      await styleLoaded;
      if (disposed) return;
      draw();
      map.once("idle", () => {
        if (disposed) return;
        reportView();
        onDrawn?.();
      });
      // Basemap swaps replace the style, and the layers with it.
      map.on("style.load", draw);

      if (pin) {
        // The permit pin, as the app's permit layer colours it.
        const pinEl = document.createElement("div");
        pinEl.style.cssText = "display:flex;flex-direction:column;align-items:center";
        // landing: an inner wrapper fades, since Mapbox owns the marker element's transform.
        const pinBody = document.createElement("div");
        pinBody.style.cssText = `display:flex;flex-direction:column;align-items:center;transform:translateY(${pinShownRef.current ? -4 : -14}px);transition:opacity 500ms ease,transform 500ms ease;opacity:${pinShownRef.current ? 1 : 0}`;
        pinRef.current = pinBody;
        pinBody.innerHTML = `
          <span style="font:600 11px/1 var(--font-sans),system-ui;color:#111827;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:6px;padding:3px 6px;margin-bottom:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.12)">${pin.label}</span>
          <span style="width:14px;height:14px;border-radius:50%;background:${pin.color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`;
        pinEl.appendChild(pinBody);
        new gl.Marker({ element: pinEl, anchor: "bottom" }).setLngLat(pin.lngLat).addTo(map);
      }
    })().catch((err) => console.error("[recon-map] failed", err));

    return () => {
      disposed = true;
      map?.remove();
      mapRef.current = null;
    };
    // The map is built once; basemap swaps go through setStyle below, and the
    // data and mode through the effects after it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // landing: fade the pin with `pinShown`.
  useEffect(() => {
    pinShownRef.current = pinShown;
    const el = pinRef.current;
    if (!el) return;
    el.style.opacity = pinShown ? "1" : "0";
    el.style.transform = pinShown ? "translateY(-4px)" : "translateY(-14px)";
  }, [pinShown]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(STYLE[basemap]);
  }, [basemap]);

  // landing: the mode's layers on, every other mode's off.
  useEffect(() => {
    modeRef.current = mode;
    const map = mapRef.current;
    if (map?.getSource("wells")) showMode(map, mode);
  }, [mode]);

  // landing: the non-well collections, set on their sources as they change.
  useEffect(() => {
    layersRef.current = layers;
    const map = mapRef.current;
    if (!map?.getSource("wells")) return;
    const set = (id: string, data: FC | undefined) =>
      (map.getSource(id) as mapboxgl.GeoJSONSource | undefined)?.setData(data ?? EMPTY);
    set("leases", layers?.leases);
    set("operators", layers?.operators);
    set("orphans", layers?.orphans);
    set("permit-history", layers?.permits?.history);
    set("permit-pending", layers?.permits?.pending);
  }, [layers]);

  // landing: a new points list or Type filter redraws the wells.
  const firstWells = useRef(true);
  useEffect(() => {
    wellsOilGasRef.current = wellsOilGas;
    if (firstWells.current) {
      firstWells.current = false;
      return;
    }
    let cancelled = false;
    Promise.all(pointsKey.split(",").map(loadPoints)).then((files) => {
      if (cancelled) return;
      wellsRef.current = wellsCollection(files, wellsOilGas);
      (mapRef.current?.getSource("wells") as mapboxgl.GeoJSONSource | undefined)?.setData(wellsRef.current);
    });
    return () => {
      cancelled = true;
    };
  }, [pointsKey, wellsOilGas]);

  // In flow with an explicit height, as the app's scout-map sizes it. Mapbox
  // sets `.mapboxgl-map { position: relative }` from an unlayered stylesheet,
  // which overrides Tailwind's layered `absolute` and would collapse an
  // inset-positioned container to zero height.
  return <div ref={el} className="h-full w-full" />;
}

function showMode(map: mapboxgl.Map, mode: ReconMapMode) {
  for (const [m, ids] of Object.entries(MODE_LAYERS)) {
    for (const id of ids) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", m === mode ? "visible" : "none");
    }
  }
}
