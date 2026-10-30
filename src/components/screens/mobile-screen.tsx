"use client";

/**
 * The phone app's gauge entry form (mobile-background src/components/tanks/
 * tank-gauge-modal.tsx on src/components/ui/fullscreen-data-entry.tsx: Date,
 * Time and the sheet-opening Comments field under the hero),
 * transcribed from its StyleSheets into HTML at the same pixel values, and
 * played as a loop: the wheel sheet is open on the parked level, the pumper
 * spins it to the new stick, Done drops the sheet, Add Reading saves, the
 * form closes onto the Smith lease page it opened from, and the app-wide
 * SuccessSheet (success-sheet.tsx: blue ring sweep, tick, "Gauge saved" with
 * the tank and level, entry-flows.tsx:91) slides up over it; then the form
 * opens again and the loop restarts. Sheets move on slideup-sheet.tsx's
 * springs. Tokens are the phone's src/config/theme.ts.
 */
import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { ScaledScreen } from "./shell";
import { bbl2, formatFeetInches, mobileFixture } from "@/lib/screens/mobile-fixture";
import { useDemoActive, useDemoProgress } from "./demo-active";
import { springCurve } from "./product/mobile/motion";
import { SmithLeasePage } from "./product/mobile/lease-offline";
import { MONO, PHONE_FONTS, SANS } from "./product/mobile/phone";

/** slideup-sheet.tsx / fullscreen-data-entry.tsx: in on 26 / 180, out on 26 / 210 clamped. */
const SPRING_IN = springCurve({ damping: 26, stiffness: 180, mass: 1 });
const SPRING_OUT = springCurve({ damping: 26, stiffness: 210, mass: 1, overshootClamping: true });
const sheetMotion = (open: boolean) =>
  open ? `transform ${SPRING_IN.ms}ms ${SPRING_IN.easing}` : `transform ${SPRING_OUT.ms}ms ${SPRING_OUT.easing}`;
const scrimMotion = (open: boolean) =>
  open ? "opacity 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "opacity 200ms cubic-bezier(0.455, 0.03, 0.515, 0.955)";

const C = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  primary: "#171717",
  primaryFg: "#fafafa",
  muted: "#f5f5f5",
  mutedFg: "#737373",
  tertiaryText: "#737373",
  border: "#e5e5e5",
};

const LABEL: React.CSSProperties = {
  fontFamily: MONO,
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
  color: C.mutedFg,
};

// The loop's beats, in ms. Each phase has its own hold so the spin can be
// watched and the check can land before the form resets.
const PHASES = [900, 1500, 1500, 1800, 1800, 700, 3600, 1300, 1000] as const;
type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
// 0 sheet open, parked on yesterday's stick
// 1 feet wheel spun
// 2 inches wheel spun
// 3 fraction wheel spun, hero filled in
// 4 Done: sheet drops, the form shows the value
// 5 Add Reading pressed
// 6 saved: the form closes onto the lease page and the app-wide SuccessSheet
//   slides up over it (ring sweep, tick, caption)
// 7 success sheet drops, the lease page alone
// 8 the form opens again from the lease page, parked

function usePhase(): Phase {
  const [i, setI] = useState<Phase>(0);
  const active = useDemoActive();
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setI(((i + 1) % PHASES.length) as Phase), PHASES[i]);
    return () => clearTimeout(id);
  }, [active, i]);
  useDemoProgress(i, PHASES.length);
  return i;
}

