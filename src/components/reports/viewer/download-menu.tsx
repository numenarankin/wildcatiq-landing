"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat } from "@/lib/export/mime";

/**
 * One Download control for a report, with the format picked from a menu. Each item is a plain link to the sample route, so the browser handles
 * the download the same way it would a real export.
 */
export function ReportDownloadMenu({
  hrefs,
  csvLabel,
  container,
}: {
  /** Download URL per format. */
  hrefs: Record<ExportFormat, string>;
  /** "CSV" or "CSV (.zip)" - a multi-table export ships one CSV per table. */
  csvLabel: string;
  /**
   * landing: a demo's canvas to open the menu inside (see
   * `DropdownMenuContent`). Set, the menu is also non-modal, so opening it
   * never locks the marketing page's scroll. Unset, the app's behaviour.
   */
  container?: HTMLElement | null;
}) {
  const formats: { format: ExportFormat; label: string }[] = [
    { format: "pdf", label: "PDF" },
    { format: "xlsx", label: "Excel (.xlsx)" },
    { format: "csv", label: csvLabel },
  ];

  return (
    <DropdownMenu modal={container ? false : undefined}>
      <DropdownMenuTrigger render={<Button variant="default" size="lg" />}>
        <DownloadIcon />
        Download
      </DropdownMenuTrigger>
      {/* Right-aligned: the trigger sits at the pane's right edge. */}
      <DropdownMenuContent align="end" className="w-44" container={container ?? undefined}>
        {formats.map(({ format, label }) => (
          <DropdownMenuItem
            key={format}
            className="cursor-pointer"
            render={<a href={hrefs[format]} />}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
