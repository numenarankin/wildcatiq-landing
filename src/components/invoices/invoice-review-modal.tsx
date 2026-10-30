"use client";

/**
 * The invoice review's right-hand pane (`components/invoices/invoice-review-modal.tsx`):
 * `ExtractedInvoicePanel`, one invoice as read, every field a click away from
 * being corrected. landing: the panel and its line rows are ported verbatim;
 * the modal around them (`InvoiceReviewModal`, which files through the
 * `saveInvoices` server action) is laid out by the screen that plays it, the
 * way `documents-live.tsx` lays out the statement upload.
 */
import { Panel } from "@/components/scout/modal-ui";
import type { ExtractedInvoice } from "@/lib/invoices/extract";
import type { WellOption } from "@/lib/ai/ingest/actions";
import { canonical } from "@/lib/ai/ingest/normalize";
import {
  EditableRow,
  InlineDate,
  InlineSelect,
  InlineText,
  SelectRow,
  money,
} from "@/components/invoices/inline-edit";
import { cn } from "@/lib/utils";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const CHARGE_TYPES = [
  { value: "Labor", label: "Labor" },
  { value: "Materials", label: "Materials" },
  { value: "Equipment", label: "Equipment" },
  { value: "Other", label: "Other" },
];

const TAXABLE = [
  { value: "unknown", label: "Tax not marked" },
  { value: "yes", label: "Taxable" },
  { value: "no", label: "Non-taxable" },
];

/** The five references a read line carries, with their printed names. */
const LINE_REFS: { key: keyof Pick<ExtractedLine, "afeNumber" | "costCenter" | "glCode" | "ticketNo" | "poNumber">; label: string }[] = [
  { key: "afeNumber", label: "AFE" },
  { key: "costCenter", label: "Cost ctr" },
  { key: "glCode", label: "GL" },
  { key: "ticketNo", label: "Ticket" },
  { key: "poNumber", label: "PO" },
];

type ExtractedLine = ExtractedInvoice["lines"][number];

/** The dropdown value for "no well": Base UI wants a non-empty string. */
const NO_WELL = "__none__";

/**
 * The "Charged to" dropdown: every well, by NAME, because the name is what the
 * draft carries (`propertyRef`) and what the writer resolves to a well exactly.
 *
 * The printed property is matched the way the writer matches it — canonical
 * form, then the tail after the operator's own name ("Sky Resources - Roach
 * #19"). Matched, the well is the selected value. Unmatched, the printed text
 * is added as the selected value so nothing the vendor wrote disappears until
 * the reader picks a well over it.
 */
function chargedToOptions(
  propertyRef: string,
  wells: WellOption[]
): { value: string; options: { value: string; label: string }[] } {
  const options = wells.map((w) => ({ value: w.name, label: w.name }));
  const printed = propertyRef.trim();
  if (!printed) {
    return { value: NO_WELL, options: [{ value: NO_WELL, label: "—" }, ...options] };
  }
  const keys = [canonical(printed), canonical(printed.split(" - ").pop() ?? "")];
  const hit = wells.find((w) => keys.includes(canonical(w.name)));
  if (hit) return { value: hit.name, options };
  return {
    value: printed,
    options: [{ value: printed, label: `${printed} (as printed)` }, ...options],
  };
}

/**
 * One extracted invoice, laid out like the viewer's right-hand pane, every
 * field a click away from being corrected. Edits go to `onChange` as a whole
 * new invoice; the modal keeps the copy that will be filed.
 */
