import { geocode, stateAt, type Point } from "@/lib/book/mapbox";

/** On-site demos are in Texas only. */
export const SERVICE_STATE = "TX";

/** The visitor's office: where it is, and its address as we will show and store it. */
export interface Office extends Point {
  address: string;
}

/**
 * Where the visitor's office is: the picked suggestion's coordinates, or the
 * typed address geocoded nearest `near` (the visitor's IP location), shown back
 * as Mapbox's full address so a typo reads correctly. "address" when nothing
 * matches, "texas" outside Texas.
 */
export async function resolveOffice(address: string, lat?: number, lng?: number, near?: Point): Promise<Office | "address" | "texas"> {
  if (lat !== undefined && lng !== undefined) {
    return (await stateAt({ lat, lng })) === SERVICE_STATE ? { lat, lng, address } : "texas";
  }
  const found = await geocode(address, near);
  if (!found) return "address";
  if (found.state !== SERVICE_STATE) return "texas";
  return { lat: found.lat, lng: found.lng, address: found.address ?? address };
}
