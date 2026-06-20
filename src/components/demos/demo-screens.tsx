"use client";

/**
 * Animated, light-themed demo clips for the landing-page scroll showcase.
 *
 * The shell is RESPONSIVE to the clip size (via the `compact` prop):
 *  - Large (the big pre-dock screen): renders the FULL app — sidebar + top bar
 *    + content — so it reads as a real product screenshot.
 *  - Compact (once docked small): drops the sidebar/top bar and zooms into just
 *    the feature with large type, so it stays legible at a small size.
 *
 * The demo CONTENT is shared between both; only the chrome and the design canvas
 * change. The app is light; the landing around it is dark.
 */

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Files,
  Sparkles,
  Droplet,
  Compass,
  Package,
  ListTodo,
  Calendar,
  Users,
  Calculator,
  BarChart3,
  DollarSign,
  Settings,
  PanelLeft,
  Mic,
  AudioLines,
  Loader2,
  Send,
  FileText,
  X,
  type LucideIcon,
} from "lucide-react";

// Webapp light-theme palette (approx hex of the oklch tokens).
const INK = "#242424";
const SUB = "#5a5a5a";
const MUTE = "#8e8e8e";
const FAINT = "#b3b3b3";
const LINE = "#ececec";
const ACCENT = "#2563eb"; // Orion accent (the blue mic in the app)
const RED = "#d32f2f";
const OIL = "#059669";
const GAS = "#800000";
const WATER = "#4169e1";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Renders children at a fixed design size, scaled to fill the container. */
function ScaledScreen({ w, h, children }: { w: number; h: number; children: ReactNode }) {
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
    <div ref={ref} className="h-full w-full overflow-hidden bg-white">
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}

/** Looping step counter. */
function useLoop(steps: number, ms: number): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % steps), ms);
    return () => clearInterval(id);
  }, [steps, ms]);
  return step;
}

/**
 * Like useLoop but each phase has its own duration. Lets the opening "empty"
 * beat be short (so the first frame appears quickly on scroll-in) while a later
 * phase can hold for a long read. `durations` must be a stable (module-level)
 * array.
 */
function usePhasedLoop(durations: readonly number[]): number {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setI((p) => (p + 1) % durations.length), durations[i]);
    return () => clearTimeout(id);
  }, [i, durations]);
  return i;
}

// ------------------------------------------------------------------ App shell
type NavId =
  | "home" | "files" | "orion" | "wells" | "projects" | "inventory"
  | "tasks" | "calendar" | "people" | "accounting" | "analytics"
  | "pricing" | "settings";

const NAV: { group: string; items: { id: NavId; label: string; Icon: LucideIcon }[] }[] = [
  { group: "Overview", items: [
    { id: "home", label: "Home", Icon: Home },
    { id: "files", label: "Files", Icon: Files },
    { id: "orion", label: "Orion", Icon: Sparkles },
  ] },
  { group: "Operations", items: [
    { id: "wells", label: "Wells", Icon: Droplet },
    { id: "projects", label: "Projects", Icon: Compass },
    { id: "inventory", label: "Inventory", Icon: Package },
    { id: "tasks", label: "Tasks", Icon: ListTodo },
    { id: "calendar", label: "Calendar", Icon: Calendar },
  ] },
  { group: "Business", items: [
    { id: "people", label: "People", Icon: Users },
    { id: "accounting", label: "Accounting", Icon: Calculator },
    { id: "analytics", label: "Analytics", Icon: BarChart3 },
    { id: "pricing", label: "Pricing", Icon: DollarSign },
  ] },
  { group: "Administration", items: [{ id: "settings", label: "Settings", Icon: Settings }] },
];

