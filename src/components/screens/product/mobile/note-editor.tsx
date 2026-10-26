"use client";

/**
 * Two phone screens for notes and dictation.
 *
 * `NoteEditorScreen`: a field note tagged to Smith 4, open in the editor. A
 * DOM transcription of wildcat-phone src/components/notes/note-editor-modal.tsx
 * (SwipeUpModal `fullBleed`: no title bar, the editor's own row of back caret
 * left and red X right, root padding 16 with 12 on top and 12 between rows),
 * the borderless 22 / 600 title `Input` (src/components/ui/input.tsx), the tag
 * header src/components/notes/tag-picker.tsx (one chip: muted "Well" caption,
 * the label, an X 12, over the row of outline sm "+ Wells / Tanks / ..."
 * buttons), and the body src/components/notes/note-body.tsx, whose ProseMirror
 * sets 16px at line-height 1.6 (src/lib/rich-text-theme.ts EDITOR_CSS). The
 * note is not focused, so the formatting pill (editor-toolbar.tsx) is hidden,
 * as it is whenever the keyboard is down.
 *
 * The note editor carries no dictate button. Dictation in the phone app is on
 * prose fields: `Textarea dictate`, `FormTextField dictate`, the data-entry
 * text sheet and the comment composer. So the recording state is shown where
 * the app has it, on `ReadingRemarksScreen`: the well page's Edit Reading form
 * (src/components/wells/edit-data-modal.tsx on fullscreen-form.tsx), scrolled
 * to its foot, the optional gas fields blank (stored unset, never 0) and the
 * Remarks field (`FormTextField multiline dictate`) taking dictation through
 * src/components/ui/dictate-button.tsx in its recording state: the 32pt button
 * filled destructive with a primaryFg Mic, and the LevelRing (size + 10, 2px
 * destructive border) at opacity 0.25 + level x 0.55 with the level at 0.5.
 */
import { ChevronLeft, Mic, Plus, X } from "lucide-react";
import { mobileFixture } from "@/lib/screens/mobile-fixture";
import { C, PhoneFrame, SANS } from "./phone";
import { FormCta, FormRow, SheetTopBar } from "./form-shell";

/** tag-picker.tsx PICKERS, in order. */
const PICKERS = ["Wells", "Tanks", "Meters", "Batteries", "Leases", "People", "Projects"];

/** typography.caption: 11 / 16. */
const CAPTION: React.CSSProperties = { fontFamily: SANS, fontSize: 11, lineHeight: "16px" };

export function NoteEditorScreen() {
  const note = mobileFixture().note;
  return (
    <PhoneFrame time="10:06">
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", gap: 12, padding: "20px 16px 0" }}>
        {/* header: caret, red X */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 }}>
          <ChevronLeft size={26} color={C.foreground} />
          <X size={22} color={C.destructive} />
        </div>
        {/* title Input: placeholder "Title" for an untitled note */}
        <div style={{ height: 40, display: "flex", alignItems: "center", fontFamily: SANS, fontSize: 22, fontWeight: 600, color: C.mutedFg }}>Title</div>
        {/* TagPicker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 999, border: `1px solid ${C.border}`, background: C.muted }}>
              <span style={{ ...CAPTION, color: C.mutedFg }}>Well</span>
              <span style={{ ...CAPTION, color: C.foreground }}>{note.well.name}</span>
              <X size={12} color={C.mutedFg} />
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PICKERS.map((p) => (
              <div key={p} style={{ height: 32, padding: "0 10px", display: "flex", alignItems: "center", gap: 6, borderRadius: 6, border: `1px solid ${C.border}`, background: C.background, fontFamily: SANS, fontWeight: 500, fontSize: 14, color: C.foreground }}>
                <Plus size={16} color={C.foreground} />
                {p}
              </div>
            ))}
          </div>
        </div>
        {/* NoteBody */}
        <div style={{ flex: 1, paddingTop: 0 }}>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 16, lineHeight: 1.6, color: C.foreground }}>{note.body}</p>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** dictate-button.tsx in its recording state, LevelRing at level 0.5. */
function DictateRecording({ size = 32, level = 0.5 }: { size?: number; level?: number }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <div
        style={{
          position: "absolute",
          width: size + 10,
          height: size + 10,
          borderRadius: (size + 10) / 2,
          border: `2px solid ${C.destructive}`,
          opacity: 0.25 + Math.min(1, level) * 0.55,
        }}
      />
      <div style={{ width: size, height: size, borderRadius: size / 2, background: C.destructive, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mic size={Math.round(size * 0.55)} color={C.primaryFg} />
      </div>
    </div>
  );
}

/** edit-data-modal.tsx GAS_FIELDS from Casing pressure on: the rows at the form's foot. */
const TAIL_FIELDS = [
  { label: "CHM" },
  { label: "Casing pressure", hint: "psi" },
  { label: "Tubing pressure", hint: "psi" },
  { label: "Flow pressure", hint: "psi" },
  { label: "Choke", hint: "64ths" },
];

export function ReadingRemarksScreen() {
  const note = mobileFixture().note;
  return (
    <PhoneFrame time="10:06">
      <SheetTopBar title="Edit Reading" right={<div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} color={C.destructive} /></div>} />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ padding: "8px 16px 32px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 18 }}>
            {TAIL_FIELDS.map((f) => (
              <FormRow key={f.label} label={f.label} hint={f.hint} value="" caret={false} />
            ))}
            <FormRow
              label="Remarks"
              value={note.body}
              placeholder="Notes for this reading"
              caret={false}
              multiline
              trailing={
                <div style={{ position: "absolute", right: 6, bottom: 6 }}>
                  <DictateRecording />
                </div>
              }
            />
          </div>
        </div>
      </div>
      <FormCta label="Save" />
      <div style={{ height: 18 }} />
    </PhoneFrame>
  );
}
