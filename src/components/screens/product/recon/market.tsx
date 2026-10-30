"use client";

/**
 * Recon's Market view as the app renders it (`market-view.tsx`), its area
 * switched on a loop: the State of Texas; Districts, with "09" searched and
 * District 09 picked from the list; Counties, with Young and then Jack picked, which
 * draws a line per county under the total and adds the Selected counties
 * board; the view scrolled down to that board and the statewide boards, and
 * back to Texas.
 *
 * The scope buttons are the view's own and are pressed for real. The area
 * list opens from the view's own picker button, but is drawn in the canvas
 * with the picker's markup, since its Popover portals out of the scaled
 * screen; a pick remounts the view on the new selection (`initialKind`,
 * `initialAreas`), which is the state the picker's own toggle produces.
 */
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { MarketView } from "@/components/scout/market-view";
import { titleCase } from "@/lib/scout/format";
import { reconMarket } from "@/lib/screens/recon-market-fixture";
import { ScreenPanel } from "../../panel";
import { useDemoActive } from "../../demo-active";
import { DemoCursor, centreOf, type CursorPoint } from "./cursor";
import { rectOf, type CanvasRect } from "./demo-ui";

type Kind = "state" | "district" | "county";
type Scope = { kind: Kind; areas: string[] };
type Cursor = (CursorPoint & { down: boolean }) | null;
type Picker = { anchor: CanvasRect; kind: "district" | "county"; query: string; selected: string[]; hover: string | null };

/** District 09 is PDQ key 13; Young and Jack are RRC counties 503 and 237. */
const D09 = "13";
const YOUNG = "503";
const JACK = "237";

interface Ctx {
  scene: HTMLElement | null;
  setCursor: (c: Cursor | ((c: Cursor) => Cursor)) => void;
  setScope: (s: Scope) => void;
  setPicker: (p: Picker | null | ((p: Picker | null) => Picker | null)) => void;
}
type Step = { id: string; hold: number; run: (c: Ctx) => void | (() => void) };

const aim = (c: Ctx, el: Element | null | undefined) => {
  const p = centreOf(el);
  if (p) c.setCursor({ ...p, down: false });
};
const press = (c: Ctx) => c.setCursor((p) => (p ? { ...p, down: true } : p));
const scopeButton = (c: Ctx, label: string) =>
  Array.from(c.scene?.querySelectorAll<HTMLElement>("button") ?? []).find(
    (b) => b.textContent?.trim() === label && !b.querySelector("svg")
  );
/** The picker's trigger: the scope bar's button with the map pin. */
const pickerButton = (c: Ctx) =>
  Array.from(c.scene?.querySelectorAll<HTMLElement>("button") ?? []).find((b) => b.querySelector("svg.lucide-map-pin"));
const scroller = (c: Ctx) => c.scene?.querySelector<HTMLElement>(".no-scrollbar.overflow-y-auto");

function openPicker(c: Ctx, kind: "district" | "county") {
  press(c);
  const anchor = rectOf(pickerButton(c));
  if (anchor) c.setPicker({ anchor, kind, query: "", selected: [], hover: null });
}
function aimArea(c: Ctx, key: string) {
  c.setPicker((p) => (p ? { ...p, hover: key } : p));
  aim(c, c.scene?.querySelector(`[data-demo-area="${key}"]`));
}
function pickArea(c: Ctx, kind: "district" | "county", areas: string[]) {
  press(c);
  c.setPicker((p) => (p ? { ...p, selected: areas } : p));
  c.setScope({ kind, areas });
}

