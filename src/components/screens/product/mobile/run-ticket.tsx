"use client";

/**
 * Add Run Ticket on the phone, just after a paper ticket off Smith T202 was
 * scanned and read. A DOM transcription of wildcat-phone
 * src/components/tanks/tank-run-ticket-entry.tsx on
 * src/components/ui/fullscreen-form.tsx (`FullscreenFormModal`: content
 * padding 16 with 8 on top, fields 18 apart, the 52pt pinned pill CTA).
 *
 * The draft is what src/lib/tickets/draft.ts `draftFromExtracted` builds from
 * the extractor's ticket: every printed field filled and tagged " · scanned"
 * (the entry's `label()`), every unprinted one left BLANK with its placeholder,
 * so the API gravity the ticket did not print reads as "check this", never as
 * 0 °API. One ticket on the sheet, so no pager (it renders only for two or
 * more). The in-form header is the "Scan ticket" pill (ScanLine 18, padding
 * 16 / 10, pill, 1px border). The column is a ScrollView; the screen pans it
 * from the scanner pill down to the gravity row and back.
 */
import { ScanLine } from "lucide-react";
import { formatFeetInches, mobileFixture } from "@/lib/screens/mobile-fixture";
import { mobileAFixture } from "@/lib/screens/mobile-a-fixture";
import { C, PhoneFrame, SANS } from "./phone";
import { FormCta, FormRow, SheetTopBar } from "./form-shell";

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

/** numeric-entry.ts `optionalRaw`: a number as the string a field holds. */
const optionalRaw = (v: number | null): string => (v == null ? "" : String(Number(v.toFixed(4))));

/** fullscreen-data-entry.tsx `formatThousands`. */
function formatThousands(raw: string): string {
  const [int, dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec != null ? `${grouped}.${dec}` : grouped;
}

/** Pan distance: from the top of the column to where the API gravity row clears the CTA. */
const PAN = 470;

export function RunTicketScreen() {
  const t = mobileFixture().ticket;
  const printed = mobileAFixture().ticketPrinted;
  const round2 = (n: number) => Math.round(n * 100) / 100;

  // draftFromExtracted: the ticket as the extractor returned it.
  const draft = {
    date: t.date,
    departureTime: printed.departureTime,
    ticketNo: t.number,
    purchaser: t.purchaser,
    transporter: "",
    grossBbls: optionalRaw(round2(t.bbl)),
    netBbls: "",
    apiGravity: "",
    bsW: optionalRaw(printed.bsW),
    openingGauge: optionalRaw(t.openIn),
    closingGauge: optionalRaw(t.closeIn),
  };
  const scanned = new Set(["date", "departureTime", "ticketNo", "purchaser", "grossBbls", "bsW", "openingGauge", "closingGauge"]);
  const label = (key: string, text: string) => (scanned.has(key) ? `${text} · scanned` : text);

  return (
    <PhoneFrame time="8:31">
      <style>{`@keyframes wc-ticket-pan { 0%, 30% { transform: translateY(0); } 45%, 80% { transform: translateY(-${PAN}px); } 95%, 100% { transform: translateY(0); } }`}</style>
      <SheetTopBar title="Add Run Ticket" />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <div style={{ padding: "8px 16px 32px", display: "flex", justifyContent: "center", animation: "wc-ticket-pan 9s cubic-bezier(0.45, 0, 0.25, 1) infinite" }}>
          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 18 }}>
            {/* header: the scan pill, idle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, border: `1px solid ${C.border}` }}>
                <ScanLine size={18} color={C.foreground} />
                <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 14, lineHeight: "22px", color: C.foreground }}>Scan ticket</span>
              </div>
            </div>

            <FormRow label={label("date", "Date")} value={formatDate(draft.date)} />
            <FormRow label={label("departureTime", "Departure time")} value={draft.departureTime ? formatTime(draft.departureTime) : ""} placeholder="Not read" />
            <FormRow label={label("ticketNo", "Ticket #")} value={draft.ticketNo} placeholder="e.g. 10432" caret={false} />
            <FormRow label={label("purchaser", "Purchaser")} value={draft.purchaser} placeholder="Buyer" />
            <FormRow label={label("transporter", "Transport company")} value={draft.transporter} placeholder="Trucking company" />
            <FormRow label={label("openingGauge", "Open gauge")} value={draft.openingGauge === "" ? "" : formatFeetInches(Number(draft.openingGauge))} placeholder="Not read" />
            <FormRow label={label("closingGauge", "Close gauge")} value={draft.closingGauge === "" ? "" : formatFeetInches(Number(draft.closingGauge))} placeholder="Not read" />
            <FormRow label={label("grossBbls", "Gross barrels")} value={formatThousands(draft.grossBbls)} placeholder="0" caret={false} />
            <FormRow label={label("netBbls", "Net barrels (as printed)")} value={draft.netBbls} placeholder="0" caret={false} />
            <FormRow label={label("apiGravity", "API gravity (°)")} value={draft.apiGravity} placeholder="0" caret={false} />
            <FormRow label={label("bsW", "BS&W")} value={draft.bsW} placeholder="0" caret={false} />
          </div>
        </div>
      </div>
      <FormCta label="Save Ticket" />
      <div style={{ height: 18 }} />
    </PhoneFrame>
  );
}
