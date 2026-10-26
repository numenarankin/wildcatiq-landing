"use client";

/**
 * Reusable Export control: a dropdown offering CSV / Excel / PDF on every
 * surface (wells, accounting, reports hub). The caller supplies `onExport`,
 * which resolves the chosen format however it likes (client-side serialize or a
 * server-route fetch). A spinner shows while an export is in flight.
 *
 * Gate this at the call site with the surface's `view_*` capability.
 */

import { useState } from "react";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat } from "@/lib/export/mime";

type ButtonProps = React.ComponentProps<typeof Button>;

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "csv", label: "CSV" },
  { format: "xlsx", label: "Excel (.xlsx)" },
  { format: "pdf", label: "PDF" },
];

export function ExportMenu({
  onExport,
  label = "Export",
  ariaLabel,
  size = "lg",
  variant = "outline",
  align = "end",
  disabled,
}: {
  onExport: (format: ExportFormat) => void | Promise<void>;
  /** Visible button text. Pass "" for an icon-only trigger (set `ariaLabel`). */
  label?: string;
  /** Accessible name for the trigger — used when `label` is empty. */
  ariaLabel?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  align?: "start" | "end";
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(format: ExportFormat) {
    if (busy) return;
    setBusy(true);
    try {
      await onExport(format);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setBusy(false);
    }
  }

  // An empty label renders an icon-only button (border kept via the outline
  // variant), sized to match the icon-button footprint.
  const iconOnly = !label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant={variant}
            size={iconOnly ? "icon-sm" : size}
            disabled={disabled || busy}
            aria-label={iconOnly ? ariaLabel ?? "Export" : ariaLabel}
          />
        }
      >
        {busy ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
        {label || null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        {FORMATS.map(({ format, label }) => (
          <DropdownMenuItem
            key={format}
            className="cursor-pointer"
            onClick={() => handle(format)}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
