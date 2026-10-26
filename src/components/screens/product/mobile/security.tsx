"use client";

/**
 * Settings > Security on the phone, biometric unlock on. A DOM transcription of
 * wildcat-phone app/(app)/settings.tsx, which opens each area in the
 * `FullscreenFormModal` sheet (src/components/ui/fullscreen-form.tsx: back
 * caret, the area's name centred, no CTA since every control saves as it is
 * touched), holding src/components/settings/security-section.tsx: one
 * `SettingsToggleRow` (src/components/settings/settings-ui.tsx: a 52pt muted
 * card, padding 16 / 10, radius 6, label 16 medium over a 13 muted hint, the
 * `AppSwitch` pinned right). The label is "Unlock with {label}", where
 * src/lib/biometrics.ts names the sensor: Face ID on an iPhone with a face
 * enrolled.
 */
import { C, PhoneFrame, SANS } from "./phone";
import { AppSwitch, SheetTopBar } from "./form-shell";

export function SecurityScreen() {
  const label = "Face ID";
  return (
    <PhoneFrame time="6:12">
      <SheetTopBar title="Security" />
      <div style={{ flex: 1, minHeight: 0, padding: "8px 16px 32px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* SecuritySection column, gap 18 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ minHeight: 52, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: C.muted, borderRadius: 6 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 16, lineHeight: "22px", color: C.foreground, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Unlock with {label}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 13, lineHeight: "18px", color: C.mutedFg }}>Ask for it when the app has been closed or set down</span>
              </div>
              <AppSwitch on />
            </div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
