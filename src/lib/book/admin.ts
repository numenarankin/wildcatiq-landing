/**
 * Admin holds the owner's Google login, so the owner's calendar is read and
 * written there. Server only: the browser never sees the calendar, only the
 * open slots the /api/book routes work out from it. Needs `BOOKING_ADMIN_URL`
 * and `BOOKING_API_SECRET` (the same secret on admin).
 */

/** One busy Google event: timed ones carry instants, all-day ones Central dates (end exclusive). */
export interface BusyEvent {
  id: string;
  start: string | null;
  end: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
}

async function callAdmin<T>(path: string, body: unknown): Promise<T> {
  const base = process.env.BOOKING_ADMIN_URL;
  const secret = process.env.BOOKING_API_SECRET;
  if (!base || !secret) throw new Error("Booking not configured: set BOOKING_ADMIN_URL and BOOKING_API_SECRET");
  const res = await fetch(new URL(`/api/gtm/booking/${path}`, base), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Admin ${path} failed (${res.status}): ${await res.text().catch(() => "")}`);
  return (await res.json()) as T;
}

export async function readCalendarBusy(timeMin: string, timeMax: string): Promise<BusyEvent[]> {
  return (await callAdmin<{ events: BusyEvent[] }>("busy", { timeMin, timeMax })).events;
}

/**
 * Hands a booking already in the table to admin, which puts it on the owner's
 * calendar and emails the visitor's confirmation from the owner's Gmail.
 */
export async function handOffBooking(bookingId: string): Promise<{ calendar: boolean; email: boolean }> {
  return callAdmin("booked", { bookingId });
}
