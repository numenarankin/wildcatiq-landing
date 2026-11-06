import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { busyForVisitor, mergeBusy } from "./availability";
import { clearGeocodeCache, driveTimes, guessAddresses, MATRIX_MAX } from "./mapbox";
import { resolveOffice } from "./place";

// Run: npx tsx --tsconfig tsconfig.json --test src/lib/book/*.test.ts
// Mapbox is answered by a stub; expected values are worked by hand.

const realFetch = globalThis.fetch;
let requests: URL[] = [];
const stub = (answer: (u: URL) => unknown) => {
  globalThis.fetch = (async (input: URL | string) => {
    const u = new URL(String(input));
    requests.push(u);
    return Response.json(answer(u));
  }) as typeof fetch;
};
beforeEach(() => {
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = "tok";
  clearGeocodeCache();
  requests = [];
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("mergeBusy", () => {
  it("turns all-day events into Central midnight to midnight, and lets a booking's row replace its own event", () => {
    const merged = mergeBusy(
      [
        { id: "a", start: null, end: null, startDate: "2026-11-02", endDate: "2026-11-03", location: null },
        { id: "g1", start: "2026-11-05T15:00:00.000Z", end: "2026-11-05T15:30:00.000Z", startDate: null, endDate: null, location: "Office" },
      ],
      // A 30-minute booking at 9:00 holds the owner until 11:00; its own 30-minute event is dropped.
      [{ starts_at: "2026-11-05T15:00:00Z", hold_ends_at: "2026-11-05T17:00:00Z", office_lat: 32, office_lng: -102, google_event_id: "g1" }],
    );
    assert.equal(merged.length, 2);
    assert.equal(new Date(merged[0].start).toISOString(), "2026-11-02T06:00:00.000Z");
    assert.equal(new Date(merged[0].end).toISOString(), "2026-11-03T06:00:00.000Z");
    assert.equal(merged[0].allDay, true);
    assert.deepEqual(merged[1].place, { lat: 32, lng: -102 });
    assert.equal(new Date(merged[1].end).toISOString(), "2026-11-05T17:00:00.000Z");
  });
});

describe("busyForVisitor", () => {
  it("drives from each event's place, treating no location or an unknown one as home", async () => {
    const HOME = { lat: 32.93, lng: -97.25 };
    const OFFICE = { lat: 32.0, lng: -98.0 };
    stub((u) => {
      if (u.pathname.includes("/geocode/")) {
        const q = u.searchParams.get("q") ?? "";
        const hit = q.includes("Secretariat") ? HOME : q.includes("Office") ? OFFICE : null;
        return { features: hit ? [{ geometry: { coordinates: [hit.lng, hit.lat] } }] : [] };
      }
      const n = u.pathname.split("/").pop()!.split(";").length;
      return { code: "Ok", durations: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : (i + j) * 600 + 1))) };
    });
    const busy = await busyForVisitor({ lat: 31, lng: -97 }, [
      { start: 1, end: 2, allDay: false, place: null, address: "Office Tower" },
      { start: 3, end: 4, allDay: false, place: null, address: null },
      { start: 5, end: 6, allDay: false, place: null, address: "Nowhere at all" },
    ]);
    // Unique places: office (index 1), home (index 2). (i+j)*600+1 s rounds up to 15 and 25 min.
    assert.deepEqual(busy.map((b) => [b.toVisitor, b.fromVisitor]), [[15, 15], [25, 25], [25, 25]]);
    assert.equal(requests.filter((r) => r.pathname.includes("directions-matrix")).length, 1);
  });

  it("asks Mapbox nothing on an empty calendar", async () => {
    stub(() => ({}));
    assert.deepEqual(await busyForVisitor({ lat: 31, lng: -97 }, []), []);
    assert.equal(requests.length, 0);
  });
});

