"use client";

/**
 * The Reports schedule: one row per report, one column per frequency, a switch
 * in every cell.
 *
 * Rows come from the reports hub (already capability-filtered), so the grid
 * offers exactly the reports the reader can open. A report the cron cannot yet
 * build for a background job shows its switches disabled rather than accepting a
 * schedule it would silently never send. Above the grid sit the delivery options
 * - attachment format, hour, timezone - which are one choice shared by every
 * scheduled report.
 *
 * Plain rules, no frame: this table renders inside a modal as often as on a
 * settings page, and the house `SettingsTable` (an outlined box with a filled
 * header band) reads as a panel nested in a panel there. Full width, one hairline
 * per row, nothing else.
 */

import { useTransition } from "react";
// landing: sonner is not installed here; same call shape.
import { toast } from "@/lib/landing/toast";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useCan } from "@/components/auth/permissions-context";
import { useServerState } from "@/hooks/use-server-state";
import {
  cellKey,
  FREQUENCY_LABEL,
  SCHEDULE_FREQUENCIES,
  type ScheduleRow,
} from "@/lib/reports/schedule/catalog";
import {
  saveReportDelivery,
  setReportScheduleCell,
  type ReportDelivery,
  type ReportSchedule,
} from "@/lib/reports/schedule/actions";
import type { DigestPeriod } from "@/lib/reports/digest/period";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  { value: "America/Chicago", label: "Central" },
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Los_Angeles", label: "Pacific" },
];

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function hourLabel(h: number): string {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${h < 12 ? "AM" : "PM"}`;
}

export function ReportScheduleTable({
  rows,
  schedule,
}: {
  rows: ScheduleRow[];
  schedule: ReportSchedule;
}) {
  const canManage = useCan([
    "admin",
    "manage_oil_production",
    "manage_gas_production",
    "manage_disposal",
    "manage_statements",
  ]);
  // Local copy so a switch flips at once; re-seeds from the server after the
  // write's revalidate lands.
  const [state, setState] = useServerState(schedule);
  const [, startTransition] = useTransition();

  function toggle(row: ScheduleRow, frequency: DigestPeriod) {
    const key = cellKey(row.id, frequency);
    const next = !state.cells[key];
    setState((prev) => ({ ...prev, cells: { ...prev.cells, [key]: next } }));
    startTransition(async () => {
      try {
        await setReportScheduleCell(row.id, frequency, next);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          cells: { ...prev.cells, [key]: !next },
        }));
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the schedule."
        );
      }
    });
  }

  function saveDelivery(delivery: ReportDelivery) {
    const previous = state;
    setState((prev) => ({ ...prev, ...delivery }));
    startTransition(async () => {
      try {
        await saveReportDelivery(delivery);
      } catch (error) {
        setState(previous);
        toast.error(
          error instanceof Error ? error.message : "Couldn't save settings."
        );
      }
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Field label="Arrives at">
          <Select
            value={String(state.sendHour)}
            onValueChange={(hour) =>
              saveDelivery({
                sendHour: Number(hour ?? state.sendHour),
                timezone: state.timezone,
              })
            }
          >
            <SelectTrigger className="w-32" disabled={!canManage}>
              <span>{hourLabel(state.sendHour)}</span>
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {hourLabel(h)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={state.timezone}
            onValueChange={(timezone) =>
              saveDelivery({
                sendHour: state.sendHour,
                timezone: timezone ?? state.timezone,
              })
            }
          >
            <SelectTrigger className="w-36" disabled={!canManage}>
              <span>
                {TIMEZONES.find((t) => t.value === state.timezone)?.label}
              </span>
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-4 text-left font-medium">
              Report
            </th>
            <th scope="col" className="py-2 pr-4 text-left font-medium">
              Section
            </th>
            {SCHEDULE_FREQUENCIES.map((f) => (
              <th
                key={f}
                scope="col"
                className="w-24 py-2 pl-4 text-right font-medium"
              >
                {FREQUENCY_LABEL[f]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td
                className={cn(
                  "py-3 pr-4 font-medium",
                  !row.deliverable && "text-muted-foreground"
                )}
              >
                {row.title}
              </td>
              <td className="py-3 pr-4 text-muted-foreground">
                {row.deliverable ? row.group : `${row.group} · not emailable yet`}
              </td>
              {SCHEDULE_FREQUENCIES.map((f) => {
                const on = state.cells[cellKey(row.id, f)] ?? false;
                return (
                  <td key={f} className="py-3 pl-4">
                    <div className="flex justify-end">
                      <Switch
                        checked={on}
                        disabled={!row.deliverable || !canManage}
                        onCheckedChange={() => toggle(row, f)}
                        aria-label={
                          row.deliverable
                            ? `${on ? "Stop" : "Start"} emailing ${row.title} ${FREQUENCY_LABEL[f].toLowerCase()}`
                            : `${row.title} cannot be emailed yet`
                        }
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A settings row: its label on the left, its control flush to the right. */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
