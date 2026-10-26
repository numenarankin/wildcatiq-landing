"use client";

import { CircleIcon, DropletIcon, CylinderIcon, GaugeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacilityKind } from "@/lib/facilities/graph";
import { KIND_LABEL } from "@/components/facilities/substances";

/** The drag payload the canvas reads on drop (native HTML5 DnD). */
export const PALETTE_MIME = "application/x-wildcat-facility";

// Batteries are not placeable — a battery is just a grouping of tanks.
const ITEMS: { kind: FacilityKind; Icon: typeof CircleIcon }[] = [
  { kind: "well", Icon: CircleIcon },
  { kind: "tank", Icon: CylinderIcon },
  { kind: "meter", Icon: GaugeIcon },
  { kind: "injection", Icon: DropletIcon },
];

/**
 * The vertical facility palette on the left edge. Each item is a native drag
 * source; the canvas turns a drop into a provisional node at the drop point.
 * Persisting a dropped facility (a create dialog + write) is the next slice, so
 * dropped nodes are marked provisional until saved.
 */
export function FacilityPalette({ disabled }: { disabled?: boolean }) {
  return (
    <div className="pointer-events-auto flex flex-col gap-1 rounded-xl border bg-card/90 p-1 shadow-lg backdrop-blur">
      {ITEMS.map(({ kind, Icon }) => (
        <button
          key={kind}
          type="button"
          draggable={!disabled}
          onDragStart={(e) => {
            e.dataTransfer.setData(PALETTE_MIME, kind);
            e.dataTransfer.effectAllowed = "copy";
          }}
          title={`Drag to add a ${KIND_LABEL[kind]}`}
          className={cn(
            "flex w-10 cursor-grab flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5 text-black transition active:cursor-grabbing",
            "hover:bg-accent",
            disabled && "pointer-events-none opacity-40"
          )}
        >
          <Icon className="size-4 text-black" />
          <span className="text-[8px] font-semibold leading-none text-black">
            {KIND_LABEL[kind]}
          </span>
        </button>
      ))}
    </div>
  );
}