describe("driveTimes", () => {
  it("batches 24 places a request with the visitor first, both directions, null for no route", async () => {
    stub((u) => {
      const n = u.pathname.split("/").pop()!.split(";").length;
      // Visitor -> place: 300 s. Place -> visitor: 900 s, except the batch's 2nd place: no route.
      return { code: "Ok", durations: Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : i === 0 ? 300 : j === 0 ? (i === 2 ? null : 900) : 60))) };
    });
    const places = Array.from({ length: 30 }, (_, i) => ({ lat: 30 + i / 100, lng: -97 }));
    const { to, from } = await driveTimes({ lat: 31, lng: -97 }, places);
    assert.deepEqual(requests.map((r) => r.pathname.split("/").pop()!.split(";").length), [MATRIX_MAX, 7]);
    assert.equal(requests[0].pathname.split("/").pop()!.split(";")[0], "-97,31");
    assert.ok(from.every((m) => m === 5));
    assert.equal(to[1], null);
    assert.equal(to[25], null);
    assert.equal(to.filter((m) => m === 15).length, 28);
  });
});

describe("resolveOffice", () => {
  it("shows back Mapbox's full address for a typed one, so a typo reads correctly, and searches near the visitor", async () => {
    stub((u) => {
      assert.equal(u.searchParams.get("proximity"), "-97.25,32.93");
      return { features: [{ geometry: { coordinates: [-97.25, 32.93] }, properties: { full_address: "805 Secretariat Trail, Keller, Texas 76248", context: { region: { region_code: "TX" } } } }] };
    });
    assert.deepEqual(await resolveOffice("805 secretarit trl keler", undefined, undefined, { lat: 32.93, lng: -97.25 }), {
      lat: 32.93,
      lng: -97.25,
      address: "805 Secretariat Trail, Keller, Texas 76248",
    });
  });
  const geo = (state: string | null) => ({
    features: [{ geometry: { coordinates: [-97.33, 32.75] }, properties: { context: { region: { region_code: state } } } }],
  });
  it("accepts a typed Texas address and refuses one elsewhere or unknown", async () => {
    stub(() => geo("TX"));
    assert.deepEqual(await resolveOffice("300 Throckmorton St, Fort Worth"), { lat: 32.75, lng: -97.33, address: "300 Throckmorton St, Fort Worth" });
    clearGeocodeCache();
    stub(() => geo("OK"));
    assert.equal(await resolveOffice("1 Main St, Tulsa"), "texas");
    clearGeocodeCache();
    stub(() => ({ features: [] }));
    assert.equal(await resolveOffice("qqqq"), "address");
  });
  it("checks a picked suggestion's state by its coordinates", async () => {
    stub((u) => {
      assert.ok(u.pathname.endsWith("/reverse"));
      return { features: [{ properties: { feature_type: "region", context: { region: { region_code: "NM" } } } }] };
    });
    assert.equal(await resolveOffice("1 Main St, Hobbs", 32.7, -103.1), "texas");
  });
});

describe("guessAddresses", () => {
  it("offers only Texas matches, nearest the visitor, without repeats", async () => {
    stub((u) => {
      assert.equal(u.searchParams.get("bbox"), "-106.65,25.84,-93.51,36.5");
      assert.equal(u.searchParams.get("proximity"), "-97.33,32.75");
      const f = (address: string, state: string) => ({ geometry: { coordinates: [-97, 32] }, properties: { full_address: address, context: { region: { region_code: state } } } });
      return { features: [f("Secretariat Trail, Keller, Texas", "TX"), f("Secretariat Trail, Ardmore, Oklahoma", "OK"), f("Secretariat Trail, Keller, Texas", "TX"), f("Secretariat Trail, Longview, Texas", "TX")] };
    });
    const out = await guessAddresses("Secretariat Trail", { lat: 32.75, lng: -97.33 });
    assert.deepEqual(out.map((g) => g.address), ["Secretariat Trail, Keller, Texas", "Secretariat Trail, Longview, Texas"]);
  });
});
