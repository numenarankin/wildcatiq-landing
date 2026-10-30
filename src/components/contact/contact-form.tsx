"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/contact/actions";
import { CONTACT_LIMITS, type ContactField, type ContactState } from "@/lib/contact";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-md border border-border bg-background px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/50 focus:ring-3 focus:ring-foreground/5 aria-invalid:border-destructive";

const INPUTS: { name: Exclude<ContactField, "message" | "wells">; label: string; type?: string; autoComplete: string; placeholder?: string }[] = [
  { name: "name", label: "Name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@company.com" },
  { name: "company", label: "Company", autoComplete: "organization" },
];

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="self-center">
        <h2 className="text-2xl font-medium tracking-tight">Thanks, message sent.</h2>
        <p className="mt-2 text-base text-muted-foreground">We will get back to you within one business day.</p>
      </div>
    );
  }

  const fieldError = (k: ContactField) => (state.status === "error" ? state.fields?.[k] : undefined);
  const field = (k: ContactField, label: string, control: React.ReactNode) => (
    <div key={k}>
      <label htmlFor={k} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {control}
      {fieldError(k) && <p className="mt-1.5 text-sm text-destructive">{fieldError(k)}</p>}
    </div>
  );

  return (
    <form action={action} className="grid content-start gap-5" noValidate>
      {INPUTS.map((f) =>
        field(
          f.name,
          f.label,
          <input
            id={f.name}
            name={f.name}
            type={f.type ?? "text"}
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            maxLength={CONTACT_LIMITS[f.name]}
            aria-invalid={fieldError(f.name) ? true : undefined}
            className={FIELD}
          />,
        ),
      )}
      {field(
        "message",
        "Message",
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="What would you like to know?"
          maxLength={CONTACT_LIMITS.message}
          aria-invalid={fieldError("message") ? true : undefined}
          className={cn(FIELD, "resize-y")}
        />,
      )}
      {/* Hidden from people; bots fill it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-3 text-base font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send message"}
        </button>
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
