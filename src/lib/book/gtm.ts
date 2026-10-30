/**
 * The GTM database's booking table, through PostgREST with the GTM project's
 * secret key (the same keys /api/track uses). Server only.
 */

export interface BookingRow {
  starts_at: string;
  /** When the owner is free again (the meeting plus its hold); scheduling uses this, not `ends_at`. */
  hold_ends_at: string;
  office_lat: number;
  office_lng: number;
  google_event_id: string | null;
}

function gtm(): { url: string; key: string } {
  const url = process.env.GTM_SUPABASE_URL;
  const key = process.env.GTM_SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("GTM database not configured: set GTM_SUPABASE_URL and GTM_SUPABASE_SECRET_KEY");
  return { url: url.replace(/\/$/, ""), key };
}

const headers = (key: string) => ({ apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" });

/** Confirmed bookings overlapping a range. */
export async function readBookings(timeMin: string, timeMax: string): Promise<BookingRow[]> {
  const { url, key } = gtm();
  const q = new URLSearchParams({
    select: "starts_at,hold_ends_at,office_lat,office_lng,google_event_id",
    status: "eq.confirmed",
    starts_at: `lt.${timeMax}`,
    hold_ends_at: `gt.${timeMin}`,
  });
  const res = await fetch(`${url}/rest/v1/demo_bookings?${q}`, { headers: headers(key), cache: "no-store" });
  if (!res.ok) throw new Error(`Bookings read failed (${res.status}): ${await res.text().catch(() => "")}`);
  return (await res.json()) as BookingRow[];
}

export interface NewBooking {
  name: string;
  email: string;
  company: string;
  address: string;
  lat: number;
  lng: number;
  start: string;
  /** The end the visitor is told. */
  end: string;
  holdEnd: string;
  notes: string;
  checkedAt: string;
}

/** Inserts through `book_demo`; null when it refused (overlap, or a same-day booking since `checkedAt`). */
export async function bookDemo(b: NewBooking): Promise<string | null> {
  const { url, key } = gtm();
  const res = await fetch(`${url}/rest/v1/rpc/book_demo`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({
      p_name: b.name,
      p_email: b.email,
      p_company: b.company,
      p_office_address: b.address,
      p_office_lat: b.lat,
      p_office_lng: b.lng,
      p_starts_at: b.start,
      p_ends_at: b.end,
      p_hold_ends_at: b.holdEnd,
      p_notes: b.notes,
      p_checked_at: b.checkedAt,
    }),
  });
  if (!res.ok) throw new Error(`book_demo failed (${res.status}): ${await res.text().catch(() => "")}`);
  return ((await res.json()) as string | null) ?? null;
}
