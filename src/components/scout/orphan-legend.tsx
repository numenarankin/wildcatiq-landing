"use client";

import { ORPHAN_COLORS, type OrphanCounts } from "@/lib/scout/orphan-filter";

/*
 * Key for the Orphans mode: the RRC's orphan list, coloured by whether the
 * state's wellbore record shows the hole plugged since (a W-3 or a plug date
 * not older than the lease's last production). Counts are of what is drawn
 * in view, beside the swatches, the way the permit key does it.
 */
function Swatch({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full ring-1 ring-white/70"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground">{label}</span>
      {count != null && (
        <span className="tabular-nums font-medium">{count.toLocaleString()}</span>
      )}
    </div>
  );
}

export function OrphanLegend({ counts }: { counts: OrphanCounts | null }) {
  return (
    <div className="absolute bottom-8 left-3 z-10 flex flex-col gap-1.5 rounded-lg border bg-background/95 p-2.5 text-xs shadow-lg backdrop-blur">
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <Swatch color={ORPHAN_COLORS.unplugged} label="Unplugged" count={counts?.unplugged} />
        <Swatch color={ORPHAN_COLORS.plugged} label="Plugged" count={counts?.plugged} />
      </div>
    </div>
  );
}
