"use client";

/**
 * Recon alerts: the app's alerts modal (`recon-alerts-modal.tsx`) in its card
 * with the one saved alert, beside the email that alert sent this morning,
 * written by the app's own `reconAlertEmail`.
 */
import { ReconAlertsModal } from "@/components/scout/recon-alerts-modal";
import { reconAlertEmailHtml, reconAlerts } from "@/lib/screens/recon-alerts-fixture";
import { ScreenPanel } from "../../panel";

export function ReconAlertsScreen() {
  const counties = reconAlerts[0].countyCodes;
  return (
    <ScreenPanel w={1280} h={720} path="/recon">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_540px] gap-8">
        <div className="flex h-[22rem] flex-col self-center overflow-hidden rounded-md bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10">
          <ReconAlertsModal open inline onClose={() => {}} currentCounties={counties} initialAlerts={reconAlerts} />
        </div>
        <div className="overflow-hidden rounded-md bg-white ring-1 ring-foreground/10">
          <iframe title="Recon alert email" srcDoc={reconAlertEmailHtml()} className="h-full w-full border-0" />
        </div>
      </div>
    </ScreenPanel>
  );
}