// Smith T201 at 1.67 bbl/in: parked on yesterday's stick (EVENTS.smithGauge),
// spun to today's, with barrels and the change derived the way
// tank-gauge-modal.tsx derives them (gauge x bbl/in, `bbl2`). All from
// mobile-fixture.ts, which takes today's stick from the Smith wells' oil.
const FX = mobileFixture().gauge;
const toWheel = (p: { feet: number; inches: number; sixteenths: number }) => ({ ft: p.feet, in: p.inches, frac: Math.round(p.sixteenths / 4) });
const PARKED = toWheel(FX.parts.yesterday);
const TODAY = toWheel(FX.parts.today);
const FRACS = ["0", "1/4", "1/2", "3/4"];
const SUBLINE = `= ${bbl2(FX.today.bbl)} bbl (${FX.today.changeBbl < 0 ? "\u2212" : "+"}${bbl2(Math.abs(FX.today.changeBbl))} bbl)`;
const SAVED_DETAIL = `${FX.tank.name} · ${formatFeetInches(FX.today.inches)}`;
const DATE_LABEL = new Date(`${FX.today.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function FieldCard({ label, value, chevron = true, tall, placeholder }: { label: string; value: string; chevron?: boolean; tall?: boolean; placeholder?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
        <span style={LABEL}>{label}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: tall ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 14px",
          background: C.muted,
          borderRadius: 6,
          minHeight: tall ? 96 : undefined,
        }}
      >
        <span style={{ fontWeight: 500, fontSize: 16, lineHeight: "22px", color: placeholder ? C.tertiaryText : C.foreground, flexShrink: 1 }}>{value}</span>
        {chevron && <ChevronDown size={16} color={C.mutedFg} />}
      </div>
    </div>
  );
}

const ITEM_H = 40;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;

/** One column of the phone's WheelPicker, scrolled to `index` with the rows fading away from the centre. */
function WheelColumn({ options, index, width, spinning }: { options: string[]; index: number; width: number; spinning: boolean }) {
  const fade = (d: number) => (d <= 0 ? 1 : d === 1 ? 0.28 : d === 2 ? 0.12 : 0.05);
  return (
    <div style={{ width, height: WHEEL_H, overflow: "hidden" }}>
      <div
        style={{
          transform: `translateY(${(2 - index) * ITEM_H}px)`,
          transition: spinning ? "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      >
        {options.map((o, i) => (
          <div key={o} style={{ height: ITEM_H, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span
              style={{
                fontSize: 18,
                fontWeight: i === index ? 600 : 500,
                color: C.foreground,
                opacity: fade(Math.abs(i - index)),
                transition: spinning ? "opacity 1100ms ease" : "none",
              }}
            >
              {o}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The MeasurementWheel inside its WheelSheet, as it opens off the hero value. */
function GaugeSheet({ open, value, spinning }: { open: boolean; value: typeof TODAY; spinning: boolean }) {
  const feet = Array.from({ length: 41 }, (_, i) => String(i));
  const inches = Array.from({ length: 12 }, (_, i) => String(i));
  const header: React.CSSProperties = { ...LABEL, fontSize: 11, textAlign: "center" };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)", opacity: open ? 1 : 0, transition: scrimMotion(open) }} />
      <div
        style={{
          position: "relative",
          alignSelf: "center",
          width: "100%",
          maxWidth: 640,
          background: C.background,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: "8px 8px 0",
          boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: sheetMotion(open),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 16px" }}>
          <div style={{ width: 64, height: 6, borderRadius: 999, background: C.border, marginTop: 4 }} />
          <span style={{ ...LABEL, marginTop: 10, alignSelf: "stretch", padding: "0 16px" }}>Gauge</span>
        </div>
        <div style={{ padding: "0 12px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 4 }}>
              <span style={{ ...header, width: 56 }}>ft</span>
              <span style={{ ...header, width: 56 }}>in</span>
              <span style={{ ...header, width: 72 }}>frac</span>
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: (WHEEL_H - ITEM_H) / 2, height: ITEM_H, background: C.muted, borderRadius: 8 }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "center", gap: 12 }}>
                <WheelColumn options={feet} index={value.ft} width={56} spinning={spinning} />
                <WheelColumn options={inches} index={value.in} width={56} spinning={spinning} />
                <WheelColumn options={FRACS} index={value.frac} width={72} spinning={spinning} />
              </div>
            </div>
          </div>
          <div style={{ height: 52, borderRadius: 999, background: C.primary, color: C.primaryFg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 14 }}>
            Done
          </div>
          <div style={{ height: 34 }} />
        </div>
      </div>
    </div>
  );
}

// success-sheet.tsx: SIZE 64, stroke 64*5/72, ring from twelve o'clock, then
// the tick, then the caption rising. Delays and durations are the phone's.
const SZ = 64;
const STROKE = Math.round((SZ * 5) / 72 * 100) / 100;
const R = SZ / 2 - STROKE / 2;
const CIRC = 2 * Math.PI * R;
const TICK_PTS = [[22 / 72, 38 / 72], [33 / 72, 49 / 72], [51 / 72, 26 / 72]] as const;
const TICK = TICK_PTS.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(x * SZ).toFixed(2)} ${(y * SZ).toFixed(2)}`).join(" ");
const TICK_LEN = TICK_PTS.reduce((t, [x, y], i) => (i === 0 ? t : t + Math.hypot((x - TICK_PTS[i - 1][0]) * SZ, (y - TICK_PTS[i - 1][1]) * SZ)), 0);
const MARK = "#1a71ff";

