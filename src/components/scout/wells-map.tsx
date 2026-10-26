"use client";

/**
 * landing: the types and `wellStatus` of the app's src/components/scout/wells-map.tsx,
 * verbatim. The dossier Map tab (a second Mapbox instance on satellite) is not
 * ported: no product screen opens that tab, so `ScoutWellsMap` draws an empty pane.
 */
export interface MapWell {
  /** Passed back to `onSelectWell`; the 8-digit RRC form either way. */
  api: number;
  lng: number;
  lat: number;
  /** "O" | "G" | "" — the dot colour, matching the main Scout map. */
  og: string;
  plugged?: boolean;
  /**
   * `injection` or `inactive` when the hole's type says so, else undefined.
   * Overrides the commodity colour: what a hole IS beats what its lease sells.
   */
  status?: "injection" | "inactive";
  /** Popup heading, usually the API. */
  label: string;
  /** Popup second line: county, type, activity. */
  sub?: string;
}

/**
 * The RRC well type a dot should be coloured by, not the commodity.
 *
 * A hole that injects is not producing whatever its lease sells, and an idle
 * hole is not producing at all; both are more useful to see at a glance than
 * oil-vs-gas. Shared so the lease and operator dossiers colour by one rule.
 */
export function wellStatus(
  type: string | null | undefined
): "injection" | "inactive" | undefined {
  const t = (type ?? "").toUpperCase();
  // Stopped is checked FIRST: a hole typed "SHUT IN" that also holds a disposal
  // permit has stopped, and that is what the colour should say.
  if (
    t.includes("SHUT IN") ||
    t.includes("ABANDONED") ||
    t === "NO PRODUCTION" ||
    t === "PARTIAL PLUG" ||
    t === "SEALED" ||
    t === "NOT ELIGIBLE FOR ALLOWABLE"
  ) {
    return "inactive";
  }
  if (
    t.includes("INJECTION") ||
    t === "WATER SUPPLY" ||
    t.includes("STRG") ||
    t === "BRINE MINING" ||
    t === "OBSERVATION" ||
    t === "LPG STORAGE"
  ) {
    return "injection";
  }
  return undefined;
}

/**
 * One plotted drilling permit: a hole that does not exist yet.
 *
 * Deliberately NOT a `MapWell` with a different colour. A permit has no API,
 * nothing to click through to, and no production to hover for, and feeding it
 * through the well layer would have meant a dot that answers the well layer's
 * questions with blanks.
 */
export interface MapPermit {
  /** Any stable string; used as the React/feature key only. */
  id: string;
  lng: number;
  lat: number;
  /** Popup heading, usually the lease the permit names. */
  label: string;
  /** Popup second line: well number, issue date. */
  sub?: string;
  /**
   * The permit became a hole. Drilled ones ring the well they produced (the
   * well dot sits inside); undrilled ones are the whole mark, because there is
   * nothing underneath them to ring.
   */
  drilled?: boolean;
}

export function ScoutWellsMap(props: {
  wells: MapWell[];
  permits?: MapPermit[];
  onSelectWell?: (api: number, lng: number | null, lat: number | null) => void;
  empty: string;
  note?: string;
}) {
  void props;
  return <div className="relative min-h-0 flex-1 bg-muted" />;
}
