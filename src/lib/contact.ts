/** The contact form's shared shapes: the server action enforces them, the inputs mirror them. */

export type ContactField = "name" | "email" | "company" | "wells" | "message";

export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string; fields?: Partial<Record<ContactField, string>> };

/** Field caps in characters. */
export const CONTACT_LIMITS: Record<ContactField, number> = {
  name: 120,
  email: 254,
  company: 120,
  wells: 60,
  message: 4000,
};
