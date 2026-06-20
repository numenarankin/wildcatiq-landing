"use client";

/**
 * Animated, light-themed recreations of the WildcatIQ app for the landing-page
 * scroll showcase. Each demo renders the FULL app (sidebar + top bar + content,
 * plus the Orion drawer where relevant), scaled to fit the 16:9 frame, and
 * plays a looping user flow. The app is light; the landing around it is dark,
 * so these read as real product screenshots.
 *
 * Built at a fixed design size and scaled with a ResizeObserver so the whole UI
 * shrinks uniformly into whatever size the frame is.
 */

import {
  useEffect,
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
  Search,
  type LucideIcon,
} from "lucide-react";

// Webapp light-theme palette (approx hex of the oklch tokens).
const INK = "#242424";
const SUB = "#5a5a5a";
const MUTE = "#8e8e8e";
const FAINT = "#b3b3b3";
const LINE = "#ececec";
const SIDEBAR = "#ffffff"; // app overrides --sidebar to bg-background (white)
const ACCENT = "#6b65ff";
const RED = "#d32f2f";
const OIL = "#059669";
const GAS = "#800000";
const WATER = "#4169e1";

const DESIGN_W = 1040;
const DESIGN_H = 585;

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Renders children at a fixed design size, scaled to fill the container. */
function ScaledScreen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / DESIGN_W);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="h-full w-full overflow-hidden bg-white">
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Looping step counter that pauses when the tab is hidden. */
function useLoop(steps: number, ms: number): number {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % steps), ms);
    return () => clearInterval(id);
  }, [steps, ms]);
  return step;
}

// ---------------------------------------------------------------- App shell
type NavId =
  | "home"
  | "files"
  | "orion"
  | "wells"
  | "projects"
  | "inventory"
  | "tasks"
  | "calendar"
  | "people"
  | "accounting"
  | "analytics"
  | "pricing"
  | "settings";

const NAV: { group: string; items: { id: NavId; label: string; Icon: LucideIcon }[] }[] = [
  {
    group: "Overview",
    items: [
      { id: "home", label: "Home", Icon: Home },
      { id: "files", label: "Files", Icon: Files },
      { id: "orion", label: "Orion", Icon: Sparkles },
    ],
  },
  {
    group: "Operations",
    items: [
      { id: "wells", label: "Wells", Icon: Droplet },
      { id: "projects", label: "Projects", Icon: Compass },
      { id: "inventory", label: "Inventory", Icon: Package },
      { id: "tasks", label: "Tasks", Icon: ListTodo },
      { id: "calendar", label: "Calendar", Icon: Calendar },
    ],
  },
  {
    group: "Business",
    items: [
      { id: "people", label: "People", Icon: Users },
      { id: "accounting", label: "Accounting", Icon: Calculator },
      { id: "analytics", label: "Analytics", Icon: BarChart3 },
      { id: "pricing", label: "Pricing", Icon: DollarSign },
    ],
  },
  {
    group: "Administration",
    items: [{ id: "settings", label: "Settings", Icon: Settings }],
  },
];

