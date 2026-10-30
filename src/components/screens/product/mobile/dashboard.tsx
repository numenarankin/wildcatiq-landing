"use client";

/**
 * The phone's dashboard arriving, the blocks rising in reading order and the
 * month's line drawing itself (an entrance for the page, in place of the
 * app's loading cover), transcribed from mobile-background:
 * - app/(app)/dashboard.tsx (page title, stats paddingTop 10, chart padding 16/16)
 * - src/components/ui/workspace-header.tsx (title in `typography.pageTitle`, no cluster: canManage false)
 * - src/components/analytics/summary-stats.tsx over src/components/charts/rate-headline.tsx
 *   (size "md": oil and gas only, mono 19/26 figures, 12px units, a middot
 *   between, mono 13 moves at 2 dp coloured by direction)
 * - src/components/charts/company-production-chart.tsx on chart-shell.tsx (flush),
 *   segmented.tsx (pill tracks) and line-chart.tsx (48px axis, 8/22 pads, 2px line,
 *   border/50 grid, 11px ticks): Oil then Gas, All leases, 1M of daily points
 * - src/components/analytics/lease-summary-table.tsx on ui/table.tsx (plain header,
 *   48pt header row, 14pt row padding; Lease 200, Bbl/d 84, Mcf/d 84, Net rev/d
 *   104, scrolling sideways past the screen; ordered by gross revenue, then oil)
 *
 * Every figure comes off `dashboardFixture()`: the headline sums its lease
 * rows' 24h oil and gas and nets their day-over-day change lease by lease
 * (`companyChange`), the table is those rows, and the line the fourteen
 * wells' daily oil summed.
 */
import { ChevronDown } from "lucide-react";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
import { OPERATOR } from "@/lib/screens/operator";
import { AppHeader, C, CHART, CONTENT_TOP, LABEL, MONO, PhoneFrame, STATUS_BAR_H } from "./phone";
import { useDemoActive } from "../../demo-active";
import { useLoopCount, useStepLoop } from "./motion";

const DASH = "—";
const PAD_X = 26;

/** format.ts formatters, verbatim. */
const vol = (dp: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const formatVolume = (n: number | null, dp = 0) => (n == null || Number.isNaN(n) ? DASH : vol(dp).format(n));
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatCurrency = (n: number | null) => (n == null || Number.isNaN(n) ? DASH : currency.format(n));
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const formatDayTick = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

/** last-day-rates.ts `changePct`: a fraction, null when there was nothing before. */
const changePct = (c: { now: number; prev: number }): number | null => (c.prev === 0 ? null : (c.now - c.prev) / c.prev);

/** summary-stats.tsx `moveOf`. */
function moveOf(pct: number | null): { text: string; tone?: "up" | "down" } {
  if (pct === null || !Number.isFinite(pct)) return { text: DASH };
  const up = pct >= 0;
  return { text: `${up ? "▲" : "▼"}${Math.abs(pct * 100).toFixed(2)}%`, tone: up ? "up" : "down" };
}

// The loop: the page arrives on Oil and holds, Gas is tapped and its line
// stands in, it holds, and the page fades for the next arrival.
const STEPS = [6400, 260, 4600, 450] as const;
const TAP_STEP = 1;

/** The arrival's curve and its beats: each block rises 10 px and fades in, in reading order. */
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const rise = (on: boolean, delay: number): React.CSSProperties =>
  on ? { animation: `wc-dash-rise 650ms ${EASE} ${delay}ms both`, animationPlayState: "var(--wc-play, running)" } : {};
const DASH_KEYFRAMES = "@keyframes wc-dash-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } } @keyframes wc-dash-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }";

/** A fingertip on the glass: where the demo touches. */
function Touch() {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 34,
        height: 34,
        marginLeft: -17,
        marginTop: -17,
        borderRadius: 999,
        background: "rgba(10,10,10,0.18)",
        border: "1px solid rgba(10,10,10,0.12)",
        pointerEvents: "none",
      }}
    />
  );
}

