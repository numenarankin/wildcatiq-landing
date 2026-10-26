"use client";

/**
 * The Orion page's section screens. Each is the app's own component in one
 * state, fed `orion-fixture.ts`:
 *
 * - reads / rrc / context: a page with the drawer's `ChatPanel` docked beside
 *   it (Dashboard, Recon, Facilities), one answered question each.
 * - math / logs / attach: the /orion page (`OrionConversationList` + `OrionChat`)
 *   playing a thread forward on a loop (`scripted-thread.tsx`): a decline
 *   chart worked, a LAS log interpreted, or a photo sent in, read and carded.
 * - approval: the `ApprovalCard` alone, pending.
 * - memory: Settings > AI > Orion (`OrionContextEditor`), history open.
 * - voice: `VoiceOverlay` over the dashboard, a gauge said aloud.
 * - permissions: Settings > AI > Permissions (`AiPermissionsTable`).
 */
import { useState } from "react";
import { DashboardOverview } from "@/components/analytics/dashboard-overview";
import { ProductionByWellPie } from "@/components/analytics/production-by-well-pie";
import { ApprovalCard, pendingApprovals } from "@/components/ai/tool-approval";
import { VoiceOverlay } from "@/components/ai/voice-overlay";
import { PermissionsProvider } from "@/components/auth/permissions-context";
import { FacilitiesFlowMap } from "@/components/facilities/flow-map";
import { MapFilters, type Filters } from "@/components/scout/map-filters";
import { AiPermissionsTable } from "@/components/settings/ai-permissions-table";
import { OrionContextEditor } from "@/components/settings/orion-context-editor";
import { ScreenPanel } from "@/components/screens/panel";
import { ReconMap } from "@/components/screens/recon-map";
import { DEFAULT_OFF } from "@/lib/ai/tool-permissions";
import { nodeId } from "@/lib/facilities/graph";
import { dashboardFixture } from "@/lib/screens/dashboard-fixture";
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
import { smith4LogThread } from "@/lib/screens/orion-las-fixture";
import { reconFilters, reconPrices, A3_LNG_LAT } from "@/lib/screens/recon-fixture";
import { OrionDrawerScreen } from "./drawer";
import { ScriptedOrionPage } from "./scripted-thread";

function Dashboard() {
  const fx = dashboardFixture();
  return (
    <DashboardOverview
      {...fx.cards}
      monthly={fx.monthly}
      byWellMonthly={fx.byWellMonthly}
      dailyByWell={fx.dailyByWell}
      prices={fx.prices}
      nriByLease={fx.nriByLease}
      companyNri={fx.companyNri}
      leaseRows={fx.leaseRows}
      wellRows={fx.wellRows}
      chartLeases={fx.chartLeases}
      pie={<ProductionByWellPie wells={fx.pieWells} leaseByWell={fx.leaseByWell} />}
    />
  );
}

/** 1. Reads your operation: the Dashboard with Smith's September answered in the drawer. */
export function OrionReadsScreen() {
  const [conversation] = useState(smithSeptemberThread);
  return (
    <OrionDrawerScreen path="/dashboard" conversation={conversation} pagePad>
      <Dashboard />
    </OrionDrawerScreen>
  );
}


/** 2. The state's record: Recon on Johnson A 3's offsets, listed in the drawer. */
export function OrionRrcScreen() {
  const [conversation] = useState(offsetsThread);
  const [filters, setFilters] = useState<Filters>({ ...reconFilters, mode: "wells" });
  return (
    <OrionDrawerScreen path="/recon" conversation={conversation}>
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
          <ReconMap center={A3_LNG_LAT} zoom={12.2} basemap="map" pin={{ lngLat: A3_LNG_LAT, color: "#111827", label: "Johnson A 3" }} />
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

/** Reads your logs: Smith 4's LAS attached from Files, read whole, tops and pay worked. */
export function OrionLogsScreen() {
  const [conversation] = useState(smith4LogThread);
  return <ScriptedOrionPage conversation={conversation} holdMs={8000} />;
}

const flowGraph = flowMapGraph();

/** 4. Knows the page: the Facilities flow map on Smith, asked what feeds T201. */
export function OrionContextScreen() {
  const [conversation] = useState(t201FeedThread);
  return (
    <OrionDrawerScreen path="/facilities" conversation={conversation}>
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

/** 5. Asks before it writes: the approval card on its own, waiting. */
export function OrionApprovalScreen() {
  const [request] = useState(() => pendingOf(smithReadingPart("pending")));
  return (
    <ScreenPanel w={760} h={300} path="/orion">
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[560px]">
          <ApprovalCard request={request} onApprove={() => {}} onDeny={() => {}} />
        </div>
      </div>
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
        <Dashboard />
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