const STEPS: Step[] = [
  {
    id: "texas",
    hold: 2800,
    run: (c) => {
      c.setCursor(null);
      c.setPicker(null);
      c.setScope({ kind: "state", areas: [] });
    },
  },
  { id: "toDistricts", hold: 900, run: (c) => aim(c, scopeButton(c, "Districts")) },
  {
    id: "districts",
    hold: 700,
    run: (c) => {
      press(c);
      scopeButton(c, "Districts")?.click();
    },
  },
  { id: "toDistrictPicker", hold: 800, run: (c) => aim(c, pickerButton(c)) },
  { id: "districtPicker", hold: 1000, run: (c) => openPicker(c, "district") },
  {
    id: "searchD09",
    hold: 900,
    run: (c) => {
      // Typed into the picker's search, as `AreaPicker` filters it.
      let i = 0;
      const id = setInterval(() => {
        i++;
        c.setPicker((p) => (p ? { ...p, query: "09".slice(0, i) } : p));
        if (i >= 2) clearInterval(id);
      }, 150);
      return () => clearInterval(id);
    },
  },
  { id: "aimD09", hold: 800, run: (c) => aimArea(c, D09) },
  { id: "d09", hold: 700, run: (c) => pickArea(c, "district", [D09]) },
  {
    id: "district",
    hold: 3000,
    run: (c) => {
      c.setPicker(null);
      c.setCursor(null);
    },
  },
  { id: "toCounties", hold: 900, run: (c) => aim(c, scopeButton(c, "Counties")) },
  {
    id: "counties",
    hold: 700,
    run: (c) => {
      press(c);
      scopeButton(c, "Counties")?.click();
    },
  },
  { id: "toCountyPicker", hold: 800, run: (c) => aim(c, pickerButton(c)) },
  { id: "countyPicker", hold: 900, run: (c) => openPicker(c, "county") },
  { id: "aimYoung", hold: 700, run: (c) => aimArea(c, YOUNG) },
  { id: "young", hold: 1400, run: (c) => pickArea(c, "county", [YOUNG]) },
  { id: "aimJack", hold: 700, run: (c) => aimArea(c, JACK) },
  { id: "jack", hold: 1200, run: (c) => pickArea(c, "county", [YOUNG, JACK]) },
  {
    id: "counties2",
    hold: 3000,
    run: (c) => {
      c.setPicker(null);
      c.setCursor(null);
    },
  },
  {
    id: "boards",
    hold: 4200,
    run: (c) => {
      const s = scroller(c);
      s?.scrollTo({ top: s.scrollHeight, behavior: "smooth" });
    },
  },
  {
    id: "top",
    hold: 1200,
    run: (c) => {
      scroller(c)?.scrollTo({ top: 0, behavior: "smooth" });
    },
  },
  { id: "toState", hold: 900, run: (c) => aim(c, scopeButton(c, "The State of Texas")) },
  {
    id: "state",
    hold: 600,
    run: (c) => {
      press(c);
      scopeButton(c, "The State of Texas")?.click();
    },
  },
];

/** The picker's open list, with `AreaPicker`'s own markup. */
function AreaList({ picker }: { picker: Picker }) {
  const all = picker.kind === "district" ? reconMarket.districts : reconMarket.counties;
  const q = picker.query.trim().toLowerCase();
  const areas = q ? all.filter((a) => a.label.toLowerCase().includes(q) || a.key.includes(q)) : all;
  const label = picker.kind === "district" ? "Districts" : "Counties";
  return (
    <div
      className="pointer-events-none fixed z-[115] w-72 rounded-lg bg-popover p-0 text-popover-foreground shadow-md ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95 duration-100"
      style={{ left: picker.anchor.x, top: picker.anchor.y + picker.anchor.h + 4 }}
    >
      <div className="border-b p-2">
        <div className="flex h-8 items-center rounded-lg border border-input px-2.5 text-xs text-muted-foreground">
          {picker.query ? <span className="text-foreground">{picker.query}</span> : `Search ${label.toLowerCase()}…`}
        </div>
      </div>
      <ul className="max-h-72 overflow-hidden p-1">
        {areas.slice(0, 9).map((a) => (
          <li key={a.key}>
            <div
              data-demo-area={a.key}
              className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm ${
                picker.hover === a.key ? "bg-muted" : ""
              }`}
            >
              <span className="truncate">
                {titleCase(a.label)}
                <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{a.key}</span>
              </span>
              {picker.selected.includes(a.key) && <Check className="size-3.5 shrink-0 text-primary" />}
            </div>
          </li>
        ))}
      </ul>
      {picker.selected.length > 0 && (
        <div className="border-t p-1">
          <div className="w-full rounded px-2 py-1.5 text-left text-xs text-primary">Clear {picker.selected.length} selected</div>
        </div>
      )}
    </div>
  );
}

export function ReconMarketScreen() {
  const active = useDemoActive();
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<Scope>({ kind: "state", areas: [] });
  const [cursor, setCursor] = useState<Cursor>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const s = STEPS[step];
    let cleanup: void | (() => void);
    const frame = requestAnimationFrame(() => {
      cleanup = s.run({ scene: root.current, setCursor, setScope, setPicker });
    });
    const id = setTimeout(() => setStep((i) => (i + 1) % STEPS.length), s.hold);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(id);
      cleanup?.();
    };
  }, [active, step]);

  return (
    <ScreenPanel w={1200} h={900} path="/recon" pad={false}>
      <div ref={root} data-phase={STEPS[step].id} className="h-full">
        <MarketView
          key={`${scope.kind}:${scope.areas.join(",")}`}
          data={reconMarket}
          initialKind={scope.kind}
          initialAreas={scope.areas}
        />
      </div>
      {picker && <AreaList picker={picker} />}
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}