export function ExtractedInvoicePanel({
  invoice,
  wells,
  onChange,
}: {
  invoice: ExtractedInvoice;
  /** The org's wells, for the "Charged to" dropdown. */
  wells: WellOption[];
  onChange: (next: ExtractedInvoice) => void;
}) {
  const set = <K extends keyof ExtractedInvoice>(key: K, value: ExtractedInvoice[K]) =>
    onChange({ ...invoice, [key]: value });
  const setLine = (index: number, next: ExtractedLine) =>
    onChange({
      ...invoice,
      lines: invoice.lines.map((l, i) => (i === index ? next : l)),
    });
  const isTicket = invoice.documentKind === "field_ticket";
  const chargedTo = chargedToOptions(invoice.propertyRef, wells);

  const summed = invoice.lines.reduce((n, l) => n + (l.amount ?? 0), 0);
  // The document's own subtotal against the sum of the lines we read. They
  // disagreeing is the single most useful signal on this screen: it means a
  // line was dropped or double-counted, which no amount of confident-looking
  // field extraction would otherwise reveal.
  const mismatch =
    invoice.subtotal != null && Math.abs(summed - invoice.subtotal) > 0.02;

  return (
    <Panel
      title={`${invoice.vendor || "Unknown vendor"}${invoice.invoiceNo ? ` · ${invoice.invoiceNo}` : ""}`}
    >
      <div className="px-4 py-2">
        <EditableRow
          label="Vendor"
          value={invoice.vendor || null}
          editable
          onCommit={(v) => set("vendor", v)}
        />
        <EditableRow
          label={isTicket ? "Ticket #" : "Invoice #"}
          value={invoice.invoiceNo || null}
          mono
          editable
          onCommit={(v) => set("invoiceNo", v)}
        />
        <SelectRow
          label="Type"
          value={invoice.documentKind}
          options={[
            { value: "invoice", label: "Invoice" },
            { value: "field_ticket", label: "Field ticket" },
          ]}
          editable
          onCommit={(v) => set("documentKind", v as ExtractedInvoice["documentKind"])}
        />
        <EditableRow
          label="Invoice date"
          value={invoice.invoiceDate || null}
          kind="date"
          mono
          editable
          onCommit={(v) => set("invoiceDate", v)}
        />
        <EditableRow
          label="Due"
          value={invoice.dueDate || null}
          kind="date"
          mono
          editable
          onCommit={(v) => set("dueDate", v)}
        />
        <EditableRow
          label="Terms"
          value={invoice.paymentTerms || null}
          editable
          onCommit={(v) => set("paymentTerms", v)}
        />
        {/* The well this is against, chosen from the wells that EXIST — not
            typed, so it can only ever name a real one. It seeds "Billed
            against" when filed. The printed property is offered as the current
            value while it matches no well, so a reader can see what the vendor
            wrote before replacing it. */}
        <SelectRow
          label="Charged to"
          value={chargedTo.value}
          options={chargedTo.options}
          editable
          onCommit={(v) => set("propertyRef", v === NO_WELL ? "" : v)}
        />
        <EditableRow
          label="Subtotal"
          value={invoice.subtotal != null ? usd.format(invoice.subtotal) : null}
          raw={invoice.subtotal != null ? String(invoice.subtotal) : ""}
          kind="money"
          mono
          editable
          onCommit={(v) => {
            const n = money(v);
            if (n !== undefined) set("subtotal", n);
          }}
        />
        <EditableRow
          label={invoice.taxLabelRaw || "Tax"}
          labelEditable
          onCommitLabel={(v) => set("taxLabelRaw", v)}
          value={invoice.taxPrinted != null ? usd.format(invoice.taxPrinted) : null}
          raw={invoice.taxPrinted != null ? String(invoice.taxPrinted) : ""}
          kind="money"
          mono
          editable
          onCommit={(v) => {
            const n = money(v);
            if (n !== undefined) set("taxPrinted", n);
          }}
        />
        <EditableRow
          label="Total"
          value={invoice.invoiceTotal != null ? usd.format(invoice.invoiceTotal) : null}
          raw={invoice.invoiceTotal != null ? String(invoice.invoiceTotal) : ""}
          kind="money"
          mono
          editable
          onCommit={(v) => {
            const n = money(v);
            if (n !== undefined) set("invoiceTotal", n);
          }}
        />

        {mismatch ? (
          <p className="mt-2 border-t pt-2 text-xs leading-relaxed text-amber-700 dark:text-amber-500">
            The charge lines read here add to {usd.format(summed)}, but the
            invoice prints a subtotal of {usd.format(invoice.subtotal ?? 0)}.
            Check the lines against the scan before filing.
          </p>
        ) : null}

        <ul className="mt-2 flex flex-col divide-y border-t">
          {invoice.lines.map((l, i) => (
            <DraftLineRow key={i} line={l} onChange={(next) => setLine(i, next)} />
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/**
 * One charge line as read, every part of it editable: the description and
 * amount on the first row, the measure, type, dates, references and tax
 * marker on the second. A blank shows as a muted label to click, because a
 * blank is exactly what a correction fills in.
 */
function DraftLineRow({
  line,
  onChange,
}: {
  line: ExtractedLine;
  onChange: (next: ExtractedLine) => void;
}) {
  const set = <K extends keyof ExtractedLine>(key: K, value: ExtractedLine[K]) =>
    onChange({ ...line, [key]: value });
  const amountShown = line.noCharge
    ? "No charge"
    : line.amount != null
      ? usd.format(line.amount)
      : null;

  return (
    <li className="flex flex-col gap-1 py-1.5 text-xs">
      <div className="flex items-baseline justify-between gap-3">
        <InlineText
          value={line.description}
          onCommit={(v) => set("description", v)}
          ariaLabel="Description"
          className="min-w-0 flex-1 whitespace-normal text-xs"
          inputClassName="flex-1"
        />
        <InlineText
          value={line.noCharge ? "" : line.amount != null ? String(line.amount) : ""}
          display={amountShown}
          kind="money"
          onCommit={(v) => {
            const n = money(v);
            if (n === undefined) return;
            onChange({ ...line, amount: n, noCharge: n == null ? line.noCharge : false });
          }}
          ariaLabel="Amount"
          className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
          inputClassName="w-28"
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        <InlineText
          value={line.quantity != null ? String(line.quantity) : ""}
          kind="money"
          placeholder="qty"
          onCommit={(v) => {
            const n = money(v);
            if (n !== undefined) set("quantity", n);
          }}
          ariaLabel="Quantity"
          className="tabular-nums"
          inputClassName="w-16"
        />
        <InlineText
          value={line.uom}
          placeholder="unit"
          onCommit={(v) => set("uom", v)}
          ariaLabel="Unit of measure"
          inputClassName="w-16"
        />
        <InlineText
          value={line.unitPrice != null ? String(line.unitPrice) : ""}
          display={line.unitPrice != null ? `@ ${usd.format(line.unitPrice)}` : null}
          kind="money"
          placeholder="@ rate"
          onCommit={(v) => {
            const n = money(v);
            if (n !== undefined) set("unitPrice", n);
          }}
          ariaLabel="Unit price"
          className="tabular-nums"
          inputClassName="w-24"
        />
        <InlineSelect
          value={line.chargeType}
          options={CHARGE_TYPES}
          onCommit={(v) => set("chargeType", v as ExtractedLine["chargeType"])}
          ariaLabel="Charge type"
          className="font-normal"
        />
        <InlineText
          value={line.chargeSubtype}
          placeholder="subtype"
          onCommit={(v) => set("chargeSubtype", v)}
          ariaLabel="Charge subtype"
          inputClassName="w-24"
        />
        <InlineDate
          value={line.serviceStart || null}
          placeholder="service start"
          onCommit={(v) => set("serviceStart", v)}
          ariaLabel="Service start"
          className="text-xs font-normal"
        />
        <InlineDate
          value={line.serviceEnd || null}
          placeholder="service end"
          onCommit={(v) => set("serviceEnd", v)}
          ariaLabel="Service end"
          className="text-xs font-normal"
        />
        {LINE_REFS.map((r) => (
          <InlineText
            key={r.key}
            value={line[r.key]}
            display={line[r.key] ? `${r.label} ${line[r.key]}` : null}
            placeholder={r.label}
            onCommit={(v) => set(r.key, v)}
            ariaLabel={r.label}
            className="tabular-nums"
            inputClassName="w-28"
          />
        ))}
        <InlineSelect
          value={line.taxable}
          options={TAXABLE}
          onCommit={(v) => set("taxable", v as ExtractedLine["taxable"])}
          ariaLabel="Taxable"
          className="font-normal"
        />
        <button
          type="button"
          onClick={() =>
            onChange({
              ...line,
              noCharge: !line.noCharge,
              amount: line.noCharge ? line.amount : null,
              unitPrice: line.noCharge ? line.unitPrice : null,
            })
          }
          aria-pressed={line.noCharge}
          className={cn(
            "rounded-sm px-1.5 py-0.5 hover:bg-muted",
            line.noCharge ? "text-foreground" : "text-muted-foreground/60"
          )}
        >
          No charge
        </button>
      </div>
    </li>
  );
}
