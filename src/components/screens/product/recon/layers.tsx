"use client";

/**
 * Recon's map, every Show mode on satellite, played as a loop through the
 * app's own bar (`MapFilters`):
 *
 *   1. Wells across Texas. The pointer types "You" into the county search and
 *      picks Young; the camera flies to the county and the bubbles break into
 *      the RRC's well marks, keyed by `WellLegend`.
 *   2. Type set to Oil: the gas wells drop off.
 *   3. Show cycles Leases, Permits and Orphans over the same ground, each with
 *      its own key. Switching mode clears the county, as `switchMode` does.
 *   4. Operators: the camera pulls out to the state, where operators sit at
 *      their mailing addresses, and a minimum of 100 wells is typed into the
 *      Wells range, leaving the big ones.
 *   5. Back to Wells, statewide, and round again.
 *
 * The Show and Type menus are drawn in the canvas (`DemoMenu`), since the
 * app's portal would open outside the scaled screen; picking applies the
 * same change the menu's own `onSelect` makes.
 */
import { useEffect, useRef, useState } from "react";
import { DEFAULT_FILTERS, type Filters, type MapMode } from "@/components/scout/map-filters";
import { carryAcrossMode } from "@/lib/scout/filter-focus";
import { YOUNG_COUNTY } from "@/lib/screens/recon-fixture";
import type { ReconMapHandle } from "../../recon-map";
import { useDemoActive } from "../../demo-active";
import { ReconMapScene } from "./map-scene";
import { DemoCursor, centreOf, type CursorPoint } from "./cursor";
import { DemoMenu, byText, clearInput, rectOf, typeInto, type CanvasRect } from "./demo-ui";

const TEXAS = { center: [-99.6, 31.3] as [number, number], zoom: 5.3 };
const YOUNG = { center: [-98.69, 33.17] as [number, number], zoom: 9.7 };
const STATE_POINTS = ["/recon/texas.json", "/recon/young.json"];
const COUNTY_POINTS = ["/recon/young.json"];

const SHOW_ITEMS: { v: MapMode; label: string }[] = [
  { label: "Wells", v: "wells" },
  { label: "Leases", v: "leases" },
  { label: "Permits", v: "permits" },
  { label: "Orphans", v: "orphans" },
  { label: "Operators", v: "operators" },
];
const TYPE_ITEMS: { v: Filters["oilGas"]; label: string }[] = [
  { label: "All", v: "all" },
  { label: "Oil", v: "O" },
  { label: "Gas", v: "G" },
];

type Menu = { anchor: CanvasRect; items: { v: string; label: string }[]; value: string; hover: string | null };

interface Ctx {
  scene: HTMLElement | null;
  map: ReconMapHandle | null;
  /** The bar's filters as the step starts. */
  filters: Filters;
  setF: (fn: (f: Filters) => Filters) => void;
  setCursor: (c: (CursorPoint & { down: boolean }) | null | ((c: (CursorPoint & { down: boolean }) | null) => (CursorPoint & { down: boolean }) | null)) => void;
  setMenu: (m: Menu | null | ((m: Menu | null) => Menu | null)) => void;
}
type Step = { id: string; hold: number; run: (c: Ctx) => void | (() => void) };

const aim = (c: Ctx, el: Element | null | undefined) => {
  const p = centreOf(el);
  if (p) c.setCursor({ ...p, down: false });
};
const press = (c: Ctx) => c.setCursor((p) => (p ? { ...p, down: true } : p));

/** Open a bar dropdown under its trigger. */
function openMenu(c: Ctx, label: string, items: { v: string; label: string }[], value: string) {
  const anchor = rectOf(c.scene?.querySelector(`[aria-label="${label}"]`));
  press(c);
  if (anchor) c.setMenu({ anchor, items, value, hover: null });
}
/** Move the pointer onto a menu item. */
function aimItem(c: Ctx, v: string) {
  c.setMenu((m) => (m ? { ...m, hover: v } : m));
  aim(c, c.scene?.querySelector(`[data-demo-menu] [data-demo-item="${v}"]`));
}

/** Show → mode, the three steps it takes. */
function showSteps(mode: MapMode, hold: number, after?: (c: Ctx) => void): Step[] {
  return [
    { id: `toShow-${mode}`, hold: 900, run: (c) => aim(c, c.scene?.querySelector('[aria-label="Show"]')) },
    {
      id: `showMenu-${mode}`,
      hold: 800,
      run: (c) => openMenu(c, "Show", SHOW_ITEMS, c.filters.mode),
    },
    { id: `aim-${mode}`, hold: 700, run: (c) => aimItem(c, mode) },
    {
      id: mode,
      hold,
      run: (c) => {
        press(c);
        c.setMenu(null);
        // What the bar's `switchMode` writes.
        c.setF((f) => carryAcrossMode(f, mode, DEFAULT_FILTERS));
        after?.(c);
      },
    },
  ];
}

