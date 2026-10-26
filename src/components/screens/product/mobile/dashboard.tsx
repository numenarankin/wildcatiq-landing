"use client";

/**
 * The phone's dashboard, transcribed from wildcat-phone:
 * - app/(app)/dashboard.tsx (page title, stats paddingTop 10, chart padding 16/16)
 * - src/components/ui/workspace-header.tsx (title in `typography.pageTitle`, no cluster: canManage false)
 * - src/components/analytics/summary-stats.tsx over src/components/charts/rate-headline.tsx
 *   (size "sm": mono 17/22 figures, 11px units, ticker moves; no decline on a phone)
 * - src/components/charts/company-production-chart.tsx on chart-shell.tsx (flush),
 *   segmented.tsx (pill tracks) and line-chart.tsx (48px axis, 8/22 pads, 2px line,
 *   border/50 grid, 11px ticks): Oil, All leases, 1M of daily points
 * - src/components/analytics/lease-summary-table.tsx on ui/table.tsx (plain header,
 *   48pt header row, 14pt row padding, sorted Net rev/mo descending)
 *
 * Every figure comes off `dashboardFixture()`: the rates are its cards, the
 * table its lease rows (net rev/mo = the lease's 24h net revenue times
 * DAYS_PER_MONTH, which sums to `cards.netRevenueMonthly`), and the line the
 * fourteen wells' daily oil summed.
 */
import { ChevronDown } from "lucide-react";
import { DAYS_PER_MONTH } from "@/lib/analytics/summary-calc";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
import { OPERATOR } from "@/lib/screens/operator";
import { AppHeader, C, CHART, CONTENT_TOP, LABEL, MONO, PhoneFrame } from "./phone";

const DASH = "—";
const PAD_X = 26;

