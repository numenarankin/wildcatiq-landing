"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, MapPin, X } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Stat, THead, Th } from "./modal-ui";
import { ScoutExportMenu } from "./export-table-menu";
import { MARKET_TABLES } from "@/lib/scout/exports/tables";
import { useRrcModals } from "./use-rrc-modals";
import { fmtVol, perMonth, titleCase, partyName } from "@/lib/scout/format";
import type { AreaSeries, CycleTotals, MarketData, RankedRow } from "@/lib/scout/rrc-types";

/*
 * ===========================================================================
 * MARKET VIEW — statewide / district / county production, and leaderboards.
 * ===========================================================================
 *
 * WHAT IT IS
 * The zoomed-out mode of Scout: not "where are the wells" but "what is the
 * state, this district, or these counties producing, and who is producing it".
 *
 * DATA IT NEEDS  (props: `MarketData` from `@/lib/scout/rrc-types`)
 *   statewide          CycleTotals[]   monthly Texas totals
 *   districts          AreaSeries[]    one entry per RRC district, with monthly
 *   counties           AreaSeries[]    one entry per county, with monthly
 *   topCounties        RankedRow[]     ranked, trailing window
 *   topFields          RankedRow[]
 *   topOperators       RankedRow[]
 *   lastReportedCycle  "YYYY-MM"       last cycle the RRC has actually published
 *   lastLoadedCycle    "YYYY-MM"       last cycle present in the mirror
 *
 * WIRING NOTES FOR THE BACKEND
 *   - `districts`  <- `district_cycle` (5,252 rows). `counties` <- `county_cycle`
 *     (243,957). `statewide` <- sum of `district_cycle` per cycle, or the
 *     `statewide_production_monthly` continuous aggregate. All three are
 *     pre-aggregated; NONE of them should be computed from `lease_production`.
 *   - `cycle` must be "YYYY-MM". The RRC ships `CYCLE_YEAR_MONTH` as the integer
 *     202601; convert once, at the query.
 *   - `lastReportedCycle` is NOT "today minus 3 months". Derive it: the last
 *     cycle whose statewide volume is non-zero. Everything after it is absent,
 *     not zero, and this component shades that band rather than plotting a
 *     collapse. Getting this wrong makes Texas look like it stopped producing.
 *   - The leaderboards are trailing-window rankings. `topCounties` should be
 *     re-queried when a scope is selected (see SCOPE below); `topFields` and
 *     `topOperators` are statewide here and are labelled as such — filtering
 *     them by county needs `county_lease_cycle` joined to fields/operators.
 *   - Counties carry `district_no` so the picker can group them; it comes from
 *     `county_cycle.DISTRICT_NO`.
 *
 * SCOPE
 * The user picks Texas, one or more districts, or one or more counties. The
 * chart then draws one line per selected area (capped at MAX_LINES so a
 * 20-county selection stays readable) and the totals table sums the selection.
 * When you wire this up, a scope change is the moment to re-query the ranked
 * lists for that area — the component already re-renders them from props.
 */

type Stream = "oil" | "gas" | "cond" | "csgd";
type ScopeKind = "state" | "district" | "county";

const STREAMS: { key: Stream; label: string; unit: string; color: string }[] = [
  { key: "oil", label: "Oil", unit: "bbl", color: "#059669" },
  { key: "gas", label: "Gas", unit: "MCF", color: "#800000" },
  { key: "cond", label: "Condensate", unit: "bbl", color: "#b45309" },
  { key: "csgd", label: "Casinghead", unit: "MCF", color: "#4169e1" },
];

/** Beyond this many series the chart is unreadable; the rest still count in the totals. */
const MAX_LINES = 8;

const LINE_COLORS = [
  "#059669", "#800000", "#4169e1", "#b45309",
  "#7c3aed", "#0d9488", "#db2777", "#65a30d",
];

const compact = new Intl.NumberFormat("en-US", { notation: "compact" });
const tickMonth = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});
const fullMonth = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthDate = (c: string) => new Date(`${c}-01T00:00:00Z`);

/**
 * The average MONTH over the trailing year for one stream, ignoring cycles the
 * RRC has not reported yet. Divided by the cycles actually in hand, so a scope
 * with a short series reads its own rate rather than a twelfth of it.
 */
function perMonth12(monthly: CycleTotals[], stream: Stream, lastReported: string): number {
  const upto = monthly.filter((m) => m.cycle <= lastReported).slice(-12);
  if (upto.length === 0) return 0;
  return upto.reduce((a, m) => a + (m[stream] || 0), 0) / upto.length;
}

/**
 * Multi-select over districts or counties, with a search box because Texas has
 * 254 counties and a flat checkbox list is unusable.
 */
