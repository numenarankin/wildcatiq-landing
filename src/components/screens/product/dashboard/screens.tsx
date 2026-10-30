"use client";

/**
 * The dashboard's section screens: each one a part of the real page
 * (`src/app/dashboard/page.tsx`) fed the shared fixture operator, so the
 * brief, the cards, the chart, the table and the pie on the product page
 * print the same numbers as the hero above them.
 *
 * The brief, the cards, the decline chart and the table play short loops of
 * what the page does: the brief streams in, the decline card waits for the
 * history and a move is hovered, the decline chart is read and switched to
 * gas, the table is sorted and a lease opened. Every press is a real click
 * (or hover) on the app's own control; the cursor is `DemoCursor`, and each
 * loop only runs while its screen is in view (`useDemoActive`).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { CompanyCharts } from "@/components/analytics/company-charts";
import { LeaseSummaryTable } from "@/components/analytics/lease-summary-table";
import { MorningBriefScripted } from "@/components/analytics/morning-brief";
import { ProductionByWellPie } from "@/components/analytics/production-by-well-pie";
import { SummaryStats } from "@/components/analytics/summary-stats";
import { ChartPrefsProvider } from "@/components/charts/chart-prefs-context";
import { TooltipContainerContext } from "@/components/ui/tooltip";
import { dashboardFixture, FIXTURE_TODAY, morningBrief } from "@/lib/screens/dashboard-fixture";
import { useDemoActive } from "../../demo-active";
import { ScreenPanel } from "../../panel";
import { DemoCursor, centreOf, toCanvas, type CursorPoint } from "../recon/cursor";

const PATH = "/dashboard";

type Cursor = (CursorPoint & { down: boolean }) | null;

/**
 * Walks `order` on a loop while the screen is in view, holding each phase for
 * its `hold`; `loop` counts the restarts, a key that remounts what the page
 * would load afresh.
 */
function usePhases<P extends string>(order: readonly P[], hold: Record<P, number>) {
  const active = useDemoActive();
  const [at, setAt] = useState(0);
  const [loop, setLoop] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      if (at === order.length - 1) setLoop((n) => n + 1);
      setAt((a) => (a + 1) % order.length);
    }, hold[order[at]]);
    return () => clearTimeout(id);
  }, [active, at, order, hold]);
  return { phase: order[at], loop };
}

/**
 * The screen's root and its canvas, once mounted: the canvas is where its
 * menus and tooltips portal to. `attach` is the root's ref.
 */
function useCanvasRoot() {
  const root = useRef<HTMLDivElement | null>(null);
  const [canvas, setCanvas] = useState<HTMLElement | null>(null);
  const attach = useCallback((el: HTMLDivElement | null) => {
    root.current = el;
    setCanvas(el?.closest<HTMLElement>("[data-screen-canvas]") ?? null);
  }, []);
  return { root, canvas, attach };
}

/** A button under `root` whose text is `label`. */
function buttonByText(root: ParentNode | null | undefined, selector: string, label: string) {
  return Array.from(root?.querySelectorAll<HTMLElement>(selector) ?? []).find((b) => b.textContent?.trim() === label);
}

/** The mouse entering or leaving an element, as a pointer would: what a hover tooltip opens on. */
function hover(el: Element | null | undefined, on: boolean) {
  if (!el) return;
  const b = el.getBoundingClientRect();
  const at = { bubbles: true, clientX: b.left + b.width / 2, clientY: b.top + b.height / 2 };
  if (on) {
    el.dispatchEvent(new PointerEvent("pointerover", { ...at, pointerType: "mouse" }));
    el.dispatchEvent(new PointerEvent("pointerenter", { ...at, bubbles: false, pointerType: "mouse" }));
    el.dispatchEvent(new MouseEvent("mouseover", at));
    el.dispatchEvent(new MouseEvent("mouseenter", { ...at, bubbles: false }));
    el.dispatchEvent(new MouseEvent("mousemove", at));
  } else {
    el.dispatchEvent(new PointerEvent("pointerout", { ...at, pointerType: "mouse" }));
    el.dispatchEvent(new PointerEvent("pointerleave", { ...at, bubbles: false, pointerType: "mouse" }));
    el.dispatchEvent(new MouseEvent("mouseout", { ...at, relatedTarget: null }));
    el.dispatchEvent(new MouseEvent("mouseleave", { ...at, bubbles: false }));
  }
}

