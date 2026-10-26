"use client";

/**
 * The Revenue page's Statements tab with a statement upload played forward on
 * a loop, every frame the app's own components: `RevenueWorkspace`'s tab
 * header, Add Statement button and `StatementsTable`; then
 * `UploadStatementModal`'s steps in the app's `SwipeUpModal` (the drop zone,
 * a file landing on it, the staged file, the read under the scanner sweep,
 * the `StatementReview` grid beside the scan, the save); then, as the app
 * queues them after a save, the `IngestApprovalModal` cards for what the
 * statement named that was not on file (the Boyd lease, its tank, the hauls),
 * each approved in turn.
 *
 * The upload modal reaches its review step only through a real file read, so
 * its branches are laid out here verbatim with the same components. The scan
 * pane is the one stand-in: the app shows the PDF through react-pdf, which
 * the landing does not install, so the statement page is drawn as plain HTML
 * in the same pane.
 */
import { useCallback, useEffect, useState } from "react";
import { FileTextIcon, PlusIcon, UploadCloudIcon } from "lucide-react";
import { Loading01 } from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import { ScanSweep } from "@/components/scan/scan-sweep";
import { cn } from "@/lib/utils";
import { StatementsTable } from "@/components/statements/statements-table";
import {
  StatementReview,
  type ReviewHeader,
  type ReviewLine,
} from "@/components/statements/statement-review";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { IngestApprovalModal } from "@/components/ai/ingest/ingest-approval-modal";
import { RUN_GRAVITY, documentsFixture } from "@/lib/screens/documents-fixture";
import { OIL_PURCHASER, OPERATOR } from "@/lib/screens/operator";
import { SKY_OPERATOR_NO, SKY_P5_NAME } from "@/lib/screens/recon-rrc";
import { AppFrame } from "./app-frame";
import { useDemoActive } from "./demo-active";

type Tab = "statements" | "payments";

const TABS: { value: Tab; label: string }[] = [
  { value: "statements", label: "Statements" },
  { value: "payments", label: "Payments" },
];

