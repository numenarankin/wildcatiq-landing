"use client";

/**
 * The Invoices page with a vendor invoice upload played forward on a loop,
 * every frame the app's own components: `InvoicesWorkspace`'s tab header,
 * "Invoice" button and `InvoicesTable`; then `UploadInvoiceModal`'s steps in
 * the app's `SwipeUpModal` (the drop zone, a file landing on it, the staged
 * file, the read under the scanner sweep); then `InvoiceReviewModal`, the
 * scan beside `ExtractedInvoicePanel`, and its File press; the invoice lands
 * at the top of the table; then, as `saveInvoices` hands them back, the
 * `IngestApprovalModal` cards it queues on /invoices: the vendor for the
 * People directory, then the well reading of the same paper (Roy Corbett 4's
 * service row, its downtime, its rods), each approved in turn.
 *
 * Both modals reach their next step only through a server read or save, so
 * their branches are laid out here verbatim with the same components, the way
 * `documents-live.tsx` lays out the statement upload. The scan pane is the one
 * stand-in: the app shows the PDF through react-pdf, which the landing does
 * not install, so the invoice is drawn as plain HTML in the same pane.
 */
import { useCallback, useEffect, useState } from "react";
import { File02, Loading01, Plus, UploadCloud01 } from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import { ScanSweep } from "@/components/scan/scan-sweep";
import { cn } from "@/lib/utils";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { ExtractedInvoicePanel } from "@/components/invoices/invoice-review-modal";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { IngestApprovalModal } from "@/components/ai/ingest/ingest-approval-modal";
import type { ExtractedInvoice } from "@/lib/invoices/extract";
import { wellOptions } from "@/lib/screens/documents-fixture";
import {
  INVOICE_FILE,
  TICKET_NO,
  VENDOR,
  filedInvoice,
  invoiceBackfillProposals,
  invoicesOnFile,
  readInvoice,
} from "@/lib/screens/invoice-fixture";
import { OPERATOR } from "@/lib/screens/operator";
import { AppFrame } from "../app-frame";
import { useDemoActive } from "../demo-active";

type Tab = "invoices" | "expenses";

const TABS: { value: Tab; label: string }[] = [
  { value: "invoices", label: "Invoices" },
  { value: "expenses", label: "Expenses" },
];

/**
 * The script. `closed` is the page before the click; `open` mounts the upload
 * modal; `drag` and `over` are the file card gliding in and the zone lighting
 * up under it; `staged` and `reading` are the Read invoice press; `review` is
 * the review screen, `saving` its File press; `saved` closes it and files the
 * invoice in the table; then one `card` / `approve` pair per proposal, the
 * card's own Done press moving the queue along; `end` holds the finished page.
 */
type Phase =
  | "closed"
  | "open"
  | "drag"
  | "over"
  | "staged"
  | "reading"
  | "review"
  | "saving"
  | "saved"
  | "card"
  | "approve"
  | "done"
  | "end";

const PHASE_MS: Record<Phase, number> = {
  closed: 1200,
  open: 1400,
  drag: 1100,
  over: 500,
  staged: 1100,
  reading: 2600,
  review: 5200,
  saving: 1000,
  saved: 1400,
  card: 2200,
  approve: 2300,
  done: 0,
  end: 3200,
};

