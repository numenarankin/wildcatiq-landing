"use client";

/**
 * Smith 4's Info tab on the pumper's phone: the page opens on the well's name
 * and chart, then scrolls down to the spec sheet and back. Transcribed from
 * mobile-background:
 * - app/(app)/production/wells/[well].tsx → src/components/wells/well-workspace.tsx
 *   (the Info tab is `WellInfoPanel`; see pumper-well-page.tsx for the page)
 * - src/components/wells/equipment-panel.tsx `WellInfoPanel` (a Field | Value
 *   `DataTable`, value column flex 1.6; a filled row's field in sansMedium, an
 *   empty slot's in mutedFg with a muted `—`; the tally row reads
 *   "<depth> ft · <n> joints" with depth at 2 dp)
 * - src/hooks/use-well-info-fields.ts + src/lib/well-info-template.ts (the
 *   org's sheet, in its order; an org with no sheet of its own gets
 *   `defaultInfoFieldList('producer')`: Tubing tally, then the producer slots)
 *
 * Every row is Smith 4's in pumper-fixture.ts.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { pumperFixture } from "@/lib/screens/pumper-fixture";
import { useDemoActive } from "../demo-active";
import { C, PhoneFrame } from "../product/mobile/phone";
import { BORDER_FAINT, DASH, TD, TH, TabStrip, WellPageViewport, WellTop } from "./pumper-well-page";

/** well-info-template.ts `TALLY_FIELD_LABEL`. */
const TALLY = "Tubing tally";
const ft = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COLS = "minmax(0, 1fr) minmax(0, 1.6fr)";

export function PumperWellInfoScreen() {
  // The pan starts when the screen is reached, like every other demo.
  const active = useDemoActive();
  const { info } = pumperFixture();
  const joints = info.tubingJoints.length;
  const rows = [
    { label: TALLY, value: `${ft(info.tubingDepthFt)} ft · ${joints} joint${joints === 1 ? "" : "s"}`, filled: true },
    ...info.rows.map((r) => ({ label: r.label, value: r.value, filled: r.value !== "" })),
  ];

  // Pan distance: from the top of the page to the tab strip, measured.
  const stripRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState(0);
  useLayoutEffect(() => {
    if (stripRef.current) setPan(stripRef.current.offsetTop - 4);
  }, []);

  return (
    <PhoneFrame time="7:52">
      {pan > 0 ? <style>{`@keyframes wc-info-pan { 0%, 22% { transform: translateY(0); } 36%, 84% { transform: translateY(-${pan}px); } 96%, 100% { transform: translateY(0); } }`}</style> : null}
      <WellPageViewport columnStyle={{ animation: pan > 0 && active ? "wc-info-pan 11s cubic-bezier(0.45, 0, 0.25, 1) infinite" : undefined }}>
        <WellTop />
        <TabStrip active="Info" stripRef={stripRef} />
        <div style={{ marginTop: 16, borderRadius: 2.4, overflow: "hidden", background: C.card }}>
          <div style={{ height: 48, display: "grid", gridTemplateColumns: COLS, alignItems: "center", borderBottom: `0.5px solid ${BORDER_FAINT}` }}>
            <span style={TH}>Field</span>
            <span style={TH}>Value</span>
          </div>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: "grid", gridTemplateColumns: COLS, alignItems: "center", padding: "14px 0", borderTop: i > 0 ? `0.5px solid ${BORDER_FAINT}` : undefined }}>
              <span style={{ ...TD, fontWeight: r.filled ? 500 : 400, color: r.filled ? C.foreground : C.mutedFg }}>{r.label}</span>
              <span style={{ ...TD, color: r.value ? C.foreground : C.mutedFg }}>{r.value || DASH}</span>
            </div>
          ))}
        </div>
      </WellPageViewport>
    </PhoneFrame>
  );
}
