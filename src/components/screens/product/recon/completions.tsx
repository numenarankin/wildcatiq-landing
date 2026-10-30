"use client";

/**
 * Completion records: Recon on satellite over the Caddo wells west of
 * Johnson A, played on a loop. The camera eases in, the pointer presses
 * Harlan Ranch 1 (Tonk Creek's first Caddo well, May 2024) and the app's well
 * dossier (`WellModal`) opens. The pointer opens Completions: the completion
 * row, the wellbore construction (casing set at 426 and 4,402 ft, the Caddo
 * perforated 3,946 to 3,972 ft) and, scrolled to, the filed W-2 with every
 * formation the bit went through and the one isolated. Then Location: the
 * surface and bottomhole on satellite, and whether the hole is vertical. The
 * dossier closes and the camera eases back out.
 *
 * The record is `harlanRanch1Dossier()` (`recon-tonk-fixture.ts`).
 */
import { useMemo, useRef, useState, type RefObject } from "react";
import { WellModal } from "@/components/scout/well-modal";
import { DOSSIER_MODAL_CLASS } from "@/components/scout/modal-ui";
import { HARLAN_VIEW, HR1, harlanRanch1Dossier } from "@/lib/screens/recon-tonk-fixture";
import { cn } from "@/lib/utils";
import type { ReconMapHandle } from "../../recon-map";
import { DemoCursor } from "./cursor";
import { DossierOverlay, SatScene, mapPointInViewport } from "./sat-scene";
import { tabIn, useTour, type TourStep } from "./tour";

const noop = () => {};
const COUNTY = { center: [-98.66, 33.14] as [number, number], zoom: 10.9 };

/** Scroll the dossier's tab pane (not the page) until the panel titled `heading` is at its top. */
function scrollTo(card: HTMLElement | null, heading: string) {
  if (!card) return;
  const el = Array.from(card.querySelectorAll<HTMLElement>("h2, h3, div, span")).find(
    (n) => n.childElementCount === 0 && (n.textContent ?? "").startsWith(heading)
  );
  let pane: HTMLElement | null = el?.parentElement ?? null;
  while (pane && pane !== card && !(pane.scrollHeight > pane.clientHeight + 4 && getComputedStyle(pane).overflowY !== "visible")) {
    pane = pane.parentElement;
  }
  if (!el || !pane || pane === card) return;
  const scale = pane.getBoundingClientRect().height / (pane.offsetHeight || 1);
  const top = pane.scrollTop + (el.getBoundingClientRect().top - pane.getBoundingClientRect().top) / scale - 12;
  pane.scrollTo({ top, behavior: "smooth" });
}

interface Ctx {
  map: RefObject<ReconMapHandle | null>;
  pane: RefObject<HTMLDivElement | null>;
  card: RefObject<HTMLDivElement | null>;
  setOpen: (o: boolean) => void;
}

const STEPS: TourStep<Ctx>[] = [
  {
    id: "county",
    ms: 2200,
    run: (t, c) => {
      t.hide();
      c.setOpen(false);
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
  { id: "summary", ms: 2800, run: (_, c) => c.setOpen(true) },
  { id: "to-completions", ms: 900, run: (t, c) => t.aim(tabIn(c.card.current, "Completions")) },
  { id: "completions", ms: 4600, run: (t, c) => t.press(tabIn(c.card.current, "Completions")) },
  {
    id: "packet",
    ms: 6400,
    run: (t, c) => {
      t.hide();
      scrollTo(c.card.current, "Completion report");
    },
  },
  { id: "to-location", ms: 900, run: (t, c) => t.aim(tabIn(c.card.current, "Location")) },
  { id: "location", ms: 6400, run: (t, c) => t.press(tabIn(c.card.current, "Location")) },
  {
    id: "close",
    ms: 3400,
    run: (t, c) => {
      t.hide();
      c.setOpen(false);
      c.map.current?.highlight(null);
      c.map.current?.flyTo({ ...COUNTY, duration: 3100 });
    },
  },
];

export function ReconCompletionsScreen() {
  const map = useRef<ReconMapHandle | null>(null);
  const pane = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [open, setOpen] = useState(false);
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
      <DossierOverlay open={open} label="Well" rootRef={card}>
        <div className={cn(DOSSIER_MODAL_CLASS, "flex h-full w-full flex-col")}>
          <WellModal
            key={loop}
            well={well}
            apiNumber={HR1.api}
            open
            inline
            onClose={noop}
            onSelectOperator={noop}
            onSelectPrincipal={noop}
            onSelectLease={noop}
          />
        </div>
      </DossierOverlay>
      {cursor && <DemoCursor {...cursor} />}
    </SatScene>
  );
}
