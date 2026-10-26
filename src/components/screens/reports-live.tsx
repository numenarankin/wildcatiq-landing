"use client";

/**
 * The reports hub as the app renders it: `src/app/reports/page.tsx` laid out
 * with the app's own ReportNav, ReportMarkdown (KPI tiles, narrative, charts
 * and tables drawn by the same code as the PDF), download menu and the Report
 * settings button, fed the fixture digest instead of the 2am compile.
 *
 * The delivery panel is the real `ReportScheduleTable` inside the real
 * `SwipeUpModal` in its inline mode. The modal otherwise portals to
 * `document.body`, which would put it outside the scaled canvas, so the card
 * and the backdrop layers are laid here with the modal's own classes; `fixed`
 * positions against the canvas because the canvas is transformed.
 */
import { useState } from "react";
import { ExternalLinkIcon, SettingsIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PermissionsProvider } from "@/components/auth/permissions-context";
import { ReportMarkdown } from "@/components/reports/viewer/report-markdown";
import { ReportDownloadMenu } from "@/components/reports/viewer/download-menu";
import { ReportNav } from "@/components/reports/viewer/report-nav";
import { ReportScheduleTable } from "@/components/reports/schedule-table";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { DIGEST_ID, reportsFixture } from "@/lib/screens/reports-fixture";
import { AppFrame } from "./app-frame";

/** The app header's height (h-14) and the open sidebar's width (16rem), which the backdrop cuts around. */
const HEADER_H = 56;
const SIDEBAR_W = 256;

export function ReportsLive({ settings = true }: { settings?: boolean }) {
  const fx = reportsFixture();
  const [open, setOpen] = useState(settings);

  const actions = (
    <>
      <a
        href={fx.downloadHrefs.pdf}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ size: "lg", variant: "outline" })}
      >
        <ExternalLinkIcon />
        View in new tab
      </a>
      <ReportDownloadMenu hrefs={fx.downloadHrefs} csvLabel="CSV (.zip)" />
    </>
  );

  return (
    <AppFrame path="/reports" crumbs={["Reports"]}>
      <PermissionsProvider permissions={["admin", "view_reports"]}>
        <div className="flex min-h-0 flex-1 flex-col gap-6">
          <div className="flex items-center justify-end gap-1.5 pb-2">
            {/* `ConfigureButton`'s trigger; its modal is laid out below. */}
            <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
              <SettingsIcon />
              Report settings
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 lg:flex-row">
            <div className="w-full shrink-0 self-start lg:sticky lg:top-14 lg:max-h-[calc(100svh-3.5rem)] lg:w-72 lg:overflow-y-auto lg:pb-6">
              <ReportNav
                groups={fx.navGroups}
                selectedId={DIGEST_ID}
                basePath="/reports"
                param="report"
                openGroup="Company"
              />
            </div>

            {/* landing: the app scrolls the window; the canvas has no window to
                scroll, so the document column scrolls in its own right. */}
            <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
              <ReportMarkdown markdown={fx.markdown} narration={fx.narration} actions={actions} />
            </div>
          </div>
        </div>

        {open ? (
          <>
            {/* The backdrop, in the modal's pieces: the page below the header
                and the strip beside it over the sidebar's top. */}
            <div className="pointer-events-none fixed inset-0 z-[100]">
              <div
                className="pointer-events-auto absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm transition-colors duration-300"
                style={{ top: HEADER_H }}
                onClick={() => setOpen(false)}
              />
              <div
                className="pointer-events-auto absolute top-0 left-0 bg-black/50 backdrop-blur-sm transition-colors duration-300"
                style={{ width: SIDEBAR_W, height: HEADER_H }}
                onClick={() => setOpen(false)}
              />
            </div>
            <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Report delivery"
                className="pointer-events-auto flex max-h-[90vh] w-full max-w-md max-w-4xl flex-col overflow-hidden rounded-md bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10"
              >
                <SwipeUpModal
                  open
                  inline
                  inlineHeader
                  onClose={() => setOpen(false)}
                  title="Report delivery"
                  description="Which reports are emailed to you, how often, and in what format."
                  className="max-w-4xl"
                >
                  {/* The modal shell supplies no padding around its children. */}
                  <div className="overflow-y-auto px-5 py-5">
                    <ReportScheduleTable rows={fx.scheduleRows} schedule={fx.schedule} />
                  </div>
                </SwipeUpModal>
              </div>
            </div>
          </>
        ) : null}
      </PermissionsProvider>
    </AppFrame>
  );
}
