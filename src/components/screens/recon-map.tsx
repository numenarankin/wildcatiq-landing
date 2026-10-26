"use client";

/**
 * The Recon wellbore map, for real: Mapbox GL on the app's basemap, RRC
 * wellbores from the landing's Recon points files (public/recon/*.json,
 * [api, lon, lat, og, plug, swd, dead]), clustered with the app's bubble
 * colours and radii, and the app's well glyphs (`well-glyphs.ts`) once the
 * bubbles break. A permit sits on it as a pin; the handle lets a scripted
 * screen fly the camera and ring the well it is about to open.
 */
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { addWellGlyphs, wellGlyphLayout } from "@/lib/scout/well-glyphs";

const STYLE = { map: "mapbox://styles/mapbox/light-v11", satellite: "mapbox://styles/mapbox/satellite-streets-v12" } as const;
const CLUSTER_MAX_ZOOM = 9;
const DEFAULT_POINTS = ["/recon/wells.json"];

type Row = [number, number, number, string, number, number, number];

export interface ReconMapHandle {
  zoomIn(): void;
  zoomOut(): void;
  /** The app's camera move, with Mapbox's own easing. */
  flyTo(opts: { center: [number, number]; zoom: number; duration: number }): void;
  /** Where a point lands in the map's own pixels, for a cursor to aim at. */
  project(lngLat: [number, number]): { x: number; y: number } | null;
  /** Ring one well (the one about to be opened), or clear the ring. */
  highlight(lngLat: [number, number] | null): void;
}

export function ReconMap({
  center,
  zoom,
  basemap,
  pin,
  points = DEFAULT_POINTS,
  pinShown = true,
  onReady,
  onDrawn,
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
  onReady?: (handle: ReconMapHandle) => void;
  /** landing: called once the wells are drawn, for a scripted screen to start its clock. */
  onDrawn?: () => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // landing: the pin's element, so `pinShown` can fade it after it is placed.
  const pinRef = useRef<HTMLDivElement | null>(null);
  const pinShownRef = useRef(pinShown);

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
      });

      // Taken before the fetch: the style usually loads first, and a listener
      // attached afterwards would wait for a `style.load` that already fired.
      const styleLoaded = map.once("style.load");
      const files = await Promise.all(points.map((url) => fetch(url).then((r) => r.json() as Promise<Row[]>)));
      if (disposed) return;
      const data = {
        type: "FeatureCollection" as const,
        features: files.flat().map(([api, lon, lat, og, plug, swd, dead]) => ({
          type: "Feature" as const,
          properties: { api, og, plug, swd, dead },
          geometry: { type: "Point" as const, coordinates: [lon, lat] },
        })),
      };

      const draw = () => {
        if (!map || map.getSource("wells")) return;
        map.addSource("wells", {
          type: "geojson",
          data,
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
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "wells",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 },
          paint: { "text-color": "#ffffff" },
        });
        addWellGlyphs(map);
        map.addLayer({
          id: "well-marks",
          type: "symbol",
          source: "wells",
          filter: ["!", ["has", "point_count"]],
          layout: wellGlyphLayout() as mapboxgl.SymbolLayerSpecification["layout"],
        });
      };

      await styleLoaded;
      if (disposed) return;
      draw();
      map.once("idle", () => !disposed && onDrawn?.());
      // Basemap swaps replace the style, and the wells with it.
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
    // The map is built once; basemap swaps go through setStyle below.
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

  // In flow with an explicit height, as the app's scout-map sizes it. Mapbox
  // sets `.mapboxgl-map { position: relative }` from an unlayered stylesheet,
  // which overrides Tailwind's layered `absolute` and would collapse an
  // inset-positioned container to zero height.
  return <div ref={el} className="h-full w-full" />;
}
