"use client";

/**
 * Smith 4's oil well tests on the pumper's phone, played on a loop: the Tests
 * tab, the latest test opened from its row, its Readings unfolded, and back.
 * Transcribed from mobile-background:
 * - src/components/wells/well-workspace.tsx (the Tests tab; a row press opens
 *   `WellTestEntry` as `editing`; see pumper-well-page.tsx for the page)
 * - src/components/wells/well-tests-table.tsx (Start 118, End 118, Isolation
 *   tank, Oil (bbl/d) 104, Rest (bbl/d) 104, Share 84, Water (bbl/hr) 116, the
 *   96pt actions cell with the Trash2 16; `minWidth` 840, so on a phone the
 *   table runs past the screen and is swiped sideways)
 * - src/components/wells/well-test-entry.tsx (title "Edit well test", the
 *   `TestSummary` header: rate at 1 dp over "bbl/24hr" and the share at 0 dp
 *   over "Allocation", 36 apart; Isolation tank, Other tanks, Start and End
 *   date and time; the `WindowReadings` footer, folded until tapped, newest
 *   first; CTA "Save test")
 * - src/components/ui/fullscreen-data-entry.tsx (list mode: content padding
 *   24 / 16, 32 above the header, 28 under it, rows 10 apart, mono label over
 *   a 14-padded muted card with a ChevronDown 16; the 48pt pill CTA in a
 *   8 / 24 / 16 slot; the delete X, ghost icon-sm in destructive, top right;
 *   in on a spring of 26 / 180 over a 260 ms scrim)
 * - src/hooks/use-well-tests.ts `spanDays` (the rate basis) and
 *   src/lib/well-test-window.ts `readingsInWindow`
 *
 * The tests and their gauges are pumper-fixture.ts's.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { formatFeetInches } from "@/lib/screens/mobile-fixture";
import { CONTROL_TANK, ISOLATION_TANK, pumperFixture, type PumperWellTest } from "@/lib/screens/pumper-fixture";
import { C, LABEL, PhoneFrame, SANS } from "../product/mobile/phone";
import { SheetTopBar } from "../product/mobile/form-shell";
import { springCurve, useStepLoop } from "../product/mobile/motion";
import { BORDER_FAINT, TD, TH, TabStrip, WellPageViewport, WellTop, formatVolume } from "./pumper-well-page";

const TANK_NAMES: Record<string, string> = { [ISOLATION_TANK.id]: ISOLATION_TANK.name, [CONTROL_TANK.id]: CONTROL_TANK.name };

/** format.ts `formatDate`. */
const formatDate = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));
/** format.ts `formatTime`. */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
/** format.ts `formatDateShort`: MM/DD/YY. */
const formatDateShort = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(2, 4)}`;
/** use-well-tests.ts `spanDays`. */
const spanDays = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

const rate = (total: number, t: PumperWellTest) => formatVolume(total / spanDays(t.startAt, t.endAt), 1);

const COLS = [
  { key: "start", header: "Start", w: 118, right: false },
  { key: "end", header: "End", w: 118, right: false },
  { key: "iso", header: "Isolation tank", w: 100, right: false },
  { key: "oil", header: "Oil (bbl/d)", w: 104, right: true },
  { key: "rest", header: "Rest (bbl/d)", w: 104, right: true },
  { key: "share", header: "Share", w: 84, right: true },
  { key: "water", header: "Water (bbl/hr)", w: 116, right: true },
] as const;
const GRID = `${COLS.map((c) => `${c.w}px`).join(" ")} 96px`;

function cellsOf(t: PumperWellTest): Record<(typeof COLS)[number]["key"], string> {
  return {
    start: formatDate(t.startAt),
    end: formatDate(t.endAt),
    iso: TANK_NAMES[t.isolationTankId],
    oil: rate(t.oilBbls, t),
    rest: rate(t.controlBbls, t),
    share: `${Math.round(t.frac * 100)}%`,
    // An oil test measures no water (that is the bucket test), so the app
    // prints its empty-cell dash here; the column sits past the screen's edge.
    water: "",
  };
}

function TestsTable({ tests }: { tests: PumperWellTest[] }) {
  return (
    <div style={{ marginTop: 16, marginRight: -26, overflow: "hidden" }}>
      <div style={{ width: 840 }}>
        <div style={{ height: 48, display: "grid", gridTemplateColumns: GRID, alignItems: "center", borderBottom: `0.5px solid ${BORDER_FAINT}` }}>
          {COLS.map((c) => (
            <span key={c.key} style={{ ...TH, justifyContent: c.right ? "flex-end" : "flex-start" }}>
              {c.header}
            </span>
          ))}
          <span />
        </div>
        {tests.map((t, i) => {
          const cells = cellsOf(t);
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: GRID, alignItems: "center", padding: "14px 0", borderTop: i > 0 ? `0.5px solid ${BORDER_FAINT}` : undefined }}>
              {COLS.map((c) => (
                <span key={c.key} style={{ ...TD, textAlign: c.right ? "right" : "left", fontWeight: c.key === "share" ? 500 : 400, fontVariantNumeric: "tabular-nums", color: C.foreground }}>
                  {cells[c.key]}
                </span>
              ))}
              <span style={{ padding: "0 8px", display: "flex", justifyContent: "flex-end" }}>
                <Trash2 size={16} color={C.mutedFg} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ padding: "0 4px" }}>
        <span style={LABEL}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 14, background: C.muted, borderRadius: 6 }}>
        <span style={{ fontWeight: 500, fontSize: 16, lineHeight: "22px", color: C.foreground, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        <ChevronDown size={16} color={C.mutedFg} style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}

function EditTestForm({ test, readingsOpen }: { test: PumperWellTest; readingsOpen: boolean }) {
  const days = spanDays(test.startAt, test.endAt);
  // readingsInWindow: newest first, isolation tank before control at one stamp.
  const order = [test.isolationTankId, ...test.controlTankIds];
  const readings = [...test.readings].sort((a, b) => b.date.localeCompare(a.date) || order.indexOf(a.tankId) - order.indexOf(b.tankId));
  const small: React.CSSProperties = { fontFamily: SANS, fontSize: 13, lineHeight: "18px" };

  // The list scrolls far enough to bring the unfolded readings above the CTA.
  const viewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  useLayoutEffect(() => {
    const view = viewRef.current;
    const list = listRef.current;
    setScroll(view && list && readingsOpen ? Math.max(0, list.offsetHeight - view.clientHeight) : 0);
  }, [readingsOpen]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.background }}>
      <SheetTopBar
        title="Edit well test"
        right={
          <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.destructive} />
          </div>
        }
      />
      <div ref={viewRef} style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div ref={listRef} style={{ padding: "16px 24px", transform: `translateY(${-scroll}px)`, transition: "transform 600ms cubic-bezier(0.45, 0, 0.25, 1)" }}>
          <div style={{ paddingTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* TestSummary */}
            <div style={{ display: "flex", justifyContent: "center", gap: 36, paddingBottom: 28 }}>
              {[
                { v: formatVolume(test.oilBbls / days, 1), l: "bbl/24hr" },
                { v: `${(test.frac * 100).toFixed(0)}%`, l: "Allocation" },
              ].map((s) => (
                <div key={s.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 18, fontVariantNumeric: "tabular-nums" }}>{s.v}</span>
                  <span style={LABEL}>{s.l}</span>
                </div>
              ))}
            </div>
            <Field label="Isolation tank" value={TANK_NAMES[test.isolationTankId]} />
            <Field label="Other tanks" value={test.controlTankIds.map((id) => TANK_NAMES[id]).join(", ")} />
            <Field label="Start date" value={formatDate(test.startAt)} />
            <Field label="Start time" value={formatTime(test.startAt.slice(11, 16))} />
            <Field label="End date" value={formatDate(test.endAt)} />
            <Field label="End time" value={formatTime(test.endAt.slice(11, 16))} />
            {/* WindowReadings */}
            <div style={{ paddingTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 4px" }}>
                <ChevronDown size={16} color={C.mutedFg} style={{ transform: readingsOpen ? undefined : "rotate(-90deg)" }} />
                <span style={{ ...small, color: C.mutedFg }}>Readings</span>
                <span style={{ ...small, color: C.tertiaryText }}>{readings.length}</span>
              </div>
              {readingsOpen
                ? readings.map((r) => (
                    <div key={`${r.tankId}:${r.date}`} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "10px 4px", borderTop: `0.5px solid ${C.border}` }}>
                      <span style={{ ...small, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{TANK_NAMES[r.tankId]}</span>
                      <span style={{ ...small, color: C.mutedFg, whiteSpace: "nowrap" }}>{`${formatDateShort(r.date)} · ${formatTime(r.time)}`}</span>
                      <span style={{ ...small, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{`${formatFeetInches(r.gauge)} · ${formatVolume(r.bbls)} bbl`}</span>
                    </div>
                  ))
                : null}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 24px 16px" }}>
        <div style={{ height: 48, marginTop: 4, borderRadius: 999, background: C.primary, color: C.primaryFg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 14 }}>Save test</div>
      </div>
      <div style={{ height: 18 }} />
    </div>
  );
}

const OPEN = springCurve({ damping: 26, stiffness: 180, mass: 1 });
const STEPS = [
  2600, // 0 the Tests tab
  OPEN.ms + 2000, // 1 the latest test opens in its form
  4600, // 2 Readings unfolded
  OPEN.ms + 600, // 3 back to the tab
] as const;

export function PumperWellTestsScreen() {
  const { tests } = pumperFixture();
  const step = useStepLoop(STEPS);
  const open = step === 1 || step === 2;

  // The page sits scrolled to the tab strip, measured.
  const stripRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState(0);
  useLayoutEffect(() => {
    if (stripRef.current) setPan(stripRef.current.offsetTop - 4);
  }, []);

  return (
    <PhoneFrame time="7:58">
      <WellPageViewport columnStyle={{ transform: `translateY(${-pan}px)` }}>
        <WellTop />
        <TabStrip active="Tests" stripRef={stripRef} />
        <TestsTable tests={tests} />
      </WellPageViewport>

      {/* FullscreenDataEntry over its scrim */}
      <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.50)", opacity: open ? 1 : 0, transition: `opacity 260ms ${open ? "ease-out" : "ease-in"}` }} />
        <div style={{ position: "absolute", inset: 0, transform: open ? "translateY(0)" : "translateY(105%)", transition: `transform ${OPEN.ms}ms ${OPEN.easing}` }}>
          <EditTestForm test={tests[0]} readingsOpen={step === 2} />
        </div>
      </div>
    </PhoneFrame>
  );
}
