"use client";

/**
 * The Documents page's ingest screens: the app's own `AddHistoryModal` and
 * `IngestApprovalModal`, as a tank page and a well page open them, fed the
 * proposals in `documents-fixture.ts`. Approving runs the card's own handler,
 * which in the landing answers locally and writes nothing.
 */
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
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
import { DemoCursor, centreOf, type CursorPoint } from "../recon/cursor";
import { byText, dragFile, pasteText, usePhases } from "./demo-kit";

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

/**
 * 1. Upload where it lives, played on a loop: Smith T201's Add History with
 * Luis's gauge-sheet photo and a texted reading queued, Upload pressed, the
 * read; then the modal fresh again, the photo dragged in from the desktop and
 * dropped, the text pasted, and round. Every press is the modal's own handler:
 * a click on Upload, a real drop on the drop target, a real paste on the page.
 */
type UploadPhase = "aim" | "press" | "read" | "empty" | "drag" | "drop" | "paste";
const UPLOAD_ORDER: readonly UploadPhase[] = ["aim", "press", "read", "empty", "drag", "drop", "paste"];
const UPLOAD_HOLD: Record<UploadPhase, number> = { aim: 1600, press: 500, read: 3400, empty: 1400, drag: 1400, drop: 1200, paste: 1600 };
const TEXTED = "Smith T201 10/27 7:00 7'10 1/4";

export function DocumentsUploadScreen() {
  const { phase, loop, active } = usePhases(UPLOAD_ORDER, UPLOAD_HOLD);
  const at = UPLOAD_ORDER.indexOf(phase);
  // A fresh modal each time the loop comes round to "empty"; only the first
  // mount opens with the two documents already queued.
  const mount = loop + (at >= UPLOAD_ORDER.indexOf("empty") ? 1 : 0);
  const [photo] = useState(() => photoFile(GAUGE_SHEET_FILE, 2_380));
  const [files] = useState(() => [photo, new File([TEXTED], "Pasted text 071244.txt", { type: "text/plain" })]);
  const root = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = () => root.current?.closest("[data-screen-canvas]") ?? null;
    const zone = () => Array.from(canvas()?.querySelectorAll("button") ?? []).find((b) => b.textContent?.includes("Drag & drop") || b.textContent?.includes("Drop to add"));
    const upload = () => byText<HTMLButtonElement>(canvas(), "button", "Upload");
    let later: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      switch (phase) {
        case "aim": {
          const c = centreOf(upload());
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "press":
          setCursor((c) => (c ? { ...c, down: true } : c));
          upload()?.click();
          break;
        case "read":
          setCursor((c) => (c ? { ...c, down: false } : c));
          break;
        case "empty":
          // In from the desktop beside the window, the photo in hand.
          setCursor({ x: 1130, y: 640, down: false });
          break;
        case "drag": {
          const c = centreOf(zone());
          if (c) setCursor({ x: c.x + 40, y: c.y + 10, down: false });
          later = setTimeout(() => dragFile(zone(), photo, "over"), 650);
          break;
        }
        case "drop":
          dragFile(zone(), photo, "drop");
          break;
        case "paste": {
          const stamp = "071244";
          // A browser that builds paste events without their payload gets the
          // file the modal's paste handler would have made.
          if (!pasteText(TEXTED)) dragFile(zone(), new File([TEXTED], `Pasted text ${stamp}.txt`, { type: "text/plain" }), "drop");
          break;
        }
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      if (later) clearTimeout(later);
    };
  }, [active, phase, photo]);

  const carrying = phase === "empty" || phase === "drag";
  return (
    <ScreenPanel w={1200} h={720} path={TANK_PATH} pad={false}>
      <div ref={root} className="hidden" />
      <AddHistoryModal
        key={mount}
        open
        onClose={() => {}}
        // The read runs on past the loop; the next mount starts fresh.
        onUpload={() => new Promise<UploadResult>(() => {})}
        onAttachStored={async () => ({ proposals: [], scan: { status: "no_records" } })}
        onProposals={() => {}}
        initialFiles={mount === 0 ? files : undefined}
        {...TANK_HISTORY}
      />
      {cursor && carrying ? <DragChip x={cursor.x} y={cursor.y} name={GAUGE_SHEET_FILE} /> : null}
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}

/** The file under the pointer while it is dragged in, as the desktop draws it. */
function DragChip({ x, y, name }: CursorPoint & { name: string }) {
  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[119]"
      initial={false}
      animate={{ transform: `translate3d(${x + 14}px, ${y + 18}px, 0px)` }}
      transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div className="flex items-center gap-2 rounded-md border bg-background/95 px-2.5 py-1.5 text-xs shadow-md">
        <ImageIcon className="size-4 text-muted-foreground" />
        <span>{name}</span>
      </div>
    </motion.div>
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

/**
 * 4. Well paperwork, played on a loop: the pulling-unit ticket on Roy Corbett
 * 4's page, its three cards approved one after another (the service row, the
 * downtime, the pump spec), each through the card's own Approve and Done.
 */
type WellPhase = "read" | "aim" | "approve" | "toDone" | "done";
const WELL_ORDER: readonly WellPhase[] = ["read", "aim", "approve", "toDone", "done"];
const WELL_HOLD: Record<WellPhase, number> = { read: 2600, aim: 900, approve: 1800, toDone: 900, done: 500 };

export function DocumentsWellScreen() {
  const { phase, active } = usePhases(WELL_ORDER, WELL_HOLD);
  const [proposals, setProposals] = useState(corbettServiceProposals);
  const [round, setRound] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);

  // The last Done empties the queue; the same ticket comes up again.
  if (proposals.length === 0) {
    setProposals(corbettServiceProposals());
    setRound((n) => n + 1);
  }

  useEffect(() => {
    if (!active) return;
    const canvas = () => root.current?.closest("[data-screen-canvas]") ?? null;
    const frame = requestAnimationFrame(() => {
      switch (phase) {
        case "read":
          setCursor((c) => (c ? { ...c, down: false } : c));
          break;
        case "aim": {
          const c = centreOf(byText(canvas(), "button", "Approve"));
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "approve":
          setCursor((c) => (c ? { ...c, down: true } : c));
          byText<HTMLButtonElement>(canvas(), "button", "Approve")?.click();
          break;
        case "toDone": {
          const c = centreOf(byText(canvas(), "button", "Done"));
          if (c) setCursor({ ...c, down: false });
          break;
        }
        case "done":
          setCursor((c) => (c ? { ...c, down: true } : c));
          byText<HTMLButtonElement>(canvas(), "button", "Done")?.click();
          break;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [active, phase]);

  const current = proposals[0];
  const well = EVENTS.rc4Downtime.well;
  return (
    <ScreenPanel w={1200} h={720} path={`/production/wells/${well}`} pad={false}>
      <div ref={root} className="hidden" />
      {current ? (
        <IngestApprovalModal
          key={`${current.id}-${round}`}
          proposal={current}
          wellOptions={wellOptions}
          defaultWellId={well}
          remaining={proposals.length - 1}
          onResolved={(id) => setProposals((prev) => prev.filter((p) => p.id !== id))}
        />
      ) : null}
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
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