/** The four cards, the fleet decline in once the history has landed (undefined: still waiting). */
function Cards({ decline }: { decline?: number | null }) {
  const fx = dashboardFixture();
  return <SummaryStats {...fx.cards} decline={decline} />;
}

/* ------------------------------------------------------------ 1. the brief */

type BriefPhase = "wait" | "stream" | "hold" | "fade";
const BRIEF_ORDER: readonly BriefPhase[] = ["wait", "stream", "hold", "fade"];
/** The route's stream, as it lands: a few characters every beat. */
const STREAM_CHUNK = 7;
const STREAM_BEAT = 45;

/**
 * Section 1: the brief at the top of the page, played as the page loads it:
 * the skeleton while the route thinks, the brief streaming in with the app's
 * own glide, held to read, then loaded again.
 */
export function BriefScreen() {
  const [text] = useState(() => morningBrief(dashboardFixture()));
  const [hold] = useState<Record<BriefPhase, number>>(() => ({
    wait: 1500,
    stream: Math.ceil(text.length / STREAM_CHUNK) * STREAM_BEAT + 500,
    hold: 6500,
    fade: 450,
  }));
  const { phase, loop } = usePhases(BRIEF_ORDER, hold);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (phase === "wait") {
      const id = setTimeout(() => setN(0), 0);
      return () => clearTimeout(id);
    }
    if (phase !== "stream" || n >= text.length) return;
    const id = setTimeout(() => setN((x) => Math.min(text.length, x + STREAM_CHUNK)), STREAM_BEAT);
    return () => clearTimeout(id);
  }, [phase, n, text.length]);

  const shown = phase === "wait" ? "" : phase === "stream" ? text.slice(0, n) : text;
  return (
    <ScreenPanel w={1200} h={210} path={PATH}>
      <div className={phase === "fade" ? "opacity-0 transition-opacity duration-400" : "opacity-100"}>
        <MorningBriefScripted key={loop} text={shown} ended={phase === "hold" || phase === "fade"} />
      </div>
    </ScreenPanel>
  );
}

/* ------------------------------------------------------------ 2. the cards */

type CardsPhase = "load" | "landed" | "aimOil" | "hintOil" | "aimNet" | "hintNet" | "rest" | "fade";
const CARDS_ORDER: readonly CardsPhase[] = ["load", "landed", "aimOil", "hintOil", "aimNet", "hintNet", "rest", "fade"];
const CARDS_HOLD: Record<CardsPhase, number> = {
  load: 1600,
  landed: 1100,
  aimOil: 850,
  hintOil: 3200,
  aimNet: 850,
  hintNet: 3200,
  rest: 1200,
  fade: 450,
};

/**
 * Section 2: the stat row as the page fills it: three cards in, the decline
 * card waiting on its skeleton for the history, then its figure; the cursor
 * hovers the oil card's 30-day move and the net revenue card's, each
 * explaining itself in the app's tooltip.
 */
export function CardsScreen() {
  const fx = dashboardFixture();
  const { phase, loop } = usePhases(CARDS_ORDER, CARDS_HOLD);
  const { root, canvas, attach } = useCanvasRoot();
  const [cursor, setCursor] = useState<Cursor>(null);

  useEffect(() => {
    // The 30-day side of each pair: oil's is the 2nd trigger, net revenue's the 6th.
    const trigger = (i: number) => root.current?.querySelectorAll('[data-slot="tooltip-trigger"]')[i];
    const frame = requestAnimationFrame(() => {
      switch (phase) {
        case "load":
          setCursor(null);
          break;
        case "landed": {
          const p = root.current && centreOf(root.current);
          if (p) setCursor({ x: p.x + 120, y: p.y + 60, down: false });
          break;
        }
        case "aimOil":
        case "aimNet": {
          const p = centreOf(trigger(phase === "aimOil" ? 1 : 5));
          if (p) setCursor({ ...p, down: false });
          break;
        }
        case "rest": {
          const p = root.current && centreOf(root.current);
          if (p) setCursor({ x: p.x + 60, y: p.y + 70, down: false });
          break;
        }
      }
    });
    const target = phase === "hintOil" ? trigger(1) : phase === "hintNet" ? trigger(5) : null;
    hover(target, true);
    return () => {
      cancelAnimationFrame(frame);
      hover(target, false);
    };
  }, [phase, root]);

  return (
    <ScreenPanel w={1200} h={190} path={PATH}>
      <TooltipContainerContext.Provider value={canvas}>
        <div ref={attach} className={phase === "fade" ? "opacity-0 transition-opacity duration-400" : "opacity-100"}>
          <Cards key={loop} decline={phase === "load" ? undefined : fx.fleet.annual} />
        </div>
        {cursor && <DemoCursor {...cursor} />}
      </TooltipContainerContext.Provider>
    </ScreenPanel>
  );
}

