import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RowActions, RowActionsHead } from "@/components/row-actions";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/lib/invoices/invoices";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Dates arrive as ISO `YYYY-MM-DD` and are formatted without a timezone hop:
 * `new Date("2026-07-28")` parses as UTC midnight and renders as the 27th west
 * of Greenwich, which is how a due date silently slips a day.
 */
function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The period the work covers, collapsed to one cell.
 *
 * A single-day job prints one date rather than repeating it either side of a
 * dash, and an invoice whose lines carry no service dates falls back to a dash
 * instead of echoing the invoice date — the two are different facts and
 * conflating them is how a job gets dated to when it was billed.
 */
function formatServicePeriod(start: string, end: string): string {
  if (!start && !end) return "—";
  if (!end || start === end) return formatDate(start || end);
  if (!start) return formatDate(end);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/**
 * Same frame, header treatment and row density as every other roster table
 * (`TanksTable`, `WellsTable`, `LeasesTable`) — and, since it also renders on
 * the facility pages' Invoices tab, the same row affordances: hover, a focus
 * ring, and Enter / Space to open.
 *
 * The rows are NOT `WellRow`. That component navigates to an `href`, and an
 * invoice has no page of its own to navigate to: it opens the document modal in
 * place. Everything else about the row matches it deliberately, so the two read
 * the same when they sit one tab apart.
 */
export function InvoicesTable({
  invoices,
  onRowClick,
  onDelete,
  showChargedTo = true,
  emptyLabel = "No invoices to display.",
}: {
  invoices: Invoice[];
  onRowClick?: (invoice: Invoice) => void;
  /** Omitted for a viewer, exactly as the roster tables omit theirs. */
  onDelete?: (invoice: Invoice) => void;
  /**
   * Show what the invoice is billed against. On a facility page that is the
   * facility whose page you are already on, so the column is dropped there —
   * the same reason the disposal tanks table hides Product.
   */
  showChargedTo?: boolean;
  /** Empty-state copy; a facility tab says which facility it means. */
  emptyLabel?: string;
}) {
  const colCount = 6 + (showChargedTo ? 1 : 0) + (onDelete ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-[0.15rem] border">
      <Table className="text-[0.95rem]">
        <TableHeader className="[&_th]:h-12 [&_th]:font-mono [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Vendor</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Due</TableHead>
            {showChargedTo ? <TableHead>Charged To</TableHead> : null}
            <TableHead className="text-right">Amount</TableHead>
            {onDelete ? <RowActionsHead /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                // Matching `WellRow`'s affordances without its navigation: the
                // row is a focus stop and opens on Enter or Space, so the
                // invoices tab is not the one table on a facility page that a
                // keyboard cannot work.
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(invoice)}
                onKeyDown={(event) => {
                  if (!onRowClick) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onRowClick(invoice);
                  }
                }}
                className={cn(
                  "group [&>td]:py-4",
                  onRowClick &&
                    "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none"
                )}
              >
                <TableCell className="font-medium">
                  {invoice.vendor || (
                    <span className="text-muted-foreground">Unidentified</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-2">
                    {invoice.invoiceNo}
                    {/* Both kinds live in one list, so a ticket says so — it is
                        why it can legitimately have no number. */}
                    {invoice.docType === "field_ticket" ? (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium">
                        Ticket
                      </span>
                    ) : null}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDate(invoice.date)}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatServicePeriod(invoice.serviceStart, invoice.serviceEnd)}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {formatDate(invoice.dueDate)}
                </TableCell>
                {showChargedTo ? (
                  <TableCell
                    className={cn(
                      "text-muted-foreground",
                      // Untagged: the vendor's printed property is standing in
                      // for a facility nobody has picked yet.
                      invoice.facilities.length === 0 && invoice.chargedTo && "italic"
                    )}
                  >
                    {invoice.chargedTo || "—"}
                  </TableCell>
                ) : null}
                <TableCell className="text-right tabular-nums">
                  {currencyFormatter.format(invoice.amount)}
                </TableCell>
                {onDelete ? (
                  <TableCell>
                    <RowActions
                      label={invoice.invoiceNo || invoice.vendor || "invoice"}
                      onDelete={() => onDelete(invoice)}
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
