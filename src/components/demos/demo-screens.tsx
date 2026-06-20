/**
 * Coded, light-themed recreations of the WildcatIQ app for the landing-page
 * scroll showcase, one per demo frame. These are static mockups (no live data)
 * built to look like real screenshots of the app, which is light-themed while
 * the landing page around them is dark. Colors and chrome mirror the webapp:
 * Figtree (font-sans), neutral grayscale, charts in oil green / gas maroon /
 * water blue, the Orion accent #6b65ff.
 */

// App palette (approximate hex of the webapp's light-theme oklch tokens).
const INK = "#242424"; // foreground
const MUTE = "#8e8e8e"; // muted-foreground
const LINE = "#ebebeb"; // border
const ACCENT = "#6b65ff"; // Orion / data accent
const RED = "#d32f2f"; // destructive
const OIL = "#059669";
const GAS = "#800000";
const WATER = "#4169e1";

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white font-sans text-[13px] leading-snug text-[#242424]">
      {children}
    </div>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l2.1 7.4L21 12l-6.9 2.6L12 22l-2.1-7.4L3 12l6.9-2.6z" />
    </svg>
  );
}

function OrionHeader({ badge }: { badge: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 border-b px-3.5 py-2.5"
      style={{ borderColor: LINE }}
    >
      <Sparkle className="h-3.5 w-3.5" />
      <span className="font-medium" style={{ color: INK }}>
        Orion
      </span>
      <span
        className="rounded-full px-1.5 py-0.5 text-[10px]"
        style={{ background: "#f5f5f5", color: MUTE }}
      >
        {badge}
      </span>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[82%] rounded-2xl px-3 py-1.5 text-[12px] text-white"
        style={{ background: INK }}
      >
        {children}
      </div>
    </div>
  );
}

function BotBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[88%] rounded-2xl px-3 py-1.5 text-[12px] leading-relaxed"
        style={{ background: "#f5f5f5", color: INK }}
      >
        {children}
      </div>
    </div>
  );
}

