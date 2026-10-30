"use client";

/**
 * The Orion page's section screens. Each is the app's own component in one
 * state, fed `orion-fixture.ts`:
 *
 * - reads / rrc / context: a page with the drawer's `ChatPanel` docked beside
 *   it (Dashboard, Recon, Facilities), one answered question each.
 * - math / attach: the /orion page (`OrionConversationList` + `OrionChat`)
 *   playing a thread forward on a loop (`scripted-thread.tsx`): a decline
 *   chart worked, a LAS log interpreted, or a photo sent in, read and carded.
 * - approval: the `ApprovalCard` alone, arriving, approved, and saved.
 * - memory: Settings > AI > Orion (`OrionContextEditor`), history open.
 * - voice: `VoiceOverlay` over the dashboard, a gauge said aloud.
 * - permissions: Settings > AI > Permissions (`AiPermissionsTable`).
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DashboardPageBody } from "@/components/screens/dashboard-live";
import { ApprovalCard, OutcomeCard, pendingApprovals, settledWrites } from "@/components/ai/tool-approval";
import { VoiceOverlay } from "@/components/ai/voice-overlay";
import { PermissionsProvider } from "@/components/auth/permissions-context";
import { FacilitiesFlowMap } from "@/components/facilities/flow-map";
import { MapFilters, type Filters } from "@/components/scout/map-filters";
import { AiPermissionsTable } from "@/components/settings/ai-permissions-table";
import { OrionContextEditor } from "@/components/settings/orion-context-editor";
import { ScreenPanel } from "@/components/screens/panel";
import { useDemoActive } from "@/components/screens/demo-active";
import { ReconMap } from "@/components/screens/recon-map";
import { DEFAULT_OFF } from "@/lib/ai/tool-permissions";
import { nodeId } from "@/lib/facilities/graph";
import {
  LEASES as FLOW_LEASES,
  flowMapCatalog,
  flowMapGraph,
  flowMapReadouts,
  flowMapRows,
} from "@/lib/screens/flow-map-fixture";
import {
  corbettDeclineThread,
  gaugePhotoThread,
  offsetsThread,
  orionMemoryDoc,
  orionPersonaDoc,
  orionRevisions,
  smithReadingPart,
  smithSeptemberThread,
  t201FeedThread,
  voiceTurns,
} from "@/lib/screens/orion-fixture";
import { reconFilters, reconPrices, A3_LNG_LAT } from "@/lib/screens/recon-fixture";
import { DemoCursor, centreOf, type CursorPoint } from "../recon/cursor";
import { OrionDrawerScreen } from "./drawer";
import { ScriptedOrionPage } from "./scripted-thread";

/** 1. Reads your operation: the Dashboard with Smith's September answered in the drawer. */
export function OrionReadsScreen() {
  const [conversation] = useState(smithSeptemberThread);
  return (
    <OrionDrawerScreen path="/dashboard" crumbs={["Dashboard"]} conversation={conversation} pagePad>
      <DashboardPageBody />
    </OrionDrawerScreen>
  );
}


/** 2. The state's record: Recon on Johnson A 3's offsets, listed in the drawer. */
export function OrionRrcScreen() {
  const [conversation] = useState(offsetsThread);
  const [filters, setFilters] = useState<Filters>({ ...reconFilters, mode: "wells" });
  return (
    <OrionDrawerScreen path="/recon" crumbs={["Recon"]} conversation={conversation}>
      <div className="flex h-full w-full flex-col">
        <MapFilters
          filters={filters}
          prices={reconPrices}
          onSelectOperator={() => {}}
          onSelectPrincipal={() => {}}
          permitPurposes={[]}
          onOpenAlerts={() => {}}
          view="map"
          onView={() => {}}
          onChange={setFilters}
        />
        <div className="relative min-h-0 flex-1">
          <ReconMap center={A3_LNG_LAT} zoom={12.2} basemap="satellite" pin={{ lngLat: A3_LNG_LAT, color: "#111827", label: "Johnson A 3" }} />
        </div>
      </div>
    </OrionDrawerScreen>
  );
}

/** 3. Works the problem: Roy Corbett 4's decline, drawn in the chat. */
export function OrionMathScreen() {
  const [conversation] = useState(corbettDeclineThread);
  return <ScriptedOrionPage conversation={conversation} />;
}

const flowGraph = flowMapGraph();

/** 4. Knows the page: the Facilities flow map on Smith, asked what feeds T201. */
export function OrionContextScreen() {
  const [conversation] = useState(t201FeedThread);
  return (
    <OrionDrawerScreen path="/facilities" crumbs={["Facilities"]} conversation={conversation}>
      <PermissionsProvider permissions={["view_facilities", "manage_facilities", "manage_leases"]}>
        <FacilitiesFlowMap
          graph={flowGraph}
          readouts={flowMapReadouts}
          catalog={flowMapCatalog}
          rows={flowMapRows}
          initialSelected={nodeId("tank", "t-sm-201")}
          initialLease={FLOW_LEASES.smith.id}
        />
      </PermissionsProvider>
    </OrionDrawerScreen>
  );
}

