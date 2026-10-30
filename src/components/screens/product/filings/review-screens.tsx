"use client";

/**
 * Filings section screens: the app's docket (`FilingsTable`) with September
 * 2026 generated, and its Form PR review (`GeneratedModal`) played forward on
 * a loop. Each review screen presses September's View, so the table runs its
 * own build (the row's Building…) and the review swipes up over the docket in
 * the app's SwipeUpModal; then it works the part of the review its section is
 * about, and Close drops the card back down.
 *
 * Everything is a real press on the app's own controls: View, a record's
 * caret, the notes and File collapsibles are clicked; a keystroke and the
 * review's Download and Close go through `FormPrScriptContext`, into the same
 * handlers. The body of the review is the app's scroller, moved smoothly to
 * whatever the screen is showing; its bar is hidden, as nobody is holding it.
 */
import { useEffect, useRef, useState } from "react";
import { FormPrScriptContext, type FormPrScript } from "@/components/reports/form-pr/generated-modal";
import { FilingsTable } from "@/components/filings/filings-table";
import { ModalScope } from "@/components/wells/swipe-up-modal";
import { BUILD_MS } from "@/lib/rrc/form-pr/actions";
import type { FilingRow } from "@/lib/rrc/forms/types";
import { PR_CYCLE, filer, filingRows, septemberFormPr } from "@/lib/screens/filings-fixture";
import { useDemoActive } from "../../demo-active";
import { ScreenPanel } from "../../panel";
import { DemoCursor, centreOf, type CursorPoint } from "../recon/cursor";

/** One beat of a screen: what it does on arrival, and how long it holds. */
interface Step {
  hold: number;
  /** The press the review's script context carries during this beat. */
  script?: FormPrScript;
  /** A press or a scroll on arrival; a returned function cancels a scroll. */
  act?: (root: HTMLElement) => void | (() => void);
}

/** The review's rise, and the card's drop on Close (SwipeUpModal's tweens). */
const RISE_MS = 700;
const DROP_MS = 600;

/* ---------------------------------------------------------------- presses */

function click(el: Element | null | undefined) {
  if (el instanceof HTMLElement) el.click();
}

/** September's row on the docket, its View button. */
function pressView(root: HTMLElement) {
  for (const tr of root.querySelectorAll("tbody tr")) {
    if (!tr.textContent?.includes(septemberFormPr().summary.month)) continue;
    for (const b of tr.querySelectorAll("button")) {
      if (b.textContent?.trim() === "View") return click(b);
    }
  }
}

const dialogOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[role="dialog"]');
/** The review's body: the one scroller in the card. */
const bodyOf = (root: HTMLElement) => dialogOf(root)?.querySelector<HTMLElement>(".overflow-y-auto") ?? null;

/** The review's collapsible whose header starts with `label`. */
function pressSection(root: HTMLElement, label: RegExp) {
  for (const b of dialogOf(root)?.querySelectorAll("section > button") ?? []) {
    if (label.test(b.textContent?.trim() ?? "")) return click(b);
  }
}

/** A record's caret: the `at`th row of the records table. */
function pressRecord(root: HTMLElement, at: number) {
  click(dialogOf(root)?.querySelectorAll('button[aria-label="Show every field"], button[aria-label="Hide every field"]')[at]);
}

/** The input under one field label in an open record. */
function fieldInput(root: HTMLElement, label: string) {
  for (const l of dialogOf(root)?.querySelectorAll("label") ?? []) {
    if (l.querySelector("span")?.textContent?.trim() === label) return l.querySelector("input");
  }
  return null;
}

