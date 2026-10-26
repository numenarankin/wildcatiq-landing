"use client";

/**
 * The Filings page as the app renders it, with September's Form PR played
 * forward on a loop: the app's FilingsTable (Form PR tab with its Beta badge,
 * the RRC filer button, one row per ended cycle) on the fixture docket with
 * September still owed; Generate pressed on its row, the row's Building…
 * while the build runs; the app's GeneratedModal rising with the month
 * (operator, records, due date, the filer, every lease's record); Download
 * pressed, the button's Building… while the file is written; the review
 * closing; and the row filed as Generated with its EDI file to download.
 *
 * The table and the modal are the app's components doing their own work: the
 * demo presses Generate on the row, and the modal's Download and Close
 * through `FormPrScriptContext`; the build and the download come back from
 * the action stand-ins after the pause a real one takes (`BUILD_MS`).
 */
import { useEffect, useRef, useState } from "react";
import { FilingsTable } from "@/components/filings/filings-table";
import { FormPrScriptContext } from "@/components/reports/form-pr/generated-modal";
import { BUILD_MS } from "@/lib/rrc/form-pr/actions";
import type { FilingRow } from "@/lib/rrc/forms/types";
import { PR_CYCLE, filer, filingRows } from "@/lib/screens/filings-fixture";
import { AppFrame } from "./app-frame";
import { useDemoActive } from "./demo-active";

/**
 * `owed` is the docket before the month is generated; `generate` presses the
 * row's button and the table shows Building… until the build returns and the
 * review rises; `review` holds it open; `download` presses Download and the
 * button shows Building… until the file is written; `written` holds the
 * finished review; `close` presses Close; `filed` shows the row with its file.
 */
type Phase = "owed" | "generate" | "review" | "download" | "written" | "close" | "filed";

const PHASE_MS: Record<Phase, number> = {
  owed: 1800,
  generate: BUILD_MS + 700,
  review: 3600,
  download: BUILD_MS + 300,
  written: 1200,
  close: 900,
  filed: 3200,
};
const NEXT: Record<Phase, Phase> = {
  owed: "generate",
  generate: "review",
  review: "download",
  download: "written",
  written: "close",
  close: "filed",
  filed: "owed",
};

/** The docket with September still owed: no file, nothing generated. */
function owedRows(): FilingRow[] {
  return filingRows().map((r) =>
    r.period === PR_CYCLE ? { ...r, id: null, status: "draft", fileName: null, generatedAt: null } : r
  );
}

export function FilingsLive() {
  const active = useDemoActive();
  const [phase, setPhase] = useState<Phase>("owed");
  const page = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setPhase(NEXT[phase]), PHASE_MS[phase]);
    return () => clearTimeout(id);
  }, [active, phase]);

  // The press on September's Generate: the table's own button, so the table
  // runs its own build, Building… and review.
  useEffect(() => {
    if (phase !== "generate") return;
    const buttons = page.current?.querySelectorAll<HTMLButtonElement>("tbody button") ?? [];
    for (const b of buttons) {
      if (b.textContent?.trim() === "Generate") {
        b.click();
        break;
      }
    }
  }, [phase]);

  const script = phase === "download" ? "download" : phase === "close" || phase === "filed" ? "close" : null;
  const rows = phase === "filed" ? filingRows() : owedRows();

  return (
    <AppFrame path="/filings" crumbs={["Filings"]}>
      <div ref={page} className="flex flex-1 flex-col gap-6">
        <FormPrScriptContext.Provider value={script}>
          <FilingsTable rows={rows} filer={filer} canManage />
        </FormPrScriptContext.Provider>
      </div>
    </AppFrame>
  );
}
