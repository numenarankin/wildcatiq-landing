"use client";

/**
 * Evaluating an operator for a deal: Recon's Browse view on Tonk Creek
 * Operating, the neighbour west of Johnson A, played on a loop. The tree
 * lists every lease Tonk Creek holds; the pointer opens Harlan Ranch to its
 * wells, picks the lease (its dossier opens in the pane beside the tree, as
 * the app's `inline` dossier does), reads its Production, then picks
 * Stambaugh. Then it presses the operator at the top of the tree and the
 * operator dossier (`OperatorModal`) opens over the page: Summary (revenue
 * estimate, volumes, wells, the P-5 profile and its officers), Leases,
 * Active wells, Permits and Activity. It closes and the tree starts over.
 *
 * Every figure is the mirror's (`recon-tonk-fixture.ts`).
 */
import { useMemo, useRef, useState, type RefObject } from "react";
import { OperatorModal } from "@/components/scout/operator-modal";
import { OperatorTreeView } from "@/components/scout/operator-tree-view";
import { DOSSIER_MODAL_CLASS } from "@/components/scout/modal-ui";
import { reconPrices } from "@/lib/screens/recon-fixture";
import { TONK } from "@/lib/screens/recon-tonk-fixture";
import { cn } from "@/lib/utils";
import { ScreenPanel } from "../../panel";
import { DemoCursor } from "./cursor";
import { DossierOverlay } from "./sat-scene";
import { buttonIn, tabIn, useTour, type TourStep } from "./tour";

const noop = () => {};
const OPERATOR_NO = Number(TONK.no);

interface Ctx {
  root: RefObject<HTMLDivElement | null>;
  card: RefObject<HTMLDivElement | null>;
  setOperatorOpen: (o: boolean) => void;
}

/** Aim at what `find` returns, then press it. */
const at = (find: (c: Ctx) => Element | null, id: string, ms: number): TourStep<Ctx>[] => [
  { id: `to-${id}`, ms: 900, run: (t, c) => t.aim(find(c)) },
  { id, ms, run: (t, c) => t.press(find(c) as HTMLElement | null) },
];
const opTab = (label: string, ms: number) => at((c) => tabIn(c.card.current, label), label, ms);

const STEPS: TourStep<Ctx>[] = [
  {
    id: "tree",
    ms: 2200,
    run: (t, c) => {
      t.hide();
      c.setOperatorOpen(false);
    },
  },
  ...at((c) => c.root.current?.querySelector('[aria-label="Expand Harlan Ranch"]') ?? null, "expand", 1500),
  ...at((c) => buttonIn(c.root.current, "Harlan Ranch"), "harlan", 3600),
  ...at((c) => tabIn(c.root.current, "Production"), "harlan-production", 4800),
  ...at((c) => buttonIn(c.root.current, "Stambaugh"), "stambaugh", 4400),
  ...at((c) => buttonIn(c.root.current, "Tonk Creek"), "operator", 5200),
  ...opTab("Leases", 5200),
  ...opTab("Active wells", 4600),
  ...opTab("Permits", 4600),
  ...opTab("Activity", 5400),
  {
    id: "close",
    ms: 1400,
    run: (t, c) => {
      t.hide();
      c.setOperatorOpen(false);
    },
  },
];

export function ReconOperatorScreen() {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [operatorOpen, setOperatorOpen] = useState(false);
  const ctx = useMemo<Ctx>(() => ({ root, card, setOperatorOpen }), []);
  const { step, loop, cursor } = useTour(STEPS, ctx);

  return (
    <ScreenPanel w={1280} h={780} path="/recon" pad={false}>
      <div ref={root} data-phase={step} className="relative h-full w-full">
        <OperatorTreeView
          key={loop}
          initialOperator={{ operator_number: OPERATOR_NO, operator_name: TONK.name }}
          onSelectOperator={() => setOperatorOpen(true)}
          onSelectPrincipal={noop}
          onSelectLease={noop}
          onSelectWell={noop}
          onSelectOwner={noop}
        />
      </div>
      <DossierOverlay open={operatorOpen} label="Operator" rootRef={card}>
        <div className={cn(DOSSIER_MODAL_CLASS, "flex h-full w-full flex-col")}>
          <OperatorModal
            operatorNumber={OPERATOR_NO}
            prices={reconPrices}
            inline
            onClose={noop}
            onSelectWell={noop}
            onSelectPrincipal={noop}
            onSelectLease={noop}
          />
        </div>
      </DossierOverlay>
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}