function SuccessSheet({ open }: { open: boolean }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)", opacity: open ? 1 : 0, transition: scrimMotion(open) }} />
      <div
        style={{
          position: "relative",
          alignSelf: "center",
          width: "100%",
          maxWidth: 640,
          background: C.background,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: "8px 8px 0",
          boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: sheetMotion(open),
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 0 16px" }}>
          <div style={{ width: 64, height: 6, borderRadius: 999, background: C.border, marginTop: 4 }} />
        </div>
        {open && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "48px 24px 28px" }}>
            <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} fill="none" aria-hidden>
              <circle
                cx={SZ / 2}
                cy={SZ / 2}
                r={R}
                stroke={MARK}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC}
                transform={`rotate(-90 ${SZ / 2} ${SZ / 2})`}
                style={{ animation: "wc-ring 440ms cubic-bezier(0.33, 1, 0.68, 1) 120ms both" }}
              />
              <path
                d={TICK}
                stroke={MARK}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={TICK_LEN}
                strokeDashoffset={TICK_LEN}
                style={{ animation: "wc-tick 320ms cubic-bezier(0.33, 1, 0.68, 1) 380ms both" }}
              />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, animation: "wc-rise 260ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 440ms both" }}>
              <span style={{ fontWeight: 600, fontSize: 20, lineHeight: "28px", color: C.foreground }}>Gauge saved</span>
              <span style={{ fontSize: 16, lineHeight: "24px", color: C.mutedFg, textAlign: "center" }}>{SAVED_DETAIL}</span>
            </div>
            <div style={{ height: 36 }} />
          </div>
        )}
      </div>
    </div>
  );
}

function gaugeLabel(v: typeof TODAY): string {
  const frac = v.frac === 0 ? "" : ` ${FRACS[v.frac]}`;
  return `${v.ft}' ${v.in}${frac}"`;
}

