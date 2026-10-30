"use client";

/**
 * Offline on the phone: the status bar's hollow signal bars, the offline label
 * under the header (src/components/shell/offline-banner.tsx, "Offline ·
 * showing saved data"), and pages opening one after another from the copy on
 * the device. The Smith lease page is a DOM transcription of
 * mobile-background app/(app)/leases/[lease]/index.tsx, which renders
 * src/components/leases/lease-facilities.tsx: the lease's title (pageTitle,
 * underlined because it opens the lease's own page) with the round black Add
 * facility button, the "Search this lease" field, then one group per kind in
 * the pumper's-round order (Oil Tanks, Saltwater Tanks, Gas Meters, Disposal
 * Wells, Tank Batteries, Producing Wells), each a `phoneList` table under
 * `PlainTableHeaders`: a plain 48pt header with a faint hairline, then name and
 * the row's "…". Page gutters are `useContentPadding` (26) and AppMain's 20pt
 * top gutter. The dashboard and Smith 4 pages are dashboard.tsx's and
 * comments.tsx's bodies.
 */
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { mobileAFixture } from "@/lib/screens/mobile-a-fixture";
import { LEASES } from "@/lib/screens/operator";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
import { AppHeader, C, LABEL, OfflineBanner, PhoneFrame, SANS } from "./phone";
import { DashboardBody } from "./dashboard";
import { Smith4Body } from "./comments";
import { useStepLoop } from "./motion";

/** table.tsx `borderFaint`: border at 50%. */
const BORDER_FAINT = `${C.border}80`;

function Group({ header, rows, pressed }: { header: string; rows: string[]; pressed?: string }) {
  return (
    <div style={{ borderRadius: 2.4, overflow: "hidden", background: C.card }}>
      <div style={{ height: 48, display: "flex", alignItems: "center", borderBottom: `0.5px solid ${BORDER_FAINT}` }}>
        <div style={{ padding: "0 8px", flex: 1 }}>
          <span style={LABEL}>{header}</span>
        </div>
      </div>
      {rows.map((name, i) => (
        <div key={name}>
          {i > 0 ? <div style={{ height: 0.5, background: BORDER_FAINT }} /> : null}
          <div style={{ display: "flex", alignItems: "center", padding: "14px 0", background: pressed === name ? C.muted : undefined, transition: "background 120ms ease" }}>
            <div style={{ flex: 1, minWidth: 0, padding: "0 8px" }}>
              <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 15, color: C.foreground, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{name}</span>
            </div>
            <div style={{ width: 48, padding: "0 8px", display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                <MoreHorizontal size={16} color={C.foreground} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The Smith lease page under the app header: title, search and the facility
 * groups. `pressed` holds a row in its pressed state; `scrollY` scrolls the list.
 */
export function SmithLeaseBody({ pressed, scrollY = 0 }: { pressed?: string; scrollY?: number }) {
  const f = mobileAFixture().smithFacilities;
  const groups: { header: string; rows: string[] }[] = [
    { header: "Oil Tanks", rows: f.oilTanks },
    { header: "Saltwater Tanks", rows: f.waterTanks },
    { header: "Gas Meters", rows: f.gasMeters },
    { header: "Disposal Wells", rows: f.swdWells },
    { header: "Tank Batteries", rows: f.batteries },
    { header: "Producing Wells", rows: f.wells },
  ].filter((g) => g.rows.length > 0);

  return (
    <div style={{ height: "100%", overflow: "hidden", padding: "20px 26px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, transform: `translateY(${-scrollY}px)`, transition: "transform 700ms cubic-bezier(0.25, 0.1, 0.25, 1)" }}>
        {/* ListPageHeader */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 24, letterSpacing: -0.4, color: C.foreground, textDecoration: "underline", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{LEASES.find((l) => l.id === "l-smith")!.name}</span>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Plus size={17} color="#ffffff" />
            </div>
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 10, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
              <Search size={16} color={C.mutedFg} />
            </div>
            <div style={{ width: "100%", height: 40, borderRadius: 6, border: `1px solid ${C.input}`, paddingLeft: 36, display: "flex", alignItems: "center", fontFamily: SANS, fontSize: 16, color: C.mutedFg }}>
              Search this lease
            </div>
          </div>
        </div>
        {/* PlainTableHeaders, groups 12 apart */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map((g) => (
            <Group key={g.header} header={g.header} rows={g.rows} pressed={pressed} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** The Smith lease page under the status bar: the app header over the body. The gauge hero opens its form from it. */
export function SmithLeasePage({ back = true }: { back?: boolean }) {
  return (
    // The header gives back metrics.headerStatusTrim (8) of the status-bar inset, as on every other screen
    <div style={{ position: "relative", marginTop: -8, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <AppHeader back={back} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <SmithLeaseBody />
      </div>
    </div>
  );
}

// The tour's beats.
const STEPS = [
  2600, // 0 the dashboard, offline
  300, // 1 the Smith row pressed
  1700, // 2 the Smith lease opens
  1000, // 3 scrolled to the wells
  300, // 4 Smith 4 pressed
  1500, // 5 the Smith 4 page opens
  2600, // 6 scrolled down to its production table
  450, // 7 fade, and round again
] as const;

/** react-navigation's iOS push: the new page in from the right, the old one a third of the way left. */
const PUSH = "transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1)";

/**
 * The phone with no signal, opening one page after another from what is on
 * the device: the dashboard, a tap on Smith into the lease, a scroll to the
 * wells, a tap on Smith 4 into the well, its chart and its production table. The offline label sits
 * under the header the whole way.
 */
export function LeaseOfflineScreen() {
  const step = useStepLoop(STEPS);
  const smith = dashboardFixture().leaseRows.find((r) => r.leaseId === "l-smith")!.key;
  const at = (open: number, covered: number): string =>
    step >= covered ? "translateX(-30%)" : step >= open ? "translateX(0)" : "translateX(100%)";
  const layer = (z: number, transform: string, dim: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    zIndex: z,
    background: C.background,
    transform,
    transition: step === 0 ? "none" : PUSH,
    boxShadow: z > 1 ? "-8px 0 24px rgba(0,0,0,0.06)" : undefined,
    filter: dim ? "brightness(0.96)" : undefined,
  });
  return (
    <PhoneFrame time="9:14" offline>
      <style>{"@keyframes wc-dash-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } } @keyframes wc-dash-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }"}</style>
      <div style={{ position: "relative", marginTop: -8, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", zIndex: 10 }}>
          <AppHeader back={step >= 2 && step <= 6} />
        </div>
        <OfflineBanner />
        {/* The pages start under the label rather than behind it, so it never sits on a title. */}
        <div style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden", marginTop: 27, opacity: step === 7 ? 0 : 1, transition: step === 7 ? "opacity 400ms ease" : "opacity 250ms ease" }}>
          <div style={layer(1, step >= 2 ? "translateX(-30%)" : "translateX(0)", step >= 2)}>
            <DashboardBody pressed={step === 1 ? smith : undefined} />
          </div>
          <div style={layer(2, at(2, 5), step >= 5)}>
            <SmithLeaseBody pressed={step === 4 ? "Smith 4" : undefined} scrollY={step >= 3 ? 440 : 0} />
          </div>
          <div style={layer(3, at(5, 99), false)}>
            <Smith4Body scrollY={step >= 6 ? 300 : 0} />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
