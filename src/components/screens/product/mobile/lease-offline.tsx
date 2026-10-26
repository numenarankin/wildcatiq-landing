"use client";

/**
 * The Smith lease on the phone with no signal and three changes waiting. A DOM
 * transcription of wildcat-phone app/(app)/leases/[lease]/index.tsx, which
 * renders src/components/leases/lease-facilities.tsx: the lease's title
 * (pageTitle, underlined because it opens the lease's own page) with the
 * round black Add facility button, the "Search this lease" field
 * (src/components/ui/list-page-header.tsx, src/components/ui/input.tsx
 * `SearchInput`), then one group per kind in the pumper's-round order the
 * component pushes them (Oil Tanks, Saltwater Tanks, Gas Meters, Disposal
 * Wells, Tank Batteries, Producing Wells). Each group is its section's own
 * table (tanks-table.tsx, meters-table.tsx, wells-table.tsx,
 * batteries-table.tsx) in `phoneList` mode under `PlainTableHeaders`
 * (src/components/ui/table.tsx): a plain 48pt header with a faint hairline,
 * then name + the row's "…" (facility-row-actions.tsx, a ghost icon-sm
 * MoreHorizontal). Page gutters are `useContentPadding` (26) and AppMain's 20pt
 * top gutter. The bar under the header is src/components/shell/offline-banner.tsx
 * reading src/lib/offline/sync-status.ts for offline with three pending.
 */
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { mobileAFixture } from "@/lib/screens/mobile-a-fixture";
import { mobileFixture } from "@/lib/screens/mobile-fixture";
import { LEASES } from "@/lib/screens/operator";
import { AppHeader, C, LABEL, OfflineBanner, PhoneFrame, SANS } from "./phone";

/** table.tsx `borderFaint`: border at 50%. */
const BORDER_FAINT = `${C.border}80`;

function Group({ header, rows }: { header: string; rows: string[] }) {
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
          <div style={{ display: "flex", alignItems: "center", padding: "14px 0" }}>
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

export function LeaseOfflineScreen() {
  const f = mobileAFixture().smithFacilities;
  const pending = mobileFixture().offline.pending;
  const groups: { header: string; rows: string[] }[] = [
    { header: "Oil Tanks", rows: f.oilTanks },
    { header: "Saltwater Tanks", rows: f.waterTanks },
    { header: "Gas Meters", rows: f.gasMeters },
    { header: "Disposal Wells", rows: f.swdWells },
    { header: "Tank Batteries", rows: f.batteries },
    { header: "Producing Wells", rows: f.wells },
  ].filter((g) => g.rows.length > 0);

  return (
    <PhoneFrame time="9:14" offline>
      <AppHeader back />
      <OfflineBanner state={{ online: false, pending, dead: 0, syncing: false }} />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "20px 26px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
              <Group key={g.header} header={g.header} rows={g.rows} />
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
