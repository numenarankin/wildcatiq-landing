"use client";

/**
 * The pieces of the reports hub (`src/app/reports/page.tsx`) the section
 * screens share: the actions beside a document's title, the picker row under
 * it, and the page's loading skeleton.
 */
import type { ReactElement, ReactNode } from "react";
import { ExternalLinkIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportDownloadMenu } from "@/components/reports/viewer/download-menu";
import { ReportHeader } from "@/components/reports/viewer/report-header";
import { ReportPickers } from "@/components/reports/viewer/report-pickers";
import {
  DIGEST_ID,
  reportsFixture,
  type HubDocument,
} from "@/lib/screens/reports-fixture";

/** The page's actions beside a document's title: View in new tab and the Download menu. */
export function Actions({ doc, container }: { doc: HubDocument; container?: HTMLElement | null }) {
  return (
    <>
      <a
        href={doc.downloadHrefs.pdf}
        target="_blank"
        rel="noreferrer"
        className={buttonVariants({ size: "lg", variant: "outline" })}
      >
        <ExternalLinkIcon />
        View in new tab
      </a>
      <ReportDownloadMenu hrefs={doc.downloadHrefs} csvLabel={doc.csvLabel} container={container} />
    </>
  );
}

/** The page's picker row: the period at the left, the facility filters at the right. */
export function PickerRow({ doc }: { doc: HubDocument }) {
  if (doc.pickers.length === 0) return undefined;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ReportPickers reportId={doc.id} params={{}} pickers={doc.pickers.filter((p) => !p.filter)} />
      <ReportPickers
        reportId={doc.id}
        params={{}}
        pickers={doc.pickers.filter((p) => p.filter)}
        className="ml-auto justify-end"
      />
    </div>
  );
}

/** The Monthly Company Digest as a hub document, from the fixture's own digest. */
export function monthlyDigestDoc(): HubDocument {
  const fx = reportsFixture();
  return {
    id: DIGEST_ID,
    markdown: fx.markdown,
    narration: fx.narration,
    pickers: [],
    downloadHrefs: fx.downloadHrefs,
    csvLabel: "CSV (.zip)",
  };
}

/**
 * The page's `ReportSkeleton`, verbatim: the placeholder in the document's own
 * shape that the hub's Suspense shows while a picked report loads, sharing
 * `ReportHeader` so the actions never jump.
 */
export function ReportSkeleton({
  actions,
  pickers,
}: {
  actions: ReactNode;
  pickers?: ReactNode;
}): ReactElement {
  return (
    <div className="flex flex-col gap-6 px-8 pb-8" aria-busy="true">
      <ReportHeader
        title={<Skeleton className="h-8 w-56" />}
        actions={actions}
        pickers={pickers}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-4 w-full last:w-3/4" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Scroll `el` to `top` over `ms`, eased at both ends. Returns a cancel. */
export function glideTo(el: HTMLElement, top: number, ms: number): () => void {
  const from = el.scrollTop;
  const to = Math.max(0, Math.min(top, el.scrollHeight - el.clientHeight));
  const start = performance.now();
  let raf = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    el.scrollTop = from + (to - from) * e;
    if (t < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
