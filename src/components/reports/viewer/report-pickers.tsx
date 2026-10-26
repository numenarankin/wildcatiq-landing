"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  nextParams,
  type ReportParams,
  type ReportPicker,
} from "@/lib/reports/hub/params";

/** The Select value standing for "nothing picked" (an empty value reads as unset). */
const ALL = "__all";

/**
 * A report's pickers (the period of a period report, Gauge History's battery
 * and tank). Every pick lives in the URL, so the page, its downloads and a
 * shared link all read the same selection.
 */
export function ReportPickers({
  reportId,
  params,
  pickers,
  className,
}: {
  reportId: string;
  params: ReportParams;
  pickers: ReportPicker[];
  /** Extra classes for the group's row (alignment). */
  className?: string;
}) {
  // landing: the app pushes the pick into the URL and the server re-renders;
  // the landing has no reports route to push to, so a pick goes nowhere.
  function pick(picker: ReportPicker, value: string) {
    void new URLSearchParams({ report: reportId, ...nextParams(params, picker, value) });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {pickers.map((picker) => {
        const labelOf = (v: string) =>
          v === ALL
            ? (picker.allLabel ?? "")
            : (picker.options.find((o) => o.value === v)?.label ?? v);
        const current = picker.value || ALL;
        return (
          <Select
            key={picker.param}
            value={current}
            onValueChange={(v) => {
              if (v == null || v === current) return;
              pick(picker, v === ALL ? "" : String(v));
            }}
          >
            <SelectTrigger className="h-9 min-w-48">
              <SelectValue>{(v) => labelOf(String(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {picker.allLabel ? (
                <SelectItem value={ALL}>{picker.allLabel}</SelectItem>
              ) : null}
              {picker.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}