function Sidebar({ active }: { active: NavId }) {
  return (
    <div className="flex h-full w-[218px] shrink-0 flex-col border-r bg-white" style={{ borderColor: LINE }}>
      <div className="flex h-[52px] items-center gap-2 border-b px-4" style={{ borderColor: LINE }}>
        <Image src="/wildcat-logo.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        <span className="text-[15px] font-semibold tracking-tight">WildcatIQ</span>
      </div>
      <div className="flex-1 overflow-hidden px-2 py-1.5">
        {NAV.map((g) => (
          <div key={g.group} className="mb-0.5">
            <div className="px-2 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: FAINT }}>
              {g.group}
            </div>
            {g.items.map(({ id, label, Icon }) => {
              const on = id === active;
              return (
                <div
                  key={id}
                  className="mb-0.5 flex items-center gap-2 rounded-md px-2 py-[5px] text-[12.5px]"
                  style={{ background: on ? "#eeeef0" : "transparent", color: on ? INK : SUB, fontWeight: on ? 500 : 400 }}
                >
                  <Icon className="h-[15px] w-[15px]" style={{ color: on ? INK : MUTE }} strokeWidth={1.9} />
                  {label}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t px-4 py-2 text-[10px]" style={{ borderColor: LINE, color: FAINT }}>
        © 2026 Wildcat Labs, Inc.
      </div>
    </div>
  );
}

function Quote({ label, price, change, up }: { label: string; price: string; change: string; up: boolean }) {
  return (
    <span className="flex items-baseline gap-1 whitespace-nowrap text-[14px]">
      <span className="font-medium" style={{ color: MUTE }}>{label}</span>
      <span className="font-semibold tabular-nums" style={{ color: INK }}>{price}</span>
      <span className="tabular-nums" style={{ color: up ? "#16a34a" : "#dc2626" }}>{up ? "▲" : "▼"}{change}</span>
    </span>
  );
}

function TopBar({ icon: Icon, crumbs }: { icon?: LucideIcon; crumbs: string[] }) {
  return (
    <div className="flex h-[52px] shrink-0 items-center justify-between border-b px-3" style={{ borderColor: LINE }}>
      <div className="flex items-center gap-2.5">
        <PanelLeft className="h-[17px] w-[17px]" style={{ color: MUTE }} strokeWidth={1.8} />
        <span className="h-4 w-px" style={{ background: LINE }} />
        <div className="flex items-center gap-1.5 text-[13px]">
          {Icon && <Icon className="h-[15px] w-[15px]" style={{ color: SUB }} strokeWidth={1.9} />}
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: FAINT }}>/</span>}
              <span style={{ color: i === crumbs.length - 1 ? INK : MUTE, fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>{c}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Quote label="WTI" price="$76.54" change="0.9%" up />
        <Quote label="Nat Gas" price="$3.20" change="1.1%" up={false} />
        <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-white" style={{ borderColor: LINE }}>
          <Mic className="h-[15px] w-[15px]" style={{ color: ACCENT }} strokeWidth={1.9} />
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-white" style={{ borderColor: LINE }}>
          <Sparkles className="h-[15px] w-[15px]" style={{ color: SUB }} strokeWidth={1.9} />
        </span>
        <span className="mx-0.5 h-4 w-px" style={{ background: LINE }} />
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] leading-none" style={{ background: "#f1f1f1", color: MUTE }}>
          JI
        </span>
      </div>
    </div>
  );
}

function AppShell({
  active, icon, crumbs, children, drawer, compact,
}: {
  active: NavId;
  icon?: LucideIcon;
  crumbs: string[];
  children: ReactNode;
  drawer?: ReactNode;
  compact: boolean;
}) {
  if (compact) {
    return (
      <div className="flex h-full w-full bg-white font-sans" style={{ color: INK }}>
        <div className="min-w-0 flex-1">{children}</div>
        {drawer}
      </div>
    );
  }
  return (
    <div className="flex h-full w-full font-sans" style={{ color: INK }}>
      <Sidebar active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar icon={icon} crumbs={crumbs} />
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
          {drawer}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- Chat atoms
function ChatHeader({ badge }: { badge?: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b px-6 py-3.5" style={{ borderColor: LINE }}>
      <Sparkles className="h-[18px] w-[18px]" style={{ color: ACCENT }} strokeWidth={1.9} />
      <span className="text-[16px] font-medium">Orion</span>
      {badge && (
        <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "#f1f1f1", color: MUTE }}>{badge}</span>
      )}
    </div>
  );
}

function Bubble({ role, size = 15, wide, children }: { role: "user" | "bot"; size?: number; wide?: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`${wide ? "max-w-[97%]" : "max-w-[86%]"} rounded-2xl px-3.5 py-2 leading-relaxed`}
        style={{ fontSize: size, ...(role === "user" ? { background: INK, color: "#fff" } : { background: "#f3f3f3", color: INK }) }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function DrawerShell({ badge, children }: { badge: string; children: ReactNode }) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col border-l bg-white" style={{ borderColor: LINE }}>
      <div className="flex h-[46px] shrink-0 items-center gap-2 border-b px-4" style={{ borderColor: LINE }}>
        <Sparkles className="h-4 w-4" style={{ color: ACCENT }} strokeWidth={1.9} />
        <span className="text-[14px] font-medium">Orion</span>
        <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "#f1f1f1", color: MUTE }}>{badge}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 px-4 py-4">{children}</div>
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-[13px]" style={{ borderColor: LINE, color: MUTE }}>
          Ask Orion…
          <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: INK }}>
            <Send className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ 1. Voice
function VoiceComposer({ state }: { state: "listening" | "thinking" | "speaking" }) {
  const label = state === "listening" ? "Listening…" : state === "thinking" ? "Orion is thinking…" : "Speaking, talk to interrupt";
  return (
    <div className="px-6 pb-5">
      <div className="rounded-xl border bg-white" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2 px-4 pt-3">
          <span className="relative flex h-[18px] w-[18px] items-center justify-center">
            {state === "listening" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: ACCENT, opacity: 0.25 }} />
            )}
            {state === "thinking" ? (
              <Loader2 className="h-[17px] w-[17px] animate-spin" style={{ color: ACCENT }} />
            ) : state === "speaking" ? (
              <AudioLines className="h-[17px] w-[17px]" style={{ color: ACCENT }} strokeWidth={2} />
            ) : (
              <Mic className="h-[17px] w-[17px]" style={{ color: ACCENT }} strokeWidth={2} />
            )}
          </span>
          <span className="text-[13px] font-medium" style={{ color: MUTE }}>{label}</span>
        </div>
        <div className="flex items-center justify-between px-4 pb-3 pt-2.5">
          <span className="text-[15px]" style={{ color: MUTE }}>Speak, or type a message…</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: INK }}>
            <Send className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );
}

