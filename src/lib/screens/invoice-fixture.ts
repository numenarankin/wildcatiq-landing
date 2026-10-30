/**
 * The Invoices page's fixture, in the app's own shapes: the vendor invoice the
 * office manager uploads on /invoices, as the Invoices page's reader returns it
 * (`ExtractedInvoice`), the row it files as (`Invoice`), the rows already on
 * the list, and the approval cards the save hands back (`saveInvoices`'s
 * backfill: the vendor first, then the well reading of the same paper).
 *
 * The job is Roy Corbett 4's rod part (EVENTS.rc4Downtime), billed by the same
 * crew whose ticket the well page reads in `documents-fixture.ts`. The service,
 * downtime and equipment cards are `corbettServiceProposals` row for row, so
 * the job reads identically wherever it appears, and the invoice total is the
 * service row's cost.
 */
import type { IngestProposal } from "@/lib/ai/ingest/actions";
import type { ExtractedInvoice, ExtractedLine } from "@/lib/invoices/extract";
import type { Invoice } from "@/lib/invoices/invoices";
import { CORBETT_JOB, corbettServiceProposals } from "./documents-fixture";
import { EVENTS, OPERATOR, WELLS } from "./operator";

const rc4 = WELLS.find((w) => w.id === EVENTS.rc4Downtime.well)!;

/** The vendor's invoice for ticket 20417, the PDF the office manager drops. */
export const INVOICE_NO = "11382";
export const TICKET_NO = "20417";
export const INVOICE_FILE = "brazos-bend-well-service-invoice-11382.pdf";

/** The vendor's letterhead (fictional, Young County). */
export const VENDOR = {
  name: CORBETT_JOB.vendor,
  address: ["1840 FM 1287", `${OPERATOR.city}, TX ${OPERATOR.zip}`],
  phone: "(940) 555-0193",
} as const;

/** What the vendor printed as the property: the well, the vendor's way. */
export const PROPERTY_PRINTED = `${OPERATOR.name.replace(", Inc.", "")} - ${rc4.name.replace(/ (\d+)$/, " #$1")}`;

const line = (
  description: string,
  chargeType: ExtractedLine["chargeType"],
  chargeSubtype: string,
  quantity: number | null,
  uom: string,
  unitPrice: number | null,
  amount: number
): ExtractedLine => ({
  description,
  chargeType,
  chargeSubtype,
  quantity,
  uom,
  unitPrice,
  noCharge: false,
  amount,
  serviceStart: CORBETT_JOB.date,
  serviceEnd: "",
  taxable: "yes",
  afeNumber: "",
  costCenter: "",
  glCode: "",
  ticketNo: TICKET_NO,
  poNumber: "",
});

/**
 * The seven charge lines as printed. They sum to the subtotal, and the
 * subtotal plus the vendor's 2.42% (labelled "Sales Tax", as vendors label the
 * Texas well-servicing tax) is the service row's cost to the cent:
 * 4,276.51 + 103.49 = 4,380.00.
 */
const LINES: ExtractedLine[] = [
  line("Pulling unit and 4-man crew, rig up, pull rods, fish parted rod, rerun pump", "Labor", "", 10.5, "hr", 265, 2782.5),
  line("Rod elevators, tongs and handling tools", "Equipment", "rental", 1, "day", 225, 225),
  line("Hot oil unit, flush tubing", "Equipment", "", 3, "hr", 145, 435),
  line('3/4" Grade D sucker rod, 25\'', "Materials", "", 1, "ea", 168, 168),
  line('3/4" rod coupling, slimhole', "Materials", "", 2, "ea", 14.5, 29),
  line("Mileage, yard to location and return", "Other", "mileage", 86, "mi", 3.25, 279.5),
  line("Fuel surcharge", "Other", "surcharge", null, "", null, 357.51),
];

/**
 * The field ticket's own lines: what the crew wrote down on location before the
 * office priced it, so the invoice's quantities with no prices (the surcharge
 * is the office's, not the crew's).
 */
export function ticketItems(): { description: string; quantity: number; uom: string }[] {
  return LINES.filter((l) => l.quantity != null).map((l) => ({ description: l.description, quantity: l.quantity!, uom: l.uom }));
}

const SUBTOTAL = 4276.51;
const TAX = 103.49;
const TAX_LABEL = "Sales Tax (2.42%)";

export const INVOICE_DATE = "2026-10-20";
const DUE_DATE = "2026-11-19";

