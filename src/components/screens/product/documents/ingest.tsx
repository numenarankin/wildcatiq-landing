"use client";

/**
 * The Documents page's ingest screens: the app's own `AddHistoryModal` and
 * `IngestApprovalModal`, as a tank page and a well page open them, fed the
 * proposals in `documents-fixture.ts`. Approving runs the card's own handler,
 * which in the landing answers locally and writes nothing.
 */
import { useEffect, useState } from "react";
import { AddHistoryModal, type UploadResult } from "@/components/ai/ingest/add-history-modal";
import { IngestApprovalModal } from "@/components/ai/ingest/ingest-approval-modal";
import { ScreenPanel } from "@/components/screens/panel";
import { AppFrame } from "@/components/screens/app-frame";
import type { IngestProposal } from "@/lib/ai/ingest/actions";
import {
  GAUGE_SHEET_FILE,
  corbettServiceProposals,
  gaugeSheetProposals,
  greasebookProposals,
  wellOptions,
} from "@/lib/screens/documents-fixture";
import { EVENTS } from "@/lib/screens/operator";

const TANK_PATH = "/production/tanks/t-sm-201";
/** The copy the tank page hands Add History (`tank-workspace.tsx`). */
const TANK_HISTORY = {
  description: "Upload a document and let AI propose the readings, run tickets, and tests it holds.",
  noRecordsMessage: "The document was read but held nothing that maps to this tank (readings, run tickets, well tests).",
};

/** A phone photo's bytes, sized like one; nothing reads them. */
function photoFile(name: string, kb: number, type = "image/jpeg"): File {
  return new File([new Uint8Array(kb * 1024)], name, { type });
}

/**
 * The hero, played on a loop: Smith T201's Add History with Luis's gauge
 * sheet queued, the read, then the two cards it produced, one after the
 * other, as the tank page queues them: seven gauges (approved), then the
 * Oct 23 haul flagged against the run already on file.
 */
type Phase = "queued" | "reading" | "gauges" | "approve" | "run" | "hold";
const HOLD: Record<Phase, number> = { queued: 1800, reading: 2600, gauges: 5200, approve: 2600, run: 5200, hold: 600 };
const READ_MS = 2400;

export function DocumentsHeroLive() {
  const [phase, setPhase] = useState<Phase>("queued");
  const [loop, setLoop] = useState(0);
  const [proposals, setProposals] = useState<IngestProposal[]>([]);
  const [file] = useState(() => photoFile(GAUGE_SHEET_FILE, 2_380));

  useEffect(() => {
    const next: Partial<Record<Phase, Phase>> = { queued: "reading", gauges: "approve", approve: "run", run: "hold" };
    const to = next[phase];
    if (!to) return;
    const id = setTimeout(() => {
      // Done on the approved card moves the queue to the next one.
      if (phase === "approve") setProposals((p) => p.slice(1));
      setPhase(to);
    }, HOLD[phase]);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "hold") return;
    const id = setTimeout(() => {
      setProposals([]);
      setPhase("queued");
      setLoop((n) => n + 1);
    }, HOLD.hold);
    return () => clearTimeout(id);
  }, [phase]);

  const upload = async (): Promise<UploadResult> => {
    await new Promise((r) => setTimeout(r, READ_MS));
    return { proposals: gaugeSheetProposals(), scan: { status: "records" } };
  };

  const current = proposals[0];
  return (
    <AppFrame path={TANK_PATH} crumbs={["Production", "Tanks", "Smith T201"]}>
      <AddHistoryModal
        key={`history-${loop}`}
        open={phase === "queued" || phase === "reading"}
        onClose={() => {}}
        onUpload={upload}
        onProposals={(p) => {
          setProposals(p);
          setPhase("gauges");
        }}
        initialFiles={[file]}
        script={phase === "reading" ? "upload" : null}
        {...TANK_HISTORY}
      />
      {current ? (
        <IngestApprovalModal
          key={`${current.id}-${loop}`}
          proposal={current}
          wellOptions={wellOptions}
          remaining={proposals.length - 1}
          script={phase === "approve" ? "approve" : null}
          onResolved={(id) => setProposals((prev) => prev.filter((p) => p.id !== id))}
        />
      ) : null}
    </AppFrame>
  );
}

/** 1. Upload where it lives: Smith T201's Add History, a photo and a pasted text queued. */
export function DocumentsUploadScreen() {
  const [files] = useState(() => [
    photoFile(GAUGE_SHEET_FILE, 2_380),
    new File(["Smith T201 10/27 7:00 7'10 1/4"], "Pasted text 071244.txt", { type: "text/plain" }),
  ]);
  return (
    <ScreenPanel w={1200} h={720} path={TANK_PATH} pad={false}>
      <AddHistoryModal
        open
        onClose={() => {}}
        onUpload={async () => ({ proposals: [], scan: { status: "no_records" } })}
        onAttachStored={async () => ({ proposals: [], scan: { status: "no_records" } })}
        onProposals={() => {}}
        initialFiles={files}
        {...TANK_HISTORY}
      />
    </ScreenPanel>
  );
}

function CardScreen({
  proposals,
  path,
  defaultWellId,
}: {
  proposals: IngestProposal[];
  path: string;
  defaultWellId?: string;
}) {
  return (
    <ScreenPanel w={1200} h={720} path={path} pad={false}>
      <IngestApprovalModal
        proposal={proposals[0]}
        wellOptions={wellOptions}
        defaultWellId={defaultWellId}
        remaining={proposals.length - 1}
        onResolved={() => {}}
      />
    </ScreenPanel>
  );
}

/** 4. Well paperwork: the pulling-unit ticket on Roy Corbett 4's page, the service row first. */
export function DocumentsWellScreen() {
  const [proposals] = useState(corbettServiceProposals);
  return <CardScreen proposals={proposals} path={`/production/wells/${EVENTS.rc4Downtime.well}`} defaultWellId={EVENTS.rc4Downtime.well} />;
}

/** 5. History import: September out of GreaseBook, thirty gauges on one card. */
export function DocumentsGreasebookScreen() {
  const [proposals] = useState(greasebookProposals);
  return <CardScreen proposals={proposals} path={TANK_PATH} />;
}

/** 6. Nothing saved: the Oct 23 haul, flagged against the run already on file. */
export function DocumentsOnFileScreen() {
  const [proposals] = useState(() => gaugeSheetProposals().slice(1));
  return <CardScreen proposals={proposals} path={TANK_PATH} />;
}
