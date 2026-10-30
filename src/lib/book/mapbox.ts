import { roundDrive } from "@/lib/book/rules";

/**
 * Mapbox geocoding and driving times for the slot check, called from the
 * /api/book routes only (admin docs/plans/demo-booking.md).
 */

export interface Point {
  lat: number;
  lng: number;
}

/** A geocoded place and the US state code it is in (e.g. "TX"). */
export interface Located extends Point {
  state: string | null;
}

/** The Matrix API's driving profile takes at most 25 coordinates a request. */
export const MATRIX_MAX = 25;

function token(): string {
  const t = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!t) throw new Error("Mapbox not configured: set NEXT_PUBLIC_MAPBOX_TOKEN");
  return t;
}

interface Feature {
  geometry?: { coordinates?: [number, number] };
  properties?: { context?: { region?: { region_code?: string } } };
}

const located = (f: Feature | undefined): Located | null => {
  const c = f?.geometry?.coordinates;
  return c ? { lng: c[0], lat: c[1], state: f?.properties?.context?.region?.region_code ?? null } : null;
};

/** Geocoded addresses, kept for the life of the server instance. */
const geocodeCache = new Map<string, Located | null>();

/** The best US match for an address, or null when nothing matches. */
export async function geocode(address: string): Promise<Located | null> {
  const q = address.trim().replace(/\s+/g, " ");
  if (!q) return null;
  const k = q.toLowerCase();
  if (geocodeCache.has(k)) return geocodeCache.get(k)!;
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.search = new URLSearchParams({ q, country: "us", limit: "1", access_token: token() }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox geocoding failed (${res.status})`);
  const body = (await res.json()) as { features?: Feature[] };
  const place = located(body.features?.[0]);
  geocodeCache.set(k, place);
  return place;
}

/** The state a point is in (e.g. "TX"), or null when Mapbox has none. */
export async function stateAt(p: Point): Promise<string | null> {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.search = new URLSearchParams({ longitude: String(p.lng), latitude: String(p.lat), types: "region", limit: "1", access_token: token() }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox reverse geocoding failed (${res.status})`);
  const body = (await res.json()) as { features?: { properties?: { region_code?: string; context?: { region?: { region_code?: string } } } }[] };
  const props = body.features?.[0]?.properties;
  return props?.region_code ?? props?.context?.region?.region_code ?? null;
}

export function clearGeocodeCache(): void {
  geocodeCache.clear();
}

/**
 * Drive minutes between the visitor and each place, both ways, rounded up to
 * 5 minutes; null where there is no road route. One Matrix request per 24
 * places, the visitor first in each.
 */
export async function driveTimes(visitor: Point, places: readonly Point[]): Promise<{ to: (number | null)[]; from: (number | null)[] }> {
  const to: (number | null)[] = [];
  const from: (number | null)[] = [];
  for (let i = 0; i < places.length; i += MATRIX_MAX - 1) {
    const batch = places.slice(i, i + MATRIX_MAX - 1);
    const coords = [visitor, ...batch].map((p) => `${p.lng},${p.lat}`).join(";");
    const url = new URL(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}`);
    url.search = new URLSearchParams({ annotations: "duration", access_token: token() }).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox matrix failed (${res.status})`);
    const body = (await res.json()) as { code?: string; durations?: (number | null)[][] };
    if (body.code !== "Ok" || !body.durations) throw new Error(`Mapbox matrix failed (${body.code ?? "no durations"})`);
    const d = body.durations;
    batch.forEach((_, j) => {
      const fromPlace = d[j + 1]?.[0];
      const toPlace = d[0]?.[j + 1];
      to.push(fromPlace == null ? null : roundDrive(fromPlace));
      from.push(toPlace == null ? null : roundDrive(toPlace));
    });
  }
  return { to, from };
}