/* ---------------------------------------------------------------- scrolls */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Move a scroller to `to` (its own pixels) over `ms`, on the in-out cubic. */
function tween(el: HTMLElement, axis: "x" | "y", to: number, ms: number): () => void {
  const from = axis === "y" ? el.scrollTop : el.scrollLeft;
  const max = axis === "y" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
  const end = Math.max(0, Math.min(max, to));
  const t0 = performance.now();
  let raf = 0;
  const frame = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    const v = from + (end - from) * ease(t);
    if (axis === "y") el.scrollTop = v;
    else el.scrollLeft = v;
    if (t < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

/**
 * Scroll the review's body so `target` sits `gap` canvas pixels below its top
 * edge. Rectangles are in page pixels and the canvas is scaled, so distances
 * are divided by the scale it renders at.
 */
function scrollBodyTo(root: HTMLElement, target: Element | null | undefined, ms: number, gap = 16) {
  const body = bodyOf(root);
  if (!body || !target) return;
  const b = body.getBoundingClientRect();
  const scale = b.height / body.offsetHeight || 1;
  const to = body.scrollTop + (target.getBoundingClientRect().top - b.top) / scale - gap;
  return tween(body, "y", to, ms);
}

function scrollBodyToTop(root: HTMLElement, ms: number) {
  const body = bodyOf(root);
  return body ? tween(body, "y", 0, ms) : undefined;
}

/* ---------------------------------------------------------------- runner */

function Scripted({ steps, w, h }: { steps: Step[]; w: number; h: number }) {
  const active = useDemoActive();
  const [at, setAt] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const cancel = steps[at].act?.(el);
    return cancel ?? undefined;
  }, [at, steps]);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setAt((n) => (n + 1) % steps.length), steps[at].hold);
    return () => clearTimeout(id);
  }, [active, at, steps]);

  return (
    <ScreenPanel w={w} h={h} path="/filings">
      <ModalScope>
        {/* The review's body is a scroller the demo moves: no bar on it. */}
        <div ref={root} className="flex flex-1 flex-col [&_*]:no-scrollbar">
          <FormPrScriptContext.Provider value={steps[at].script ?? null}>
            <FilingsTable rows={filingRows()} filer={filer} canManage />
          </FormPrScriptContext.Provider>
        </div>
      </ModalScope>
    </ScreenPanel>
  );
}

/** The docket held, then September's View: Building… on the row, the review rising. */
const OPEN: Step[] = [
  { hold: 1600 },
  { hold: BUILD_MS + RISE_MS, act: pressView },
];

/** Close pressed: the card drops, the docket held before the loop starts over. */
const CLOSE: Step[] = [
  { hold: DROP_MS, script: "close" },
  { hold: 900 },
];

/* ---------------------------------------------------------------- screens */

/** The edited field: Johnson A's ending storage, re-gauged from 312 to 318. */
const EDIT_FIELD = "Liquid Ending Storage";
const typed = (value: string): Step => ({
  hold: 320,
  script: { edit: { at: 0, field: "liqEndingStorage", value } },
});

const REVIEW_STEPS: Step[] = [
  ...OPEN,
  // The review as it opens: operator, due date, the filer, every record.
  { hold: 2800 },
  // Johnson A's caret: all fifty fields open under the row.
  { hold: 2000, act: (r) => pressRecord(r, 0) },
  // Down through the groups to the last field.
  { hold: 2600, act: (r) => scrollBodyTo(r, dialogOf(r)?.querySelectorAll("h4")[2], 2400) },
  { hold: 2400, act: (r) => scrollBodyTo(r, dialogOf(r)?.querySelectorAll("h4")[3], 2200) },
  // The field takes the cursor, the 2 is deleted, an 8 typed.
  {
    hold: 700,
    act: (r) => {
      fieldInput(r, EDIT_FIELD)?.focus({ preventScroll: true });
    },
  },
  typed("31"),
  { ...typed("318"), hold: 1600 },
  // Back up: the row reads 318, the File says with edits, Download with edits.
  {
    hold: 2200,
    act: (r) => {
      fieldInput(r, EDIT_FIELD)?.blur();
      return scrollBodyToTop(r, 2000);
    },
  },
  { hold: 3600 },
  ...CLOSE,
];

/** Johnson A open, a field edited, Download with edits. */
export function FormPrReviewScreen() {
  return <Scripted steps={REVIEW_STEPS} w={1400} h={900} />;
}

const ISSUES_STEPS: Step[] = [
  ...OPEN,
  { hold: 1800 },
  // The notes open: the shared tank, the agent's authorization.
  { hold: 4200, act: (r) => pressSection(r, /notes?$/) },
  // Smith carries the tank's mark: its record opens on the picker that moves it.
  { hold: 1400, act: (r) => pressRecord(r, 1) },
  {
    hold: 4400,
    act: (r) => {
      // Johnson A's row above it, so the record reads as one of the five.
      const rows = dialogOf(r)?.querySelectorAll("tbody > tr");
      return scrollBodyTo(r, rows?.[0], 2000, 12);
    },
  },
  { hold: 3000, act: (r) => scrollBodyToTop(r, 1600) },
  ...CLOSE,
];

