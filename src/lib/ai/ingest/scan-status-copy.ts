import type { IngestScanStatus } from "@/lib/ai/ingest/types";

/**
 * The one place the "why did this scan produce no cards" copy lives.
 *
 * Four surfaces render these lines — the well/facility upload modal, the
 * tank/meter Add History modal, the Revenue statement upload, and the Invoices
 * upload — and they used to each carry their own copy of the map. The same
 * failure then read differently depending on which page the user happened to be
 * standing on, and a new status meant hunting down every copy. Pure module (no
 * server imports) so client components can import it directly.
 *
 * `records` is deliberately absent: when there ARE cards, every surface has its
 * own success behaviour (open the cards, show a count), and copy is not it.
 */
export const NO_CARD_MESSAGE: Record<Exclude<IngestScanStatus, "records">, string> = {
  all_on_file:
    "Everything in this document is already on file, so there's nothing new to add.",
  no_records: "The document was read but held nothing that could be added.",
  no_credits: "Out of AI credits — top up in Billing to scan documents.",
  ai_unavailable:
    "AI scanning is unavailable right now. Check your organization's AI settings.",
  scan_disabled:
    "Document scanning is turned off for your organization. Enable it in AI settings.",
  no_skills: "No data-entry skills are enabled, so nothing could be proposed.",
  unreadable: "This file couldn't be read — try a clearer scan or another format.",
  error: "Something went wrong while scanning. Please try again.",
};

/**
 * The line for one status, with a surface's own wording where it has one.
 * Overrides exist because `no_records` genuinely differs by host — "nothing
 * that maps to this tank" is more useful than the generic line — while the
 * failure statuses must read the same everywhere.
 */
export function noCardMessage(
  status: Exclude<IngestScanStatus, "records">,
  overrides?: Partial<Record<Exclude<IngestScanStatus, "records">, string>>
): string {
  return overrides?.[status] ?? NO_CARD_MESSAGE[status];
}
