import { roundDrive } from "@/lib/book/rules";

/**
 * Mapbox geocoding and driving times for the slot check, called from the
 * /api/book routes only (admin docs/plans/demo-booking.md).
 */

export interface Point {
  lat: number;
  lng: number;
}

/** A geocoded place, its full address as Mapbox has it, and the US state code it is in (e.g. "TX"). */
export interface Located extends Point {
  state: string | null;
  address: string | null;
}

/** The Matrix API's driving profile takes at most 25 coordinates a request. */
export const MATRIX_MAX = 25;

function token(): string {
  // Trimmed: a pasted env value can carry a trailing newline, which Mapbox rejects.
  const t = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  if (!t) throw new Error("Mapbox not configured: set NEXT_PUBLIC_MAPBOX_TOKEN");
  return t;
}

interface Feature {
  geometry?: { coordinates?: [number, number] };
  properties?: { full_address?: string; context?: { region?: { region_code?: string } } };
}

/** Every address here is in the US, so the country is noise. */
const shortAddress = (a: string | undefined | null) => a?.replace(/,\s*United States$/, "") ?? null;

const located = (f: Feature | undefined): Located | null => {
  const c = f?.geometry?.coordinates;
  return c
    ? { lng: c[0], lat: c[1], state: f?.properties?.context?.region?.region_code ?? null, address: shortAddress(f?.properties?.full_address) }
    : null;
};

/** Geocoded addresses, kept for the life of the server instance. */
const geocodeCache = new Map<string, Located | null>();

/** The best US match for an address, nearest `near` when given, or null when nothing matches. */
export async function geocode(address: string, near?: Point): Promise<Located | null> {
  const q = address.trim().replace(/\s+/g, " ");
  if (!q) return null;
  const k = `${q.toLowerCase()}|${near ? `${near.lng.toFixed(1)},${near.lat.toFixed(1)}` : ""}`;
  if (geocodeCache.has(k)) return geocodeCache.get(k)!;
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.search = new URLSearchParams({
    q,
    country: "us",
    limit: "1",
    ...(near ? { proximity: `${near.lng},${near.lat}` } : {}),
    access_token: token(),
  }).toString();
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

/** Texas's bounding box, for suggestions. */
const TEXAS_BBOX = "-106.65,25.84,-93.51,36.5";

/** An address Mapbox thinks the visitor meant, with where it is. */
export interface AddressGuess extends Point {
  address: string;
}

/**
 * Texas addresses close to what was typed, nearest `near` first (the
 * visitor's IP location, or the owner's base). For "Did you mean...".
 */
export async function guessAddresses(q: string, near: Point, limit = 3): Promise<AddressGuess[]> {
  const text = q.trim().replace(/\s+/g, " ");
  if (!text) return [];
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.search = new URLSearchParams({
    q: text,
    country: "us",
    bbox: TEXAS_BBOX,
    proximity: `${near.lng},${near.lat}`,
    autocomplete: "true",
    types: "address,street,place,locality,neighborhood,postcode",
    limit: String(limit),
    access_token: token(),
  }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox geocoding failed (${res.status})`);
  const body = (await res.json()) as { features?: (Feature & { properties?: { full_address?: string; place_formatted?: string; name?: string } })[] };
  const out: AddressGuess[] = [];
  for (const f of body.features ?? []) {
    const p = located(f);
    if (!p || p.state !== "TX") continue;
    const address = shortAddress(f.properties?.full_address ?? [f.properties?.name, f.properties?.place_formatted].filter(Boolean).join(", "));
    if (address && !out.some((o) => o.address === address)) out.push({ address, lat: p.lat, lng: p.lng });
  }
  return out;
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
