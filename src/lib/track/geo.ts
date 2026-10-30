/**
 * Where a request came from, from Vercel's `x-vercel-ip-*` headers: city-level,
 * from the IP address, never the device's position. A US state is stored by
 * name ("Texas"), the way Snitcher reports it, so the two sources agree.
 */

const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky",
  LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico",
};

export interface Geo {
  country: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

function decode(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function coord(v: string | null, limit: number): number | null {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n : null;
}

export function geoFromHeaders(h: Headers): Geo {
  const country = h.get("x-vercel-ip-country");
  const region = h.get("x-vercel-ip-country-region");
  return {
    country,
    state: region ? (country === "US" ? (US_STATES[region] ?? region) : region) : null,
    city: decode(h.get("x-vercel-ip-city")),
    latitude: coord(h.get("x-vercel-ip-latitude"), 90),
    longitude: coord(h.get("x-vercel-ip-longitude"), 180),
  };
}
