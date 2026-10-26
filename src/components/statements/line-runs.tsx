"use client";

import { ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StatementRun } from "@/lib/statements/line-runs";

const num2 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const money = (v: number | null) => (v == null ? "-" : usd.format(v));

/**
 * The runs behind one statement line, collapsed until opened. Read-only: the
 * line above stays the revenue figure, and these are what the purchaser
 * printed per haul.
 */
export function LineRuns({ runs }: { runs: StatementRun[] }) {
  if (runs.length === 0) return null;
  return (
    <Collapsible className="col-span-2">
      <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">
        <ChevronRightIcon className="size-3.5 transition-transform group-data-[panel-open]:rotate-90" />
        Runs ({runs.length})
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="overflow-hidden rounded-[0.15rem] border">
          <Table className="text-sm">
            <TableHeader className="[&_th]:font-mono [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead className="text-right">Barrels</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Taxes</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="tabular-nums">{r.runDate || "-"}</TableCell>
                  <TableCell className="font-medium">{r.ticketNo || "-"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {num2.format(r.volume)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {money(r.price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {money(r.grossValue)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {money(r.taxes)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {money(r.netValue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
