"use client";

/**
 * Shared chrome for the product screens: a fixed-size design canvas scaled to
 * its container, plus the webapp's sidebar and top bar so each screen reads as
 * a real screenshot. Nav groups mirror the app's app-shared.tsx.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Sparkles,
  Compass,
  Files,
  StickyNote,
  Calendar,
  MessageSquare,
  FileText,
  Droplet,
  Waves,
  Workflow,
  Package,
  Radar,
  Landmark,
  Receipt,
  DollarSign,
  Users,
  BarChart3,
  ClipboardCheck,
  Bell,
  type LucideIcon,
} from "lucide-react";

// Webapp light-theme palette (approx hex of the oklch tokens).
export const INK = "#242424";
export const SUB = "#5a5a5a";
export const MUTE = "#8e8e8e";
export const FAINT = "#b3b3b3";
export const LINE = "#ececec";
export const PANEL = "#f6f6f7";
export const ACCENT = "#2563eb";
export const RED = "#d32f2f";
export const OIL = "#059669";
export const GAS = "#800000";
export const WATER = "#4169e1";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Renders children at a fixed design size, scaled to fill the container width. */
export function ScaledScreen({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / w);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className="w-full overflow-hidden bg-white" style={{ aspectRatio: `${w} / ${h}` }}>
      <div data-screen-canvas style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left", color: INK }}>
        {children}
      </div>
    </div>
  );
}

export type NavId =
  | "dashboard" | "orion" | "projects" | "files" | "notes" | "agenda" | "messages"
  | "leases" | "production" | "disposal" | "facilities" | "inventory" | "recon"
  | "revenue" | "invoices" | "prices" | "people" | "reports" | "filings";

