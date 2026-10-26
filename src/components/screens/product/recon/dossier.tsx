"use client";

/**
 * The Johnson A lease dossier as the map opens it (`ScoutLeaseModal` ->
 * `LeaseModal`), framed as its card, played forward on a loop: the pointer
 * walks its tab row left to right, pressing Summary, Production,
 * Disposition, Counties, Wells and Purchaser and holding on each long enough
 * to read, then comes back to Summary.
 *
 * The presses are on the modal's own tab buttons, so `LeaseModal` switches
 * tabs through its own handler. The tab row is read from the page, so a tab
 * the lease does not get is never pressed.
 */
import { useEffect, useRef, useState } from "react";
import { ScoutLeaseModal } from "@/components/scout/scout-lease-modal";
import { DOSSIER_MODAL_CLASS } from "@/components/scout/modal-ui";
import { JOHNSON_A_KEY } from "@/lib/screens/recon-dossier-fixture";
import { cn } from "@/lib/utils";
import { ScreenPanel } from "../../panel";
import { useDemoActive } from "../../demo-active";
import { DemoCursor, centreOf, type CursorPoint } from "./cursor";

/**
 * The tabs pressed, in the row's order, and how long each is held. Allowables
 * is left out because its cycle table runs past the card and would show cut
 * off, and Map because it is a second Mapbox canvas inside the first.
 */
const HOLD_MS: Record<string, number> = {
  Summary: 3800,
  Production: 5400,
  Disposition: 4200,
  Counties: 3000,
  Wells: 3800,
  Purchaser: 4200,
};
/** The pointer's travel to the next tab before it presses. */
const AIM_MS = 1000;
/** The press, shown before the tab opens. */
const PRESS_MS = 250;

const noop = () => {};

const labelOf = (t: HTMLElement) => t.firstChild?.textContent?.trim() ?? "";

function tabsIn(root: HTMLElement | null): HTMLButtonElement[] {
  return Array.from(root?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []).filter(
    (t) => t.offsetWidth > 0 && labelOf(t) in HOLD_MS
  );
}

export function ReconDossierScreen() {
  const active = useDemoActive();
  const root = useRef<HTMLDivElement>(null);
  /** The tab being held (index into the row), and whether the pointer is on its way to the next. */
  const [step, setStep] = useState<{ index: number; aiming: boolean }>({ index: 0, aiming: false });
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);

  useEffect(() => {
    if (!active) return;
    const tabs = tabsIn(root.current);
    // The dossier is still loading: wait for its tab row.
    if (tabs.length === 0) {
      const id = setTimeout(() => setStep((s) => ({ ...s })), 300);
      return () => clearTimeout(id);
    }
    const current = tabs[step.index % tabs.length];
    if (!step.aiming) {
      const id = setTimeout(
        () => setStep((s) => ({ index: s.index, aiming: true })),
        HOLD_MS[labelOf(current)]
      );
      return () => clearTimeout(id);
    }
    // Aim at the next tab (Summary again after the last), then press it.
    const nextIndex = (step.index + 1) % tabs.length;
    const frame = requestAnimationFrame(() => {
      const c = centreOf(tabs[nextIndex]);
      if (c) setCursor({ ...c, down: false });
    });
    const press = setTimeout(() => setCursor((c) => (c ? { ...c, down: true } : c)), AIM_MS);
    const open = setTimeout(() => {
      tabsIn(root.current)[nextIndex]?.click();
      setCursor((c) => (c ? { ...c, down: false } : c));
      setStep({ index: nextIndex, aiming: false });
    }, AIM_MS + PRESS_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(press);
      clearTimeout(open);
    };
  }, [active, step]);

  return (
    <ScreenPanel w={1280} h={860} path="/recon" pad={false}>
      <div ref={root} data-phase={`${step.index}${step.aiming ? "-aim" : ""}`} className="flex h-full w-full items-center justify-center bg-neutral-500/40 p-6">
        <div
          className={cn(
            DOSSIER_MODAL_CLASS,
            "flex h-full w-full flex-col overflow-hidden rounded-md bg-card text-card-foreground shadow-2xl ring-1 ring-foreground/10"
          )}
        >
          <ScoutLeaseModal
            inline
            leaseKey={JOHNSON_A_KEY}
            initialTab="summary"
            onClose={noop}
            onSelectOperator={noop}
            onSelectWell={noop}
          />
        </div>
      </div>
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}
