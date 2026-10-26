"use client";

/**
 * landing: shim of the app's facility-create-menu.tsx. The app's menu opens the
 * tank / meter / well / battery create dialogs, which sit on server actions and
 * form components the landing does not carry. The trigger button is the app's
 * own markup (its classes and icons), so the toolbar reads the same.
 * `FacilityCatalog` and `Draft` are the app's types.
 *
 * landing: with `defaultOpen` the menu is drawn open under the trigger: the
 * app's items, icons, order and lease gate (`manage_leases`), in the
 * DropdownMenuContent / DropdownMenuItem classes. It is laid in place rather
 * than through the Base UI portal, which would mount it outside the scaled
 * screen canvas. Picking an item opens nothing.
 */
import {
  ChevronDownIcon,
  CircleDotIcon,
  CylinderIcon,
  DropletIcon,
  GaugeIcon,
  LayersIcon,
  MapIcon,
  PlusIcon,
  type LucideIcon,
} from "lucide-react";
import { useCan } from "@/components/auth/permissions-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FacilityEdge, FacilityNode } from "@/lib/facilities/graph";

/** Mirror of the app's `BatteryTankOption` (battery-form-dialog.tsx). */
export interface BatteryTankOption {
  id: string;
  name: string;
  battery: string;
  bblPerInch: number;
  product?: "oil" | "water";
  leaseId?: string | null;
}

/** Everything the create dialogs need to offer their pickers. */
export interface FacilityCatalog {
  wells: { id: string; name: string; leaseId?: string | null }[];
  injectionWells: { id: string; name: string; leaseId?: string | null }[];
  batteries: { id: string; name: string; leaseId?: string | null }[];
  gatherers: { id: string; name: string }[];
  leases: { id: string; name: string }[];
  meters: {
    id: string;
    name: string;
    leaseId?: string | null;
    substance?: "gas" | "water";
  }[];
  tanks: BatteryTankOption[];
}

export type Draft =
  | "lease"
  | "producing-well"
  | "disposal-well"
  | "oil-tank"
  | "water-tank-production"
  | "water-tank-disposal"
  | "gas-meter"
  | "battery";

const ITEM =
  "relative flex cursor-default items-center gap-1.5 rounded-sm px-1.5 py-1 text-sm outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
const SEPARATOR = "-mx-1 my-1 h-px bg-border";

export function FacilityCreateMenu({
  className,
  hideTrigger = false,
  defaultOpen = false,
}: {
  catalog: FacilityCatalog;
  className?: string;
  align?: "start" | "end";
  elevated?: boolean;
  onCreated?: (node: FacilityNode) => void;
  onPending?: (node: FacilityNode, edges: FacilityEdge[]) => void;
  onSettled?: (tempId: string, real: FacilityNode | null) => void;
  draft?: Draft | null;
  onDraftChange?: (draft: Draft | null) => void;
  hideTrigger?: boolean;
  defaultOpen?: boolean;
}) {
  const canManageLeases = useCan("manage_leases");
  if (hideTrigger) return null;
  const groups: { Icon: LucideIcon; label: string }[][] = [
    [
      { Icon: CircleDotIcon, label: "Producing well" },
      { Icon: DropletIcon, label: "Disposal well" },
    ],
    [
      { Icon: CylinderIcon, label: "Oil tank" },
      { Icon: CylinderIcon, label: "Saltwater tank (production)" },
      { Icon: CylinderIcon, label: "Saltwater tank (disposal)" },
    ],
    [{ Icon: GaugeIcon, label: "Gas meter" }],
    [
      ...(canManageLeases ? [{ Icon: MapIcon, label: "Lease" }] : []),
      { Icon: LayersIcon, label: "Tank battery" },
    ],
  ];
  return (
    <div className="relative">
      <Button size="sm" variant="outline" className={cn("h-10", defaultOpen && "bg-muted", className)}>
        <PlusIcon className="size-4" />
        New facility
        <ChevronDownIcon className="size-4" />
      </Button>
      {defaultOpen ? (
        <div className="absolute top-full right-0 z-50 mt-1 w-52 rounded-md bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {groups.map((items, gi) => (
            <div key={gi}>
              {gi > 0 ? <div className={SEPARATOR} /> : null}
              {items.map(({ Icon, label }, i) => (
                <div key={label} className={cn(ITEM, "cursor-pointer", gi === 1 && i === 0 && "bg-accent text-accent-foreground")}>
                  <Icon />
                  {label}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