function pendingOf(part: ReturnType<typeof smithReadingPart>) {
  return pendingApprovals({ id: "m", role: "assistant", parts: [part] })[0];
}

type ApprovalPhase = "empty" | "arrive" | "aim" | "press" | "approved" | "fade";
const APPROVAL_ORDER: readonly ApprovalPhase[] = ["empty", "arrive", "aim", "press", "approved", "fade"];
const APPROVAL_HOLD: Record<ApprovalPhase, number> = {
  empty: 900,
  arrive: 3400,
  aim: 900,
  press: 600,
  approved: 3800,
  fade: 450,
};

/**
 * 5. Asks before it writes: the approval card played as the chat shows it.
 * The card arrives, the cursor reads down it to Approve and presses the
 * card's own button, and the card turns into the saved outcome the thread
 * shows once the write has run (`OutcomeCard`, as `scripted-thread.tsx`
 * settles an approved call).
 */
export function OrionApprovalScreen() {
  const active = useDemoActive();
  const [request] = useState(() => pendingOf(smithReadingPart("pending")));
  const [saved] = useState(() => settledWrites({ id: "m", role: "assistant", parts: [smithReadingPart("saved")] })[0]);
  const [at, setAt] = useState(0);
  const [approved, setApproved] = useState(false);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const phase = APPROVAL_ORDER[at];

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setAt((a) => (a + 1) % APPROVAL_ORDER.length), APPROVAL_HOLD[phase]);
    return () => clearTimeout(id);
  }, [active, phase]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const approve = Array.from(root.current?.querySelectorAll("button") ?? []).find(
        (b) => b.textContent?.trim() === "Approve"
      );
      switch (phase) {
        case "empty":
          setApproved(false);
          setCursor(null);
          break;
        case "arrive": {
          // In from below the card, where the reader's eye starts.
          const p = centreOf(root.current);
          if (p) setCursor({ x: p.x + 180, y: p.y + 120, down: false });
          break;
        }
        case "aim": {
          const p = centreOf(approve);
          if (p) setCursor({ ...p, down: false });
          break;
        }
        case "press":
          setCursor((c) => (c ? { ...c, down: true } : c));
          approve?.click();
          break;
        case "approved":
          setCursor((c) => (c ? { x: c.x + 90, y: c.y + 40, down: false } : c));
          break;
        case "fade":
          setCursor(null);
          break;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const shown = phase !== "empty";
  return (
    <ScreenPanel w={760} h={300} path="/orion">
      <div ref={root} className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[560px]">
          <AnimatePresence mode="wait">
            {shown && phase !== "fade" ? (
              <motion.div
                key={approved ? "saved" : "pending"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              >
                {approved ? (
                  <OutcomeCard write={saved} />
                ) : (
                  <ApprovalCard request={request} onApprove={() => setApproved(true)} onDeny={() => {}} />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}

/** 7. Remembers: Settings > AI > Orion, the memory doc's history open. */
export function OrionMemoryScreen() {
  const revisions = orionRevisions.map((r, i) => ({ ...r, createdAt: `2026-10-${String(24 - i * 6).padStart(2, "0")}T14:00:00Z` }));
  return (
    <ScreenPanel w={1000} h={760} path="/settings">
      <div className="max-w-3xl">
        <OrionContextEditor
          docs={{ persona: orionPersonaDoc, memory: orionMemoryDoc }}
          revisions={{ memory: revisions }}
          historyOpen={["memory"]}
        />
      </div>
    </ScreenPanel>
  );
}

/** 8. Voice: the overlay over the dashboard, the gauge said and answered. */
export function OrionVoiceScreen() {
  const turns = voiceTurns();
  const [pending] = useState(() => [pendingOf(smithReadingPart("pending"))]);
  return (
    <ScreenPanel w={1320} h={820} path="/dashboard" pad={false}>
      <div className="h-full w-full overflow-hidden px-10 py-6">
        <DashboardPageBody />
      </div>
      <VoiceOverlay status="speaking" lastUser={turns.user} liveReply={turns.reply} liveActive pendingApprovals={pending} readOut={() => {}} onClose={() => {}} />
    </ScreenPanel>
  );
}

/** 9. Attach: a photo of the gauge sheet sent in, read, and one card for the week. */
export function OrionAttachScreen() {
  const [conversation] = useState(gaugePhotoThread);
  return <ScriptedOrionPage conversation={conversation} />;
}

/** 10. Control: Settings > AI > Permissions, at the org's defaults. */
export function OrionPermissionsScreen() {
  return (
    <ScreenPanel w={1000} h={860} path="/settings">
      <div className="max-w-3xl">
        <AiPermissionsTable disabled={[...DEFAULT_OFF]} onError={() => {}} />
      </div>
    </ScreenPanel>
  );
}
