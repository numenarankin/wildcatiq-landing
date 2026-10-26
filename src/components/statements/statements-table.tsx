"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/statements/status-badge";
import { RowDeleteButton } from "@/components/row-delete-button";
import { cn } from "@/lib/utils";
import type { Statement } from "@/lib/statements/statements";

const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function period(s: Statement): string {
  // Collapse a whole-month range to "Jul 2026"; otherwise show the range.
  const start = s.periodStart;
  const end = s.periodEnd;
  const d = new Date(`${start}T00:00:00`);
  const label = d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return sameMonth ? label : `${start} → ${end}`;
}

/**
 * The statements list, one row per purchaser settlement document with its
 * lifecycle status and totals. Presentational: a row OPENS the statement over
 * this list rather than navigating to a page of its own, the way an invoice row
 * opens its document. Used by the Revenue page's Statements tab.
 */
export function StatementsTable({
  statements,
  canManage,
  onOpen,
  onDelete,
}: {
  statements: Statement[];
  /** Whether the empty state should nudge toward uploading. */
  canManage: boolean;
  /** Open a statement; omit to leave rows inert. */
  onOpen?: (statement: Statement) => void;
  /** Delete a statement; omit to hide the actions column. */
  onDelete?: (statement: Statement) => void;
}) {
  const showActions = Boolean(onDelete);
  const colCount = 6 + (showActions ? 1 : 0);
  return (
    <div className="overflow-hidden rounded-[0.15rem] border">
      <Table className="text-[0.95rem]">
        <TableHeader className="[&_th]:h-12 [&_th]:font-mono [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Period</TableHead>
            <TableHead>Purchaser</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Oil (bbl)</TableHead>
            <TableHead className="text-right">Gas (MCF)</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            {/* No label: the delete only appears under the cursor, and a header
                over an empty column is a heading for nothing. */}
            {showActions ? <TableHead className="w-10" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colCount}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No statements yet.
                {canManage
                  ? " Upload a purchaser settlement to get started."
                  : ""}
              </TableCell>
            </TableRow>
          ) : (
            statements.map((s) => (
              <TableRow
                key={s.id}
                // The whole row is the target, and it is a focus stop that
                // opens on Enter or Space - the affordances the period link
                // used to carry alone.
                role={onOpen ? "button" : undefined}
                tabIndex={onOpen ? 0 : undefined}
                onClick={() => onOpen?.(s)}
                onKeyDown={(event) => {
                  if (!onOpen) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(s);
                  }
                }}
                className={cn(
                  "group [&>td]:py-4",
                  onOpen &&
                    "cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none"
                )}
              >
                <TableCell className="font-medium">{period(s)}</TableCell>
                <TableCell>{s.purchaser || "-"}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {num.format(s.totalOilBbls)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {num.format(s.totalGasMcf)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {usd.format(s.totalValue)}
                </TableCell>
                {showActions ? (
                  <TableCell className="pl-0">
                    <RowDeleteButton
                      label={`Delete ${s.purchaser || "statement"} ${period(s)}`}
                      onDelete={() => onDelete?.(s)}
                      // Revealed on hover, and on keyboard focus so it stays
                      // reachable without a pointer.
                      className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
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
