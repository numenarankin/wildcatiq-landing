import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { noticeEmail } from "./notice";

// Run: npx tsx --tsconfig tsconfig.json --test src/lib/book/*.test.ts

// Fri Nov 13 2026, 11:00am CST = 17:00Z.
const booking = {
  bookingId: "b1",
  name: "Jo Field",
  email: "jo@acme.com",
  company: "Sky Resources",
  address: "300 Throckmorton St, Fort Worth, TX 76102",
  start: "2026-11-13T17:00:00.000Z",
  end: "2026-11-13T17:30:00.000Z",
};

describe("noticeEmail", () => {
  it("tells the owner who booked, when and where, with the notes", () => {
    const mail = noticeEmail({ ...booking, notes: "Two pumpers will join." });
    assert.equal(mail.subject, "New demo booked: Sky Resources, Friday, November 13 at 11:00 AM CST");
    assert.equal(
      mail.textContent,
      [
        "Jo Field at Sky Resources just booked a demo.",
        "",
        "When: Friday, November 13 at 11:00 AM CST (30 minutes)",
        "Company: Sky Resources",
        "Name: Jo Field",
        "Email: jo@acme.com",
        "Office: 300 Throckmorton St, Fort Worth, TX 76102",
        "Notes: Two pumpers will join.",
        "",
        "Bookings: https://admin-suite-tan.vercel.app/bookings",
      ].join("\n"),
    );
  });
  it("leaves out Notes when there are none", () => {
    assert.ok(!noticeEmail({ ...booking, notes: " " }).textContent.includes("Notes:"));
  });
});
