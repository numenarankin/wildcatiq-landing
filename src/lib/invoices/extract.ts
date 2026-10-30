/**
 * One invoice as the Invoices page's reader returns it (`lib/invoices/extract.ts`):
 * nested, one header and N charge lines, exactly as the document is. landing:
 * the shapes only, written out from the app's zod schemas; nothing is read.
 */

export interface ExtractedLine {
  /** The charge description VERBATIM, including sizes, depths and intervals. */
  description: string;
  chargeType: "Labor" | "Materials" | "Equipment" | "Other";
  chargeSubtype: string;
  quantity: number | null;
  uom: string;
  unitPrice: number | null;
  noCharge: boolean;
  amount: number | null;
  serviceStart: string;
  serviceEnd: string;
  taxable: "yes" | "no" | "unknown";
  afeNumber: string;
  costCenter: string;
  glCode: string;
  ticketNo: string;
  poNumber: string;
}

export interface ExtractedInvoice {
  vendor: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: string;
  documentKind: "invoice" | "field_ticket";
  /** The lease / well / facility the work was done on, VERBATIM as printed. */
  propertyRef: string;
  county: string;
  rrcDistrict: string;
  subtotal: number | null;
  taxPrinted: number | null;
  /** The tax line's label copied VERBATIM, e.g. 'Sales Tax (2.42%)'. */
  taxLabelRaw: string;
  invoiceTotal: number | null;
  lines: ExtractedLine[];
}