function VoiceDemo({ compact }: { compact: boolean }) {
  // Steps 0-4 reveal the conversation; the extra steps hold the finished
  // conversation on screen so there's time to read before it loops.
  const step = useLoop(9, 2000);
  return (
    <AppShell active="orion" icon={Sparkles} crumbs={["Orion"]} compact={compact}>
      <div className="flex h-full flex-col">
        {compact && <ChatHeader badge="Voice" />}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-5">
          <Bubble role="bot">
            Voice mode is on. Just start talking, or type below. I&apos;ll answer out loud and on screen.
          </Bubble>
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user">Hey Orion, how did the Johnson lease do last month?</Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot">
                The Johnson lease made about <strong>1,200 barrels</strong> of oil and <strong>250 Mcf</strong> of gas in May, up about 6% from April. That brought in about <strong>$92K</strong> in revenue and netted around <strong>$55K</strong> after lifting costs.
              </Bubble>
            )}
            {step >= 3 && (
              <Bubble key="q2" role="user">What equipment is downhole in the Johnson #2?</Bubble>
            )}
            {step >= 4 && (
              <Bubble key="a2" role="bot">
                The Johnson #2 has <strong>118</strong> ¾&quot; <strong>sucker rods</strong>, <strong>95 joints</strong> of 2⅜&quot; tubing, and a <strong>1½&quot; insert pump</strong> downhole. The pump was last changed in <strong>April 2025</strong>, about 14 months ago.
              </Bubble>
            )}
          </AnimatePresence>
        </div>
        <VoiceComposer
          state={
            step === 0 ? "listening" : step === 1 || step === 3 ? "thinking" : "speaking"
          }
        />
      </div>
    </AppShell>
  );
}

// ---------------------------------------------------------------- 2. Well log
function AnimatedPath(props: React.ComponentProps<typeof motion.path>) {
  return (
    <motion.path
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      {...props}
    />
  );
}

// Deterministic PRNG so the generated log curves are identical on server and
// client (stable hydration; no Math.random / Date).
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Horizontal value samples for a vertical well-log curve, in a 0..100 track box.
 * A tight, mean-reverting random walk (so the curve hugs a baseline) plus rare
 * larger excursions (the "spikes" a real log has) and fine per-foot jitter.
 */
function curveXs(seed: number, center: number, amp: number, n = 170): number[] {
  const rnd = mulberry32(seed);
  let base = 0;
  const xs: number[] = [];
  for (let i = 0; i <= n; i++) {
    base += (rnd() - 0.5) * 0.7;
    if (rnd() < 0.05) base += (rnd() - 0.5) * 2.4; // occasional bed/spike
    base *= 0.8; // pull back toward baseline
    const v = clamp(base + (rnd() - 0.5) * 0.45, -1.5, 1.5);
    xs.push(clamp(center + v * amp, 3, 97));
  }
  return xs;
}

// A second trace that shadows another (e.g. ILM tracking ILD) with small offset.
function shadowXs(xs: number[], seed: number, spread = 5): number[] {
  const rnd = mulberry32(seed);
  return xs.map((x) => clamp(x + (rnd() - 0.5) * spread, 3, 97));
}

// Build an SVG path from value samples across the 0..100 × 0..400 track box.
function pathFromXs(xs: number[]): string {
  const n = xs.length - 1;
  return `M${xs.map((x, i) => `${x.toFixed(1)} ${(2 + (i / n) * 396).toFixed(1)}`).join(" L ")}`;
}

