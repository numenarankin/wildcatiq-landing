import { z } from "zod";
import { gate } from "@/lib/book/guard";
import { availability } from "@/lib/book/availability";
import { resolveOffice } from "@/lib/book/place";

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
    const office = await resolveOffice(address, lat, lng);
    if (typeof office === "string") return Response.json({ error: office });
    const days = await availability(office, Date.now());
    return Response.json({ place: { address, ...office }, days });
  } catch (err) {
    console.error("[book] availability failed", err);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