/** The invoice as the reader hands it to the review screen. */
export function readInvoice(): ExtractedInvoice {
  return {
    vendor: VENDOR.name,
    invoiceNo: INVOICE_NO,
    invoiceDate: INVOICE_DATE,
    dueDate: DUE_DATE,
    paymentTerms: "Net 30",
    documentKind: "invoice",
    propertyRef: PROPERTY_PRINTED,
    county: OPERATOR.county,
    rrcDistrict: OPERATOR.district,
    subtotal: SUBTOTAL,
    taxPrinted: TAX,
    taxLabelRaw: TAX_LABEL,
    invoiceTotal: CORBETT_JOB.cost,
    lines: LINES,
  };
}

/**
 * The row the save files: the printed property resolved to Roy Corbett 4,
 * which seeds the invoice's facility, so "Charged To" names the well.
 */
export function filedInvoice(): Invoice {
  return {
    id: "inv-bb-11382",
    docType: "invoice",
    vendor: VENDOR.name,
    invoiceNo: INVOICE_NO,
    date: INVOICE_DATE,
    dueDate: DUE_DATE,
    serviceStart: CORBETT_JOB.date,
    serviceEnd: "",
    chargedTo: rc4.name,
    facilities: [{ type: "well", id: rc4.id, label: rc4.name }],
    afe: "",
    lineCount: LINES.length,
    amount: CORBETT_JOB.cost,
    fileUrl: null,
    fileName: INVOICE_FILE,
  };
}

const onFile = (
  id: string,
  vendor: string,
  invoiceNo: string,
  date: string,
  dueDate: string,
  service: string,
  chargedTo: { type: "well" | "lease"; id: string; label: string },
  lineCount: number,
  amount: number
): Invoice => ({
  id,
  docType: "invoice",
  vendor,
  invoiceNo,
  date,
  dueDate,
  serviceStart: service,
  serviceEnd: "",
  chargedTo: chargedTo.label,
  facilities: [chargedTo],
  afe: "",
  lineCount,
  amount,
  fileUrl: null,
  fileName: null,
});

/** September and October's payables already on the list, newest first. */
export function invoicesOnFile(): Invoice[] {
  return [
    onFile("inv-ct-6631", "Cross Timbers Hot Oil", "6631", "2026-10-14", "2026-11-13", "2026-10-09", { type: "well", id: "w-s2", label: "Smith 2" }, 3, 1184.36),
    onFile("inv-lc-24418", "Loving Chemical Supply", "24418", "2026-10-06", "2026-11-05", "2026-10-02", { type: "lease", id: "l-johnson", label: "Johnson A" }, 2, 642.18),
    onFile("inv-rr-3097", "Red River Roustabout", "3097", "2026-09-29", "2026-10-29", "2026-09-24", { type: "lease", id: "l-young", label: "Fannie Young" }, 5, 2318.75),
    onFile("inv-wp-88214", "Wichita Pipe & Supply", "88214", "2026-09-18", "2026-10-18", "2026-09-16", { type: "well", id: "w-ja3", label: "Johnson A 3" }, 4, 963.4),
    onFile("inv-ct-6587", "Cross Timbers Hot Oil", "6587", "2026-09-11", "2026-10-11", "2026-09-08", { type: "well", id: "w-rp7", label: "Roach Parrott 7" }, 3, 1046.92),
  ];
}

/**
 * The cards `saveInvoices` hands back, in the order they are offered: the
 * vendor that sent it (no Brazos Bend in the directory yet), then the well
 * reading of the same paper, which is the well page's ticket read
 * (`corbettServiceProposals`) row for row. Roy Corbett 4 is on file, so no
 * facility card.
 */
export function invoiceBackfillProposals(): IngestProposal[] {
  const vendor: IngestProposal = {
    id: "ip-bb-vendor",
    type: "serviceProviders",
    fileName: INVOICE_FILE,
    wellId: null,
    tankId: null,
    meterId: null,
    rows: [
      {
        company: VENDOR.name,
        service: "",
        contact: "",
        phone: "",
        email: "",
        status: "Active",
        description: "",
        sourceText: `Billed invoice ${INVOICE_NO}`,
      },
    ],
    status: "pending",
    createdAt: "2026-10-27T14:06:00Z",
  };
  const well = corbettServiceProposals().map((p) => ({
    ...p,
    id: `${p.id}-inv`,
    fileName: INVOICE_FILE,
    createdAt: "2026-10-27T14:06:00Z",
  }));
  return [vendor, ...well];
}