const NEXT: Record<Exclude<Phase, "done">, Phase> = {
  closed: "open",
  open: "drag",
  drag: "over",
  over: "staged",
  staged: "reading",
  reading: "review",
  review: "saving",
  saving: "saved",
  saved: "card",
  card: "approve",
  approve: "done",
  end: "closed",
};

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function InvoiceIngestScreen() {
  const [fx] = useState(() => ({
    read: readInvoice(),
    filed: filedInvoice(),
    onFile: invoicesOnFile(),
    proposals: invoiceBackfillProposals(),
  }));
  const [tab, setTab] = useState<Tab>("invoices");
  const [draft, setDraft] = useState<ExtractedInvoice>(fx.read);
  const [phase, setPhase] = useState<Phase>("closed");
  const [card, setCard] = useState(0);
  const active = useDemoActive();

  // Each step runs for its time, then the next. `done` has no timer: it is
  // the card's Done press, and the card's own `onResolved` moves the queue.
  useEffect(() => {
    if (!active || phase === "done") return;
    const id = setTimeout(() => setPhase(NEXT[phase]), PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [active, phase]);

  const onResolved = useCallback(() => {
    setCard((c) => c + 1);
    setPhase("card");
  }, []);

  // The queue ran out: hold the finished page, then start over.
  const queueDone = phase === "card" && card >= fx.proposals.length;
  useEffect(() => {
    if (!queueDone) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the queue ran out
    setPhase("end");
  }, [queueDone]);
  useEffect(() => {
    if (phase !== "closed") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the loop's reset
    setCard(0);
    setDraft(fx.read);
  }, [phase, fx]);

  const uploadOpen = !["closed", "saved", "card", "approve", "done", "end"].includes(phase);
  const review = phase === "review" || phase === "saving";
  const saving = phase === "saving";
  const staged = phase === "staged" || phase === "reading";
  const reading = phase === "reading";
  const dragging = phase === "drag" || phase === "over";
  const filed = ["saved", "card", "approve", "done", "end"].includes(phase);
  const onCard = phase === "card" || phase === "approve" || phase === "done";
  const proposal = onCard && fx.proposals[card] ? fx.proposals[card] : null;
  const noop = useCallback(() => {}, []);

  const invoices = filed ? [fx.filed, ...fx.onFile] : fx.onFile;

  return (
    <AppFrame path="/invoices" crumbs={["Invoices"]}>
      <div className="flex flex-1 flex-col gap-6">
        {/* Header-styled toggle replaces the page title, with the add action at right. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={tab === t.value}
                onClick={() => setTab(t.value)}
                className={cn(
                  "cursor-pointer font-heading text-2xl font-semibold tracking-tight transition-colors",
                  tab === t.value
                    ? "text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3" />
            {tab === "invoices" ? (
              <Button size="lg">
                <Plus />
                Invoice
              </Button>
            ) : null}
          </div>
        </div>

        <div>
          <div className={cn(tab !== "invoices" && "hidden")}>
            <InvoicesTable invoices={invoices} onRowClick={noop} onDelete={noop} />
          </div>
        </div>
      </div>

      {/* `UploadInvoiceModal`, then `InvoiceReviewModal` once the read lands. */}
      <SwipeUpModal
        open={uploadOpen}
        onClose={noop}
        title={review ? "Review Invoices" : "Upload Invoice"}
        description={
          review
            ? `1 invoice read from ${INVOICE_FILE}. Nothing is saved until you file them.`
            : "Vendor invoice, extracted and reviewed before saving."
        }
        // The app's `h-[90vh]`, as a share of the canvas the screen draws in.
        className="h-[90%] max-w-7xl"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {!review ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {staged ? (
                <div className="relative flex h-full flex-col items-center justify-center gap-3 text-center">
                  {reading ? <ScanSweep /> : null}
                  <File02 className="size-10 text-muted-foreground" />
                  <p className="text-sm font-medium">{INVOICE_FILE}</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {reading
                      ? "Reading the invoice. Its lines, dates, references and totals come back for review before anything is saved."
                      : "Read invoice pulls out the vendor, the charge lines and the totals, then hands them to you for approval."}
                  </p>
                </div>
              ) : (
                <div className="relative flex h-full items-center justify-center p-4">
                  <div
                    className={cn(
                      "flex min-h-[18rem] w-full max-w-xl flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                      phase === "over" ? "border-ring bg-muted/40" : "border-border"
                    )}
                  >
                    <UploadCloud01 className="size-10 text-muted-foreground" />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Drop an invoice or click to upload</span>
                      <span className="text-xs text-muted-foreground">PDF, image, CSV, or XLSX</span>
                    </div>
                  </div>
                  {dragging ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-xl"
                      style={{ animation: "doc-drag-in 1.5s cubic-bezier(0.3, 0, 0.2, 1) both" }}
                    >
                      <File02 className="size-4 text-muted-foreground" />
                      {INVOICE_FILE}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <div className="min-h-0 overflow-hidden rounded-[0.15rem] border bg-neutral-100">
                <InvoicePaper invoice={fx.read} />
              </div>
              <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
                <ExtractedInvoicePanel invoice={draft} wells={wellOptions} onChange={setDraft} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t px-5 py-4">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              {review ? (
                <span className="truncate text-muted-foreground">
                  {draft.lines.length} charge lines · {usd.format(draft.invoiceTotal ?? 0)} total
                </span>
              ) : staged ? (
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-1.5 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  title="Replace file"
                >
                  <File02 className="size-4 shrink-0" />
                  <span className="truncate">{INVOICE_FILE}</span>
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {review ? (
                <>
                  <Button variant="ghost" disabled={saving}>
                    Start over
                  </Button>
                  <Button disabled={saving}>
                    {saving ? <Loading01 className="size-4 animate-spin" /> : null}
                    {saving ? "Filing…" : "File 1 invoice"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" disabled={reading}>
                    Cancel
                  </Button>
                  <Button variant="outline" disabled={reading}>
                    Choose from Files
                  </Button>
                  <Button disabled={!staged || reading}>
                    {reading ? <Loading01 className="size-4 animate-spin" /> : null}
                    {reading ? "Reading…" : "Read invoice"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </SwipeUpModal>

      {proposal ? (
        <IngestApprovalModal
          key={proposal.id}
          proposal={proposal}
          wellOptions={wellOptions}
          remaining={fx.proposals.length - card - 1}
          onResolved={onResolved}
          script={phase === "approve" ? "approve" : phase === "done" ? "done" : null}
        />
      ) : null}
    </AppFrame>
  );
}

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** MM/DD/YYYY, the way the vendor prints it. */
function printed(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

/** The invoice as the vendor printed it, standing in for the PDF pane. */
function InvoicePaper({ invoice }: { invoice: ExtractedInvoice }) {
  return (
    <div className="h-full overflow-hidden p-4">
      <div className="mx-auto flex h-full max-w-[40rem] flex-col gap-5 bg-white px-6 py-6 font-mono text-[10px] leading-relaxed text-neutral-800 shadow-sm">
        <div className="flex items-start justify-between border-b border-neutral-300 pb-3">
          <div>
            <div className="text-[15px] font-bold uppercase tracking-tight text-neutral-900">{VENDOR.name}</div>
            <div>{VENDOR.address[0]}</div>
            <div>{VENDOR.address[1]}</div>
            <div>{VENDOR.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-bold text-neutral-900">INVOICE</div>
            <div>No. {invoice.invoiceNo}</div>
            <div>Date {printed(invoice.invoiceDate)}</div>
            <div>Terms {invoice.paymentTerms}</div>
            <div>Due {printed(invoice.dueDate)}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-500">Bill to</div>
            <div className="font-bold text-neutral-900">{OPERATOR.name}</div>
            <div>{OPERATOR.mailing}</div>
            <div>
              {OPERATOR.city}, TX {OPERATOR.zip}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-500">Lease / well</div>
            <div className="font-bold text-neutral-900">{invoice.propertyRef}</div>
            <div>
              {invoice.county} Co. RRC Dist. {invoice.rrcDistrict}
            </div>
            <div>Field ticket {TICKET_NO}</div>
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-neutral-400 text-left text-[9px] uppercase tracking-wider text-neutral-600">
              <th className="py-1 pr-2 font-semibold">Date</th>
              <th className="py-1 pr-2 font-semibold">Description</th>
              <th className="py-1 pr-2 text-right font-semibold">Qty</th>
              <th className="py-1 pr-2 text-right font-semibold">Rate</th>
              <th className="py-1 pr-2 text-right font-semibold">Amount</th>
              <th className="py-1 font-semibold">Tx</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l, i) => (
              <tr key={i} className="border-b border-dotted border-neutral-300 align-top tabular-nums">
                <td className="py-1.5 pr-2">{printed(l.serviceStart).slice(0, 5)}</td>
                <td className="py-1.5 pr-2 uppercase">{l.description}</td>
                <td className="py-1.5 pr-2 text-right">{l.quantity != null ? `${l.quantity} ${l.uom}` : ""}</td>
                <td className="py-1.5 pr-2 text-right">{l.unitPrice != null ? money.format(l.unitPrice) : ""}</td>
                <td className="py-1.5 pr-2 text-right">{money.format(l.amount ?? 0)}</td>
                <td className="py-1.5">{l.taxable === "yes" ? "T" : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto grid w-56 grid-cols-[1fr_auto] gap-x-4 tabular-nums">
          <span>Subtotal</span>
          <span className="text-right">{money.format(invoice.subtotal ?? 0)}</span>
          <span>{invoice.taxLabelRaw}</span>
          <span className="text-right">{money.format(invoice.taxPrinted ?? 0)}</span>
          <span className="border-t border-neutral-400 pt-1 font-bold text-neutral-900">Total due</span>
          <span className="border-t border-neutral-400 pt-1 text-right font-bold text-neutral-900">
            ${money.format(invoice.invoiceTotal ?? 0)}
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-neutral-300 pt-3 text-[10px] text-neutral-600">
          <div>Rod parted at 3,640 ft. Pump tested good, rerun. Thank you for your business.</div>
          <div className="text-right">Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
}