const STEPS: Step[] = [
  {
    id: "texas",
    hold: 2200,
    run: (c) => {
      c.setCursor(null);
      c.setMenu(null);
      c.setF(() => DEFAULT_FILTERS);
    },
  },
  { id: "toCounty", hold: 900, run: (c) => aim(c, c.scene?.querySelector('input[placeholder="Search county…"]')) },
  {
    id: "typeCounty",
    hold: 1000,
    run: (c) => {
      press(c);
      return typeInto(c.scene?.querySelector<HTMLInputElement>('input[placeholder="Search county…"]'), "You");
    },
  },
  { id: "aimCounty", hold: 800, run: (c) => aim(c, byText(c.scene, "ul button", "Young")) },
  {
    id: "county",
    hold: 4200,
    run: (c) => {
      press(c);
      // The result's own button, so the picker's `onPick` runs.
      byText(c.scene, "ul button", "Young")?.click();
      c.map?.flyTo({ ...YOUNG, duration: 3000 });
    },
  },
  { id: "toType", hold: 900, run: (c) => aim(c, c.scene?.querySelector('[aria-label="Type"]')) },
  { id: "typeMenu", hold: 800, run: (c) => openMenu(c, "Type", TYPE_ITEMS, "all") },
  { id: "aimOil", hold: 700, run: (c) => aimItem(c, "O") },
  {
    id: "oil",
    hold: 3000,
    run: (c) => {
      press(c);
      c.setMenu(null);
      c.setF((f) => ({ ...f, oilGas: "O" }));
    },
  },
  ...showSteps("leases", 3400),
  ...showSteps("permits", 3400),
  ...showSteps("orphans", 3400),
  ...showSteps("operators", 2800, (c) => c.map?.flyTo({ ...TEXAS, duration: 2200 })),
  { id: "toMinWells", hold: 900, run: (c) => aim(c, c.scene?.querySelector('input[aria-label="Minimum wells operated"]')) },
  {
    id: "minWells",
    hold: 3600,
    run: (c) => {
      press(c);
      // The Wells range is controlled by the bar's filters, so typing is the
      // value growing a digit at a time.
      const typed = [1, 10, 100];
      let i = 0;
      const id = setInterval(() => {
        const v = typed[i++];
        c.setF((f) => ({ ...f, minWells: v }));
        if (i >= typed.length) clearInterval(id);
      }, 160);
      return () => clearInterval(id);
    },
  },
  ...showSteps("wells", 1400),
];

export function ReconLayersScreen() {
  const active = useDemoActive();
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [drawn, setDrawn] = useState(false);
  const map = useRef<ReconMapHandle | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!active || !drawn) return;
    const s = STEPS[step];
    let cleanup: void | (() => void);
    const frame = requestAnimationFrame(() => {
      cleanup = s.run({ scene: root.current?.parentElement ?? null, map: map.current, filters: filtersRef.current, setF: setFilters, setCursor, setMenu });
    });
    const id = setTimeout(() => setStep((i) => (i + 1) % STEPS.length), s.hold);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(id);
      cleanup?.();
    };
  }, [active, drawn, step]);

  // A county search left half-typed by an interrupted loop is cleared.
  useEffect(() => {
    if (step === 0) clearInput(root.current?.parentElement?.querySelector<HTMLInputElement>('input[placeholder="Search county…"]'));
  }, [step]);

  const county = filters.county === YOUNG_COUNTY || (Array.isArray(filters.county) && filters.county.includes(YOUNG_COUNTY));

  return (
    <ReconMapScene
      filters={DEFAULT_FILTERS}
      value={filters}
      onFilters={setFilters}
      center={TEXAS.center}
      zoom={TEXAS.zoom}
      points={county ? COUNTY_POINTS : STATE_POINTS}
      onMapReady={(h) => (map.current = h)}
      onMapDrawn={() => setDrawn(true)}
    >
      <div ref={root} data-phase={STEPS[step].id} className="hidden" />
      {menu && <DemoMenu anchor={menu.anchor} items={menu.items} value={menu.value} hover={menu.hover} />}
      {cursor && <DemoCursor {...cursor} />}
    </ReconMapScene>
  );
}