/**
 * The script. `closed` is the page before the click; `open` mounts the upload
 * modal (its swipe-up); `drag` and `over` are the file card gliding in and
 * the zone lighting up under it; `saving` is the Save press; `saved` closes
 * the modal (its swipe-down) and files the statement in the table; then one
 * `card` / `approve` pair per proposal, the card's own Done press moving the
 * queue along; `end` holds the finished page before the loop starts over.
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
  end: 2600,
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

export function DocumentsLive() {
  const [fx] = useState(documentsFixture);
  const [tab, setTab] = useState<Tab>("statements");
  const [header, setHeader] = useState<ReviewHeader>(fx.header);
  const [lines, setLines] = useState<ReviewLine[]>(fx.lines);
  const [phase, setPhase] = useState<Phase>("closed");
  const [card, setCard] = useState(0);
  const active = useDemoActive();

  // Each step runs for its time, then the next. `done` has no timer: it is
  // the card's Done press, and the card's own `onResolved` moves the queue
  // along to the next card.
  useEffect(() => {
    if (!active || phase === "done") return;
    const id = setTimeout(() => setPhase(NEXT[phase]), PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [active, phase]);

  const onResolved = useCallback(() => {
    setCard((c) => c + 1);
    setPhase("card");
  }, []);

  // The queue ran out: hold the finished page, then start over. The loop's
  // reset puts back what the script changed.
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
    setHeader(fx.header);
    setLines(fx.lines);
  }, [phase, fx]);

  const uploadOpen = !["closed", "saved", "card", "approve", "done", "end"].includes(phase);
  const review = phase === "review" || phase === "saving";
  const staged = phase === "staged" || phase === "reading";
  const reading = phase === "reading";
  const dragging = phase === "drag" || phase === "over";
  const filed = ["saved", "card", "approve", "done", "end"].includes(phase);
  const onCard = phase === "card" || phase === "approve" || phase === "done";
  const proposal = onCard && fx.proposals[card] ? fx.proposals[card] : null;
  const drafts = 1;
  const totalLines = lines.length;
  const fileName = fx.fileName;
  const noop = useCallback(() => {}, []);

  const statements = filed ? [fx.saved, ...fx.statements] : fx.statements;

  return (
    <AppFrame path="/revenue" crumbs={["Revenue"]}>
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
                  "font-heading text-2xl font-semibold tracking-tight transition-colors",
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
            {tab === "statements" ? (
              <Button size="lg" className="bg-black text-white hover:bg-neutral-800">
                <PlusIcon />
                Add Statement
              </Button>
            ) : null}
          </div>
        </div>

        <div>
          <div className={cn("flex flex-col gap-6", tab !== "statements" && "hidden")}>
            <StatementsTable statements={statements} canManage onOpen={noop} onDelete={noop} />
          </div>
        </div>
      </div>

      <SwipeUpModal
        open={uploadOpen}
        onClose={noop}
        title={review ? "Review Statements" : "Upload Statement"}
        description={
          review
            ? `${drafts} statement read from ${fileName}. Nothing is saved until you file them.`
            : "Purchaser settlement, extracted and reviewed before saving."
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
                  <FileTextIcon className="size-10 text-muted-foreground" />
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="max-w-sm text-xs text-muted-foreground">
                    {reading
                      ? "Reading the document, then extracting the statement. Its purchaser, period and settlement lines come back for review before anything is saved."
                      : "Read statement pulls out the purchaser, the period and every settlement line, then hands them to you for approval."}
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
                    <UploadCloudIcon className="size-10 text-muted-foreground" />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">Drop a statement or click to upload</span>
                      <span className="text-xs text-muted-foreground">PDF, photo, CSV, or XLSX</span>
                    </div>
                  </div>
                  {dragging ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-xl"
                      style={{ animation: "doc-drag-in 1.5s cubic-bezier(0.3, 0, 0.2, 1) both" }}
                    >
                      <FileTextIcon className="size-4 text-muted-foreground" />
                      {fileName}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div className="min-h-0 overflow-hidden rounded-[0.15rem] border bg-neutral-100">
                <StatementPaper header={header} lines={fx.lines} />
              </div>
              <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
                <StatementReview
                  header={header}
                  lines={lines}
                  warnings={fx.warnings}
                  leases={fx.leases}
                  tanks={fx.tanks}
                  meters={fx.meters}
                  onHeaderChange={(patch) => setHeader((h) => ({ ...h, ...patch }))}
                  onLinesChange={setLines}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t px-5 py-4">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              {review || staged ? (
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-1.5 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  title="Replace file"
                >
                  <FileTextIcon className="size-4 shrink-0" />
                  <span className="truncate">{fileName}</span>
                </button>
              ) : null}
              {review ? (
                <span className="shrink-0 text-muted-foreground">
                  {`· ${drafts} statement · ${totalLines} line item${totalLines === 1 ? "" : "s"}`}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={phase === "saving"}>
                {review ? "Start over" : "Cancel"}
              </Button>
              {review ? (
                <Button disabled={phase === "saving"}>
                  {phase === "saving" ? <Loading01 className="size-4 animate-spin" /> : null}
                  Save statement
                </Button>
              ) : (
                <>
                  <Button variant="outline" disabled={reading}>
                    Choose from Files
                  </Button>
                  <Button disabled={!staged || reading}>
                    {reading ? <Loading01 className="size-4 animate-spin" /> : null}
                    {reading ? "Reading…" : "Read statement"}
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
          wellOptions={[]}
          remaining={fx.proposals.length - card - 1}
          onResolved={onResolved}
          script={phase === "approve" ? "approve" : phase === "done" ? "done" : null}
        />
      ) : null}
    </AppFrame>
  );
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
const qty = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** The statement as the purchaser printed it, standing in for the PDF pane. */
function StatementPaper({ header, lines }: { header: ReviewHeader; lines: ReviewLine[] }) {
  const totalBbl = lines.reduce((s, l) => s + l.volume, 0);
  const totalGross = lines.reduce((s, l) => s + l.grossValue, 0);
  const totalTax = lines.reduce((s, l) => s + l.taxes, 0);
  const totalNet = lines.reduce((s, l) => s + l.netValue, 0);
  return (
    <div className="h-full overflow-hidden p-4">
      <div className="mx-auto flex h-full max-w-[36rem] flex-col gap-5 bg-white px-5 py-6 font-mono text-[10px] leading-relaxed text-neutral-800 shadow-sm">
        <div className="flex items-start justify-between border-b border-neutral-300 pb-3">
          <div>
            <div className="text-[15px] font-bold tracking-tight text-neutral-900">{OIL_PURCHASER.legalName}</div>
            <div>{OIL_PURCHASER.address[0]}</div>
            <div>{OIL_PURCHASER.address[1]}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-neutral-900">CRUDE OIL SETTLEMENT</div>
            <div>Statement {header.statementNo}</div>
            <div>Check {header.checkNo}</div>
            <div>Production month 09/2026</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-500">Remit to</div>
            <div className="font-bold text-neutral-900">{SKY_P5_NAME}</div>
            <div>{OPERATOR.mailing}</div>
            <div>
              {OPERATOR.city}, TX {OPERATOR.zip}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-500">Owner</div>
            <div>Operator no. {SKY_OPERATOR_NO}</div>
            <div>Interest type: WI</div>
            <div>Payment date 10/20/2026</div>
          </div>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-y border-neutral-400 text-left text-[9px] uppercase tracking-wider text-neutral-600">
              <th className="py-1 pr-2 font-semibold">Property</th>
              <th className="py-1 pr-2 font-semibold">Tank</th>
              <th className="py-1 pr-2 text-right font-semibold">Bbls</th>
              <th className="py-1 pr-2 text-right font-semibold">Price</th>
              <th className="py-1 pr-2 text-right font-semibold">Gross</th>
              <th className="py-1 pr-2 text-right font-semibold">Sev tax</th>
              <th className="py-1 text-right font-semibold">Net</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-dotted border-neutral-300 tabular-nums">
                <td className="py-1.5 pr-2">{l.leaseRef}</td>
                <td className="py-1.5 pr-2">{l.tankRef}</td>
                <td className="py-1.5 pr-2 text-right">{qty.format(l.volume)}</td>
                <td className="py-1.5 pr-2 text-right">{l.price?.toFixed(2)}</td>
                <td className="py-1.5 pr-2 text-right">{usd.format(l.grossValue)}</td>
                <td className="py-1.5 pr-2 text-right">({usd.format(l.taxes)})</td>
                <td className="py-1.5 text-right">{usd.format(l.netValue)}</td>
              </tr>
            ))}
            <tr className="border-t border-neutral-400 font-bold tabular-nums text-neutral-900">
              <td className="py-1.5 pr-2" colSpan={2}>
                Total
              </td>
              <td className="py-1.5 pr-2 text-right">{qty.format(totalBbl)}</td>
              <td className="py-1.5 pr-2" />
              <td className="py-1.5 pr-2 text-right">{usd.format(totalGross)}</td>
              <td className="py-1.5 pr-2 text-right">({usd.format(totalTax)})</td>
              <td className="py-1.5 text-right">{usd.format(totalNet)}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-auto flex items-end justify-between border-t border-neutral-300 pt-3 text-[10px] text-neutral-600">
          <div>Runs settled 09/01/2026 to 09/30/2026. Gravity {RUN_GRAVITY} API. Posted price less trucking.</div>
          <div className="text-right">Page 1 of 3</div>
        </div>
      </div>
    </div>
  );
}
