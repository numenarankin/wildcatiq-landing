/**
 * Where a "have someone contact me" request goes: one email to the sales
 * inbox through Brevo, the same transactional sender the web app uses. The
 * sales chat's follow-up tool and the contact page's form both send here.
 *
 * Only server code imports this file, so the API key stays on the server. Configuration:
 *   BREVO_API_KEY, BREVO_SENDER_EMAIL  (sender, must be verified in Brevo)
 * Leads are delivered to `SALES_LEAD_EMAIL`, fixed here rather than in the environment.
 * When any is missing the tool reports that honestly and the assistant tells
 * the visitor to book a demo instead. Nothing is swallowed.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/** Where every lead is delivered. */
const SALES_LEAD_EMAIL = "info@wildcatiq.ai";

export interface FollowupLead {
  name: string;
  email: string;
  company?: string;
  wells?: string;
  note?: string;
  pathname: string;
  /** Where the lead came from, for the subject line. Defaults to the chat. */
  source?: "chat" | "contact";
}

export type FollowupResult = { ok: true } | { ok: false; error: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export async function sendFollowupLead(lead: FollowupLead): Promise<FollowupResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const to = SALES_LEAD_EMAIL;
  if (!apiKey || !senderEmail) {
    console.error(`[${lead.source ?? "chat"}] follow-up not configured: set BREVO_API_KEY and BREVO_SENDER_EMAIL`);
    return { ok: false, error: "Follow-up requests are not set up yet." };
  }

  const rows: [string, string | undefined][] = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Company", lead.company],
    ["Wells", lead.wells],
    ["Note", lead.note],
    ["Page", lead.pathname],
  ];
  const present = rows.filter((r): r is [string, string] => Boolean(r[1]));
  const textContent = present.map(([k, v]) => `${k}: ${v}`).join("\n");
  const htmlContent = `<table>${present
    .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0"><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v)}</td></tr>`)
    .join("")}</table>`;

  const response = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || "WildcatIQ" },
      to: [{ email: to }],
      replyTo: { email: lead.email, name: lead.name },
      subject: `${lead.source === "contact" ? "Contact form" : "Website chat lead"}: ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
      htmlContent,
      textContent,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[${lead.source ?? "chat"}] Brevo send failed (${response.status}): ${detail}`);
    return { ok: false, error: "The request could not be delivered." };
  }
  return { ok: true };
}