function Sidebar({ active }: { active: NavId }) {
  return (
    <div
      className="flex h-full w-[218px] shrink-0 flex-col border-r"
      style={{ background: SIDEBAR, borderColor: LINE }}
    >
      <div className="flex h-[52px] items-center gap-2 border-b px-4" style={{ borderColor: LINE }}>
        <Image src="/wildcat-logo.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: INK }}>
          WildcatIQ
        </span>
      </div>
      <div className="flex-1 overflow-hidden px-2 py-1.5">
        {NAV.map((g) => (
          <div key={g.group} className="mb-0.5">
            <div
              className="px-2 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: FAINT }}
            >
              {g.group}
            </div>
            {g.items.map(({ id, label, Icon }) => {
              const on = id === active;
              return (
                <div
                  key={id}
                  className="mb-0.5 flex items-center gap-2 rounded-md px-2 py-[5px] text-[12.5px]"
                  style={{
                    background: on ? "#eeeef0" : "transparent",
                    color: on ? INK : SUB,
                    fontWeight: on ? 500 : 400,
                  }}
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
      <span className="font-medium" style={{ color: MUTE }}>
        {label}
      </span>
      <span className="font-semibold tabular-nums" style={{ color: INK }}>
        {price}
      </span>
      <span className="tabular-nums" style={{ color: up ? "#16a34a" : "#dc2626" }}>
        {up ? "▲" : "▼"}
        {change}
      </span>
    </span>
  );
}

function TopBar({ icon: Icon, crumbs }: { icon?: LucideIcon; crumbs: string[] }) {
  return (
    <div
      className="flex h-[52px] shrink-0 items-center justify-between border-b px-3"
      style={{ borderColor: LINE }}
    >
      <div className="flex items-center gap-2.5">
        <PanelLeft className="h-[17px] w-[17px]" style={{ color: MUTE }} strokeWidth={1.8} />
        <span className="h-4 w-px" style={{ background: LINE }} />
        <div className="flex items-center gap-1.5 text-[13px]">
          {Icon && <Icon className="h-[15px] w-[15px]" style={{ color: SUB }} strokeWidth={1.9} />}
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              {i > 0 && <span style={{ color: FAINT }}>/</span>}
              <span style={{ color: i === crumbs.length - 1 ? INK : MUTE, fontWeight: i === crumbs.length - 1 ? 500 : 400 }}>
                {c}
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Quote label="WTI" price="$76.54" change="0.9%" up />
        <Quote label="Nat Gas" price="$3.20" change="1.1%" up={false} />
        <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-white" style={{ borderColor: LINE }}>
          <Mic className="h-[15px] w-[15px]" style={{ color: "#2563eb" }} strokeWidth={1.9} />
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-white" style={{ borderColor: LINE }}>
          <Sparkles className="h-[15px] w-[15px]" style={{ color: SUB }} strokeWidth={1.9} />
        </span>
        <span className="mx-0.5 h-4 w-px" style={{ background: LINE }} />
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[12.5px] leading-none"
          style={{ background: "#f1f1f1", color: MUTE }}
        >
          JI
        </span>
      </div>
    </div>
  );
}

function AppShell({
  active,
  icon,
  crumbs,
  children,
  drawer,
}: {
  active: NavId;
  icon?: LucideIcon;
  crumbs: string[];
  children: ReactNode;
  drawer?: ReactNode;
}) {
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
function Bubble({ role, children }: { role: "user" | "bot"; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div
        className="max-w-[74%] rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed"
        style={
          role === "user"
            ? { background: INK, color: "#fff" }
            : { background: "#f5f5f5", color: INK }
        }
      >
        {children}
      </div>
    </motion.div>
  );
}

function DrawerShell({ badge, children }: { badge: string; children: ReactNode }) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col border-l" style={{ borderColor: LINE }}>
      <div className="flex h-[44px] items-center gap-2 border-b px-3.5" style={{ borderColor: LINE }}>
        <Sparkles className="h-4 w-4" style={{ color: ACCENT }} strokeWidth={1.9} />
        <span className="text-[13px] font-medium">Orion</span>
        <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: "#f5f5f5", color: MUTE }}>
          {badge}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 px-3.5 py-3">{children}</div>
      <div className="px-3.5 pb-3">
        <div
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-[12px]"
          style={{ borderColor: LINE, color: MUTE }}
        >
          Ask Orion…
          <span className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: INK }}>
            <Send className="h-3 w-3 text-white" strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );
}

function Thinking({ tools }: { tools?: string[] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-0.5">
      <span className="text-[12px]" style={{ color: MUTE }}>
        Orion is thinking…
      </span>
      {tools?.map((t) => (
        <span key={t} className="font-mono text-[11px]" style={{ color: `${MUTE}cc` }}>
          → {t}
        </span>
      ))}
    </motion.div>
  );
}

// ------------------------------------------------------------------ 1. Voice
function VoiceComposer({ state }: { state: "listening" | "thinking" | "speaking" }) {
  const label =
    state === "listening"
      ? "Listening…"
      : state === "thinking"
        ? "Orion is thinking…"
        : "Speaking, talk to interrupt";
  return (
    <div className="px-6 pb-5">
      <div className="rounded-xl border bg-white" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2 px-4 pt-2.5">
          <span className="relative flex h-4 w-4 items-center justify-center">
            {state === "listening" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "#2563eb", opacity: 0.25 }} />
            )}
            {state === "thinking" ? (
              <Loader2 className="h-[15px] w-[15px] animate-spin" style={{ color: "#2563eb" }} />
            ) : state === "speaking" ? (
              <AudioLines className="h-[15px] w-[15px]" style={{ color: "#2563eb" }} strokeWidth={2} />
            ) : (
              <Mic className="h-[15px] w-[15px]" style={{ color: "#2563eb" }} strokeWidth={2} />
            )}
          </span>
          <span className="text-[12px] font-medium" style={{ color: MUTE }}>
            {label}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 pb-3 pt-2">
          <span className="text-[13px]" style={{ color: MUTE }}>
            Speak, or type a message…
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: INK }}>
            <Send className="h-3.5 w-3.5 text-white" strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );
}

