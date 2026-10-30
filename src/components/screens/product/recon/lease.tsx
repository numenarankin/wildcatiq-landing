"use client";

/**
 * Evaluating a lease to buy: Recon on satellite over Tonk Creek Operating's
 * Harlan Ranch, west of Sky's Johnson A, played on a loop. The camera eases
 * in from the county, the pointer presses Harlan Ranch 1, its well dossier
 * opens, the pointer follows the Lease link and the lease dossier
 * (`ScoutLeaseModal` -> `LeaseModal`) replaces it, as the app's modal stack
 * does. Then the tabs a buy decision reads: Production, Allowables (the
 * tank balances and filing record), Disposition, Wells and Purchaser. The
 * dossier closes and the camera eases back out.
 *
 * Every figure is the mirror's (`recon-tonk-fixture.ts`): the same monthly
 * series the operator dossier sums and Orion quotes.
 */
import { useMemo, useRef, useState, type RefObject } from "react";
import { ScoutLeaseModal } from "@/components/scout/scout-lease-modal";
import { WellModal } from "@/components/scout/well-modal";
import { DOSSIER_MODAL_CLASS } from "@/components/scout/modal-ui";
import { HARLAN_KEY, HARLAN_VIEW, HR1, harlanRanch1Dossier } from "@/lib/screens/recon-tonk-fixture";
import { cn } from "@/lib/utils";
import type { ReconMapHandle } from "../../recon-map";
import { DemoCursor } from "./cursor";
import { DossierOverlay, SatScene, mapPointInViewport } from "./sat-scene";
import { buttonIn, tabIn, useTour, type TourStep } from "./tour";

const noop = () => {};
const COUNTY = { center: [-98.66, 33.14] as [number, number], zoom: 10.9 };

type Open = null | "well" | "lease";

interface Ctx {
  map: RefObject<ReconMapHandle | null>;
  pane: RefObject<HTMLDivElement | null>;
  card: RefObject<HTMLDivElement | null>;
  setOpen: (o: Open) => void;
}

const tab = (label: string, ms: number): TourStep<Ctx>[] => [
  { id: `to-${label}`, ms: 900, run: (t, c) => t.aim(tabIn(c.card.current, label)) },
  { id: label, ms, run: (t, c) => t.press(tabIn(c.card.current, label)) },
];

const STEPS: TourStep<Ctx>[] = [
  {
    id: "county",
    ms: 2200,
    run: (t, c) => {
      t.hide();
      c.setOpen(null);
      c.map.current?.highlight(null);
    },
  },
  {
    id: "fly",
    ms: 3400,
    run: (t, c) => {
      c.map.current?.flyTo({ ...HARLAN_VIEW, duration: 3100 });
      const r = c.pane.current?.getBoundingClientRect();
      if (r) t.aimViewport(r.left + r.width * 0.78, r.top + r.height * 0.85, c.pane.current);
    },
  },
  {
    id: "aim",
    ms: 1000,
    run: (t, c) => {
      const p = mapPointInViewport(c.map.current, c.pane.current, HR1.lngLat);
      if (p) t.aimViewport(p.x, p.y, p.from);
    },
  },
  {
    id: "press",
    ms: 500,
    run: (t, c) => {
      c.map.current?.highlight(HR1.lngLat);
      t.press();
    },
  },
  { id: "well", ms: 2600, run: (_, c) => c.setOpen("well") },
  { id: "to-lease", ms: 1000, run: (t, c) => t.aim(buttonIn(c.card.current, "Harlan Ranch")) },
  // The well dossier's own Lease link, so its `onSelectLease` opens the lease.
  { id: "lease", ms: 3600, run: (t, c) => t.press(buttonIn(c.card.current, "Harlan Ranch")) },
  ...tab("Production", 5200),
  ...tab("Allowables", 3400),
  ...tab("Disposition", 4400),
  ...tab("Wells", 4000),
  ...tab("Purchaser", 4400),
  {
    id: "close",
    ms: 3400,
    run: (t, c) => {
      t.hide();
      c.setOpen(null);
      c.map.current?.highlight(null);
      c.map.current?.flyTo({ ...COUNTY, duration: 3100 });
    },
  },
];

export function ReconLeaseScreen() {
  const map = useRef<ReconMapHandle | null>(null);
  const pane = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [open, setOpen] = useState<Open>(null);
  const well = useMemo(() => harlanRanch1Dossier(), []);
  const ctx = useMemo<Ctx>(() => ({ map, pane, card, setOpen }), []);
  const { step, loop, cursor } = useTour(STEPS, ctx, drawn);

  return (
    <SatScene
      center={COUNTY.center}
      zoom={COUNTY.zoom}
      paneRef={pane}
      onMapReady={(h) => (map.current = h)}
      onMapDrawn={() => setDrawn(true)}
    >
      <div data-phase={step} className="hidden" />
      <DossierOverlay open={open !== null} label={open === "lease" ? "Lease" : "Well"} rootRef={card}>
        <div className={cn(DOSSIER_MODAL_CLASS, "flex h-full w-full flex-col")}>
          {open === "well" && (
            <WellModal
              well={well}
              apiNumber={HR1.api}
              open
              inline
              onClose={noop}
              onSelectOperator={noop}
              onSelectPrincipal={noop}
              onSelectLease={() => setOpen("lease")}
            />
          )}
          {open === "lease" && (
            <ScoutLeaseModal
              key={loop}
              inline
              leaseKey={HARLAN_KEY}
              initialTab="summary"
              onClose={noop}
              onSelectOperator={noop}
              onSelectWell={noop}
            />
          )}
        </div>
      </DossierOverlay>
      {cursor && <DemoCursor {...cursor} />}
    </SatScene>
  );
}