// Per-curve samples for the three tracks (8 curves, matching the header legend).
const ILD_XS = curveXs(53, 48, 26);
const RHOB_XS = curveXs(101, 46, 24);
const LOG_PATHS = {
  cal: pathFromXs(curveXs(40, 28, 8)),
  gr: pathFromXs(curveXs(7, 50, 30)),
  sp: pathFromXs(curveXs(19, 64, 14)),
  ild: pathFromXs(ILD_XS),
  ilm: pathFromXs(shadowXs(ILD_XS, 91)),
  rhob: pathFromXs(RHOB_XS),
  nphi: pathFromXs(curveXs(67, 56, 22)),
  drho: pathFromXs(curveXs(23, 50, 6)),
} as const;

// Depth labels down the left axis, with the fractional y-position of each.
const DEPTHS = ["4,100", "4,150", "4,200", "4,250", "4,300"] as const;
const DEPTH_FR = [0.02, 0.255, 0.49, 0.725, 0.96] as const;

interface CurveSpec {
  name: string;
  unit: string;
  lo: string;
  hi: string;
  color: string;
  dashed?: boolean;
}
const TRACKS: { title: string; curves: CurveSpec[] }[] = [
  {
    title: "GR / SP / Caliper",
    curves: [
      { name: "CALI", unit: "IN", lo: "6", hi: "16", color: "#8d6e63", dashed: true },
      { name: "GR", unit: "GAPI", lo: "0", hi: "150", color: "#2e7d32" },
      { name: "SP", unit: "MV", lo: "-160", hi: "40", color: "#111111" },
    ],
  },
  {
    title: "Resistivity",
    curves: [
      { name: "ILD", unit: "OHMM", lo: "0.2", hi: "2k", color: "#111111" },
      { name: "ILM", unit: "OHMM", lo: "0.2", hi: "2k", color: "#c62828" },
    ],
  },
  {
    title: "Porosity / Lithology",
    curves: [
      { name: "RHOB", unit: "G/CC", lo: "1.95", hi: "2.95", color: "#c62828" },
      { name: "NPHI", unit: "V/V", lo: "0.45", hi: "-0.15", color: "#1565c0" },
      { name: "DRHO", unit: "G/CC", lo: "-0.25", hi: "0.25", color: "#9e9e9e", dashed: true },
    ],
  },
];

// One curve's scale legend (name above a colored sample line, lo/hi at the ends,
// unit below) — the distinctive header strip of a real LAS viewer.
function CurveScale({ name, unit, lo, hi, color, dashed }: CurveSpec) {
  return (
    <div className="mb-[3px] last:mb-0">
      <div className="text-center text-[8.5px] font-medium leading-none" style={{ color: INK }}>{name}</div>
      <div className="flex items-center gap-1 leading-none">
        <span className="text-[7.5px] tabular-nums" style={{ color: MUTE }}>{lo}</span>
        <span className="flex-1" style={{ borderTop: `1.5px ${dashed ? "dashed" : "solid"} ${color}` }} />
        <span className="text-[7.5px] tabular-nums" style={{ color: MUTE }}>{hi}</span>
      </div>
      <div className="text-center text-[7px] leading-none" style={{ color: FAINT }}>{unit}</div>
    </div>
  );
}

function TrackHead({ title, curves }: { title: string; curves: CurveSpec[] }) {
  return (
    <div className="min-w-0 flex-1 border-l" style={{ borderColor: LINE }}>
      <div className="border-b py-[3px] text-center text-[9px] font-semibold" style={{ borderColor: LINE, color: SUB, background: "#fafafa" }}>
        {title}
      </div>
      <div className="px-1.5 py-1">
        {curves.map((c) => <CurveScale key={c.name} {...c} />)}
      </div>
    </div>
  );
}

// A plotted track: faint graph-paper grid behind the curve(s).
function Track({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-w-0 flex-1 border-l" style={{ borderColor: LINE }}>
      <svg viewBox="0 0 100 400" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {[20, 40, 60, 80].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={400} stroke="#f3f3f3" strokeWidth={1} />
        ))}
        {Array.from({ length: 11 }, (_, i) => i * 40).map((y) => (
          <line key={y} x1={0} y1={y} x2={100} y2={y} stroke="#f3f3f3" strokeWidth={1} />
        ))}
        {children}
      </svg>
    </div>
  );
}

function Curve({ d, color, dashed }: { d: string; color: string; dashed?: boolean }) {
  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={1.1}
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      {...(dashed ? { strokeDasharray: "3 2.5" } : {})}
    />
  );
}

const LOG_PHASES = [500, 1500, 1900, 1900, 1900, 1900] as const;