function Pills({ options, value, stretch, touched }: { options: string[]; value: string; stretch?: boolean; touched?: string }) {
  return (
    <div style={{ display: "flex", flexGrow: stretch ? 1 : 0, background: C.muted, borderRadius: 999, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <div
            key={o}
            style={{
              position: "relative",
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
            {touched === o ? <Touch /> : null}
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

export function OilChart({
  points,
  draw = false,
  drawDelay = 0,
  color = CHART.oil,
}: {
  points: { date: string; y: number }[];
  draw?: boolean;
  drawDelay?: number;
  /** The metric's colour (company-production-chart's `chart.oil` / `chart.gas`). */
  color?: string;
}) {
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
  // Rounded to a hundredth: the fixture's float sums land a few ulps apart on
  // the server and the client, and unrounded coordinates fail hydration.
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const xToPx = (x: number) => r2(plotLeft + ((x - xMin) / (xMax - xMin || 1)) * (plotRight - plotLeft));
  const yToPx = (v: number) => r2(plotBottom - (v / hi) * plotH);
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
      <polyline
        points={points.map((p, i) => `${xToPx(xs[i])},${yToPx(p.y)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={2}
        // Drawn left to right on arrival: a unit path length, dashed and slid in.
        pathLength={1}
        strokeDasharray={draw ? 1 : undefined}
        style={draw ? { animation: `wc-dash-draw 1300ms cubic-bezier(0.65, 0, 0.35, 1) ${drawDelay}ms both`, animationPlayState: "var(--wc-play, running)" } : undefined}
      />
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

type Metric = "Oil" | "Gas";

/**
 * The dashboard page under the app header. `entrance` plays the arrival;
 * `pressed` holds a lease row in its pressed state; `metric` is the chart's
 * pill and `touched` a pill under the finger.
 */
export function DashboardBody({
  entrance = false,
  pressed,
  metric = "Oil",
  touched,
}: {
  entrance?: boolean;
  pressed?: string;
  metric?: Metric;
  touched?: Metric;
}) {
  const fx = dashboardFixture();

  // 1M: the last thirty days, the metric summed across every well.
  const n = fx.dailyByWell[0].daily.length;
  const field = metric === "Gas" ? "gasMcf" : "oilBbl";
  const points = Array.from({ length: 30 }, (_, k) => {
    const i = n - 30 + k;
    return { date: fx.dailyByWell[0].daily[i].date, y: fx.dailyByWell.reduce((a, w) => a + w.daily[i][field], 0) };
  });

  // summary-stats.tsx: the rows' 24h sums, the move netted lease by lease (`companyChange`).
  const rows = fx.leaseRows;
  const sumChange = (k: "oil" | "gas") => rows.reduce((a, r) => ({ now: a.now + r.change[k].now, prev: a.prev + r.change[k].prev }), { now: 0, prev: 0 });
  const stats = [
    { num: formatVolume(rows.reduce((a, r) => a + r.oil24, 0), 1), unit: "bbl/d", move: moveOf(changePct(sumChange("oil"))) },
    { num: formatVolume(rows.reduce((a, r) => a + r.gas24, 0)), unit: "mcf/d", move: moveOf(changePct(sumChange("gas"))) },
  ];

  // lease-summary-table.tsx `tableLines`: gross revenue, then oil, descending.
  const lines = [...rows]
    .sort((a, b) => b.revenue24 - a.revenue24 || b.oil24 - a.oil24)
    .map((r) => ({ key: r.key, name: r.name, oil: r.oil24, gas: r.gas24, net: r.netRevenue24 ?? null }));

  const head: React.CSSProperties = { ...LABEL, padding: "0 8px", display: "flex", alignItems: "center" };
  const cell: React.CSSProperties = { padding: "0 8px", display: "flex", alignItems: "center", justifyContent: "flex-end", fontSize: 15, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
  const cols = "200px 84px 84px 104px";
  const tone = (t?: "up" | "down") => (t === "up" ? C.success : t === "down" ? C.destructive : C.mutedFg);

  return (
      <div style={{ padding: `20px ${PAD_X}px 0`, display: "flex", flexDirection: "column" }}>
        <span style={{ fontWeight: 600, fontSize: 24, letterSpacing: -0.4, color: C.foreground, ...rise(entrance, 0) }}>{OPERATOR.name}</span>

        <div style={{ paddingTop: 10, display: "flex", flexWrap: "nowrap", alignItems: "baseline", gap: 5, ...rise(entrance, 90) }}>
          {stats.map((s, i) => (
            <span key={s.unit} style={{ display: "flex", alignItems: "baseline", gap: 5, minWidth: 0 }}>
              {i > 0 ? <span style={{ fontSize: 12, color: C.mutedFg }}>·</span> : null}
              <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 19, lineHeight: "26px", fontVariantNumeric: "tabular-nums" }}>{s.num}</span>
              <span style={{ fontSize: 12, color: C.mutedFg, whiteSpace: "nowrap" }}>{s.unit}</span>
              <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, color: tone(s.move.tone), fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{s.move.text}</span>
            </span>
          ))}
        </div>

        {/* dashboard.tsx chart slot 16/16 around chart-shell.tsx's flush Card: no top
            padding, 16 below, and its children 16 apart (ui/card.tsx `gap: 16`) */}
        <div style={{ padding: "16px 0" }}>
          <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ paddingTop: 10, paddingBottom: 2, display: "flex", alignItems: "center", gap: 8, ...rise(entrance, 180) }}>
            <div style={{ flex: 1, display: "flex" }}>
              <Pills options={["Oil", "Gas", "Revenue"]} value={metric} stretch touched={touched} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, maxWidth: 132, padding: "0 12px", borderRadius: 999, border: `1px solid ${C.border}` }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>All</span>
              <ChevronDown size={14} color={C.mutedFg} />
            </div>
          </div>
          <div style={rise(entrance, 260)}>
            <OilChart points={points} draw={entrance} drawDelay={380} color={metric === "Gas" ? CHART.gas : CHART.oil} />
          </div>
          <div style={{ paddingTop: 4, display: "flex", ...rise(entrance, 420) }}>
            <Pills options={["1M", "3M", "6M", "12M"]} value="1M" stretch />
          </div>
          </div>
        </div>

        <div style={{ overflow: "hidden", marginRight: -PAD_X }}>
          <div style={{ width: 472 }}>
            <div style={{ height: 48, display: "grid", gridTemplateColumns: cols, alignItems: "center", borderBottom: `0.5px solid ${C.border}80`, ...rise(entrance, 520) }}>
              <span style={head}>Lease</span>
              <span style={{ ...head, justifyContent: "flex-end" }}>Bbl/d</span>
              <span style={{ ...head, justifyContent: "flex-end" }}>Mcf/d</span>
              <span style={{ ...head, justifyContent: "flex-end" }}>Net rev/d</span>
            </div>
            {lines.map((r, i) => (
              <div key={r.key} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", padding: "14px 0", borderBottom: `0.5px solid ${C.border}80`, background: pressed === r.key ? C.muted : undefined, transition: "background 120ms ease", ...rise(entrance, 580 + i * 70) }}>
                <span style={{ padding: "0 8px", fontWeight: 500, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                <span style={cell}>{formatVolume(r.oil, 1)}</span>
                <span style={cell}>{formatVolume(r.gas, 1)}</span>
                <span style={cell}>{formatCurrency(r.net)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}

/**
 * The dashboard arriving on the phone: the company name, then the rates, the
 * controls, the line drawing itself across the month, the range pills and the
 * lease rows one by one. Then Gas is tapped and the month's gas line stands
 * in for the oil (the app's chart swaps without a tween), it holds, fades,
 * and arrives again.
 */
export function PhoneDashboardScreen() {
  const step = useStepLoop(STEPS);
  const visit = useLoopCount(step);
  const active = useDemoActive();
  return (
    <PhoneFrame time="7:41">
      <style>{DASH_KEYFRAMES}</style>
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10 }}>
        <AppHeader />
      </div>
      {/* Held at its first frame until the screen is in view, so the arrival is seen, not missed. */}
      <div style={{ paddingTop: CONTENT_TOP - STATUS_BAR_H, opacity: step === STEPS.length - 1 ? 0 : 1, transition: step === STEPS.length - 1 ? "opacity 400ms ease" : "none", ["--wc-play" as string]: active ? "running" : "paused" }}>
        <DashboardBody key={visit} entrance metric={step >= TAP_STEP + 1 ? "Gas" : "Oil"} touched={step === TAP_STEP ? "Gas" : undefined} />
      </div>
    </PhoneFrame>
  );
}
