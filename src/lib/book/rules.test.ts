import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bookingDates, candidateSlots, centralInstant, openSlots, roundDrive, type Busy } from "./rules";

// Run: npx tsx --tsconfig tsconfig.json --test src/lib/book/*.test.ts
// Expected values are worked by hand from admin docs/plans/demo-booking.md ("Rules").
// 2026-11-02 is a Monday in CST (UTC-6), so 9:00am Central is 15:00Z.
const MON = "2026-11-02";
const at = (hhmm: string, date = MON) => {
  const [h, m] = hhmm.split(":").map(Number);
  return centralInstant(date, h * 60 + m);
};
const iso = (ms: number) => new Date(ms).toISOString();
const busy = (from: string, to: string, toVisitor: number | null, fromVisitor: number | null = toVisitor): Busy => ({
  start: at(from),
  end: at(to),
  toVisitor,
  fromVisitor,
});
const times = (list: string[], date = MON) => list.map((t) => at(t, date));

describe("candidateSlots", () => {
  it("runs Monday, Thursday and Friday 9:00 to 11:00am and 1:30 to 4:00pm, every 30 minutes", () => {
    for (const day of ["2026-11-02", "2026-11-05", "2026-11-06"]) {
      assert.deepEqual(candidateSlots(day), times(["9:00", "9:30", "10:00", "10:30", "11:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"], day));
    }
  });
  it("starts Wednesday at 1:30pm", () => {
    assert.deepEqual(candidateSlots("2026-11-04").map(iso), [
      "2026-11-04T19:30:00.000Z",
      "2026-11-04T20:00:00.000Z",
      "2026-11-04T20:30:00.000Z",
      "2026-11-04T21:00:00.000Z",
      "2026-11-04T21:30:00.000Z",
      "2026-11-04T22:00:00.000Z",
    ]);
  });
  it("offers nothing on Tuesday, Saturday or Sunday", () => {
    for (const d of ["2026-11-03", "2026-11-07", "2026-11-08"]) assert.deepEqual(candidateSlots(d), []);
  });
  it("keeps 9:00am Central across the DST change (CDT is UTC-5)", () => {
    assert.equal(iso(candidateSlots("2026-10-26")[0]), "2026-10-26T14:00:00.000Z");
  });
});

describe("openSlots", () => {
  it("offers 9:00am on an empty day, however far the office", () => {
    assert.equal(iso(openSlots(MON, [])[0]), "2026-11-02T15:00:00.000Z");
    assert.equal(openSlots(MON, []).length, 11);
  });
  it("waits for the meeting before, the buffer and the drive", () => {
    // 11:00 + 30m + 40m = 12:10; 12:30 and 1:00 are lunch, so 1:30 is the first slot.
    assert.deepEqual(openSlots(MON, [busy("9:00", "11:00", 40)]), times(["13:30", "14:00", "14:30", "15:00", "15:30", "16:00"]));
  });
  it("leaves time to reach the meeting after, counting the 2-hour hold, not the 30 minutes on paper", () => {
    // s + 2h hold + 30m + 25m <= 3:00pm, so s <= 12:05; 11:30 and 12:00 are lunch.
    assert.deepEqual(openSlots(MON, [busy("15:00", "16:00", 25)]), times(["9:00", "9:30", "10:00", "10:30", "11:00"]));
  });
  it("checks both sides when a slot sits between two events", () => {
    // After: 10:00 + 30m + 20m = 10:50. Before: 3:00pm - 2h - 30m - 20m = 12:10. Lunch leaves 11:00.
    assert.deepEqual(openSlots(MON, [busy("9:00", "10:00", 20), busy("15:00", "16:00", 20)]), times(["11:00"]));
  });
  it("keeps the 30-minute buffer around an event with no drive", () => {
    assert.deepEqual(openSlots(MON, [busy("13:00", "14:00", 0)]), times(["9:00", "9:30", "10:00", "10:30", "14:30", "15:00", "15:30", "16:00"]));
  });
  it("never starts a meeting from 11:30am through 1:00pm", () => {
    const starts = openSlots(MON, []).map((s) => new Date(s).toISOString());
    for (const lunch of ["11:30", "12:00", "12:30", "13:00"]) assert.ok(!starts.includes(iso(at(lunch))));
  });
  it("blocks the day for an all-day busy event", () => {
    assert.deepEqual(openSlots(MON, [{ ...busy("0:00", "0:00", 0), end: at("0:00", "2026-11-03"), allDay: true }]), []);
  });
  it("blocks slots next to an event with no road route", () => {
    assert.deepEqual(openSlots(MON, [busy("9:00", "10:00", null)]), []);
    assert.deepEqual(openSlots(MON, [busy("15:30", "16:00", null)]), []);
  });
  it("ignores events on other days", () => {
    const yesterday = { ...busy("9:00", "17:00", 0), start: at("9:00", "2026-11-01"), end: at("17:00", "2026-11-01") };
    assert.equal(openSlots(MON, [yesterday]).length, 11);
  });
});

describe("roundDrive", () => {
  it("rounds seconds up to the next 5 minutes", () => {
    assert.deepEqual([0, 1, 300, 301, 2400].map(roundDrive), [0, 5, 5, 10, 40]);
  });
});

describe("bookingDates", () => {
  it("runs from tomorrow (Central) for 45 days", () => {
    const dates = bookingDates(Date.parse("2026-10-30T12:00:00Z"));
    assert.equal(dates.length, 45);
    assert.equal(dates[0], "2026-10-31");
    assert.equal(dates[44], "2026-12-14");
  });
  it("uses the Central date late in the evening", () => {
    assert.equal(bookingDates(Date.parse("2026-10-31T04:30:00Z"))[0], "2026-10-31");
  });
});
