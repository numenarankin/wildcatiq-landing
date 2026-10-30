import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ProductionPoint } from "@/lib/wells/wells";
import type { HistoryMonth } from "@/lib/rrc/lease-history-series";

/**
 * How many rows render before the "Show more" control, and how many each click
 * adds. A well with years of daily readings has thousands of rows; mounting all
 * of them cost seconds of main-thread time before the page became interactive,
 * for entries nobody scrolls to on most visits. The data is already in hand —
 * this only bounds the DOM, so "Show more" is instant.
 */
const PAGE_SIZE = 60;

const numberFormatter = new Intl.NumberFormat("en-US");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const rateFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

/** Formats a 24-hour `HH:MM` string as a 12-hour time, e.g. "6:00 AM". */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function ProductionTable({
  data,
  history = [],
  onRowClick,
}: {
  data: ProductionPoint[];
  /**
   * What the state has on file for this well before the operator's own records
   * begin, at the granularity Texas actually files: one row per MONTH.
   *
   * Not spread to days here on purpose. The chart wants a daily rate so its line
   * is continuous, but a table of 12,000 identical daily rows derived from 404
   * monthly filings would be unreadable and would imply a precision the source
   * does not have. Texas reports oil per lease, so these are that lease's
   * volumes divided by the wells' filed test rates: an estimate, and not
   * clickable to edit the way a measured row is.
   */
  history?: HistoryMonth[];
  onRowClick?: (point: ProductionPoint) => void;
}) {
  const [visibleRows, setVisibleRows] = useState(PAGE_SIZE);
  const [visibleHistory, setVisibleHistory] = useState(PAGE_SIZE);

  // Daily readings, newest first. Oil is stored in barrels (converted at write
  // time), so the readings are shown as-is.
  const allRows = useMemo(() => [...data].reverse(), [data]);
  const rows = allRows.slice(0, visibleRows);
  const hiddenRows = allRows.length - rows.length;
  const shownHistory = history.slice(0, visibleHistory);
  const hiddenHistory = history.length - shownHistory.length;

  return (
    <div className="overflow-hidden rounded-[0.15rem] border">
      <Table className="text-[0.95rem]">
        <TableHeader className="[&_th]:h-12 [&_th]:font-mono [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="text-right">Oil (bbl/d)</TableHead>
            <TableHead className="text-right">Gas (MCF/d)</TableHead>
            <TableHead className="text-right">Saltwater (bbl/d)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && history.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                No production data to display.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((point, index) => (
              <TableRow
                key={`${point.date}-${point.time}-${index}`}
                className={
                  onRowClick ? "cursor-pointer [&>td]:py-4" : "[&>td]:py-4"
                }
                onClick={onRowClick ? () => onRowClick(point) : undefined}
              >
                <TableCell className="font-medium">
                  {dateFormatter.format(new Date(point.date))}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {formatTime(point.time)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numberFormatter.format(point.oilProduction)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numberFormatter.format(point.gasProduction)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {numberFormatter.format(point.saltWater)}
                </TableCell>
              </TableRow>
            ))
          )}

          {hiddenRows > 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={(event) => {
                    // The row above is clickable; don't let this bubble to it.
                    event.stopPropagation();
                    setVisibleRows((n) => n + PAGE_SIZE * 4);
                  }}
                >
                  Show more ({numberFormatter.format(hiddenRows)} older{" "}
                  {hiddenRows === 1 ? "entry" : "entries"})
                </Button>
              </TableCell>
            </TableRow>
          )}

          {/* The state's filings, below the operator's own records and clearly
              their own thing: monthly rows, greyed, no time of day. */}
          {history.length > 0 && (
            <>
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="bg-muted/40 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Reported to the Railroad Commission &middot; monthly average
                </TableCell>
              </TableRow>
              {shownHistory.map((h) => (
                <TableRow key={`rrc-${h.month}`} className="[&>td]:py-4">
                  <TableCell className="font-medium text-muted-foreground">
                    {monthFormatter.format(new Date(`${h.month}-01T00:00:00Z`))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">-</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {h.oilBblPerDay == null ? "-" : rateFormatter.format(h.oilBblPerDay)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {h.gasMcfPerDay == null ? "-" : rateFormatter.format(h.gasMcfPerDay)}
                  </TableCell>
                  {/* Texas publishes no produced-water volumes. */}
                  <TableCell className="text-right text-muted-foreground">-</TableCell>
                </TableRow>
              ))}
              {hiddenHistory > 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => setVisibleHistory((n) => n + PAGE_SIZE * 4)}
                    >
                      Show more ({numberFormatter.format(hiddenHistory)} older{" "}
                      {hiddenHistory === 1 ? "month" : "months"})
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