/** The notes opened, the shared tank marked on the control that fixes it. */
export function FormPrIssuesScreen() {
  return <Scripted steps={ISSUES_STEPS} w={1400} h={760} />;
}

const FILE_STEPS: Step[] = [
  ...OPEN,
  { hold: 1800 },
  // The File section opens on the EDI, every line as it will upload, tabs marked.
  { hold: 5200, act: (r) => pressSection(r, /^File/) },
  // Download: Building… while the file is written.
  { hold: BUILD_MS + 400, script: "download" },
  { hold: 2400 },
  ...CLOSE,
];

/** The File section opened on the EDI, then Download building it. */
export function FormPrFileScreen() {
  return <Scripted steps={FILE_STEPS} w={1400} h={760} />;
}

type DocketPhase = "owed" | "aim" | "generate" | "review" | "aimClose" | "close" | "filed";
const DOCKET_ORDER: readonly DocketPhase[] = ["owed", "aim", "generate", "review", "aimClose", "close", "filed"];
const DOCKET_HOLD: Record<DocketPhase, number> = {
  owed: 1500,
  aim: 900,
  generate: BUILD_MS + RISE_MS + 200,
  review: 3400,
  aimClose: 900,
  close: DROP_MS + 300,
  filed: 4400,
};

/** The docket with September still owed: no file, nothing generated. */
function owedRows(): FilingRow[] {
  return filingRows().map((r) =>
    r.period === PR_CYCLE ? { ...r, id: null, status: "draft", fileName: null, generatedAt: null } : r
  );
}

/** A button in September's row whose label is `label`. */
function septemberButton(root: HTMLElement | null, label: string) {
  for (const tr of root?.querySelectorAll("tbody tr") ?? []) {
    if (!tr.textContent?.includes(septemberFormPr().summary.month)) continue;
    for (const b of tr.querySelectorAll<HTMLElement>("button")) {
      if (b.textContent?.trim() === label) return b;
    }
  }
  return null;
}

/**
 * The docket, played: twelve ended cycles with September still owed; the
 * cursor presses its Generate, the row builds and the review rises over the
 * docket; Close drops it, and September is on file as Generated with its EDI.
 */
export function FilingsDocketScreen() {
  const active = useDemoActive();
  const [at, setAt] = useState(0);
  const [loop, setLoop] = useState(0);
  const [cursor, setCursor] = useState<(CursorPoint & { down: boolean }) | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const phase = DOCKET_ORDER[at];

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => {
      if (at === DOCKET_ORDER.length - 1) setLoop((n) => n + 1);
      setAt((a) => (a + 1) % DOCKET_ORDER.length);
    }, DOCKET_HOLD[phase]);
    return () => clearTimeout(id);
  }, [active, at, phase]);

  useEffect(() => {
    const el = root.current;
    const frame = requestAnimationFrame(() => {
      const close = () => (el ? dialogOf(el)?.querySelector<HTMLElement>('button[aria-label="Close"]') : null);
      switch (phase) {
        case "owed":
          setCursor(null);
          break;
        case "aim": {
          const p = centreOf(septemberButton(el, "Generate"));
          if (p) setCursor({ ...p, down: false });
          break;
        }
        case "generate":
          click(septemberButton(el, "Generate"));
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "review":
          // Off the button while the review reads; it rose under the cursor.
          setCursor((c) => (c ? { x: c.x - 260, y: c.y + 140, down: false } : c));
          break;
        case "aimClose": {
          const p = centreOf(close());
          if (p) setCursor({ ...p, down: false });
          break;
        }
        case "close":
          click(close());
          setCursor((c) => (c ? { ...c, down: true } : c));
          break;
        case "filed": {
          const p = centreOf(septemberButton(el, "View"));
          if (p) setCursor({ x: p.x - 200, y: p.y + 40, down: false });
          break;
        }
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  return (
    <ScreenPanel w={1200} h={780} path="/filings">
      <ModalScope>
        <div ref={root} className="flex flex-1 flex-col [&_*]:no-scrollbar">
          <FilingsTable key={loop} rows={phase === "filed" ? filingRows() : owedRows()} filer={filer} canManage />
        </div>
      </ModalScope>
      {cursor && <DemoCursor {...cursor} />}
    </ScreenPanel>
  );
}
