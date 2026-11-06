import { z } from "zod";
import { gate } from "@/lib/book/guard";
import { availability } from "@/lib/book/availability";
import { handOffBooking } from "@/lib/book/admin";
import { bookDemo } from "@/lib/book/gtm";
import { sendNotice } from "@/lib/book/notice";
import { resolveOffice } from "@/lib/book/place";
import { HOLD_MINUTES, MEETING_MINUTES, centralDate } from "@/lib/book/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const input = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  company: z.string().trim().min(1).max(160),
  address: z.string().trim().min(3).max(300),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  start: z.iso.datetime(),
  notes: z.string().max(2000).default(""),
});

/** App and database clocks may differ a little; checking from earlier only refuses more. */
const CLOCK_SLACK_MS = 10_000;

/**
 * Books a demo (admin docs/plans/demo-booking.md): the slot is checked again
 * against the calendar, the row goes in through `book_demo`, admin puts it on
 * the owner's calendar and emails the visitor's confirmation (with the
 * 30-minute calendar file) from the owner's Gmail, and noreply tells the owner. A slot no longer open
 * answers `{ ok: false, reason: "taken" }`.
 */
export async function POST(req: Request): Promise<Response> {
  const body = await gate(req);
  if (body instanceof Response) return body;
  const parsed = input.safeParse(body);
  if (!parsed.success) return Response.json({ error: "input" }, { status: 400 });
  const b = parsed.data;

  try {
    const resolved = await resolveOffice(b.address, b.lat, b.lng);
    if (typeof resolved === "string") return Response.json({ error: resolved });
    const office = { lat: resolved.lat, lng: resolved.lng };

    const startMs = Date.parse(b.start);
    const start = new Date(startMs).toISOString();
    const end = new Date(startMs + MEETING_MINUTES * 60_000).toISOString();
    const holdEnd = new Date(startMs + HOLD_MINUTES * 60_000).toISOString();
    const date = centralDate(startMs);

    // A booking that lands the same day between our check and our insert is
    // refused by book_demo; check once more with it in the busy list.
    let id: string | null = null;
    for (let attempt = 0; attempt < 2 && !id; attempt++) {
      const checkedAt = new Date(Date.now() - CLOCK_SLACK_MS).toISOString();
      const [day] = await availability(office, Date.now(), [date]);
      if (!day?.slots.includes(start)) return Response.json({ ok: false, reason: "taken" });
      id = await bookDemo({ ...b, ...office, start, end, holdEnd, checkedAt });
    }
    if (!id) return Response.json({ ok: false, reason: "taken" });

    // The booking stands even if these fail: admin's Bookings page shows one
    // missing from the calendar, and the logs name a failed email.
    const [handoff, notice] = await Promise.allSettled([
      handOffBooking(id),
      sendNotice({ bookingId: id, name: b.name, email: b.email, company: b.company, address: b.address, start, end, notes: b.notes }),
    ]);
    if (handoff.status === "rejected") console.error("[book] admin handoff failed", id, handoff.reason);
    else if (!handoff.value.calendar || !handoff.value.email) console.error("[book] admin handoff incomplete", id, handoff.value);
    if (notice.status === "rejected") console.error("[book] owner notice failed", id, notice.reason);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[book] confirm failed", err);
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