/** Section 4: the company chart on Revenue at 12M, the average line on, October shaded as not yet settled. */
export function ChartScreen() {
  const fx = dashboardFixture();
  return (
    <ScreenPanel w={1200} h={520} path={PATH}>
      <ChartPrefsProvider defaultRange="12M" averageLine>
        <CompanyCharts
          data={fx.monthly}
          wells={fx.byWellMonthly}
          dailyByWell={fx.dailyByWell}
          prices={fx.prices}
          leases={fx.chartLeases}
          nriByLease={fx.nriByLease}
          companyNri={fx.companyNri}
          initialView="revenue"
        />
      </ChartPrefsProvider>
    </ScreenPanel>
  );
}

/* ---------------------------------------------------------- 5. the decline */

type DeclinePhase = "draw" | "read1" | "read2" | "read3" | "toMenu" | "menu" | "pick" | "choose" | "gas" | "fade";
const DECLINE_ORDER: readonly DeclinePhase[] = ["draw", "read1", "read2", "read3", "toMenu", "menu", "pick", "choose", "gas", "fade"];
const DECLINE_HOLD: Record<DeclinePhase, number> = {
  draw: 3200,
  read1: 1500,
  read2: 1500,
  read3: 1800,
  toMenu: 900,
  menu: 1100,
  pick: 900,
  choose: 300,
  gas: 4400,
  fade: 450,
};
/** How far along the measured rate line each read stops. */
const READ_AT: Partial<Record<DeclinePhase, number>> = { read1: 0.3, read2: 0.62, read3: 0.9 };

/** A point `f` of the way along an SVG path, in viewport pixels. */
function alongPath(path: SVGPathElement, f: number): { x: number; y: number } | null {
  const ctm = path.getScreenCTM();
  if (!ctm) return null;
  const p = path.getPointAtLength(path.getTotalLength() * f);
  const v = new DOMPoint(p.x, p.y).matrixTransform(ctm);
  return { x: v.x, y: v.y };
}

/**
 * Section 5: the Proj. 12-mo decline card over the chart's Oil decline view,
 * played: the curve draws in, the cursor reads three months off the measured
 * line (the chart's own tooltip), then opens the view menu and picks Gas
 * decline.
 */
export function DeclineScreen() {
  const fx = dashboardFixture();
  const { phase, loop } = usePhases(DECLINE_ORDER, DECLINE_HOLD);
  const { root, canvas, attach } = useCanvasRoot();
  const [cursor, setCursor] = useState<Cursor>(null);

  useEffect(() => {
    const el = root.current;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      const wrapper = el?.querySelector(".recharts-wrapper");
      const f = READ_AT[phase];
      if (f !== undefined) {
        const line = el?.querySelector<SVGPathElement>(".recharts-line-curve");
        const v = line && alongPath(line, f);
        const c = v && toCanvas(line, v.x, v.y);
        if (!v || !c) return;
        setCursor({ ...c, down: false });
        // The tooltip answers once the pointer has arrived.
        pending = setTimeout(
          () => wrapper?.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: v.x, clientY: v.y })),
          phase === "read1" ? 650 : 450,
        );
        return;
      }
      switch (phase) {
        case "draw":
          setCursor(null);
          break;
        case "toMenu": {
          wrapper?.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: null }));
          const p = centreOf(el?.querySelector('[data-slot="dropdown-menu-trigger"]'));
          if (p) setCursor({ ...p, down: false });
          break;
        }
        case "menu":
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "pick": {
          const p = centreOf(buttonByText(canvas, '[role="menuitem"]', "Gas decline"));
          if (p) setCursor({ ...p, down: false });
          break;
        }
        case "choose": {
          // The item's own click, while the menu is still open; it shuts on the next beat.
          buttonByText(canvas, '[role="menuitem"]', "Gas decline")?.click();
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        }
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(pending);
    };
  }, [phase, canvas, root]);

  return (
    <ScreenPanel w={1200} h={700} path={PATH}>
      <div ref={attach} className={phase === "fade" ? "flex flex-col gap-4 opacity-0 transition-opacity duration-400" : "flex flex-col gap-4"}>
        <Cards decline={fx.fleet.annual} />
        <CompanyCharts
          key={loop}
          data={fx.monthly}
          wells={fx.byWellMonthly}
          dailyByWell={fx.dailyByWell}
          prices={fx.prices}
          leases={fx.chartLeases}
          nriByLease={fx.nriByLease}
          companyNri={fx.companyNri}
          initialView="decline-oil"
          viewMenu={{ open: phase === "menu" || phase === "pick" || phase === "choose", container: canvas }}
        />
      </div>
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}

