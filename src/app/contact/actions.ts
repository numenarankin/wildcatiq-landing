"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { sendFollowupLead } from "@/lib/sales-chat/followup";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/links";
import { CONTACT_LIMITS, type ContactField, type ContactState } from "@/lib/contact";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(CONTACT_LIMITS.name),
  email: z.string().trim().max(CONTACT_LIMITS.email).pipe(z.email("Enter a valid email address.")),
  company: z.string().trim().min(1, "Enter your company.").max(CONTACT_LIMITS.company),
  wells: z.string().trim().max(CONTACT_LIMITS.wells).optional(),
  message: z.string().trim().min(1, "Enter a message.").max(CONTACT_LIMITS.message),
});

/** Submissions one IP may make inside the window, per server instance. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

const FALLBACK = `Email ${CONTACT_EMAIL} or call ${CONTACT_PHONE} instead.`;

export async function submitContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  // A field people never see; anything filling it is a bot. It is told it succeeded.
  if (String(form.get("website") ?? "")) return { status: "sent" };

  const text = (k: ContactField) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v : undefined;
  };
  const parsed = schema.safeParse({
    name: text("name") ?? "",
    email: text("email") ?? "",
    company: text("company") ?? "",
    wells: text("wells"),
    message: text("message") ?? "",
  });
  if (!parsed.success) {
    const fields: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ContactField;
      fields[key] ??= issue.message;
    }
    return { status: "error", message: "Check the highlighted fields.", fields };
  }

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return { status: "error", message: `Too many messages from here. ${FALLBACK}` };
  }

  const { name, email, company, wells, message } = parsed.data;
  const result = await sendFollowupLead({
    name,
    email,
    company,
    wells: wells || undefined,
    note: message,
    pathname: "/contact",
    source: "contact",
  });
  if (!result.ok) return { status: "error", message: `Your message did not go through. ${FALLBACK}` };
  return { status: "sent" };
}
