/**
 * The owner's new-booking notice, from noreply through Brevo (BREVO_API_KEY).
 * The visitor's own confirmation goes from the owner's Gmail, through admin.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const OWNER = { name: "Rankin Poage", email: "rankin@wildcatiq.ai" };

export interface Booked {
  bookingId: string;
  name: string;
  email: string;
  company: string;
  address: string;
  start: string;
  end: string;
  notes: string;
}

const when = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  weekday: "long",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

const html = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Where the owner's new-booking notice comes from. */
const NOTICE_SENDER = { email: "noreply@wildcatiq.ai", name: "WildcatIQ" };
const BOOKINGS_PAGE = "https://admin-suite-tan.vercel.app/bookings";

export function noticeEmail(c: Booked): { subject: string; htmlContent: string; textContent: string } {
  const at = when.format(new Date(c.start));
  const rows: [string, string][] = [
    ["When", `${at} (30 minutes)`],
    ["Company", c.company],
    ["Name", c.name],
    ["Email", c.email],
    ["Office", c.address],
    ...(c.notes.trim() ? ([["Notes", c.notes.trim()]] as [string, string][]) : []),
  ];
  return {
    subject: `New demo booked: ${c.company}, ${at}`,
    textContent: [`${c.name} at ${c.company} just booked a demo.`, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", `Bookings: ${BOOKINGS_PAGE}`].join("\n"),
    htmlContent: `<p>${html(c.name)} at ${html(c.company)} just booked a demo.</p>
<p>${rows.map(([k, v]) => `<strong>${k}:</strong> ${html(v).replace(/\n/g, "<br>")}`).join("<br>")}</p>
<p><a href="${BOOKINGS_PAGE}">Open Bookings</a></p>`,
  };
}

/** Tells the owner someone booked; replying goes straight to the visitor. */
export async function sendNotice(c: Booked): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("Email not configured: set BREVO_API_KEY");
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: NOTICE_SENDER,
      to: [OWNER],
      replyTo: { email: c.email, name: c.name },
      ...noticeEmail(c),
    }),
  });
  if (!res.ok) throw new Error(`Brevo send failed (${res.status}): ${await res.text().catch(() => "")}`);
}
