"use client";

/**
 * The phone app's fullscreen form shell, transcribed for the run ticket:
 *
 * - mobile-background src/components/ui/fullscreen-form.tsx (`FullscreenFormModal`,
 *   `FormField`, `FormCustomField`, `FormNumpadField`, `FormTextField`,
 *   `FormSelectField`): label 13px muted over a 52pt muted card, rows 18 apart,
 *   content padding 16, a 52pt pill CTA in a pinned bottom slot.
 *
 * It opens with a 56pt top bar (back caret left at padding 12, title
 * centred, 16 semibold) under the status bar plus OVERLAY_TOP_GAP (8).
 */
import { ChevronDown, ChevronLeft } from "lucide-react";
import { C, SANS } from "./phone";

/** fullscreen-form.tsx / fullscreen-data-entry.tsx `topBar` + `headerTitle`, under OVERLAY_TOP_GAP. */
export function SheetTopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 8, background: C.background }}>
      <div style={{ position: "relative", height: 56, display: "flex", alignItems: "center", padding: "0 12px" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: C.foreground, whiteSpace: "nowrap" }}>{title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "6px 8px 6px 0" }}>
          <ChevronLeft size={26} color={C.foreground} />
        </div>
        {right ? <div style={{ marginLeft: "auto", padding: "6px 8px" }}>{right}</div> : null}
      </div>
    </div>
  );
}

/* ---------------------------- FullscreenFormModal ---------------------------- */

/** fullscreen-form.tsx `label`: sans 13, muted. */
const FORM_LABEL: React.CSSProperties = { fontFamily: SANS, fontSize: 13, lineHeight: "normal", color: C.mutedFg };

/** `FormField`: label row (padding 4) over the 52pt muted card (padding 16, radius 6). */
export function FormRow({
  label,
  hint,
  value,
  placeholder,
  caret = true,
  multiline = false,
  trailing,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  /** The ChevronDown a picker row carries; a typed field has none. */
  caret?: boolean;
  multiline?: boolean;
  /** Something absolutely placed inside the card (the dictate button). */
  trailing?: React.ReactNode;
}) {
  const empty = value === "";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
        <span style={FORM_LABEL}>{label}</span>
        {hint ? <span style={FORM_LABEL}>{hint}</span> : null}
      </div>
      <div
        style={{
          position: "relative",
          minHeight: multiline ? 96 : 52,
          display: "flex",
          alignItems: multiline ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 12,
          padding: multiline ? "14px 44px 14px 16px" : "0 16px",
          background: C.muted,
          borderRadius: 6,
        }}
      >
        <span
          style={{
            fontWeight: 500,
            fontSize: 16,
            lineHeight: multiline ? "22px" : "52px",
            color: empty ? C.mutedFg : C.foreground,
            whiteSpace: multiline ? "normal" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {empty ? placeholder ?? "" : value}
        </span>
        {caret ? <ChevronDown size={16} color={C.mutedFg} style={{ flexShrink: 0 }} /> : null}
        {trailing}
      </div>
    </div>
  );
}

/** `FullscreenFormModal`'s pinned CTA: bottomWrap 8/16/16, a 52pt black pill. */
export function FormCta({ label }: { label: string }) {
  return (
    <div style={{ padding: "8px 16px 16px", display: "flex", justifyContent: "center", background: C.background }}>
      <div style={{ width: "100%", maxWidth: 480, height: 52, borderRadius: 999, background: "#000000", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 14 }}>
        {label}
      </div>
    </div>
  );
}

/* ---------------------------- FullscreenDataEntry ---------------------------- */