function AreaPicker({
  label,
  areas,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  areas: AreaSeries[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? areas.filter((a) => a.label.toLowerCase().includes(q) || a.key.includes(q))
      : areas;
    return list.slice(0, 200);
  }, [areas, query]);

  return (
    <Popover>
      <PopoverTrigger render={<Button size="sm" variant="outline" />}>
        <MapPin className="size-3.5" />
        {label}
        {selected.size > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">
            {selected.size}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b p-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}…`}
            className="h-8 text-xs"
          />
        </div>
        <ul className="no-scrollbar max-h-72 overflow-y-auto p-1">
          {matches.map((a) => {
            const on = selected.has(a.key);
            return (
              <li key={a.key}>
                <button
                  onClick={() => onToggle(a.key)}
                  className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  <span className="truncate">
                    {titleCase(a.label)}
                    <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                      {a.key}
                    </span>
                  </span>
                  {on && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              </li>
            );
          })}
          {matches.length === 0 && (
            <li className="px-2 py-3 text-xs text-muted-foreground">No match.</li>
          )}
        </ul>
        {selected.size > 0 && (
          <div className="border-t p-1">
            <button
              onClick={onClear}
              className="w-full rounded px-2 py-1.5 text-left text-xs text-primary hover:bg-muted"
            >
              Clear {selected.size} selected
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * A leaderboard's rows, per month, re-ranked on the rate they now show.
 *
 * The query ranks on the window's SUM, and the rows do not all cover the same
 * number of cycles — a county that filed nine months is out of order against
 * one that filed twelve for the same total. Re-sorting fixes the column the
 * reader sees; MEMBERSHIP is still the top N by sum, so a heavy short-filer
 * just outside the cut does not appear at all. Widening that would mean ranking
 * on the rate in SQL, which the materialised boards cannot do.
 */
function perMonthRows(rows: RankedRow[]): RankedRow[] {
  return rows
    .map((r) => ({
      ...r,
      oil: perMonth(r.oil, r.months),
      gas: perMonth(r.gas, r.months),
    }))
    .sort((a, b) => b.oil - a.oil || b.gas - a.gas);
}

/** A leaderboard. No inner scroller — the market view scrolls as a page. */
function Ranked({
  title,
  note,
  rows,
  countLabel,
  onSelect,
  action,
}: {
  title: string;
  note?: string;
  rows: RankedRow[];
  countLabel: string;
  onSelect?: (row: RankedRow) => void;
  /** A control at the heading's right end: the board's Export menu. */
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-[0.15rem] border">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-1.5">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="flex items-center gap-2">
          {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
          {action}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <THead>
            <Th>Name</Th>
            <Th right>Oil (bbl/mo)</Th>
            <Th right>Gas (MCF/mo)</Th>
            <Th right>{countLabel}</Th>
          </THead>
          <tbody className="divide-y">
            {rows.map((r) => (
              <tr
                key={r.key}
                onClick={() => onSelect?.(r)}
                className={onSelect ? "cursor-pointer hover:bg-muted" : "hover:bg-muted"}
              >
                <td className="px-3 py-1.5">
                  <div className={onSelect ? "font-medium text-primary" : undefined}>
                    {titleCase(r.label)}
                    {onSelect && <ArrowUpRight className="ml-0.5 inline size-3" />}
                  </div>
                  {r.sub && (
                    <div className="text-[11px] text-muted-foreground">
                      {titleCase(r.sub)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {fmtVol(Math.round(r.oil))}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {fmtVol(Math.round(r.gas))}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                  {r.count?.toLocaleString() ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function MarketView({
  data,
  onSelectOperator,
  initialKind = "state",
  initialAreas = [],
}: {
  data: MarketData;
  /** Opens the operator dossier from the leaderboard. */
  onSelectOperator?: (operatorNumber: string) => void;
  /** landing: the scope the screen opens on (the app always opens on Texas). */
  initialKind?: ScopeKind;
  /** landing: the district or county keys selected at open. */
  initialAreas?: string[];
}) {
  const { openOperator, openLease, openField, openCounty, modals } =
    useRrcModals();
  const [stream, setStream] = useState<Stream>("oil");
  const [kind, setKind] = useState<ScopeKind>(initialKind);
  const [districts, setDistricts] = useState<Set<string>>(
    () => new Set(initialKind === "district" ? initialAreas : [])
  );
  const [counties, setCounties] = useState<Set<string>>(
    () => new Set(initialKind === "county" ? initialAreas : [])
  );

  const spec = STREAMS.find((s) => s.key === stream)!;
  const lastReal = data.lastReportedCycle;
  const lastLoaded = data.lastLoadedCycle;

  /**
   * The areas currently in scope. Statewide is a single pseudo-area so the rest
   * of the component has exactly one code path to render.
   */
  const scoped: AreaSeries[] = useMemo(() => {
    if (kind === "district" && districts.size) {
      return data.districts.filter((d) => districts.has(d.key));
    }
    if (kind === "county" && counties.size) {
      return data.counties.filter((c) => counties.has(c.key));
    }
    return [{ key: "tx", label: "The State of Texas", monthly: data.statewide }];
  }, [kind, districts, counties, data]);

  /** Sum of everything in scope, per cycle — the headline series and totals. */
  const combined: CycleTotals[] = useMemo(() => {
    if (scoped.length === 1) return scoped[0].monthly;
    const byCycle = new Map<string, CycleTotals>();
    for (const a of scoped) {
      for (const m of a.monthly) {
        const row = byCycle.get(m.cycle) ?? {
          cycle: m.cycle, oil: 0, gas: 0, cond: 0, csgd: 0,
        };
        row.oil += m.oil;
        row.gas += m.gas;
        row.cond += m.cond;
        row.csgd += m.csgd;
        byCycle.set(m.cycle, row);
      }
    }
    return [...byCycle.values()].sort((a, b) => (a.cycle < b.cycle ? -1 : 1));
  }, [scoped]);

  // Chart series: the combined line always, plus per-area lines when a handful
  // of areas are selected (past MAX_LINES it is a hairball, so only the total).
  const perArea = scoped.length > 1 && scoped.length <= MAX_LINES;

  const series = useMemo(() => {
    const byCycle = new Map<string, Record<string, number | string>>();
    for (const m of combined) {
      byCycle.set(m.cycle, { cycle: m.cycle, total: m[stream] });
    }
    if (perArea) {
      for (const a of scoped) {
        for (const m of a.monthly) {
          const row = byCycle.get(m.cycle);
          if (row) row[`a${a.key}`] = m[stream];
        }
      }
    }
    return [...byCycle.values()];
  }, [combined, scoped, perArea, stream]);

  const config = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {
      total: {
        label:
          scoped.length === 1 ? `${titleCase(scoped[0].label)} ${spec.label}` : `Selected ${spec.label}`,
        color: spec.color,
      },
    };
    if (perArea) {
      scoped.forEach((a, i) => {
        cfg[`a${a.key}`] = {
          label: titleCase(a.label),
          color: LINE_COLORS[i % LINE_COLORS.length],
        };
      });
    }
    return cfg satisfies ChartConfig;
  }, [scoped, perArea, spec]);

  const latest = combined.find((m) => m.cycle === lastReal);

  const scopeLabel =
    kind === "state" || scoped.length === 0
      ? "The State of Texas"
      : scoped.length === 1
        ? titleCase(scoped[0].label)
        : `${scoped.length} ${kind === "district" ? "districts" : "counties"}`;

  const clearScope = () => {
    setDistricts(new Set());
    setCounties(new Set());
    setKind("state");
  };

  const toggle = (set: Set<string>, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  return (
    <div className="no-scrollbar flex h-full flex-col gap-4 overflow-y-auto p-5">
      {/* Scope bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Area
        </span>
        <Button
          size="sm"
          variant={kind === "state" ? "default" : "outline"}
          onClick={clearScope}
        >
          The State of Texas
        </Button>
        <Button
          size="sm"
          variant={kind === "district" ? "default" : "outline"}
          onClick={() => setKind("district")}
        >
          Districts
        </Button>
        <Button
          size="sm"
          variant={kind === "county" ? "default" : "outline"}
          onClick={() => setKind("county")}
        >
          Counties
        </Button>

        {kind === "district" && (
          <AreaPicker
            label="Districts"
            areas={data.districts}
            selected={districts}
            onToggle={(k) => setDistricts((s) => toggle(s, k))}
            onClear={() => setDistricts(new Set())}
          />
        )}
        {kind === "county" && (
          <AreaPicker
            label="Counties"
            areas={data.counties}
            selected={counties}
            onToggle={(k) => setCounties((s) => toggle(s, k))}
            onClear={() => setCounties(new Set())}
          />
        )}

        {kind !== "state" && (districts.size > 0 || counties.size > 0) && (
          <div className="flex flex-wrap items-center gap-1">
            {scoped.slice(0, 6).map((a) => (
              <span
                key={a.key}
                className="flex items-center gap-1 rounded-full border bg-muted/40 py-0.5 pl-2 pr-1 text-xs"
              >
                {titleCase(a.label)}
                <button
                  aria-label={`Remove ${a.label}`}
                  onClick={() =>
                    kind === "district"
                      ? setDistricts((s) => toggle(s, a.key))
                      : setCounties((s) => toggle(s, a.key))
                  }
                  className="rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {scoped.length > 6 && (
              <span className="text-xs text-muted-foreground">
                +{scoped.length - 6} more
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={`Oil · ${lastReal}`}
          value={`${fmtVol(latest?.oil ?? 0)} bbl`}
          hint={`${scopeLabel} · last reported cycle`}
        />
        <Stat label={`Gas · ${lastReal}`} value={`${fmtVol(latest?.gas ?? 0)} MCF`} />
        <Stat
          label="Oil · per month"
          value={`${fmtVol(Math.round(perMonth12(combined, "oil", lastReal)))} bbl`}
          hint={`${scopeLabel} · 12-month average`}
        />
        <Stat
          label="Loaded through"
          value={lastLoaded}
          hint={`reported through ${lastReal}, RRC lags ~3 months`}
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {STREAMS.map((s) => (
            <Button
              key={s.key}
              size="xs"
              variant={stream === s.key ? "default" : "outline"}
              onClick={() => setStream(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        {scoped.length > MAX_LINES && (
          <span className="text-[11px] text-muted-foreground">
            {scoped.length} areas selected, charting the combined total only
          </span>
        )}
      </div>

      <ChartContainer config={config} className="aspect-auto h-[300px] w-full shrink-0">
        <LineChart data={series} margin={{ left: 8, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} />
          {/* Cycles the RRC has not published yet: shaded, never plotted as a
              drop to zero. */}
          <ReferenceArea
            x1={lastReal}
            x2={lastLoaded}
            fill="var(--muted-foreground)"
            fillOpacity={0.1}
          />
          <XAxis
            dataKey="cycle"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={28}
            tickFormatter={(v) => tickMonth.format(monthDate(String(v)))}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => compact.format(v)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) => fullMonth.format(monthDate(String(v)))}
              />
            }
          />
          <Line
            dataKey="total"
            type="monotone"
            stroke="var(--color-total)"
            strokeWidth={2.5}
            dot={false}
          />
          {perArea &&
            scoped.map((a) => (
              <Line
                key={a.key}
                dataKey={`a${a.key}`}
                type="monotone"
                stroke={`var(--color-a${a.key})`}
                strokeWidth={1.5}
                strokeOpacity={0.75}
                dot={false}
              />
            ))}
        </LineChart>
      </ChartContainer>

      {/* Per-area totals for the current selection. */}
      {scoped.length > 1 && (
        <Ranked
          title={`Selected ${kind === "district" ? "districts" : "counties"}`}
          note="12-month average"
          countLabel=""
          rows={scoped.map((a) => ({
            key: a.key,
            label: a.label,
            oil: perMonth12(a.monthly, "oil", lastReal),
            gas: perMonth12(a.monthly, "gas", lastReal),
          }))}
        />
      )}

      {/* Every board opens its own dossier. Until the modal host was hoisted
          out of the RRC browser these rows were inert — `onSelectOperator` was
          a prop this page never passed, so the operator board looked clickable
          and was not. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Ranked
          title="Top counties"
          note="statewide"
          rows={perMonthRows(data.topCounties)}
          countLabel="Wells"
          onSelect={(r) => openCounty(r.key)}
          action={<ScoutExportMenu subject="market" subjectKey="state" table={MARKET_TABLES.counties} dossier={data} />}
        />
        <Ranked
          title="Top fields"
          note="statewide"
          rows={perMonthRows(data.topFields)}
          countLabel="Wells"
          onSelect={(r) => openField(r.key)}
          action={<ScoutExportMenu subject="market" subjectKey="state" table={MARKET_TABLES.fields} dossier={data} />}
        />
      </div>
      <Ranked
        title="Top operators"
        note="statewide"
        // Operators are people as often as companies; the other boards are
        // leases, fields and counties, which keep their filed names.
        rows={perMonthRows(data.topOperators).map((r) => ({ ...r, label: partyName(r.label) }))}
        countLabel="Wells"
        onSelect={(r) => (onSelectOperator ?? openOperator)(r.key)}
        action={<ScoutExportMenu subject="market" subjectKey="state" table={MARKET_TABLES.operators} dossier={data} />}
      />
      <Ranked
        title="Top leases"
        note="12-month average, by oil"
        rows={perMonthRows(data.topLeases)}
        countLabel=""
        action={<ScoutExportMenu subject="market" subjectKey="state" table={MARKET_TABLES.leases} dossier={data} />}
        onSelect={(r) => {
          // key is `oil_gas_code/district_no/lease_no`, built by
          // getLeaderboard so the row needs no second lookup to open.
          const [oil_gas_code, district_no, lease_no] = r.key.split("/");
          openLease({ oil_gas_code, district_no, lease_no });
        }}
      />
      {modals}
    </div>
  );
}