export function MobileScreen() {
  const phase = usePhase();
  const sheetOpen = phase <= 3;
  // One finger: the feet wheel, then inches, then the fraction.
  const value = {
    ft: phase >= 1 && phase <= 6 ? TODAY.ft : PARKED.ft,
    in: phase >= 2 && phase <= 6 ? TODAY.in : PARKED.in,
    frac: phase >= 3 && phase <= 6 ? TODAY.frac : PARKED.frac,
  };
  const entered = phase >= 1 && phase <= 6;
  const pressed = phase === 5;
  const saved = phase === 6;
  const formOpen = phase !== 6 && phase !== 7;

  return (
    <div className="mx-auto w-full max-w-[290px] overflow-hidden rounded-[44px] border-[8px] border-neutral-900 bg-neutral-900 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
      <style>{PHONE_FONTS}</style>
      <style>{`@keyframes wc-ring { to { stroke-dashoffset: 0; } } @keyframes wc-tick { to { stroke-dashoffset: 0; } } @keyframes wc-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
      <div className="overflow-hidden rounded-[36px]">
        <ScaledScreen w={390} h={844}>
          <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", background: C.background, color: C.foreground, fontFamily: SANS, lineHeight: "normal" }}>
            {/* Behind the form: the Smith lease page it was opened from */}
            <div style={{ position: "absolute", top: 54, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column" }}>
              <SmithLeasePage back={false} />
            </div>
            {/* The fullscreen form, closing onto the lease page on save and opening from it again */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                paddingTop: 54,
                display: "flex",
                flexDirection: "column",
                background: C.background,
                transform: formOpen ? "translateY(0)" : "translateY(100%)",
                // fullscreen-data-entry.tsx opens and closes on the same 26 / 180 spring.
                transition: `transform ${SPRING_IN.ms}ms ${SPRING_IN.easing}`,
              }}
            >
            {/* topBar: height 56 under OVERLAY_TOP_GAP (8), title absolutely centred, back caret left */}
            <div style={{ position: "relative", marginTop: 8, height: 56, display: "flex", alignItems: "center", padding: "0 12px" }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>Add Gauge Reading</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 8px 6px 0" }}>
                <ChevronLeft size={26} color={C.foreground} />
              </div>
            </div>

            {/* HERO: entryArea flex 1, centred, gap 6. Grey while parked, black once entered. */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "0 24px" }}>
              <span style={LABEL}>Gauge</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 56, textAlign: "center", whiteSpace: "nowrap", color: entered ? C.foreground : C.mutedFg, transition: "color 300ms ease" }}>
                  {gaugeLabel(value)}
                </span>
              </div>
              <span style={{ fontSize: 14, lineHeight: "22px", color: C.mutedFg, fontVariantNumeric: "tabular-nums", opacity: phase >= 3 && phase <= 6 ? 1 : 0, transition: "opacity 300ms ease" }}>
                {SUBLINE}
              </span>
            </div>

            {/* bottomWrap */}
            <div style={{ padding: "8px 24px 16px", display: "flex", justifyContent: "center" }}>
              <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 10 }}>
                <FieldCard label="Date" value={DATE_LABEL} />
                <FieldCard label="Time" value={FX.today.time} />
                {/* Comments: a text field that opens in a sheet, so a tall card with no caret and "—" while empty */}
                <FieldCard label="Comments" value="—" chevron={false} tall />
                {/* heroSheetSlot: the wheel's reserved room when it opens in a sheet */}
                <div style={{ height: 120 }} />
                <div
                  style={{
                    height: 48,
                    marginTop: 4,
                    borderRadius: 999,
                    background: C.primary,
                    color: C.primaryFg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontWeight: 500,
                    fontSize: 14,
                    opacity: pressed ? 0.85 : 1,
                    transform: pressed ? "scale(0.98)" : "scale(1)",
                    transition: "opacity 120ms ease, transform 120ms ease",
                  }}
                >
                  Add Reading
                </div>
              </div>
            </div>
            {/* insets.bottom under the form */}
            <div style={{ height: 34 }} />
            </div>
            {/* OS status bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50, height: 54, display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 28px 6px", fontSize: 15, fontWeight: 600 }}>
              <span>7:41</span>
              <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill={C.foreground} aria-hidden><rect x="0" y="8" width="3" height="4" rx="0.5" /><rect x="5" y="5" width="3" height="7" rx="0.5" /><rect x="10" y="2.5" width="3" height="9.5" rx="0.5" /><rect x="15" y="0" width="3" height="12" rx="0.5" /></svg>
                <svg width="27" height="13" viewBox="0 0 27 13" fill="none" aria-hidden><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={C.foreground} opacity="0.35" /><rect x="2" y="2" width="20" height="9" rx="2" fill={C.foreground} /><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill={C.foreground} opacity="0.4" /></svg>
              </span>
            </div>

            {/* the home indicator, over everything */}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 40 }}>
              <div style={{ width: 134, height: 5, borderRadius: 3, background: C.foreground, opacity: 0.9 }} />
            </div>
            <GaugeSheet open={sheetOpen} value={value} spinning={phase >= 1 && phase <= 3} />
            <SuccessSheet open={saved} />
          </div>
        </ScaledScreen>
      </div>
    </div>
  );
}
