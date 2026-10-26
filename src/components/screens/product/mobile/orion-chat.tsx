"use client";

/**
 * Orion on the phone, paused on a write, transcribed from wildcat-phone:
 * - src/components/ai/orion-chat.tsx (thread column 16 padding, 24 top, 24
 *   gap; user bubble bgSubtle radius 16; assistant block with its stamp and
 *   the copy / read-aloud row; the "Waiting on your approval" footer line
 *   while status is awaiting-approval; the floating composer docked over the
 *   thread with the send button disabled while the turn is busy)
 * - src/components/ai/turn-layers.tsx (COMFORTABLE body: 15/24)
 * - src/components/ai/approval-card.tsx over src/lib/ai/approval-view.ts
 *   `describeApproval`: `record_tank_reading` titles "Record a tank gauge
 *   reading"; the field rows follow the server's tool-field manifest
 *   (wildcat src/lib/ai/tool-fields.ts over the tool's row schema in
 *   src/lib/ai/tools.ts), so every field Orion left out reads "Not specified"
 *   and the card counts them; Approve, Review, Deny
 * - src/components/ai/chat-composer.tsx (the pill with the + attach button)
 * - src/components/shell/app-header.tsx with the corner claimed by /orion
 *   (app/(app)/orion.tsx `useClaimHeaderAction('Chat history')`)
 *
 * The record is Smith T201's gauge this morning from mobileFixture(): the
 * card shows the gauge in inches as the tool carries it, Orion's sentence
 * says it in feet and inches.
 */
import { ArrowUp, Check, ChevronLeft, Copy, Pencil, Plus, Volume2, X } from "lucide-react";
import Image from "next/image";
import { formatFeetInches, mobileFixture } from "@/lib/screens/mobile-fixture";
import { ORION_TIMES } from "@/lib/screens/mobile-b-fixture";
import { C, CONTENT_TOP, HEADER_H, PhoneFrame } from "./phone";

/** approval-view.ts `formatValue` for the scalar types this record carries. */
const formatValue = (v: unknown): string => (v == null || v === "" ? "—" : typeof v === "number" ? v.toLocaleString() : String(v));

/** lib/format.ts `messageTime` for a same-day message. */
const messageTime = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** The tool's row fields as the server manifest lists them (tankId hidden), with their humanized labels. */
const SPEC = [
  { key: "date", label: "Date" },
  { key: "gauge", label: "Gauge" },
  { key: "time", label: "Time" },
  { key: "pulledBottom", label: "Pulled bottom" },
  { key: "waterHauled", label: "Water hauled" },
  { key: "hotOil", label: "Hot oil" },
  { key: "comments", label: "Comments" },
  { key: "wellIds", label: "Wells" },
];

function SmButton({ icon, label, primary }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 32,
        padding: "0 10px",
        borderRadius: 6,
        background: primary ? C.primary : C.background,
        color: primary ? C.primaryFg : C.foreground,
        border: primary ? "1px solid transparent" : `1px solid ${C.border}`,
        fontWeight: 500,
        fontSize: 13,
      }}
    >
      {icon}
      {label}
    </div>
  );
}

export function OrionChatScreen() {
  const { gauge } = mobileFixture();
  // What Orion sent: one record, the tool's required fields and the time.
  const input: Record<string, unknown> = {
    tankId: gauge.tank.id,
    date: gauge.today.date,
    gauge: gauge.today.inches,
    time: "07:40",
  };
  const fields = SPEC.map((f) => {
    const v = input[f.key];
    return v == null || v === "" ? { label: f.label, value: "Not specified", missing: true } : { label: f.label, value: formatValue(v), missing: false };
  });
  const missing = fields.filter((f) => f.missing).length;
  const stamp: React.CSSProperties = { fontSize: 11, lineHeight: "16px", color: C.tertiaryText, fontVariantNumeric: "tabular-nums" };

  return (
    <PhoneFrame time="7:41">
      {/* app-header.tsx, the corner claimed: caret plus "Chat history" */}
      <div style={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 10, height: HEADER_H, display: "flex", alignItems: "center", padding: "0 16px", background: C.background }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 4 }}>
          <ChevronLeft size={26} color={C.foreground} />
          <span style={{ fontWeight: 500, fontSize: 16 }}>Chat history</span>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <Image src="/slim_normal.png" alt="" width={20} height={20} />
        </div>
        <div style={{ marginLeft: "auto", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={C.foreground} aria-hidden>
            {[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
          </svg>
        </div>
      </div>

      {/* The thread */}
      <div style={{ padding: `${CONTENT_TOP - 54 + 24}px 16px 0`, display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: "85%", gap: 4 }}>
          <div style={{ borderRadius: 16, background: C.bgSubtle, padding: "8px 14px" }}>
            <span style={{ fontSize: 15, lineHeight: "24px" }}>{`${gauge.tank.name} stuck at ${formatFeetInches(gauge.today.inches)} this morning, 7:40. Log it.`}</span>
          </div>
          <span style={stamp}>{messageTime(ORION_TIMES.user)}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 15, lineHeight: "24px" }}>
              {`Here is the gauge for ${gauge.tank.name}: ${formatFeetInches(gauge.today.inches)}, up from ${formatFeetInches(gauge.yesterday.inches)} yesterday.`}
            </span>

            {/* ApprovalCard, pending */}
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 2.4, background: C.background, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontWeight: 500, fontSize: 13 }}>Record a tank gauge reading</span>
              <span style={{ fontSize: 12, color: C.tertiaryText }}>Orion needs your OK before this is saved.</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {fields.map((f) => (
                  <div key={f.label} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12, color: C.mutedFg, width: "45%" }}>{f.label}</span>
                    <span style={{ fontSize: 12, flex: 1, fontVariantNumeric: "tabular-nums", color: f.missing ? C.mutedFg : C.foreground, fontStyle: f.missing ? "italic" : "normal" }}>{f.value}</span>
                  </div>
                ))}
              </div>
              {missing > 0 ? (
                <span style={{ fontSize: 11, lineHeight: "16px", color: C.mutedFg }}>
                  {missing === 1 ? "1 field was left blank." : `${missing} fields were left blank.`} Deny and tell Orion if any of them matter.
                </span>
              ) : null}
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <SmButton primary icon={<Check size={14} />} label="Approve" />
                <SmButton icon={<Pencil size={14} />} label="Review" />
                <SmButton icon={<X size={14} />} label="Deny" />
              </div>
            </div>
          </div>
          <span style={stamp}>{messageTime(ORION_TIMES.assistant)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: -9 }}>
            {[Copy, Volume2].map((Icon, i) => (
              <div key={i} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={C.tertiaryText} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 15, lineHeight: "24px", color: C.tertiaryText }}>Waiting on your approval — nothing is saved until you decide.</span>
        </div>
      </div>

      {/* The docked composer: send disabled while the run waits */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 16px 42px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, borderRadius: 24, background: C.background, boxShadow: "0 0 20px rgba(0,0,0,0.16)", padding: "4px 10px 4px 4px" }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Plus size={22} color={C.foreground} />
          </div>
          <span style={{ flex: 1, alignSelf: "center", margin: "6px 0", padding: "0 8px", fontSize: 16, lineHeight: "22px", color: C.tertiaryText }}>Ask Orion…</span>
          <div style={{ width: 32, height: 32, marginBottom: 4, borderRadius: 999, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5 }}>
            <ArrowUp size={18} color={C.primaryFg} />
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
