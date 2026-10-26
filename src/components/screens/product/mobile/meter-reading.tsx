"use client";

/**
 * Add Meter Reading on the phone, opened on Smith M1 the morning after its last
 * reading. A DOM transcription of wildcat-phone
 * src/components/meters/meter-reading-modal.tsx (the field list and labels) on
 * src/components/ui/fullscreen-data-entry.tsx in LIST mode (no hero: rows 10
 * apart in a 480 column, content padding 24 / 16 with 32 on top, the pinned
 * 48pt CTA), seeded by src/lib/meter-reading-form.ts `seedForm`: a new reading
 * carries yesterday's volume, the flow rate and the four config figures from
 * the previous reading, and leaves the cumulative counter blank with the last
 * index greyed behind it. Values print through src/lib/format.ts
 * `formatVolume`, `formatDate` and `formatTime`, ported below.
 */
import { mobileFixture } from "@/lib/screens/mobile-fixture";
import { mobileAFixture } from "@/lib/screens/mobile-a-fixture";
import { C, LABEL, PhoneFrame } from "./phone";
import { AppSwitch, EntryCta, EntryRow, SheetTopBar } from "./form-shell";

/** format.ts `formatVolume`. */
function formatVolume(n: number | null | undefined, dp = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }).format(n);
}

/** format.ts `formatDate`. */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

/** format.ts `formatTime`. */
function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? 0);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** fullscreen-data-entry.tsx `formatThousands` on a typed numeric field. */
function formatThousands(raw: string): string {
  const [int, dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec != null ? `${grouped}.${dec}` : grouped;
}

export function MeterReadingScreen() {
  const m = mobileFixture();
  const a = mobileAFixture();
  const prev = a.meterPrevious;
  // seedForm(null, previous): the two repeating figures carry, the counter does not.
  const form = {
    date: m.gauge.today.date,
    time: a.meterNowTime,
    yesterdayMcf: String(prev.yesterdayMcf),
    mcf: String(prev.mcf),
    cumulativeMcf: "",
    orifice: String(prev.orifice),
    differential: String(prev.differential),
    separator: String(prev.separator),
    heater: String(prev.heater),
  };
  const shown = (v: string, dp: number) => (v === "" ? "" : formatVolume(Number(v), dp));

  return (
    <PhoneFrame time="7:52">
      <SheetTopBar title="Add Meter Reading" />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "16px 24px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, paddingTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
          <EntryRow label="Yesterday's volume (MCF)" value={shown(form.yesterdayMcf, 2)} placeholder={formatVolume(prev.yesterdayMcf, 2)} />
          <EntryRow label="Flow rate (MCF/d)" value={shown(form.mcf, 2)} placeholder={formatVolume(prev.mcf, 2)} />
          <EntryRow label="Cumulative (MCF)" value={shown(form.cumulativeMcf, 0)} placeholder={formatVolume(prev.cumulativeMcf, 0)} />
          <EntryRow label="Date" value={formatDate(form.date)} />
          <EntryRow label="Time" value={formatTime(form.time)} />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <EntryRow kind="input" label="Orifice" value={formatThousands(form.orifice)} placeholder="0" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <EntryRow kind="input" label="Differential" value={formatThousands(form.differential)} placeholder="0" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <EntryRow kind="input" label="Separator" value={formatThousands(form.separator)} placeholder="0" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <EntryRow kind="input" label="Heater" value={formatThousands(form.heater)} placeholder="0" />
            </div>
          </div>
          {/* toggleRow: no card, label + hint, the switch pinned right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 2px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={LABEL}>Meter reset</span>
              <span style={{ ...LABEL, color: C.mutedFg }}>Odometer / EFM roll-over</span>
            </div>
            <AppSwitch on={false} />
          </div>
        </div>
      </div>
      <EntryCta label="Add Reading" />
      <div style={{ height: 18 }} />
    </PhoneFrame>
  );
}