/** format.ts formatters, verbatim. */
const vol = (dp: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const formatVolume = (n: number | null, dp = 0) => (n == null || Number.isNaN(n) ? DASH : vol(dp).format(n));
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatCurrency = (n: number | null) => (n == null || Number.isNaN(n) ? DASH : currency.format(n));
function formatCompactMoney(n: number | null): string {
  if (n == null || Number.isNaN(n)) return DASH;
  const abs = Math.abs(n);
  if (abs < 1_000) return formatCurrency(n);
  const sign = n < 0 ? "-" : "";
  const [scaled, suffix] = abs >= 1_000_000 ? [abs / 1_000_000, "m"] : [abs / 1_000, "k"];
  return `${sign}$${scaled.toFixed(1)}${suffix}`;
}
const formatPercent = (n: number | null, dp = 1) => (n == null || Number.isNaN(n) ? DASH : `${n.toFixed(dp)}%`);
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const formatDayTick = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

/** line-chart.tsx `niceTicks`. */
function niceTicks(lo: number, hi: number, count = 4): number[] {
  const rawStep = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const start = Math.ceil(lo / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= hi + step * 1e-6; v += step) ticks.push(Math.abs(v) < step * 1e-6 ? 0 : v);
  return ticks;
}

/** paired-total `changePct`: percent (8.1 is 8.1%), null when there is no move to state. */
const pctOf = (now: number, prev: number): number | null => (prev === 0 ? null : ((now - prev) / prev) * 100);

function Move({ pct, size }: { pct: number | null; size: number }) {
  if (pct == null) return <span style={{ fontSize: size, color: C.mutedFg, fontVariantNumeric: "tabular-nums" }}>{DASH}</span>;
  const up = pct >= 0;
  return (
    <span style={{ fontWeight: 500, fontSize: size, color: up ? C.success : C.destructive, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
      {(up ? "▲" : "▼") + `${Math.abs(pct).toFixed(1)}%`}
    </span>
  );
}

function Pills({ options, value, stretch }: { options: string[]; value: string; stretch?: boolean }) {
  return (
    <div style={{ display: "flex", flexGrow: stretch ? 1 : 0, background: C.muted, borderRadius: 999, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <div
            key={o}
            style={{
              flexGrow: stretch ? 1 : 0,
              padding: "0 12px",
              minHeight: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: active ? C.background : "transparent",
              boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : undefined,
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 12, color: active ? C.foreground : C.mutedFg, whiteSpace: "nowrap" }}>{o}</span>
          </div>
        );
      })}
    </div>
  );
}

const CHART_W = 390 - PAD_X * 2;
const CHART_H = 320;
const AXIS_W = 48;
const PAD_TOP = 8;
const PAD_BOTTOM = 22;

function OilChart({ points }: { points: { date: string; y: number }[] }) {
  const xs = points.map((p) => Date.parse(`${p.date}T00:00:00Z`));
  const xMin = xs[0];
  const xMax = xs[xs.length - 1];
  const max = Math.max(...points.map((p) => p.y));
  const ticks = niceTicks(0, max, 4);
  const hi = Math.max(max, ticks[ticks.length - 1]);
  const plotLeft = AXIS_W;
  const plotRight = CHART_W - 8;
  const plotBottom = CHART_H - PAD_BOTTOM;
  const plotH = plotBottom - PAD_TOP;
  const xToPx = (x: number) => plotLeft + ((x - xMin) / (xMax - xMin || 1)) * (plotRight - plotLeft);
  const yToPx = (v: number) => plotBottom - (v / hi) * plotH;
  // company-production-chart `makeTicks` (≤ 8, every nth date), then line-chart's pixel thinning.
  const step = Math.max(1, Math.ceil(points.length / 8));
  const xTicks: { px: number; label: string }[] = [];
  let lastRight = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < points.length; i += step) {
    const px = xToPx(xs[i]);
    const label = formatDayTick(points[i].date);
    const half = (label.length * 6.2) / 2;
    if (px - half < lastRight + 8) continue;
    xTicks.push({ px, label });
    lastRight = px + half;
  }
  return (
    <svg width={CHART_W} height={CHART_H} style={{ display: "block" }}>
      {ticks.map((t) => (
        <line key={t} x1={plotLeft} x2={plotRight} y1={yToPx(t)} y2={yToPx(t)} stroke={C.border} strokeOpacity={0.5} strokeWidth={1} />
      ))}
      <polyline points={points.map((p, i) => `${xToPx(xs[i])},${yToPx(p.y)}`).join(" ")} fill="none" stroke={CHART.oil} strokeWidth={2} />
      {ticks.map((t) => (
        <text key={`l${t}`} x={0} y={yToPx(t) + 4} fontSize={11} fill={C.mutedFg}>
          {compact.format(t)}
        </text>
      ))}
      {xTicks.map((t) => (
        <text key={t.label} x={t.px} y={CHART_H - 6} textAnchor="middle" fontSize={11} fill={C.mutedFg}>
          {t.label}
        </text>
      ))}
    </svg>
  );
}

