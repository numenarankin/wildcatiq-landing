"use client";

/**
 * The Reports page's section screens: the hub (`src/app/reports/page.tsx`)
 * with one report open in each, built by the app's own loaders and markdown
 * builders over the shared operator (`reports-fixture.ts`).
 */
import { PermissionsProvider } from "@/components/auth/permissions-context";
import { ReportMarkdown } from "@/components/reports/viewer/report-markdown";
import { ReportNav } from "@/components/reports/viewer/report-nav";
import {
  pumperDoc,
  reportsFixture,
  tanksCalledInDoc,
  type HubDocument,
} from "@/lib/screens/reports-fixture";
import { ScreenPanel } from "../../panel";
import { Actions, PickerRow } from "./hub";
import { DigestLive, LibraryLive, OutputsLive, ProductionLive, ScheduleLive } from "./live";

const PATH = "/reports";

/** One document as the hub renders it, with or without the report list beside it. */
function Hub({ doc, nav = false }: { doc: HubDocument; nav?: boolean }) {
  const fx = reportsFixture();
  return (
    <PermissionsProvider permissions={["admin", "view_reports"]}>
      <div className="flex min-h-0 flex-1 gap-6">
        {nav ? (
          <div className="w-72 shrink-0 self-start">
            <ReportNav groups={fx.navGroups} selectedId={doc.id} basePath="/reports" param="report" openGroup="Company" />
          </div>
        ) : null}
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <ReportMarkdown
            markdown={doc.markdown}
            narration={doc.narration}
            actions={<Actions doc={doc} />}
            pickers={PickerRow({ doc })}
          />
        </div>
      </div>
    </PermissionsProvider>
  );
}

/** Section 1: the report list, reports picked in turn (`LibraryLive`). */
export const LibraryScreen = LibraryLive;

/** Section 2: the Daily Company Digest picked and read down (`DigestLive`). */
export const DigestScreen = DigestLive;

/** Section 3: the production reports picked in turn, monthly to exceptions (`ProductionLive`). */
export const VarianceScreen = ProductionLive;

/** Section 4: Tanks Called In, the pickup queue this month. */
export function TanksScreen() {
  return (
    <ScreenPanel w={1200} h={330} path={PATH}>
      <Hub doc={tanksCalledInDoc()} />
    </ScreenPanel>
  );
}

/** Section 5: the Pumper Report with its coverage chart. */
export function PumperScreen() {
  return (
    <ScreenPanel w={1200} h={760} path={PATH}>
      <Hub doc={pumperDoc()} />
    </ScreenPanel>
  );
}

/** Section 6: Narrate pressed and stopped, then the Download menu opened (`OutputsLive`). */
export const OutputsScreen = OutputsLive;

/** Section 7: the Report delivery modal over the hub, switches flipped (`ScheduleLive`). */
export const ScheduleScreen = ScheduleLive;
