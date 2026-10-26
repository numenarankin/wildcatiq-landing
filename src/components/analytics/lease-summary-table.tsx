"use client";

import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ChevronRightIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MovePair } from "@/components/analytics/move-pair";
import { changePct } from "@/lib/analytics/last-day-rates";
import { wellUnitKey } from "@/lib/analytics/fleet-decline";
import { wellsByRow } from "@/lib/analytics/lease-table-rows";
import type { LeaseSummaryRow, LeaseWellRow } from "@/lib/analytics/lease-summaries";

// Two decimals, always — a rate column reads as a column, so 0.50 and 12.00 have
// to carry the same number of places as 4.25 rather than each trimming its own.
const num = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const count = new Intl.NumberFormat("en-US");

// UTC on both: the stamp is a wall-clock date and time as the pumper wrote it
// down, with no zone behind it. Parsed locally, a 06:00 reading in a browser
// west of the data shows as the day before.
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** `2026-09-03T06:00` → "Sep 3, 6:00 AM"; a dateless reading → "Sep 3". */
export function formatReported(stamp: string | null): string {
  if (!stamp) return "—";
  const [date, time] = stamp.split("T");
  const day = dayFormatter.format(new Date(`${date}T00:00:00Z`));
  if (!time) return day;
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${day}, ${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Effective annual decline (fraction) → "12.34%"; positive = declining. */
function formatDecline(annual: number): string {
  return `${num.format(annual * 100).replace("-", "−")}%`;
}

/**
 * Today as the pumper writes it: the BROWSER's calendar date, not the server's.
 *
 * A reading's date is a wall-clock day with no zone behind it, and the server
 * runs on UTC — at 8pm in Texas it is already tomorrow there, and every lease
 * gauged that afternoon would lose its dot. Null on the server render, because
 * it cannot know the viewer's day and a guess would only mismatch on hydration;
 * the client snapshot fills it in on the first client render.
 */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const noSubscribe = () => () => {};
function useLocalToday(): string | null {
  return useSyncExternalStore(noSubscribe, localToday, () => null);
}

/** A figure and its two moves (day, 30-day), on one line, right-aligned as one cell. */
function Figure({
  value,
  change,
  change30,
}: {
  value: string;
  change: number | null;
  change30: number | null;
}) {
  return (
    <span className="inline-flex items-baseline justify-end gap-1.5">
      <span className="tabular-nums">{value}</span>
      <MovePair day={change} month={change30} className="text-xs" />
    </span>
  );
}

type SortKey = "name" | "oil24" | "gas24" | "runs30d" | "revenue24" | "decline";
type Direction = "asc" | "desc";

interface Column {
  key: SortKey;
  label: string;
  numeric: boolean;
}

const COLUMNS: Column[] = [
  { key: "name", label: "Lease", numeric: false },
  { key: "oil24", label: "Oil bbl/d", numeric: true },
  { key: "gas24", label: "Gas mcf/d", numeric: true },
  // 30 because that is `RUNS_WINDOW_DAYS` in `lib/leases/lease-activity.ts`,
  // which the count is actually taken over. Spelled out here rather than
  // imported: that module is server-only.
  { key: "runs30d", label: "Runs 30d", numeric: true },
  // The operator's own share of the day, like the card above and the phone.
  { key: "revenue24", label: "Net rev/day", numeric: true },
  { key: "decline", label: "Decline", numeric: true },
];

/**
 * Company lease summary: one row per lease with its last complete day of
 * production, the loads that went off it in the last 30 days, what that day was
 * worth at the lease's own realized prices, and its projected decline.
 *
 * The oil and gas columns add up to the two production cards above them: both
 * are the same per-well last measured days, summed (`last-day-rates.ts`).
 *
 * The decline column is the lease's share of the fleet projection the card
 * above reads (`fleet-decline`, `unitDecline`) — its own oil and gas curves
 * anchored at their current rates and summed a year forward — so the rows are
 * the card, taken apart. Undefined until that projection lands (the column
 * shows a skeleton with the card); null when nothing on the lease has fitted a
 * curve (a dash).
 *
 * A blue dot beside the lease name means something on it was read TODAY, by
 * the viewer's calendar. It replaced a "Last report" column: what the operator
 * checks each morning is who has reported, and a dot answers that without a
 * column of dates to scan. The stamp itself is the name's tooltip.
 *
 * Each of the three figures carries two moves, day-over-day and 30-day, in the
 * topbar ticker's treatment (`MovePair`, which also explains each on hover).
 * Same-well and same-price: the percentage moves when production does, not
 * when a well starts reporting or the benchmark ticks.
 *
 * A lease row opens into its wells (the caret at the left, the ledger's
 * treatment of a statement and its lines). Each well row is the lease row
 * taken apart: the same rollup summed the lease from these wells, so the
 * columns add up, and the decline is the well's own curve out of the same
 * projection the lease row sums (`wellUnitKey`). Runs are loads off a tank,
 * which no well owns, so that column is blank on a well. Only wells with
 * something allocated to them on their last day are listed (`wellsByRow`).
 *
 * Sorted by revenue (highest first) by default; clicking a column header sorts
 * by it — first click descending, second click ascending. Wells sort under
 * their lease by the same column.
 */
export function LeaseSummaryTable({
  rows,
  wells,
  decline,
  initialExpanded,
  today: fixedToday,
}: {
  rows: LeaseSummaryRow[];
  /** The wells the rows were summed from; a lease row expands into its own. */
  wells: LeaseWellRow[];
  /**
   * Projected 12-month decline by row key, and by `well:<id>` for the wells;
   * see above for undefined vs null.
   */
  decline?: Record<string, number | null>;
  /** landing: row keys a product-page screen opens expanded (the app opens with none). */
  initialExpanded?: string[];
  /** landing: the screen's fixed calendar day, so the fixture's readings read as today's on any visit. */
  today?: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue24");
  const [direction, setDirection] = useState<Direction>("desc");
  // Row keys whose wells are showing.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialExpanded));
  const localDay = useLocalToday();
  const today = fixedToday ?? localDay;
  const wellRows = useMemo(() => wellsByRow(rows, wells), [rows, wells]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  }

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const declineOf = (key: string): number | null | undefined =>
    decline === undefined ? undefined : (decline[key] ?? null);

  /**
   * One ordering for leases and for the wells under each: the column's value,
   * with a row that has no curve sorting under every row that has one whichever
   * way the column goes — it is not the smallest decline, it is unknown.
   */
  function compare(a: Sortable, b: Sortable): number {
    let cmp: number;
    if (sortKey === "name") {
      cmp = a.name.localeCompare(b.name);
    } else if (sortKey === "decline") {
      const da = declineOf(a.declineKey);
      const db = declineOf(b.declineKey);
      if (da == null || db == null) return da == null && db == null ? 0 : da == null ? 1 : -1;
      cmp = da - db;
    } else {
      cmp = a[sortKey] - b[sortKey];
    }
    return direction === "desc" ? -cmp : cmp;
  }

  const sorted = rows.map(leaseSortable).sort(compare);

  return (
    <div className="rounded-[0.15rem] border">
      <Table className="text-[0.95rem]">
        <TableHeader className="bg-muted [&_th]:h-12 [&_th]:font-mono [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-muted-foreground">
          <TableRow className="hover:bg-muted">
            {/* The caret column: no heading, and as narrow as the caret. */}
            <TableHead className="w-8 pr-0" aria-label="Expand" />
            {COLUMNS.map((col) => {
              const active = col.key === sortKey;
              return (
                <TableHead
                  key={col.key}
                  className={col.numeric ? "text-right" : undefined}
                  aria-sort={
                    active
                      ? direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      "inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-foreground",
                      col.numeric && "flex-row-reverse",
                      active && "text-foreground"
                    )}
                  >
                    {col.label}
                    {/* Always render an arrow (hidden when inactive) so every
                        header keeps the same box — otherwise the active header's
                        inline-flex baseline shifts and its label rides higher. */}
                    <span className="inline-flex w-3 justify-center">
                      {active && direction === "asc" ? (
                        <ArrowUpIcon className="size-3" />
                      ) : (
                        <ArrowDownIcon
                          className={cn("size-3", !active && "invisible")}
                        />
                      )}
                    </span>
                  </button>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COLUMNS.length + 1}
                className="h-24 text-center text-muted-foreground"
              >
                No leases to display.
              </TableCell>
            </TableRow>
          ) : (
            sorted.map(({ row }) => {
              const children = wellRows.get(row.key) ?? [];
              const isOpen = expanded.has(row.key);
              const reportedToday =
                today !== null && row.lastReportedAt?.slice(0, 10) === today;
              return (
                <Fragment key={row.key}>
                  <TableRow className="[&>td]:py-3.5">
                    <TableCell className="pr-0">
                      {children.length > 0 ? (
                        <button
                          type="button"
                          aria-label={isOpen ? "Hide wells" : "Show wells"}
                          aria-expanded={isOpen}
                          onClick={() => toggleExpanded(row.key)}
                          className="flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ChevronRightIcon
                            className={cn("size-4 transition-transform", isOpen && "rotate-90")}
                          />
                        </button>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span
                        className="inline-flex items-center gap-2"
                        title={
                          row.lastReportedAt
                            ? `Last report: ${formatReported(row.lastReportedAt)}`
                            : "Never reported"
                        }
                      >
                        {/* The unassigned bucket is a grouping, not a lease, so it
                            has no page to open. */}
                        {row.slug ? (
                          <Link
                            href={`/leases/${row.slug}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                        {reportedToday ? (
                          <span
                            role="img"
                            aria-label="Reported today"
                            title="Reported today"
                            className="inline-block size-[7px] shrink-0 rounded-full bg-blue-500"
                          />
                        ) : null}
                      </span>
                    </TableCell>
                    <FigureCells
                      oil={row.oil24}
                      gas={row.gas24}
                      revenue={row.netRevenue24 ?? row.revenue24}
                      change={row.change}
                      change30={row.change30}
                      runs={row.runs30d}
                      decline={declineOf(row.key)}
                    />
                  </TableRow>
                  {isOpen &&
                    children.map(wellSortable).sort(compare).map(({ well }) => (
                      // A well is a detail of the row above it, not another
                      // entry in the table: the ledger's line treatment, half
                      // the height and a step lighter.
                      <TableRow
                        key={well.wellId}
                        className="[&>td]:py-2 [&>td]:text-[0.875rem]"
                      >
                        <TableCell className="pr-0" />
                        <TableCell className="pl-6 text-muted-foreground">
                          <Link
                            href={`/production/wells/${well.wellId}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {well.name}
                          </Link>
                        </TableCell>
                        <FigureCells
                          oil={well.oilBbl}
                          gas={well.gasMcf}
                          revenue={well.revenue24 * (well.nri ?? 1)}
                          change={well.change}
                          change30={well.change30}
                          runs={null}
                          decline={declineOf(wellUnitKey(well.wellId))}
                        />
                      </TableRow>
                    ))}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** What the sort reads off a lease row or a well row: the same five columns. */
interface Sortable {
  name: string;
  oil24: number;
  gas24: number;
  runs30d: number;
  revenue24: number;
  /** Where its decline sits in the `decline` map. */
  declineKey: string;
}

function leaseSortable(row: LeaseSummaryRow): Sortable & { row: LeaseSummaryRow } {
  return {
    row,
    name: row.name,
    oil24: row.oil24,
    gas24: row.gas24,
    runs30d: row.runs30d,
    revenue24: row.netRevenue24 ?? row.revenue24,
    declineKey: row.key,
  };
}

function wellSortable(well: LeaseWellRow): Sortable & { well: LeaseWellRow } {
  return {
    well,
    name: well.name,
    oil24: well.oilBbl,
    gas24: well.gasMcf,
    runs30d: 0,
    revenue24: well.revenue24 * (well.nri ?? 1),
    declineKey: wellUnitKey(well.wellId),
  };
}

/** The five figure cells, identical on a lease row and a well row. */
function FigureCells({
  oil,
  gas,
  revenue,
  change,
  change30,
  runs,
  decline,
}: {
  oil: number;
  gas: number;
  revenue: number;
  change: LeaseSummaryRow["change"];
  change30: LeaseSummaryRow["change30"];
  /** Null on a well: runs are loads off a tank, and no well owns one. */
  runs: number | null;
  decline: number | null | undefined;
}) {
  return (
    <>
      <TableCell className="text-right">
        <Figure
          value={num.format(oil)}
          change={changePct(change.oil)}
          change30={changePct(change30.oil)}
        />
      </TableCell>
      <TableCell className="text-right">
        <Figure
          value={num.format(gas)}
          change={changePct(change.gas)}
          change30={changePct(change30.gas)}
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {runs == null ? "" : count.format(runs)}
      </TableCell>
      <TableCell className="text-right">
        <Figure
          value={usd.format(revenue)}
          change={changePct(change.revenue)}
          change30={changePct(change30.revenue)}
        />
      </TableCell>
      <TableCell
        className={cn("text-right tabular-nums", decline === null && "text-muted-foreground")}
      >
        {decline === undefined ? (
          <Skeleton className="ml-auto h-4 w-14" />
        ) : decline === null ? (
          "—"
        ) : (
          formatDecline(decline)
        )}
      </TableCell>
    </>
  );
}
