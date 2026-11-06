import { z } from "zod";
import { gate } from "@/lib/book/guard";
import { availability } from "@/lib/book/availability";
import { resolveOffice } from "@/lib/book/place";
import { guessAddresses, type Point } from "@/lib/book/mapbox";
import { geoFromHeaders } from "@/lib/track/geo";

/** The owner's base, when the visitor's IP gives no location. */
const KELLER: Point = { lat: 32.93, lng: -97.25 };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({
  address: z.string().trim().min(3).max(300),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

/**
 * Open demo times for an office (admin docs/plans/demo-booking.md). The
 * owner's calendar is read and checked here on the server; the answer carries
 * only the open slot starts, never the events behind them.
 */
export async function POST(req: Request): Promise<Response> {
  const body = await gate(req);
  if (body instanceof Response) return body;
  const parsed = input.safeParse(body);
  if (!parsed.success) return Response.json({ error: "input" }, { status: 400 });
  const { address, lat, lng } = parsed.data;

  try {
    // Typed addresses resolve nearest the visitor (by IP), or the owner's base.
    const geo = geoFromHeaders(req.headers);
    const near = geo.latitude != null && geo.longitude != null ? { lat: geo.latitude, lng: geo.longitude } : KELLER;
    const office = await resolveOffice(address, lat, lng, near);
    if (typeof office === "string") {
      // "Did you mean...": Texas addresses near the visitor that match what they typed.
      const suggestions = await guessAddresses(address, near, 2).catch(() => []);
      return Response.json({ error: office, suggestions });
    }
    const days = await availability({ lat: office.lat, lng: office.lng }, Date.now());
    return Response.json({ place: office, days });
  } catch (err) {
    console.error("[book] availability failed", err);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
