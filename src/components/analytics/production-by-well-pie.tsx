"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronDownIcon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WellProductionTotal } from "@/lib/analytics/types";

type Metric = "revenue" | "oil" | "gas";

/** The card's title IS this menu, so each label reads as a heading. */
const METRICS: { value: Metric; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "oil", label: "Oil" },
  { value: "gas", label: "Gas" },
];

const USD_METRICS: Metric[] = ["revenue"];

/** What the slices are. A well is the unit of production; a lease is the unit of
 *  ownership, and which one you want depends on whether you are asking about the
 *  rods or about the money. */
type Breakdown = "well" | "lease" | "commodity";

const BREAKDOWNS: { value: Breakdown; label: string }[] = [
  { value: "well", label: "By well" },
  { value: "lease", label: "By lease" },
  // Revenue only: a barrel-count sliced by commodity is one slice.
  { value: "commodity", label: "By commodity" },
];

/** The commodity slices in the colours every chart draws them in. */
const COMMODITY_COLORS: Record<string, string> = { Oil: "#059669", Gas: "#800000" };

/** A lease is only named on wells that were assigned one. */
const NO_LEASE = "Unassigned";

/** A well's figures plus, for the commodity split, its revenue by stream. */
type PieWell = WellProductionTotal & { oilRevenue?: number; gasRevenue?: number };

// A distinct color per well slice, cycled if there are more wells than colors.
const COLORS = [
  "#059669",
  "#800000",
  "#4169e1",
  "#d97706",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#dc2626",
  "#475569",
];

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function valueOf(well: WellProductionTotal, metric: Metric): number {
  if (metric === "oil") return well.oilBbl;
  if (metric === "gas") return well.gasMcf;
  return well.revenue;
}

function formatValue(value: number, metric: Metric): string {
  return USD_METRICS.includes(metric)
    ? usdFormatter.format(value)
    : numberFormatter.format(value);
}

/** One well's wedge. The tooltip reads this straight off the hovered payload. */
interface Slice {
  name: string;
  value: number;
  color: string;
}

export function ProductionByWellPie({
  wells,
  leaseByWell,
  className,
}: {
  wells: PieWell[];
  /**
   * Well id → lease name, for the lease breakdown. Wells missing from it (or
   * carrying an empty name) group under "Unassigned" rather than disappearing:
   * a barrel with no lease on it is still a barrel the company sold.
   */
  leaseByWell?: Record<string, string>;
  className?: string;
}) {
  // Revenue first: the question a dashboard pie answers is which wells carry the
  // company, and a barrel is not that answer when oil and gas price apart.
  const [metric, setMetric] = useState<Metric>("revenue");
  // Opens by LEASE: the lease is what the operator prices, settles and reads
  // the table below by, so the pie should answer "which lease" first.
  const [breakdown, setBreakdown] = useState<Breakdown>("lease");
  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? "";
  const breakdownLabel =
    BREAKDOWNS.find((b) => b.value === breakdown)?.label ?? "";
  const breakdowns = BREAKDOWNS.filter(
    (b) => b.value !== "commodity" || metric === "revenue"
  );
  const selectMetric = (next: Metric) => {
    setMetric(next);
    // The commodity split only means something for money; picking a volume
    // metric while on it drops back to the lease view rather than a one-slice pie.
    if (next !== "revenue" && breakdown === "commodity") setBreakdown("lease");
  };

  // Group first, colour second, so the palette walks the slices in the order
  // they are drawn whichever unit is selected.
  const grouped = new Map<string, number>();
  for (const well of wells) {
    if (breakdown === "commodity") {
      grouped.set("Oil", (grouped.get("Oil") ?? 0) + (well.oilRevenue ?? 0));
      grouped.set("Gas", (grouped.get("Gas") ?? 0) + (well.gasRevenue ?? 0));
      continue;
    }
    const key =
      breakdown === "lease"
        ? (leaseByWell?.[well.wellId] || "").trim() || NO_LEASE
        : well.name;
    grouped.set(key, (grouped.get(key) ?? 0) + valueOf(well, metric));
  }

  const slices: Slice[] = [...grouped.entries()]
    .map(([name, value]) => ({ name, value, color: "" }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((s, index) => ({
      ...s,
      color:
        breakdown === "commodity"
          ? (COMMODITY_COLORS[s.name] ?? COLORS[index % COLORS.length])
          : COLORS[index % COLORS.length],
    }));

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    // `h-full` + a column layout so the card fills its grid row and matches the
    // production chart beside it, with the donut growing into whatever height
    // that leaves.
    <Card className={cn("flex h-full flex-col rounded-[0.15rem]", className)}>
      <CardHeader>
        <CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger className="-mx-1 -my-0.5 inline-flex items-center gap-1 rounded-md px-1 py-0.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              {metricLabel} {breakdownLabel.toLowerCase()}
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={metric}
                onValueChange={(value) => selectMetric(value as Metric)}
              >
                {METRICS.map((m) => (
                  <DropdownMenuRadioItem key={m.value} value={m.value}>
                    {m.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                />
              }
            >
              {breakdownLabel}
              <ChevronDownIcon className="size-3 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuRadioGroup
                value={breakdown}
                onValueChange={(value) => setBreakdown(value as Breakdown)}
              >
                {breakdowns.map((b) => (
                  <DropdownMenuRadioItem key={b.value} value={b.value}>
                    {b.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {slices.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No production to display.
          </p>
        ) : (
          /*
           * The donut IS the list. A legend under it repeated every well's name
           * and figure, which on a real fleet is thirty rows of text under a
           * chart that already encodes the same ranking by angle — and it pushed
           * the donut down to a token circle. Hovering a slice names it.
           *
           * Sized in percentages so the ring grows into whatever height the card
           * is given (it shares a row with the production chart, which is taller
           * than any fixed donut we would have picked).
           */
          <div className="min-h-[240px] w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const slice = payload[0].payload as Slice;
                    return (
                      <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                        <div className="flex items-center gap-2 font-medium">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: slice.color }}
                          />
                          {slice.name}
                        </div>
                        <div className="mt-0.5 pl-4.5 tabular-nums text-muted-foreground">
                          {formatValue(slice.value, metric)}
                          {total > 0 && (
                            <span className="ml-1.5">
                              ({Math.round((slice.value / total) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={1}
                  strokeWidth={1}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
