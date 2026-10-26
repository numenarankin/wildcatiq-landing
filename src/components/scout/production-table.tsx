"use client";

import { useMemo } from "react";
import { ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Th, THead } from "./modal-ui";
import type { LeaseMonth } from "@/lib/scout/rrc-types";

/**
 * The months under the production chart, as numbers.
 *
 * Fed the SAME `monthly` array the chart draws, row for row, so a figure read
 * off this table is the figure under the cursor on the curve. Newest month
 * first, because the question is almost always "what did it do lately", and
 * the totals row stands at the top of the body for the same reason: a lease
 * with forty years of cycles should not make the reader scroll to the sum.
 *
 * The totals are the sum of the PRINTED cells. Volumes arrive as whole
 * barrels and MCF from the RRC, so there is no rounding to disagree with, but
 * the rule is stated so a future decimal does not quietly break it. Allowables
 * do not total: a monthly allowable added up over years means nothing.
 */

const num = (n: number | null | undefined) =>
  n == null ? "—" : Math.round(n).toLocaleString("en-US");

/** The columns, in the table's order; `allow` columns show only when asked. */
export const PRODUCTION_TABLE_COLUMNS: {
  key: keyof LeaseMonth;
  label: string;
  allow?: boolean;
  totals?: boolean;
}[] = [
  { key: "oil_prod_vol", label: "Oil (bbl)", totals: true },
  { key: "oil_allow", label: "Oil allow", allow: true },
  { key: "gas_prod_vol", label: "Gas (MCF)", totals: true },
  { key: "gas_allow", label: "Gas allow", allow: true },
  { key: "cond_prod_vol", label: "Condensate (bbl)", totals: true },
  { key: "csgd_prod_vol", label: "Casinghead (MCF)", totals: true },
];

/** Sum of the printed cells of one column, over every month. */
export function productionTotals(
  monthly: LeaseMonth[]
): Partial<Record<keyof LeaseMonth, number>> {
  const out: Partial<Record<keyof LeaseMonth, number>> = {};
  for (const col of PRODUCTION_TABLE_COLUMNS) {
    if (!col.totals) continue;
    out[col.key] = monthly.reduce((s, m) => s + Math.round(Number(m[col.key]) || 0), 0);
  }
  return out;
}

export function ProductionTable({
  monthly,
  showAllowable = true,
  defaultOpen = false,
  className,
}: {
  monthly: LeaseMonth[];
  /** The same flag the chart takes, so the two agree on whether allowables exist. */
  showAllowable?: boolean;
  /** Open on first render where the chart is the whole pane (county, field). */
  defaultOpen?: boolean;
  className?: string;
}) {
  const columns = PRODUCTION_TABLE_COLUMNS.filter((c) => showAllowable || !c.allow);
  const rows = useMemo(() => [...monthly].reverse(), [monthly]);
  const totals = useMemo(() => productionTotals(monthly), [monthly]);

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("shrink-0", className)}>
      <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">
        <ChevronRightIcon className="size-3.5 transition-transform group-data-[panel-open]:rotate-90" />
        Monthly table ({monthly.length})
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          data-slot="production-table"
          className="max-h-80 w-full overflow-auto rounded-[0.15rem] border"
        >
          <table className="w-full text-sm">
            <THead>
              <Th>Month</Th>
              {columns.map((c) => (
                <Th key={c.key} right>
                  {c.label}
                </Th>
              ))}
            </THead>
            <tbody className="divide-y">
              <tr data-row="totals" className="bg-muted/40 font-medium">
                <td className="px-3 py-1.5 text-xs">Total</td>
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-1.5 text-right tabular-nums">
                    {c.totals ? num(totals[c.key]) : ""}
                  </td>
                ))}
              </tr>
              {rows.map((m) => (
                <tr
                  key={m.cycle}
                  data-row={m.cycle}
                  className={cn("hover:bg-muted", m.reported === false && "text-muted-foreground")}
                >
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {m.cycle}
                    {m.reported === false && (
                      <span className="ml-2 font-sans text-xs text-muted-foreground">pending</span>
                    )}
                  </td>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 py-1.5 text-right tabular-nums",
                        c.allow && "text-muted-foreground"
                      )}
                    >
                      {num(m[c.key] as number | null)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