function Composer() {
  return (
    <div className="shrink-0 px-3.5 pb-3">
      <div
        className="flex items-center justify-between rounded-lg border px-3 py-2 text-[12px]"
        style={{ borderColor: LINE, color: MUTE }}
      >
        <span>Ask Orion…</span>
        <span
          className="flex h-5 w-5 items-center justify-center rounded-md"
          style={{ background: INK }}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
            <path d="M3 11l18-8-8 18-2-7-8-3z" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// 1 -------------------------------------------------------------- Voice
function VoiceDemo() {
  return (
    <Screen>
      <OrionHeader badge="Voice" />
      <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-3.5 py-3">
        <UserBubble>How did the Johnson lease produce last month?</UserBubble>
        <BotBubble>
          The Johnson lease made <strong>4,210 bbl</strong> of oil and{" "}
          <strong>9.8 MMcf</strong> of gas in May, up about 6% from April. Water
          cut held steady near 38%.
        </BotBubble>
      </div>
      <div
        className="flex shrink-0 items-center gap-2 border-t px-3.5 py-2.5"
        style={{ borderColor: LINE }}
      >
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full"
            style={{ background: ACCENT, opacity: 0.4 }}
          />
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" style={{ color: ACCENT }}>
            <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
            <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 18v3" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        <span className="text-[11px] font-medium" style={{ color: MUTE }}>
          Listening…
        </span>
      </div>
    </Screen>
  );
}

// 2 ------------------------------------------------------------ Well logs
function LogDemo() {
  const depths = ["9,600", "9,700", "9,800", "9,900", "10,000"];
  return (
    <Screen>
      <div
        className="flex shrink-0 items-center justify-between border-b px-3 py-1.5 text-[11px]"
        style={{ borderColor: LINE }}
      >
        <span className="font-medium" style={{ color: "#5a5a5a" }}>
          Smith #4 — triple combo.las
        </span>
        <span className="font-mono" style={{ color: MUTE }}>
          LAS well log
        </span>
      </div>
      <div
        className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-0.5 border-b px-3 py-1.5 text-[10px]"
        style={{ borderColor: LINE }}
      >
        {[
          ["Well", "Smith #4"],
          ["Field", "Midland"],
          ["API", "42-329-31021"],
          ["Interval", "9,600–10,020 ft"],
          ["Curves", "8"],
        ].map(([k, v]) => (
          <span key={k}>
            <span style={{ color: "#b3b3b3" }}>{k}: </span>
            <span className="font-medium" style={{ color: "#5a5a5a" }}>
              {v}
            </span>
          </span>
        ))}
      </div>
      <div className="relative flex-1 bg-white">
        <svg viewBox="0 0 320 210" preserveAspectRatio="none" className="h-full w-full">
          {/* depth grid */}
          {[8, 56, 104, 152, 200].map((y) => (
            <line key={y} x1="36" y1={y} x2="320" y2={y} stroke={LINE} strokeWidth="0.5" />
          ))}
          {/* track separators */}
          <line x1="36" y1="0" x2="36" y2="210" stroke={LINE} strokeWidth="1" />
          <line x1="180" y1="0" x2="180" y2="210" stroke={LINE} strokeWidth="1" />
          {/* pay zone highlight */}
          <rect x="36" y="96" width="284" height="26" fill={ACCENT} opacity="0.08" />
          <line x1="36" y1="96" x2="36" y2="122" stroke={ACCENT} strokeWidth="2" />
          {/* GR (green) */}
          <path
            d="M100 6 C 78 30, 124 48, 96 68 C 74 88, 120 108, 98 128 C 78 148, 122 168, 100 204"
            fill="none"
            stroke="#2e7d32"
            strokeWidth="1.4"
          />
          {/* caliper (brown dashed) */}
          <path
            d="M150 6 C 142 46, 158 86, 150 126 C 142 166, 158 186, 150 204"
            fill="none"
            stroke="#8d6e63"
            strokeWidth="1.1"
            strokeDasharray="4 3"
          />
          {/* resistivity (black) */}
          <path
            d="M225 6 C 205 28, 245 46, 222 66 C 200 86, 246 106, 224 126 C 204 146, 248 166, 226 204"
            fill="none"
            stroke="#111111"
            strokeWidth="1.4"
          />
          {/* second resistivity (red) */}
          <path
            d="M272 6 C 258 46, 284 86, 268 126 C 256 166, 284 186, 272 204"
            fill="none"
            stroke="#c62828"
            strokeWidth="1.1"
          />
          {depths.map((d, i) => (
            <text key={d} x="4" y={11 + i * 48} fontSize="7" fill={MUTE} fontFamily="monospace">
              {d}
            </text>
          ))}
        </svg>
        {/* Orion pay-zone callout */}
        <div
          className="absolute right-2 top-[40%] flex items-center gap-1 rounded-md border bg-white px-1.5 py-1 text-[10px] font-medium shadow-sm"
          style={{ borderColor: LINE, color: INK }}
        >
          <Sparkle className="h-2.5 w-2.5" />
          Likely pay · ~14% φ
        </div>
      </div>
    </Screen>
  );
}

function ChartLegend({ items }: { items: [string, string][] }) {
  return (
    <div className="flex items-center gap-2.5 text-[10px]" style={{ color: MUTE }}>
      {items.map(([color, label]) => (
        <span key={label} className="flex items-center gap-1">
          <span className="h-0.5 w-3 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function RangeTabs({ tabs, active }: { tabs: string[]; active: string }) {
  return (
    <div
      className="flex items-center gap-0.5 rounded-md p-0.5 text-[10px] font-medium"
      style={{ background: "#f5f5f5" }}
    >
      {tabs.map((t) => (
        <span
          key={t}
          className="rounded px-1.5 py-0.5"
          style={
            t === active
              ? { background: "#fff", color: INK, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }
              : { color: MUTE }
          }
        >
          {t}
        </span>
      ))}
    </div>
  );
}

// 3 ----------------------------------------------------------- Production
function ProductionDemo() {
  return (
    <Screen>
      <div
        className="flex shrink-0 items-start justify-between gap-3 border-b px-3.5 py-2.5"
        style={{ borderColor: LINE }}
      >
        <div>
          <div className="font-medium" style={{ color: INK }}>
            Production History
          </div>
          <div className="text-[11px]" style={{ color: MUTE }}>
            Last 90 days · daily readings
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ChartLegend
            items={[
              [OIL, "Oil"],
              [GAS, "Gas"],
              [WATER, "Water"],
            ]}
          />
          <RangeTabs tabs={["1M", "3M", "12M"]} active="3M" />
        </div>
      </div>
      <div className="relative flex flex-1 flex-col px-2 pb-1 pt-2">
        <svg viewBox="0 0 320 150" preserveAspectRatio="none" className="w-full flex-1">
          {[40, 75, 110].map((y) => (
            <line key={y} x1="8" y1={y} x2="312" y2={y} stroke={LINE} strokeWidth="0.6" />
          ))}
          <path
            d="M8 40 L40 38 L72 45 L104 35 L136 50 L168 45 L200 78 L232 70 L264 65 L296 60 L312 58"
            fill="none"
            stroke={OIL}
            strokeWidth="2"
          />
          <path
            d="M8 92 L40 90 L72 95 L104 88 L136 96 L168 92 L200 100 L232 96 L264 99 L296 95 L312 97"
            fill="none"
            stroke={GAS}
            strokeWidth="2"
          />
          <path
            d="M8 118 L40 116 L72 119 L104 115 L136 121 L168 117 L200 122 L232 118 L264 120 L296 117 L312 119"
            fill="none"
            stroke={WATER}
            strokeWidth="2"
          />
        </svg>
        <div className="mt-1 flex justify-between px-1 text-[9px]" style={{ color: MUTE }}>
          {["Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        <div
          className="absolute left-[55%] top-[44%] flex items-center gap-1 rounded-md border bg-white px-1.5 py-1 text-[10px] font-medium shadow-sm"
          style={{ borderColor: LINE, color: INK }}
        >
          <Sparkle className="h-2.5 w-2.5" />
          −7% · pump change
        </div>
      </div>
    </Screen>
  );
}

// 4 ------------------------------------------------------------ Paperwork
function PaperworkDemo() {
  return (
    <Screen>
      <OrionHeader badge="AI" />
      <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden px-3.5 py-3">
        <UserBubble>Pull up the lease on the Smith tract.</UserBubble>
        <BotBubble>Found it. Here’s the Smith tract lease — section 4 covers the royalty terms:</BotBubble>
        <div
          className="flex items-start gap-2 rounded-lg border p-2.5"
          style={{ borderColor: LINE }}
        >
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="#c62828" strokeWidth="1.6">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
          </svg>
          <div className="min-w-0">
            <div className="text-[12px] font-medium" style={{ color: INK }}>
              Smith Tract Lease.pdf
            </div>
            <div className="text-[10px]" style={{ color: MUTE }}>
              PDF · 14 pages
            </div>
            <div className="mt-1 text-[11px] leading-relaxed" style={{ color: "#5a5a5a" }}>
              §4 Royalties — lessor reserves a 3/16 (0.1875) royalty on all oil and
              gas produced and saved…
            </div>
          </div>
        </div>
      </div>
      <Composer />
    </Screen>
  );
}

// 5 -------------------------------------------------------------- Books
function BooksDemo() {
  return (
    <Screen>
      <div
        className="flex shrink-0 items-start justify-between gap-3 border-b px-3.5 py-2.5"
        style={{ borderColor: LINE }}
      >
        <div>
          <div className="font-medium" style={{ color: INK }}>
            Cash Flow
          </div>
          <div className="text-[11px]" style={{ color: MUTE }}>
            Monthly · all wells
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium"
            style={{ borderColor: LINE, color: "#5a5a5a" }}
          >
            Cash Flow
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
          <RangeTabs tabs={["6M", "12M", "All"]} active="12M" />
        </div>
      </div>
      <div className="relative flex flex-1 flex-col px-2 pb-1 pt-2">
        <svg viewBox="0 0 320 150" preserveAspectRatio="none" className="w-full flex-1">
          {/* y labels grid */}
          <line x1="40" y1="85" x2="312" y2="85" stroke={LINE} strokeWidth="1" strokeDasharray="3 3" />
          {/* positive (green) segments */}
          <path d="M40 58 L80 56 L120 66 L150 84" fill="none" stroke={OIL} strokeWidth="2" />
          <path d="M250 86 L286 60 L312 50" fill="none" stroke={OIL} strokeWidth="2" />
          {/* negative (red) segment */}
          <path d="M150 84 L186 102 L214 108 L250 86" fill="none" stroke={RED} strokeWidth="2" />
          <text x="6" y="36" fontSize="8" fill={MUTE} fontFamily="monospace">$40k</text>
          <text x="14" y="88" fontSize="8" fill={MUTE} fontFamily="monospace">$0</text>
          <text x="2" y="128" fontSize="8" fill={MUTE} fontFamily="monospace">−$20k</text>
        </svg>
        <div
          className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md border bg-white px-1.5 py-1 text-[10px] font-medium shadow-sm"
          style={{ borderColor: LINE, color: INK }}
        >
          <Sparkle className="h-2.5 w-2.5" />
          Henderson lease ≈ $18.4k/mo, up since March
        </div>
      </div>
    </Screen>
  );
}

// 6 ---------------------------------------------------------- Whole picture
function WholePictureDemo() {
  const rows: [string, string, string, string][] = [
    ["Smith #4", "14% φ", "3", "−$1,240"],
    ["Carter A2", "12% φ", "5", "−$870"],
    ["Doyle 11", "16% φ", "2", "−$2,110"],
  ];
  return (
    <Screen>
      <OrionHeader badge="AI" />
      <div className="flex flex-1 flex-col justify-center gap-2 overflow-hidden px-3.5 py-3">
        <UserBubble>
          Which wells logged good pay but are barely producing and losing money?
        </UserBubble>
        <BotBubble>Three worth a look:</BotBubble>
        <div className="overflow-hidden rounded-lg border" style={{ borderColor: LINE }}>
          <div
            className="grid grid-cols-[1.4fr_1fr_0.9fr_1fr] gap-2 px-2.5 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider"
            style={{ background: "#f8f8f8", color: MUTE }}
          >
            <span>Well</span>
            <span>Logged pay</span>
            <span className="text-right">Oil b/d</span>
            <span className="text-right">P/L</span>
          </div>
          {rows.map(([well, pay, oil, pl]) => (
            <div
              key={well}
              className="grid grid-cols-[1.4fr_1fr_0.9fr_1fr] gap-2 border-t px-2.5 py-1.5 text-[11px] tabular-nums"
              style={{ borderColor: LINE }}
            >
              <span className="font-medium" style={{ color: INK }}>
                {well}
              </span>
              <span style={{ color: "#5a5a5a" }}>{pay}</span>
              <span className="text-right" style={{ color: "#5a5a5a" }}>
                {oil}
              </span>
              <span className="text-right font-medium" style={{ color: RED }}>
                {pl}
              </span>
            </div>
          ))}
        </div>
        <div className="text-[10px]" style={{ color: MUTE }}>
          Cross-checked against your logs, production, and the ledger.
        </div>
      </div>
    </Screen>
  );
}

const SCREENS = [
  VoiceDemo,
  LogDemo,
  ProductionDemo,
  PaperworkDemo,
  BooksDemo,
  WholePictureDemo,
];

export function DemoScreen({ index }: { index: number }) {
  const Component = SCREENS[Math.max(0, Math.min(SCREENS.length - 1, index))];
  return <Component />;
}