function LogDemo({ compact }: { compact: boolean }) {
  const step = usePhasedLoop(LOG_PHASES); // 0 empty, 1 question, 2 answer, 3-5 hold
  const meta: [string, string][] = [
    ["Well", "Smith #4"],
    ["Field", "Graham"],
    ["Interval", "4,080 to 4,320 ft"],
    ["Curves", "8"],
  ];
  return (
    <AppShell
      active="files"
      icon={Files}
      crumbs={["Files", "Smith #4 logs", "triple-combo.las"]}
      compact={compact}
      drawer={
        <DrawerShell badge="AI">
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user" size={13}>Evaluate the prospective pays in this log.</Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot" size={13}>
                Two zones look prospective:
                <div className="mt-1.5 space-y-1.5">
                  <div>
                    <strong>4,180 to 4,230 ft</strong>: best pay. Low gamma, ~14% porosity. Primary target.
                  </div>
                  <div>
                    <strong>4,120 to 4,150 ft</strong>: clean sand, ~12% porosity. Secondary target.
                  </div>
                </div>
              </Bubble>
            )}
          </AnimatePresence>
        </DrawerShell>
      }
    >
      <div className="flex h-full flex-col bg-white">
        <div className="flex h-[46px] shrink-0 items-center justify-between border-b px-5 text-[13px]" style={{ borderColor: LINE }}>
          <span className="font-medium" style={{ color: SUB }}>triple-combo.las</span>
          <span className="font-mono" style={{ color: MUTE }}>LAS well log</span>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 border-b px-5 py-2 text-[12px]" style={{ borderColor: LINE }}>
          {meta.map(([k, v]) => (
            <span key={k}>
              <span style={{ color: FAINT }}>{k}: </span>
              <span className="font-medium" style={{ color: SUB }}>{v}</span>
            </span>
          ))}
        </div>
        {/* Track header band: track titles + per-curve scale legends */}
        <div className="flex shrink-0 border-b" style={{ borderColor: LINE }}>
          <div className="flex w-[46px] shrink-0 flex-col items-center justify-center">
            <span className="text-[9px] font-semibold" style={{ color: SUB }}>DEPT</span>
            <span className="text-[7px]" style={{ color: FAINT }}>F</span>
          </div>
          {TRACKS.map((t) => (
            <TrackHead key={t.title} title={t.title} curves={t.curves} />
          ))}
        </div>
        {/* Plot: depth axis + gridded tracks */}
        <div className="relative flex min-h-0 flex-1">
          <div className="relative w-[46px] shrink-0">
            {DEPTHS.map((d, i) => (
              <span
                key={d}
                className="absolute right-1.5 -translate-y-1/2 text-[8.5px] tabular-nums"
                style={{ top: `${DEPTH_FR[i] * 100}%`, color: MUTE, fontFamily: "monospace" }}
              >
                {d}
              </span>
            ))}
          </div>
          <Track>
            <Curve d={LOG_PATHS.cal} color="#8d6e63" dashed />
            <Curve d={LOG_PATHS.gr} color="#2e7d32" />
            <Curve d={LOG_PATHS.sp} color="#111111" />
          </Track>
          <Track>
            <Curve d={LOG_PATHS.ild} color="#111111" />
            <Curve d={LOG_PATHS.ilm} color="#c62828" />
          </Track>
          <Track>
            <Curve d={LOG_PATHS.rhob} color="#c62828" />
            <Curve d={LOG_PATHS.nphi} color="#1565c0" />
            <Curve d={LOG_PATHS.drho} color="#9e9e9e" dashed />
          </Track>
        </div>
      </div>
    </AppShell>
  );
}

