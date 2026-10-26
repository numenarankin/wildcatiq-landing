"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableHead } from "@/components/ui/table";
import { SettingsRow, SettingsTable } from "@/components/settings/panel";
// landing: the app saves the cell through a server action; the demo keeps it in state.
async function setToolPermission(area: string, action: AiToolAction, allowed: boolean): Promise<void> {
  void area;
  void action;
  void allowed;
}
import {
  AI_TOOL_ACTIONS,
  TOGGLEABLE_AREAS,
  cellKey,
  populatedCells,
  type AiToolAction,
} from "@/lib/ai/tool-permissions";

const ACTION_LABELS: Record<AiToolAction, string> = {
  read: "Read",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
};

/**
 * What Orion may do, by area. Each switch is one (area, action) cell of
 * `ai_tool_permissions`; turning one off stops the tools behind it from running
 * at all, which is enforced on the way into every tool body rather than by
 * asking the model to behave (`docs/plans/orion-tool-permissions.md`).
 *
 * The rows are the areas that CAN be switched: the public record, the geology
 * library, the web and the user's own remembered preferences are left out
 * entirely, since none of them reach anything of the company's.
 *
 * The columns are the actions some tool actually performs, so Delete is absent:
 * Orion creates and updates, and has no tool that deletes anything. A column
 * appears the day a tool is classified into it. Within a column, an area with no
 * tool for that action renders as a dash rather than an off switch, so "turned
 * off" and "there is nothing here" do not look alike.
 */
export function AiPermissionsTable({
  disabled,
  onError,
}: {
  /** `area:action` keys the org has turned off. Absent = allowed. */
  disabled: string[];
  onError: (message: string) => void;
}) {
  const [off, setOff] = useState(() => new Set(disabled));
  const [, startTransition] = useTransition();
  const populated = populatedCells();
  const actions = AI_TOOL_ACTIONS.filter((action) =>
    TOGGLEABLE_AREAS.some((area) => populated.has(cellKey(area.id, action))),
  );

  function toggle(area: string, action: AiToolAction, next: boolean) {
    const key = cellKey(area, action);
    const optimistic = new Set(off);
    if (next) optimistic.delete(key);
    else optimistic.add(key);
    setOff(optimistic);
    // The switch flips and stays flipped. Disabling it while the write is in
    // flight only paints a not-allowed cursor over the control the user is
    // still pointing at; a failure reverts it and says why.
    startTransition(async () => {
      try {
        await setToolPermission(area, action, next);
      } catch (err) {
        setOff((current) => {
          const reverted = new Set(current);
          if (next) reverted.add(key);
          else reverted.delete(key);
          return reverted;
        });
        onError(err instanceof Error ? err.message : "Couldn't save that.");
      }
    });
  }

  return (
    <SettingsTable
      head={
        <>
          <TableHead>Area</TableHead>
          {actions.map((action) => (
            <TableHead key={action} className="w-24 text-center">
              {ACTION_LABELS[action]}
            </TableHead>
          ))}
        </>
      }
    >
      {TOGGLEABLE_AREAS.map((area) => (
        <SettingsRow key={area.id}>
          <TableCell className="font-medium">{area.label}</TableCell>
          {actions.map((action) => {
            const key = cellKey(area.id, action);
            if (!populated.has(key)) {
              return (
                <TableCell
                  key={action}
                  className="text-center text-muted-foreground"
                >
                  &ndash;
                </TableCell>
              );
            }
            return (
              <TableCell key={action} className="text-center">
                <Switch
                  checked={!off.has(key)}
                  onCheckedChange={(next) => toggle(area.id, action, next)}
                  aria-label={`${ACTION_LABELS[action]} ${area.label}`}
                />
              </TableCell>
            );
          })}
        </SettingsRow>
      ))}
    </SettingsTable>
  );
}
