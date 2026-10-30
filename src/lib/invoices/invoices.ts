/**
 * The /invoices table's row shape (`lib/invoices/invoices.ts`) and the
 * facility it is billed against (`lib/invoices/facility-types.ts`). landing:
 * the types only; the app projects these rows from its PIDX tables, the
 * landing hands them in from a fixture.
 */

export const INVOICE_FACILITY_TYPES = ["well", "tank", "meter", "battery", "lease"] as const;
export type InvoiceFacilityType = (typeof INVOICE_FACILITY_TYPES)[number];

/** One facility an invoice is against, as stored and as rendered in a chip. */
export interface InvoiceFacility {
  type: InvoiceFacilityType;
  /** A well slug or a uuid rendered as text. */
  id: string;
  /** Display name, snapshotted when tagged. */
  label: string;
}

export interface Invoice {
  id: string;
  /** Invoice or field ticket. Both live in one table and read differently. */
  docType: "invoice" | "field_ticket";
  /** Who sent it. */
  vendor: string;
  /** The vendor's own invoice number, as printed. */
  invoiceNo: string;
  /** Invoice date, ISO `YYYY-MM-DD`. */
  date: string;
  /** Payment due date, ISO `YYYY-MM-DD`. Empty when the invoice states none. */
  dueDate: string;
  /** The period the WORK covers, widened across the lines. */
  serviceStart: string;
  serviceEnd: string;
  /**
   * What the charge is against, as ONE cell: the facilities the invoice is
   * billed against, or, for an invoice nobody has tagged yet, the property the
   * vendor printed. `facilities` says which of the two it is.
   */
  chargedTo: string;
  /** The maintained facility set. Empty means `chargedTo` is the printed text. */
  facilities: InvoiceFacility[];
  /**
   * The cost object. One AFE when the whole invoice is coded to one, "Multiple"
   * when its lines split across several, empty when none is coded.
   */
  afe: string;
  /** How many charge lines the invoice carries. */
  lineCount: number;
  /** Invoice total in US dollars. */
  amount: number;
  /** Signed URL of the source document, when one is attached. */
  fileUrl: string | null;
  /** Original file name, shown as the viewer's title. */
  fileName: string | null;
}