export function PhoneDashboardScreen() {
  const fx = dashboardFixture();
  const cards = fx.cards;
  const pct = (f: number | null) => (f == null ? null : f * 100);

  // 1M: the last thirty days, company oil summed across every well.
  const n = fx.dailyByWell[0].daily.length;
  const points = Array.from({ length: 30 }, (_, k) => {
    const i = n - 30 + k;
    return { date: fx.dailyByWell[0].daily[i].date, y: fx.dailyByWell.reduce((a, w) => a + w.daily[i].oilBbl, 0) };
  });

  const leases = fx.leaseRows.map((r) => ({
    key: r.key,
    name: r.name,
    oil: r.oil24,
    oilPct: pctOf(r.change.oil.now, r.change.oil.prev),
    gas: r.gas24,
    gasPct: pctOf(r.change.gas.now, r.change.gas.prev),
    net: (r.netRevenue24 ?? 0) * DAYS_PER_MONTH,
    netPct: pctOf(r.change.revenue.now, r.change.revenue.prev),
  }));
  const total = leases.reduce((a, r) => a + r.net, 0);
  const rows = [...leases].sort((a, b) => b.net - a.net);

  const stats = [
    { num: formatVolume(cards.oilBblPerDay, 1), unit: "bbl/d", change: pct(cards.oilChangePct) },
    { num: formatVolume(cards.gasMcfPerDay), unit: "mcf/d", change: pct(cards.gasChangePct) },
    { num: formatCompactMoney(cards.netRevenueMonthly), unit: "net rev/mo", change: pct(cards.netChangePct) },
  ];

  const head: React.CSSProperties = { ...LABEL, padding: "0 8px", display: "flex", alignItems: "center" };
  const cell: React.CSSProperties = { padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontSize: 15, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
  const cols = "140px 150px 150px 168px 96px";

  return (
    <PhoneFrame time="7:41">
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10 }}>
        <AppHeader />
      </div>
      <div style={{ padding: `${CONTENT_TOP - 54 + 20}px ${PAD_X}px 0`, display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 600, fontSize: 24, letterSpacing: -0.4, color: C.foreground }}>{OPERATOR.name}</span>

        <div style={{ paddingTop: 10, display: "flex", flexWrap: "wrap", columnGap: 14, rowGap: 2, alignItems: "baseline" }}>
          {stats.map((s) => (
            <span key={s.unit} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 17, lineHeight: "22px", fontVariantNumeric: "tabular-nums" }}>{s.num}</span>
              <span style={{ fontSize: 11, color: C.mutedFg }}>{s.unit}</span>
              {s.change == null ? null : <Move pct={s.change} size={11} />}
            </span>
          ))}
        </div>

        <div style={{ padding: "16px 0" }}>
          <div style={{ paddingTop: 10, paddingBottom: 2, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, display: "flex" }}>
              <Pills options={["Oil", "Gas", "Revenue"]} value="Oil" stretch />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, maxWidth: 132, padding: "0 12px", borderRadius: 999, border: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>All</span>
              <ChevronDown size={14} color={C.mutedFg} />
            </div>
          </div>
          <OilChart points={points} />
          <div style={{ paddingTop: 4, display: "flex" }}>
            <Pills options={["1M", "3M", "6M", "12M"]} value="1M" stretch />
          </div>
        </div>

        <div style={{ overflow: "hidden", marginRight: -PAD_X }}>
          <div style={{ width: 704 }}>
            <div style={{ height: 48, display: "grid", gridTemplateColumns: cols, alignItems: "center", borderBottom: `0.5px solid ${C.border}80` }}>
              <span style={head}>Lease</span>
              <span style={{ ...head, justifyContent: "flex-end" }}>Bbl/d</span>
              <span style={{ ...head, justifyContent: "flex-end" }}>Mcf/d</span>
              <span style={{ ...head, justifyContent: "flex-end", gap: 2 }}>
                Net rev/mo
                <ChevronDown size={12} color={C.mutedFg} />
              </span>
              <span style={{ ...head, justifyContent: "flex-end" }}>Net rev %</span>
            </div>
            {rows.map((r) => (
              <div key={r.key} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", padding: "14px 0", borderBottom: `0.5px solid ${C.border}80` }}>
                <span style={{ padding: "0 8px", fontWeight: 500, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                <span style={cell}>
                  {formatVolume(r.oil, 1)}
                  <Move pct={r.oilPct} size={12} />
                </span>
                <span style={cell}>
                  {formatVolume(r.gas, 1)}
                  <Move pct={r.gasPct} size={12} />
                </span>
                <span style={cell}>
                  {formatCurrency(r.net)}
                  <Move pct={r.netPct} size={12} />
                </span>
                <span style={{ ...cell, color: C.mutedFg }}>{formatPercent((r.net / total) * 100, 1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