function VoiceDemo() {
  const step = useLoop(4, 2000); // 0 listen, 1 question, 2 answer, 3 hold
  return (
    <AppShell active="orion" icon={Sparkles} crumbs={["Orion"]}>
      <div className="flex h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-5">
          <Bubble role="bot">
            Voice mode is on. Just start talking, or type below. I&apos;ll answer
            out loud and on screen. Talk over me anytime to interrupt.
          </Bubble>
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user">
                Hey Orion, how did the Johnson lease do last month?
              </Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot">
                The Johnson lease made <strong>4,210 barrels</strong> of oil and{" "}
                <strong>9.8 MMcf</strong> of gas in May, up about 6% from April.
                Water cut held near 38%.
              </Bubble>
            )}
          </AnimatePresence>
        </div>
        <VoiceComposer state={step === 0 ? "listening" : step === 1 ? "thinking" : "speaking"} />
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

function LogDemo() {
  const step = useLoop(4, 1700);
  const meta: [string, string][] = [
    ["Well", "Smith #4"],
    ["Field", "Midland"],
    ["API", "42-329-31021"],
    ["Interval", "9,600 to 10,020 ft"],
    ["Curves", "8"],
  ];
  return (
    <AppShell
      active="files"
      icon={Files}
      crumbs={["Files", "Smith #4 logs", "triple-combo.las"]}
      drawer={
        <DrawerShell badge="AI">
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user">
                Where is the best pay on this log?
              </Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot">
                Best interval looks like <strong>9,820 to 9,870 ft</strong>: low gamma
                ray with about 14% porosity. Worth a closer look.
              </Bubble>
            )}
          </AnimatePresence>
        </DrawerShell>
      }
    >
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b px-3 py-2 text-[11px]" style={{ borderColor: LINE }}>
          <span className="font-medium" style={{ color: SUB }}>
            triple-combo.las
          </span>
          <span className="font-mono" style={{ color: MUTE }}>
            LAS well log
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b px-3 py-1.5 text-[10.5px]" style={{ borderColor: LINE }}>
          {meta.map(([k, v]) => (
            <span key={k}>
              <span style={{ color: FAINT }}>{k}: </span>
              <span className="font-medium" style={{ color: SUB }}>
                {v}
              </span>
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <svg viewBox="0 0 600 360" preserveAspectRatio="none" className="h-full w-full">
            {[8, 76, 144, 212, 280, 348].map((y) => (
              <line key={y} x1="60" y1={y} x2="600" y2={y} stroke={LINE} strokeWidth="0.6" />
            ))}
            <line x1="60" y1="0" x2="60" y2="360" stroke={LINE} strokeWidth="1" />
            <line x1="330" y1="0" x2="330" y2="360" stroke={LINE} strokeWidth="1" />
            {step >= 2 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                <rect x="60" y="176" width="540" height="44" fill={ACCENT} opacity="0.09" />
                <line x1="60" y1="176" x2="60" y2="220" stroke={ACCENT} strokeWidth="3" />
              </motion.g>
            )}
            <AnimatedPath
              d="M170 6 C 120 56, 220 96, 160 136 C 110 176, 220 216, 170 256 C 120 296, 220 326, 170 358"
              fill="none"
              stroke="#2e7d32"
              strokeWidth="1.6"
            />
            <AnimatedPath
              d="M270 6 C 250 86, 290 166, 270 246 C 252 306, 290 336, 270 358"
              fill="none"
              stroke="#8d6e63"
              strokeWidth="1.2"
              strokeDasharray="5 4"
            />
            <AnimatedPath
              d="M420 6 C 380 50, 470 92, 410 136 C 360 180, 470 222, 420 266 C 372 306, 472 332, 420 358"
              fill="none"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <AnimatedPath
              d="M510 6 C 492 86, 532 166, 510 246 C 494 306, 532 336, 510 358"
              fill="none"
              stroke="#c62828"
              strokeWidth="1.2"
            />
            {["9,600", "9,700", "9,800", "9,900", "10,000"].map((d, i) => (
              <text key={d} x="6" y={14 + i * 68} fontSize="11" fill={MUTE} fontFamily="monospace">
                {d}
              </text>
            ))}
          </svg>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-3 top-[46%] flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-medium shadow-sm"
              style={{ borderColor: LINE, color: INK }}
            >
              <Sparkles className="h-3 w-3" style={{ color: ACCENT }} strokeWidth={1.9} />
              Likely pay, ~14% porosity
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// -------------------------------------------------- shared chart chrome
function ChartHeader({
  title,
  subtitle,
  legend,
  tabs,
  active,
}: {
  title: string;
  subtitle: string;
  legend?: [string, string][];
  tabs: string[];
  active: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b px-5 py-3" style={{ borderColor: LINE }}>
      <div>
        <div className="text-[14px] font-medium" style={{ color: INK }}>
          {title}
        </div>
        <div className="text-[11.5px]" style={{ color: MUTE }}>
          {subtitle}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        {legend && (
          <div className="flex items-center gap-3 text-[10.5px]" style={{ color: MUTE }}>
            {legend.map(([c, l]) => (
              <span key={l} className="flex items-center gap-1">
                <span className="h-[2px] w-3 rounded-full" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-0.5 rounded-md p-0.5 text-[10.5px] font-medium" style={{ background: "#f5f5f5" }}>
          {tabs.map((t) => (
            <span
              key={t}
              className="rounded px-2 py-0.5"
              style={t === active ? { background: "#fff", color: INK, boxShadow: "0 1px 2px rgba(0,0,0,.06)" } : { color: MUTE }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------- 3. Production
function ProductionDemo() {
  const step = useLoop(4, 1700);
  return (
    <AppShell active="wells" icon={Droplet} crumbs={["Wells", "Smith #4"]}>
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-4 border-b px-5 pt-4 text-[13px]" style={{ borderColor: LINE }}>
          {["Production", "Comments", "Equipment", "Files", "Royalty"].map((t, i) => (
            <span
              key={t}
              className="pb-2"
              style={
                i === 0
                  ? { color: INK, fontWeight: 500, borderBottom: `2px solid ${INK}` }
                  : { color: MUTE }
              }
            >
              {t}
            </span>
          ))}
        </div>
        <ChartHeader
          title="Production History"
          subtitle="Last 90 days · daily readings"
          legend={[
            [OIL, "Oil"],
            [GAS, "Gas"],
            [WATER, "Water"],
          ]}
          tabs={["1M", "3M", "12M"]}
          active="3M"
        />
        <div className="relative flex flex-1 flex-col px-3 pb-2 pt-3">
          <svg viewBox="0 0 600 240" preserveAspectRatio="none" className="w-full flex-1">
            {[60, 120, 180].map((y) => (
              <line key={y} x1="10" y1={y} x2="590" y2={y} stroke={LINE} strokeWidth="0.7" />
            ))}
            <AnimatedPath d="M10 64 L74 60 L138 72 L202 56 L266 80 L330 72 L394 128 L458 112 L522 104 L590 96" fill="none" stroke={OIL} strokeWidth="2.4" />
            <AnimatedPath d="M10 150 L74 146 L138 154 L202 142 L266 156 L330 150 L394 164 L458 156 L522 160 L590 156" fill="none" stroke={GAS} strokeWidth="2.4" />
            <AnimatedPath d="M10 196 L74 192 L138 198 L202 190 L266 200 L330 194 L394 202 L458 196 L522 199 L590 196" fill="none" stroke={WATER} strokeWidth="2.4" />
          </svg>
          <div className="mt-1 flex justify-between px-1 text-[9.5px]" style={{ color: MUTE }}>
            {["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-[58%] top-[46%] flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-[11px] font-medium shadow-sm"
              style={{ borderColor: LINE, color: INK }}
            >
              <Sparkles className="h-3 w-3" style={{ color: ACCENT }} strokeWidth={1.9} />
              Oil down 7% after the Jun 12 pump change
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// --------------------------------------------------------------- 4. Paperwork
const FILES: [string, string, string][] = [
  ["Drilling AFE 2024.pdf", "PDF", "2 days ago"],
  ["Smith Tract Lease.pdf", "PDF", "Mar 4"],
  ["Johnson #2 well file.pdf", "PDF", "Feb 18"],
  ["Field notes.note", "NOTE", "Jan 30"],
  ["seismic-line-3.png", "IMAGE", "Jan 12"],
];

function PaperworkDemo() {
  const step = useLoop(4, 1700);
  const hit = step >= 2 ? 1 : -1; // highlight Smith Tract Lease row
  return (
    <AppShell
      active="files"
      icon={Files}
      crumbs={["Files"]}
      drawer={
        <DrawerShell badge="AI">
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user">
                Pull up the lease on the Smith tract.
              </Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot">
                Here it is. Section 4 covers the royalty terms: lessor reserves a
                3/16 (0.1875) royalty.
              </Bubble>
            )}
          </AnimatePresence>
        </DrawerShell>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b px-5 py-2.5" style={{ borderColor: LINE }}>
          <Search className="h-4 w-4" style={{ color: MUTE }} strokeWidth={1.8} />
          <span className="text-[13px]" style={{ color: MUTE }}>
            Search files
          </span>
        </div>
        <div className="px-2 py-1.5">
          <div className="grid grid-cols-[28px_1fr_90px_110px] gap-2 px-3 py-2 text-[11px] font-medium" style={{ color: MUTE }}>
            <span />
            <span>Name</span>
            <span>Type</span>
            <span>Modified</span>
          </div>
          {FILES.map(([name, type, mod], i) => (
            <motion.div
              key={name}
              animate={{ backgroundColor: i === hit ? "#efefff" : "rgba(255,255,255,0)" }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-[28px_1fr_90px_110px] items-center gap-2 rounded-md px-3 py-2 text-[12.5px]"
            >
              <FileText className="h-4 w-4" style={{ color: i === hit ? ACCENT : MUTE }} strokeWidth={1.7} />
              <span className="font-medium" style={{ color: INK }}>
                {name}
              </span>
              <span className="uppercase" style={{ color: MUTE }}>
                {type}
              </span>
              <span style={{ color: MUTE }}>{mod}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ------------------------------------------------------------------ 5. Books
function BooksDemo() {
  const step = useLoop(4, 1700);
  return (
    <AppShell
      active="accounting"
      icon={Calculator}
      crumbs={["Accounting"]}
      drawer={
        <DrawerShell badge="AI">
          <AnimatePresence>
            {step >= 1 && (
              <Bubble key="q" role="user">
                What is it costing me to run the Henderson lease?
              </Bubble>
            )}
            {step >= 2 && (
              <Bubble key="a" role="bot">
                About <strong>$18,400 a month</strong>, mostly $7,200 lifting and
                $5,900 saltwater disposal. It has climbed since March.
              </Bubble>
            )}
          </AnimatePresence>
        </DrawerShell>
      }
    >
      <div className="flex h-full flex-col">
        <ChartHeader title="Cash Flow" subtitle="Monthly · all wells" tabs={["6M", "12M", "All"]} active="12M" />
        <div className="relative flex flex-1 flex-col px-3 pb-2 pt-3">
          <svg viewBox="0 0 600 240" preserveAspectRatio="none" className="w-full flex-1">
            <line x1="70" y1="140" x2="590" y2="140" stroke={LINE} strokeWidth="1" strokeDasharray="4 4" />
            <AnimatedPath d="M70 92 L150 88 L230 108 L286 138" fill="none" stroke={OIL} strokeWidth="2.4" />
            <AnimatedPath d="M286 138 L350 172 L410 182 L470 142" fill="none" stroke={RED} strokeWidth="2.4" />
            <AnimatedPath d="M470 142 L540 96 L590 80" fill="none" stroke={OIL} strokeWidth="2.4" />
            <text x="18" y="60" fontSize="11" fill={MUTE} fontFamily="monospace">$40k</text>
            <text x="34" y="144" fontSize="11" fill={MUTE} fontFamily="monospace">$0</text>
            <text x="8" y="212" fontSize="11" fill={MUTE} fontFamily="monospace">-$20k</text>
          </svg>
          <div className="mt-1 flex justify-between px-1 text-[9.5px]" style={{ color: MUTE }}>
            {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ------------------------------------------------------------ 6. Whole picture
const SYNTH_ROWS: [string, string, string, string][] = [
  ["Smith #4", "14% φ", "3", "-$1,240"],
  ["Carter A2", "12% φ", "5", "-$870"],
  ["Doyle 11", "16% φ", "2", "-$2,110"],
];

function WholePictureDemo() {
  const step = useLoop(4, 1900); // 0 q, 1 thinking+tools, 2 answer+table, 3 hold
  return (
    <AppShell active="orion" icon={Sparkles} crumbs={["Orion"]}>
      <div className="flex h-full flex-col justify-center gap-2.5 px-8 py-5">
        <AnimatePresence>
          {step >= 0 && (
            <Bubble key="q" role="user">
              Which wells logged good pay but are barely producing and losing money?
            </Bubble>
          )}
          {step === 1 && (
            <motion.div key="t" exit={{ opacity: 0 }}>
              <Thinking tools={["list_wells()", "get_production()", "get_accounting_overview()"]} />
            </motion.div>
          )}
          {step >= 2 && (
            <Bubble key="a" role="bot">
              Three worth a look:
            </Bubble>
          )}
        </AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[480px] overflow-hidden rounded-lg border"
            style={{ borderColor: LINE }}
          >
            <div
              className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] gap-2 px-3 py-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider"
              style={{ background: "#f8f8f8", color: MUTE }}
            >
              <span>Well</span>
              <span>Logged pay</span>
              <span className="text-right">Oil b/d</span>
              <span className="text-right">P/L</span>
            </div>
            {SYNTH_ROWS.map(([w, pay, oil, pl], i) => (
              <motion.div
                key={w}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.18 }}
                className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr] gap-2 border-t px-3 py-1.5 text-[12px] tabular-nums"
                style={{ borderColor: LINE }}
              >
                <span className="font-medium" style={{ color: INK }}>
                  {w}
                </span>
                <span style={{ color: SUB }}>{pay}</span>
                <span className="text-right" style={{ color: SUB }}>
                  {oil}
                </span>
                <span className="text-right font-medium" style={{ color: RED }}>
                  {pl}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
        {step >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-[10.5px]" style={{ color: MUTE }}>
            Cross-checked against your logs, production, and the ledger.
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}

const SCREENS = [VoiceDemo, LogDemo, ProductionDemo, PaperworkDemo, BooksDemo, WholePictureDemo];

export function DemoScreen({ index }: { index: number }) {
  const Component = SCREENS[Math.max(0, Math.min(SCREENS.length - 1, index))];
  return (
    <ScaledScreen>
      <Component />
    </ScaledScreen>
  );
}