const NAV: { group: string; items: { id: NavId; label: string; Icon: LucideIcon }[] }[] = [
  { group: "Workspace", items: [
    { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { id: "orion", label: "Orion", Icon: Sparkles },
    { id: "projects", label: "Projects", Icon: Compass },
    { id: "files", label: "Files", Icon: Files },
    { id: "notes", label: "Notes", Icon: StickyNote },
    { id: "agenda", label: "Agenda", Icon: Calendar },
    { id: "messages", label: "Messages", Icon: MessageSquare },
  ] },
  { group: "Operations", items: [
    { id: "leases", label: "Leases", Icon: FileText },
    { id: "production", label: "Production", Icon: Droplet },
    { id: "disposal", label: "Disposal", Icon: Waves },
    { id: "facilities", label: "Facilities", Icon: Workflow },
    { id: "inventory", label: "Inventory", Icon: Package },
    { id: "recon", label: "Recon", Icon: Radar },
  ] },
  { group: "Finance", items: [
    { id: "revenue", label: "Revenue", Icon: Landmark },
    { id: "invoices", label: "Invoices", Icon: Receipt },
    { id: "prices", label: "Prices", Icon: DollarSign },
  ] },
  { group: "Admin", items: [
    { id: "people", label: "People", Icon: Users },
    { id: "reports", label: "Reports", Icon: BarChart3 },
    { id: "filings", label: "Filings", Icon: ClipboardCheck },
  ] },
];

function Sidebar({ active }: { active: NavId }) {
  return (
    <div className="flex h-full w-[200px] shrink-0 flex-col border-r bg-white" style={{ borderColor: LINE }}>
      <div className="flex h-[48px] items-center gap-2 border-b px-4" style={{ borderColor: LINE }}>
        <Image src="/slim_normal.png" alt="" width={903} height={859} className="h-[14px] w-[14px] object-contain" />
        <span className="text-[14px] font-semibold tracking-tight">WildcatIQ</span>
      </div>
      <div className="flex-1 overflow-hidden px-2 py-1">
        {NAV.map((g) => (
          <div key={g.group} className="mb-0.5">
            <div className="px-2 pb-0.5 pt-1.5 text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: FAINT }}>
              {g.group}
            </div>
            {g.items.map(({ id, label, Icon }) => {
              const on = id === active;
              return (
                <div
                  key={id}
                  className="mb-px flex items-center gap-2 rounded-md px-2 py-[4px] text-[12px]"
                  style={{ background: on ? "#eeeef0" : "transparent", color: on ? INK : SUB, fontWeight: on ? 500 : 400 }}
                >
                  <Icon className="h-[14px] w-[14px]" style={{ color: on ? INK : MUTE }} strokeWidth={1.9} />
                  {label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopBar({ crumbs }: { crumbs: string[] }) {
  return (
    <div className="flex h-[48px] shrink-0 items-center justify-between border-b bg-white px-5" style={{ borderColor: LINE }}>
      <div className="flex items-center gap-1.5 text-[12.5px]">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5">
            {i > 0 && <span style={{ color: FAINT }}>/</span>}
            <span style={{ color: i === crumbs.length - 1 ? INK : MUTE, fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>{c}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-5 text-[11.5px]">
        <Quote label="WTI" price="$61.42" change="+0.8%" up />
        <Quote label="HH" price="$3.18" change="-1.2%" up={false} />
        <Bell className="h-[15px] w-[15px]" style={{ color: SUB }} strokeWidth={1.9} />
        <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: INK }}>
          HW
        </div>
      </div>
    </div>
  );
}

function Quote({ label, price, change, up }: { label: string; price: string; change: string; up: boolean }) {
  return (
    <div className="flex items-center gap-1.5 font-mono">
      <span style={{ color: MUTE }}>{label}</span>
      <span style={{ color: INK }}>{price}</span>
      <span style={{ color: up ? OIL : RED }}>{change}</span>
    </div>
  );
}

/** Full app frame at 1280 x 800. */
export function AppFrame({ active, crumbs, children }: { active: NavId; crumbs: string[]; children: ReactNode }) {
  return (
    <ScaledScreen w={1280} h={800}>
      <div className="flex h-full w-full">
        <Sidebar active={active} />
        <div className="flex min-w-0 flex-1 flex-col" style={{ background: "#fafafa" }}>
          <TopBar crumbs={crumbs} />
          <div className="min-h-0 flex-1 overflow-hidden p-5">{children}</div>
        </div>
      </div>
    </ScaledScreen>
  );
}

// ---------------------------------------------------------------- primitives

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-lg border bg-white ${className}`} style={{ borderColor: LINE, ...style }}>
      {children}
    </div>
  );
}

export function Stat({ label, value, unit, delta, up }: { label: string; value: string; unit?: string; delta?: string; up?: boolean }) {
  return (
    <Card className="p-3.5">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: MUTE }}>{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-mono text-[22px] font-medium tracking-tight">{value}</span>
        {unit && <span className="text-[11px]" style={{ color: MUTE }}>{unit}</span>}
      </div>
      {delta && (
        <div className="mt-1 font-mono text-[10.5px]" style={{ color: up ? OIL : RED }}>{delta}</div>
      )}
    </Card>
  );
}

export function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2 text-[10px] font-semibold uppercase tracking-wider ${right ? "text-right" : "text-left"}`} style={{ color: MUTE }}>
      {children}
    </th>
  );
}

export function Td({ children, right, mono, strong }: { children: ReactNode; right?: boolean; mono?: boolean; strong?: boolean }) {
  return (
    <td className={`px-3 py-[7px] text-[12px] ${right ? "text-right" : "text-left"} ${mono ? "font-mono" : ""}`} style={{ color: strong ? INK : SUB, fontWeight: strong ? 500 : 400 }}>
      {children}
    </td>
  );
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "info" }) {
  const map = {
    neutral: { bg: "#f0f0f1", fg: SUB },
    ok: { bg: "#e6f6ef", fg: OIL },
    warn: { bg: "#fff4e0", fg: "#b45309" },
    info: { bg: "#e8effd", fg: ACCENT },
  }[tone];
  return (
    <span className="rounded-full px-2 py-[2px] text-[10px] font-medium" style={{ background: map.bg, color: map.fg }}>
      {children}
    </span>
  );
}

export function Button({ children, primary, small }: { children: ReactNode; primary?: boolean; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${small ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[12px]"}`}
      style={primary ? { background: INK, borderColor: INK, color: "#fff" } : { background: "#fff", borderColor: "#d9d9dc", color: INK }}
    >
      {children}
    </span>
  );
}

export function Tabs({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="flex items-center gap-4 border-b text-[12px]" style={{ borderColor: LINE }}>
      {items.map((t) => (
        <div key={t} className="pb-2" style={{ color: t === active ? INK : MUTE, fontWeight: t === active ? 500 : 400, borderBottom: t === active ? `1.5px solid ${INK}` : "1.5px solid transparent", marginBottom: -1 }}>
          {t}
        </div>
      ))}
    </div>
  );
}

/** Simple polyline chart. Values are normalized into the box. */
export function LineChart({ series, w, h, labels }: { series: { values: number[]; color: string; dashed?: boolean }[]; w: number; h: number; labels?: string[] }) {
  const all = series.flatMap((s) => s.values);
  const min = Math.min(...all) * 0.9;
  const max = Math.max(...all) * 1.05;
  const padL = 36;
  const padB = labels ? 18 : 6;
  const x = (i: number, n: number) => padL + (i / (n - 1)) * (w - padL - 8);
  const y = (v: number) => 6 + (1 - (v - min) / (max - min)) * (h - padB - 10);
  const ticks = 4;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const v = min + ((max - min) * i) / ticks;
        const yy = y(v);
        return (
          <g key={i}>
            <line x1={padL} x2={w - 8} y1={yy} y2={yy} stroke={LINE} />
            <text x={padL - 6} y={yy + 3} fontSize="9" textAnchor="end" fill={FAINT} fontFamily="ui-monospace, monospace">
              {Math.round(v)}
            </text>
          </g>
        );
      })}
      {labels?.map((l, i) => (
        <text key={l + i} x={x(i, labels.length)} y={h - 4} fontSize="9" textAnchor="middle" fill={FAINT}>
          {l}
        </text>
      ))}
      {series.map((s, k) => (
        <polyline
          key={k}
          fill="none"
          stroke={s.color}
          strokeWidth="2"
          strokeDasharray={s.dashed ? "4 4" : undefined}
          strokeLinejoin="round"
          points={s.values.map((v, i) => `${x(i, s.values.length)},${y(v)}`).join(" ")}
        />
      ))}
    </svg>
  );
}
