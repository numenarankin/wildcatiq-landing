"use client";

/**
 * Smith 4's well page on the phone, shared by the Pumper page's Info and Tests
 * screens. Transcribed from mobile-background:
 * - src/components/wells/well-workspace.tsx (the page: WorkspaceHeader with the
 *   "Well info" gear and the Add circle, the ProductionChart `flush pill
 *   productionOnly headline="ema14"`, the tab list in web parity order)
 * - src/components/ui/facility-workspace.tsx (Comments and Notes spliced in
 *   after Service, `facilityTabsAt={3}`; the strip 16 over the pane)
 * - src/components/ui/tabs.tsx `UnderlineTabs` (16 semibold labels, padding
 *   16 / 9, gap 4, the muted pill behind the active tab, marginTop 16 /
 *   bottom 12; the strip scrolls so the active tab sits 16 from its left edge)
 * - src/components/charts/production-chart.tsx + chart-shell.tsx (phone: the
 *   rate line up top, the commodity pills with the settings and fullscreen
 *   icon-sm buttons beside them, the 320pt plot, the 1M / 3M / 12M / All
 *   presets under it; the page opens on 1M)
 * - src/components/ui/table.tsx `DataTable` under `PlainTableHeaders` (a plain
 *   48pt header in `typography.label`, rows padded 14, cells 8, border/50
 *   hairlines)
 *
 * The rate line is the 14-day EMA over Smith 4's full daily record, as
 * comments.tsx draws the same page; the plot is its last 30 days of oil.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { Maximize2, Plus, Settings, Settings2 } from "lucide-react";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
import { PUMPER_WELL } from "@/lib/screens/pumper-fixture";
import { AppHeader, C, CHART, HEADER_H, LABEL, MONO, SANS } from "../product/mobile/phone";

export const PAD_X = 26;
/** table.tsx `borderFaint`. */
export const BORDER_FAINT = `${C.border}80`;
export const DASH = "—";

const vol = (dp: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
/** format.ts `formatVolume`. */
export const formatVolume = (n: number | null, dp = 0) => (n == null || Number.isNaN(n) ? DASH : vol(dp).format(n));

/** lib/analytics.ts `ema`, the last smoothed value. */
function lastEma(values: number[], days: number): number {
  let prev = values.slice(0, days).reduce((a, v) => a + v, 0) / days;
  const k = 2 / (days + 1);
  for (let i = days; i < values.length; i++) prev = values[i] * k + prev * (1 - k);
  return prev;
}

/** well-workspace.tsx tab order, with the shell's Comments and Notes at 3. */
export const WELL_TABS = ["Production", "Info", "Service", "Comments", "Notes", "Tests", "Downtime", "Shots", "Pumping", "Files", "Revenue"] as const;
export type WellTab = (typeof WELL_TABS)[number];

function Pills({ options, value }: { options: string[]; value: string }) {
  return (
    <div style={{ display: "flex", flexGrow: 1, background: C.muted, borderRadius: 999, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <div key={o} style={{ flexGrow: 1, padding: "0 12px", minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: active ? C.background : "transparent", boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : undefined }}>
            <span style={{ fontWeight: 500, fontSize: 12, color: active ? C.foreground : C.mutedFg, whiteSpace: "nowrap" }}>{o}</span>
          </div>
        );
      })}
    </div>
  );
}

function IconButton({ children }: { children: React.ReactNode }) {
  return <div style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 999, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}

const CHART_W = 390 - PAD_X * 2;
const CHART_H = 320;
const AXIS_W = 48;

function niceTicks(lo: number, hi: number, count = 4): number[] {
  const rawStep = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}

/** line-chart.tsx: 48px axis, 8 / 22 pads, a 2px oil line over border/50 grid. */
function OilPlot({ points }: { points: { date: string; y: number }[] }) {
  const max = Math.max(...points.map((p) => p.y));
  const ticks = niceTicks(0, max, 4);
  const hi = Math.max(max, ticks[ticks.length - 1]);
  const left = AXIS_W;
  const right = CHART_W - 8;
  const bottom = CHART_H - 22;
  const x = (i: number) => left + (i / (points.length - 1)) * (right - left);
  const y = (v: number) => bottom - (v / hi) * (bottom - 8);
  const tick = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
  const xTicks = points.map((p, i) => ({ i, label: tick(p.date) })).filter((_, i) => i % 6 === 0);
  return (
    <svg width={CHART_W} height={CHART_H} style={{ display: "block" }}>
      {ticks.map((t) => (
        <line key={t} x1={left} x2={right} y1={y(t)} y2={y(t)} stroke={C.border} strokeOpacity={0.5} strokeWidth={1} />
      ))}
      <polyline points={points.map((p, i) => `${x(i)},${y(p.y)}`).join(" ")} fill="none" stroke={CHART.oil} strokeWidth={2} />
      {ticks.map((t) => (
        <text key={`l${t}`} x={0} y={y(t) + 4} fontSize={11} fill={C.mutedFg}>
          {t}
        </text>
      ))}
      {xTicks.map((t) => (
        <text key={t.label} x={x(t.i)} y={CHART_H - 6} textAnchor="middle" fontSize={11} fill={C.mutedFg}>
          {t.label}
        </text>
      ))}
    </svg>
  );
}

