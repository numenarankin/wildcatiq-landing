import { geocode, stateAt, type Point } from "@/lib/book/mapbox";

/** On-site demos are in Texas only. */
export const SERVICE_STATE = "TX";

/**
 * Where the visitor's office is: the picked suggestion's coordinates, or the
 * typed address geocoded. "address" when nothing matches, "texas" outside Texas.
 */
export async function resolveOffice(address: string, lat?: number, lng?: number): Promise<Point | "address" | "texas"> {
  let point: Point;
  let state: string | null;
  if (lat !== undefined && lng !== undefined) {
    point = { lat, lng };
    state = await stateAt(point);
  } else {
    const found = await geocode(address);
    if (!found) return "address";
    point = { lat: found.lat, lng: found.lng };
    state = found.state;
  }
  return state === SERVICE_STATE ? point : "texas";
}