/* ------------------------------------------------------------ 6. the table */

type TablePhase =
  | "rest"
  | "aimOil"
  | "byOil"
  | "aimDecline"
  | "byDecline"
  | "aimRev"
  | "byRev"
  | "aimCaret"
  | "open"
  | "fade";
const TABLE_ORDER: readonly TablePhase[] = ["rest", "aimOil", "byOil", "aimDecline", "byDecline", "aimRev", "byRev", "aimCaret", "open", "fade"];
const TABLE_HOLD: Record<TablePhase, number> = {
  rest: 1500,
  aimOil: 850,
  byOil: 1900,
  aimDecline: 850,
  byDecline: 2100,
  aimRev: 850,
  byRev: 1300,
  aimCaret: 900,
  open: 4400,
  fade: 450,
};
/** The header each sort press lands on, by the table's own labels. */
const SORT_HEADER: Partial<Record<TablePhase, string>> = {
  aimOil: "Oil bbl/d",
  byOil: "Oil bbl/d",
  aimDecline: "Decline",
  byDecline: "Decline",
  aimRev: "Net rev/day",
  byRev: "Net rev/day",
};
const OPENED_LEASE = "l-johnson";

/**
 * Section 6: the lease table played: sorted by oil, then by decline, back to
 * net revenue, and Johnson A opened into its four wells. Each press is a click
 * on the table's own header or caret.
 */
export function TableScreen() {
  const fx = dashboardFixture();
  const { phase, loop } = usePhases(TABLE_ORDER, TABLE_HOLD);
  const root = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<Cursor>(null);
  const leaseName = fx.leaseRows.find((r) => r.key === OPENED_LEASE)?.name ?? "";

  useEffect(() => {
    const el = root.current;
    const header = SORT_HEADER[phase];
    const caret = () => {
      const row = Array.from(el?.querySelectorAll("tbody tr") ?? []).find((tr) =>
        Array.from(tr.querySelectorAll("td")).some((td) => td.textContent?.trim() === leaseName)
      );
      return row?.querySelector<HTMLElement>('button[aria-label="Show wells"]');
    };
    const frame = requestAnimationFrame(() => {
      if (phase === "rest") {
        setCursor(null);
        return;
      }
      if (phase === "fade") return;
      const target = header ? buttonByText(el, "thead button", header) : caret();
      const press = phase.startsWith("by") || phase === "open";
      if (press) target?.click();
      const p = centreOf(target);
      if (p) setCursor({ ...p, down: press });
    });
    return () => cancelAnimationFrame(frame);
  }, [phase, leaseName]);

  return (
    <ScreenPanel w={1200} h={600} path={PATH}>
      <div ref={root} className={phase === "fade" ? "opacity-0 transition-opacity duration-400" : "opacity-100"}>
        <LeaseSummaryTable
          key={loop}
          rows={fx.leaseRows}
          wells={fx.wellRows}
          decline={fx.declineByRow}
          today={FIXTURE_TODAY}
        />
      </div>
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}

/** Section 7: the pie on Revenue by lease, in its cell beside the chart. */
export function PieScreen() {
  const fx = dashboardFixture();
  return (
    <ScreenPanel w={1200} h={520} path={PATH}>
      <div className="grid grid-cols-3 items-stretch gap-4">
        <CompanyCharts
          data={fx.monthly}
          wells={fx.byWellMonthly}
          dailyByWell={fx.dailyByWell}
          prices={fx.prices}
          leases={fx.chartLeases}
          nriByLease={fx.nriByLease}
          companyNri={fx.companyNri}
          className="col-span-2"
        />
        <ProductionByWellPie wells={fx.pieWells} leaseByWell={fx.leaseByWell} />
      </div>
    </ScreenPanel>
  );
}