// -------------------------------------------------- chart chrome
function ChartHeader({ title, subtitle, legend, tabs, active }: {
  title: string; subtitle: string; legend?: [string, string][]; tabs: string[]; active: string;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 border-b px-6 py-3.5" style={{ borderColor: LINE }}>
      <div>
        <div className="text-[17px] font-medium" style={{ color: INK }}>{title}</div>
        <div className="text-[13px]" style={{ color: MUTE }}>{subtitle}</div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {legend && (
          <div className="flex items-center gap-3.5 text-[12px]" style={{ color: MUTE }}>
            {legend.map(([c, l]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="h-[2px] w-3.5 rounded-full" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-0.5 rounded-md p-0.5 text-[12px] font-medium" style={{ background: "#f1f1f1" }}>
          {tabs.map((t) => (
            <span key={t} className="rounded px-2 py-0.5" style={t === active ? { background: "#fff", color: INK, boxShadow: "0 1px 2px rgba(0,0,0,.06)" } : { color: MUTE }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- 3. Production
// A single field of the "Add Production Data" form. `filled` shows its value;
// `active` is the one currently being typed (focus ring + caret).
function FormField({ label, value, filled, active }: { label: string; value: string; filled: boolean; active?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-medium" style={{ color: INK }}>{label}</span>
      <div
        className="flex h-9 items-center rounded-md border px-3 text-[13.5px]"
        style={{
          borderColor: active ? ACCENT : LINE,
          boxShadow: active ? `0 0 0 3px ${ACCENT}22` : "none",
          color: filled ? INK : FAINT,
        }}
      >
        {filled ? value : "0"}
        {active && <span className="ml-px inline-block h-[15px] w-px animate-pulse" style={{ background: ACCENT }} />}
      </div>
    </label>
  );
}

const PROD_FIELDS = [
  { label: "Oil Prod (in)", value: "18" },
  { label: "Oil Stock (in)", value: "47" },
  { label: "Oil Sales (in)", value: "147" },
  { label: "Gas (MCF/d)", value: "150" },
  { label: "Salt Water (bbl/d)", value: "26" },
] as const;

const SWIPE = [0.4, 0, 0.2, 1] as const;

// Production series: a monthly view (6 months on the axis) plotted at daily
// frequency — one logged reading per day, so the line shows day-by-day logging.
// Seeded (mulberry32) so the jitter is identical on server and client — no
// Math.random/Date, stable hydration.
const PROD_DAYS = 180;
const PUMP_CHANGE_DAY = 162; // ~Jun 12 within the 6-month window

function buildDailySeries(
  seed: number,
  valueAt: (i: number) => number,
  jitterAmp: number,
): { d: string; pts: { x: number; y: number }[] } {
  const rnd = mulberry32(seed);
  const pts = Array.from({ length: PROD_DAYS }, (_, i) => {
    const x = 10 + (580 * i) / (PROD_DAYS - 1);
    const y = valueAt(i) + (rnd() - 0.5) * jitterAmp;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  return { d, pts };
}

// Oil drifts down gently, then steps ~7% lower at the pump change; gas and water
// stay roughly flat. Higher y = lower production (SVG y grows downward).
const OIL_DAILY = buildDailySeries(
  7,
  (i) => (i < PUMP_CHANGE_DAY ? 62 + i * 0.06 : 90 + (i - PUMP_CHANGE_DAY) * 0.1),
  8,
);
const GAS_DAILY = buildDailySeries(13, () => 150, 7);
const WATER_DAILY = buildDailySeries(21, () => 194, 5);
const PROD_MONTH_TICKS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;

function ProductionDemo({ compact }: { compact: boolean }) {
  // 0..4 fill the five numeric fields, 5 linger (all filled), 6 submit,
  // 7..10 chart shown (lines draw, insight, then hold).
  const tick = useLoop(11, 950);
  const showForm = tick <= 6;
  const px = compact ? "px-5" : "px-8";
  const clipId = useId(); // unique reveal-clip id (stable across SSR/client)

  return (
    <div className="relative h-full w-full overflow-hidden bg-white font-sans" style={{ color: INK }}>
      {/* Chart layer — revealed once the form swipes down */}
      <AnimatePresence>
        {!showForm && (
          <motion.div
            key="chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col"
          >
            <div className={`flex shrink-0 items-center justify-between border-b py-3.5 ${px}`} style={{ borderColor: LINE }}>
              <div>
                <div className="text-[17px] font-medium">Production History</div>
                <div className="text-[13px]" style={{ color: MUTE }}>Smith #4 · last 6 months, daily readings</div>
              </div>
              <div className="flex items-center gap-3.5 text-[12px]" style={{ color: MUTE }}>
                {([[OIL, "Oil"], [GAS, "Gas"], [WATER, "Water"]] as [string, string][]).map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className="h-[2px] w-3.5 rounded-full" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <div className={`relative flex min-h-0 flex-1 flex-col pb-3 pt-4 ${px}`}>
              <svg viewBox="0 0 600 240" preserveAspectRatio="none" className="w-full flex-1">
                {[60, 120, 180].map((y) => (
                  <line key={y} x1="10" y1={y} x2="590" y2={y} stroke={LINE} strokeWidth="0.7" />
                ))}
                {/* Month separators, aligned with the month labels below */}
                {[1, 2, 3, 4].map((k) => {
                  const x = 10 + (580 * k) / 5;
                  return <line key={`m${k}`} x1={x} y1="8" x2={x} y2="216" stroke={LINE} strokeWidth="0.5" opacity="0.55" />;
                })}
                {/* Static full-length lines (always reach the right edge),
                    revealed left-to-right by a clip that wipes open then holds
                    fully open — so the data animates in AND ends fully drawn. */}
                <defs>
                  <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                    <motion.rect
                      x="0"
                      y="0"
                      height="240"
                      initial={{ width: 0 }}
                      animate={{ width: 600 }}
                      transition={{ duration: 1.3, ease: "easeInOut" }}
                    />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${clipId})`}>
                  <path d={OIL_DAILY.d} fill="none" stroke={OIL} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <path d={GAS_DAILY.d} fill="none" stroke={GAS} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <path d={WATER_DAILY.d} fill="none" stroke={WATER} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </g>
              </svg>
              <div className="mt-1.5 flex justify-between text-[11px]" style={{ color: MUTE }}>
                {PROD_MONTH_TICKS.map((m) => <span key={m}>{m}</span>)}
              </div>
              {tick >= 9 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-[52%] top-[44%] flex items-center gap-1.5 rounded-md border bg-white px-2.5 py-1.5 text-[13px] font-medium shadow-sm"
                  style={{ borderColor: LINE, color: INK }}
                >
                  <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} strokeWidth={1.9} />
                  Oil down 7% after the Jun 12 pump change
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form layer — the Add Production Data modal, full-bleed; swipes down on submit */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: SWIPE }}
            className="absolute inset-0 flex flex-col bg-white"
          >
            <div className={`flex shrink-0 items-center justify-between gap-4 border-b py-3 ${px}`} style={{ borderColor: LINE }}>
              <h2 className="text-[16px] font-semibold tracking-tight">Add Production Data</h2>
              <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ color: MUTE }}>
                <X className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </span>
            </div>
            <div className={`flex flex-1 flex-col justify-center gap-3 py-3 ${px}`}>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Date" value="2026-06-20" filled />
                <FormField label="Time" value="08:15" filled />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PROD_FIELDS.map((f, i) => (
                  <FormField key={f.label} label={f.label} value={f.value} filled={tick >= i} active={tick === i} />
                ))}
              </div>
            </div>
            <div className={`flex items-center justify-end gap-2 py-3 ${px}`}>
              <span className="rounded-md border px-4 py-2 text-[14px] font-medium" style={{ borderColor: LINE, color: SUB }}>Cancel</span>
              <motion.span
                className="rounded-md px-4 py-2 text-[14px] font-medium text-white"
                style={{ background: INK }}
                animate={tick === 6 ? { scale: 0.96, boxShadow: `0 0 0 3px ${ACCENT}44` } : { scale: 1, boxShadow: "0 0 0 0px transparent" }}
                transition={{ duration: 0.2 }}
              >
                Add Data
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --------------------------------------------------------------- 4. Documents
// Short opening beat, then question, then a long hold so the answer is readable.
const PAPER_PHASES = [500, 1500, 1700, 1700, 1700, 1700, 1700] as const;

function PaperworkDemo({ compact }: { compact: boolean }) {
  const step = usePhasedLoop(PAPER_PHASES); // 0 empty, 1 question, 2 answer, 3-6 hold
  return (
    <AppShell active="files" icon={Files} crumbs={["Files"]} compact={compact}>
      <div className="flex h-full flex-col">
        {compact && <ChatHeader badge="AI" />}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-6 py-4">
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user" size={14}>
                <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px]" style={{ background: "rgba(255,255,255,0.16)" }}>
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />Smith Tract Lease.pdf
                </span>
                <div>What are the key terms?</div>
              </Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot" size={14} wide>
                The Smith Tract lease carries a 3/16 royalty on 160 acres, with the primary term ending March 14, 2027. It has a depth-severed Pugh clause and a continuous-drilling requirement of a new well every 120 days. The last well was spudded 96 days ago, so you have about 24 days to drill or extend before acreage starts releasing. That deadline also lands a month before the offset-well obligation on the neighboring Carter lease.
              </Bubble>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

// ------------------------------------------------------------ 5. Accounting
const BOOKS_PHASES = [500, 1500, 1900, 1900, 1900, 1900, 1900, 1900] as const;

function BooksDemo({ compact }: { compact: boolean }) {
  const step = usePhasedLoop(BOOKS_PHASES); // 0 empty, 1 question, 2 answer, 3-7 hold
  return (
    <AppShell
      active="accounting"
      icon={Calculator}
      crumbs={["Accounting"]}
      compact={compact}
      drawer={
        <DrawerShell badge="AI">
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user" size={13}>Over the last three months, which wells are losing money?</Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot" size={13}>
                Three are underwater the last three months. Doyle 11 is the worst at about -$2,100 a month, then Smith #4 at -$1,240 and Carter A2 at -$870. Doyle 11&apos;s slide is mostly rising saltwater-disposal cost since March.
              </Bubble>
            )}
          </AnimatePresence>
        </DrawerShell>
      }
    >
      <div className="flex h-full flex-col bg-white">
        <ChartHeader title="Cash Flow" subtitle="Monthly · all wells" tabs={["3M", "6M", "12M"]} active="3M" />
        <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-3 pt-4">
          <svg viewBox="0 0 600 240" preserveAspectRatio="none" className="w-full flex-1">
            <line x1="70" y1="140" x2="590" y2="140" stroke={LINE} strokeWidth="1" strokeDasharray="4 4" />
            <AnimatedPath d="M70 92 L150 88 L230 108 L286 138" fill="none" stroke={OIL} strokeWidth="2.6" />
            <AnimatedPath d="M286 138 L350 172 L410 182 L470 142" fill="none" stroke={RED} strokeWidth="2.6" />
            <AnimatedPath d="M470 142 L540 96 L590 80" fill="none" stroke={OIL} strokeWidth="2.6" />
            <text x="14" y="60" fontSize="13" fill={MUTE} fontFamily="monospace">$40k</text>
            <text x="30" y="144" fontSize="13" fill={MUTE} fontFamily="monospace">$0</text>
            <text x="6" y="212" fontSize="13" fill={MUTE} fontFamily="monospace">-$20k</text>
          </svg>
          <div className="mt-1.5 flex justify-between px-1 text-[11px]" style={{ color: MUTE }}>
            {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => <span key={m}>{m}</span>)}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ------------------------------------------------------------ 6. Whole picture
// well, current oil rate (low), uphole pay zone from the logs, porosity
const SYNTH_ROWS: [string, string, string, string][] = [
  ["Doyle 11", "2 b/d", "3,920-3,970 ft", "16%"],
  ["Smith #4", "3 b/d", "3,540-3,590 ft", "14%"],
  ["Carter A2", "5 b/d", "2,980-3,030 ft", "12%"],
];

const WHOLE_PHASES = [800, 1300, 2200, 1700, 1700, 1700, 1700] as const;

function WholePictureDemo({ compact }: { compact: boolean }) {
  const step = usePhasedLoop(WHOLE_PHASES); // 0 empty, 1 question, 2 thinking, 3 answer, 4-6 hold
  return (
    <AppShell active="orion" icon={Sparkles} crumbs={["Orion"]} compact={compact}>
      <div className="flex h-full flex-col">
        {compact && <ChatHeader />}
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-hidden px-6 py-5">
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user">Which wells with low existing production have potential pay zones up the hole?</Bubble>
            )}
            {step === 2 && (
              <motion.div key="t" exit={{ opacity: 0 }} className="flex flex-col gap-1">
                <span className="text-[14px]" style={{ color: MUTE }}>Orion is thinking…</span>
                {["get_production()", "read_well_logs()", "get_accounting_overview()"].map((t) => (
                  <span key={t} className="font-mono text-[12.5px]" style={{ color: `${MUTE}cc` }}>→ {t}</span>
                ))}
              </motion.div>
            )}
            {step >= 3 && (
              <Bubble key="a" role="bot">
                Cross-referenced production, the books, and each well&apos;s logs. Three low-rate, marginal wells have untested pay up the hole:
              </Bubble>
            )}
            {step >= 3 && (
              <motion.div
                key="tbl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-[460px] overflow-hidden rounded-lg border"
                style={{ borderColor: LINE }}
              >
                <div className="grid grid-cols-[1.1fr_0.8fr_1.5fr_0.6fr] gap-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider" style={{ background: "#f8f8f8", color: MUTE }}>
                  <span>Well</span><span>Oil now</span><span>Uphole pay</span><span className="text-right">φ</span>
                </div>
                {SYNTH_ROWS.map(([w, oilNow, zone, phi], i) => (
                  <motion.div
                    key={w}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.18 }}
                    className="grid grid-cols-[1.1fr_0.8fr_1.5fr_0.6fr] gap-2 border-t px-3 py-2 text-[14px] tabular-nums"
                    style={{ borderColor: LINE }}
                  >
                    <span className="font-medium" style={{ color: INK }}>{w}</span>
                    <span style={{ color: MUTE }}>{oilNow}</span>
                    <span style={{ color: INK }}>{zone}</span>
                    <span className="text-right" style={{ color: SUB }}>{phi}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

const SCREENS = [VoiceDemo, LogDemo, ProductionDemo, PaperworkDemo, BooksDemo, WholePictureDemo];

export function DemoScreen({ index, compact = true }: { index: number; compact?: boolean }) {
  const Component = SCREENS[Math.max(0, Math.min(SCREENS.length - 1, index))];
  const [w, h] = compact ? [720, 405] : [1040, 585];
  return (
    <ScaledScreen w={w} h={h}>
      <Component compact={compact} />
    </ScaledScreen>
  );
}
