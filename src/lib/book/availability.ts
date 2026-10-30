import { readCalendarBusy, type BusyEvent } from "@/lib/book/admin";
import { readBookings, type BookingRow } from "@/lib/book/gtm";
import { driveTimes, geocode, type Point } from "@/lib/book/mapbox";
import { HOME_ADDRESS, addDaysKey, bookingDates, centralInstant, openSlots, type Busy } from "@/lib/book/rules";

/**
 * Open demo slots for a visitor's office (admin docs/plans/demo-booking.md).
 * The owner's busy Google events and the confirmed bookings are the busy
 * list; each one's place is driven to and from the visitor. Server only.
 */

/** A busy stretch and where the owner is during it (null place + null address = home). */
export interface PlacedBusy {
  start: number;
  end: number;
  allDay: boolean;
  place: Point | null;
  address: string | null;
}

/** Calendar events and bookings as one busy list; a booking's own event gives way to its row, which has coordinates. */
export function mergeBusy(events: readonly BusyEvent[], bookings: readonly BookingRow[]): PlacedBusy[] {
  const booked = new Set(bookings.map((b) => b.google_event_id).filter(Boolean));
  const out: PlacedBusy[] = [];
  for (const e of events) {
    if (booked.has(e.id)) continue;
    if (e.startDate && e.endDate) {
      out.push({ start: centralInstant(e.startDate, 0), end: centralInstant(e.endDate, 0), allDay: true, place: null, address: e.location });
    } else if (e.start && e.end) {
      out.push({ start: Date.parse(e.start), end: Date.parse(e.end), allDay: false, place: null, address: e.location });
    }
  }
  for (const b of bookings) {
    // The booking's own calendar event is 30 minutes; the hold is what keeps the owner busy.
    out.push({ start: Date.parse(b.starts_at), end: Date.parse(b.hold_ends_at), allDay: false, place: { lat: b.office_lat, lng: b.office_lng }, address: null });
  }
  return out;
}

/** Busy events timed against the visitor. No location, or one that does not geocode, means home. */
export async function busyForVisitor(visitor: Point, busy: readonly PlacedBusy[]): Promise<Busy[]> {
  if (!busy.length) return [];
  const home = await geocode(HOME_ADDRESS);
  if (!home) throw new Error("Home address did not geocode");
  const placed = await Promise.all(busy.map(async (b) => b.place ?? (b.address ? await geocode(b.address) : null) ?? home));

  const keyOf = (p: Point) => `${p.lat},${p.lng}`;
  const unique = [...new Map(placed.map((p) => [keyOf(p), { lat: p.lat, lng: p.lng }])).values()];
  const { to, from } = await driveTimes(visitor, unique);
  const index = new Map(unique.map((p, i) => [keyOf(p), i]));

  return busy.map((b, i) => {
    const j = index.get(keyOf(placed[i]))!;
    return { start: b.start, end: b.end, allDay: b.allDay, toVisitor: to[j], fromVisitor: from[j] };
  });
}

export interface DayOpen {
  date: string;
  /** Slot starts, ISO. */
  slots: string[];
}

/** Open slots for the visitor on each date (default: the whole booking window). */
export async function availability(visitor: Point, now: number, dates: string[] = bookingDates(now)): Promise<DayOpen[]> {
  if (!dates.length) return [];
  const timeMin = new Date(centralInstant(dates[0], 0)).toISOString();
  const timeMax = new Date(centralInstant(addDaysKey(dates[dates.length - 1], 1), 0)).toISOString();
  const [events, bookings] = await Promise.all([readCalendarBusy(timeMin, timeMax), readBookings(timeMin, timeMax)]);
  const busy = await busyForVisitor(visitor, mergeBusy(events, bookings));
  return dates.map((date) => ({ date, slots: openSlots(date, busy).map((s) => new Date(s).toISOString()) }));
}