/** WorkspaceHeader + the production chart, as the page opens. */
export function WellTop() {
  const fx = dashboardFixture();
  const daily = fx.dailyByWell.find((d) => d.wellId === PUMPER_WELL.id)!.daily;
  const oil = lastEma(daily.map((d) => d.oilBbl), 14);
  const gas = lastEma(daily.map((d) => d.gasMcf), 14);
  const points = daily.slice(-30).map((d) => ({ date: d.date, y: d.oilBbl }));
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span style={{ fontWeight: 600, fontSize: 24, letterSpacing: -0.4 }}>{PUMPER_WELL.name}</span>
            <Settings size={18} color={C.foreground} />
          </div>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", transform: "translateY(13px)" }}>
            <Plus size={20} color={C.primaryFg} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 22, lineHeight: "26px" }}>{vol(2).format(oil)}</span>
          <span style={{ fontSize: 12, color: C.mutedFg }}>bbl/d</span>
          <span style={{ fontSize: 12, color: C.mutedFg }}>·</span>
          <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: 22, lineHeight: "26px" }}>{vol(0).format(gas)}</span>
          <span style={{ fontSize: 12, color: C.mutedFg }}>mcf/d</span>
        </div>
      </div>
      <div style={{ padding: "16px 0 0" }}>
        <div style={{ paddingTop: 10, paddingBottom: 2, display: "flex", alignItems: "center", gap: 8 }}>
          <Pills options={["Oil", "Gas", "Water", "Net Rev"]} value="Oil" />
          <IconButton>
            <Settings2 size={16} color={C.foreground} />
          </IconButton>
          <IconButton>
            <Maximize2 size={16} color={C.foreground} />
          </IconButton>
        </div>
        <OilPlot points={points} />
        <div style={{ paddingTop: 4, display: "flex" }}>
          <Pills options={["1M", "3M", "12M", "All"]} value="1M" />
        </div>
      </div>
    </div>
  );
}

/** UnderlineTabs, scrolled so the active tab sits 16 from the strip's left edge. */
export function TabStrip({ active, stripRef }: { active: WellTab; stripRef?: React.Ref<HTMLDivElement> }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  useLayoutEffect(() => {
    const el = rowRef.current?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (el) setX(Math.max(0, el.offsetLeft - 16));
  }, [active]);
  return (
    <div ref={stripRef} style={{ marginTop: 16, marginBottom: 12, overflow: "hidden" }}>
      <div ref={rowRef} style={{ position: "relative", display: "flex", gap: 4, paddingRight: 16, width: "max-content", transform: `translateX(${-x}px)` }}>
        {WELL_TABS.map((t) => (
          <div key={t} data-tab={t} style={{ padding: "9px 16px", borderRadius: 999, background: t === active ? C.muted : "transparent" }}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 16, color: t === active ? C.foreground : C.mutedFg, whiteSpace: "nowrap" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** DataTable's plain header cell. */
export const TH: React.CSSProperties = { ...LABEL, padding: "0 8px", display: "flex", alignItems: "center", whiteSpace: "nowrap", overflow: "hidden" };
/** `typography.tableCell`. */
export const TD: React.CSSProperties = { padding: "0 8px", fontFamily: SANS, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

/**
 * The page under the AppHeader: a viewport from the header's foot down, the
 * column inside it padded 20 on top (AppMain) and 26 at the sides.
 */
export function WellPageViewport({ children, columnStyle }: { children: React.ReactNode; columnStyle?: React.CSSProperties }) {
  return (
    <>
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10 }}>
        <AppHeader back />
      </div>
      <div style={{ position: "absolute", top: HEADER_H - 8, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <div style={{ padding: `20px ${PAD_X}px 40px`, display: "flex", flexDirection: "column", ...columnStyle }}>{children}</div>
      </div>
    </>
  );
}
