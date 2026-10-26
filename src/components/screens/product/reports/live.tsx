"use client";

/**
 * The Reports page's section screens played forward on a loop, every frame the
 * app's own components doing their own work: `ReportNav` with its selection
 * moved the way a click on an entry moves it, the hub's `ReportSkeleton` while
 * the picked report loads, `ReportMarkdown` rendering the document, the
 * document column scrolling the way the page scrolls, `NarrateButton` pressed
 * through its own onClick, and `ReportDownloadMenu` opened and closed through
 * its own trigger.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PermissionsProvider } from "@/components/auth/permissions-context";
import { ReportMarkdown } from "@/components/reports/viewer/report-markdown";
import { NarrationStandInContext } from "@/components/reports/viewer/narrate-button";
import { ReportNav } from "@/components/reports/viewer/report-nav";
import type { NarrationState } from "@/components/ai/use-narration";
import {
  dailyDigestDoc,
  dailyProductionDoc,
  productionVarianceDoc,
  reportsFixture,
  type HubDocument,
} from "@/lib/screens/reports-fixture";
import { useDemoActive } from "../../demo-active";
import { ScreenPanel } from "../../panel";
import { Actions, PickerRow, ReportSkeleton, glideTo, monthlyDigestDoc } from "./hub";

const PATH = "/reports";

/** How long a scroll between two stops takes. */
const GLIDE_MS = 1600;
/** The gap left above a heading the screen scrolls to. */
const HEADING_GAP = 24;

/**
 * One beat of a hub demo: the report selected in the nav, whether it is still
 * loading (the skeleton), where the document column scrolls to (a section
 * heading's text, or the top), and how long the beat lasts.
 */
interface Beat {
  doc: HubDocument;
  loading?: boolean;
  scroll?: string | "top";
  ms: number;
}

/** Runs `beats` in order on a loop while the screen is on screen. */
function useBeats(count: number, ms: (i: number) => number): number {
  const active = useDemoActive();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setI((n) => (n + 1) % count), ms(i));
    return () => clearTimeout(id);
  }, [active, i, count, ms]);
  return i;
}

/** The hub with the report list beside the document, played through `beats`. */
function HubLive({ beats, w, h }: { beats: Beat[]; w: number; h: number }) {
  const fx = reportsFixture();
  const ms = useCallback((i: number) => beats[i].ms, [beats]);
  const beat = beats[useBeats(beats.length, ms)];
  const column = useRef<HTMLDivElement>(null);

  // The page scrolls the window; the canvas has none, so the document column
  // scrolls itself (overflow hidden: no scrollbar, the glide is the motion).
  useEffect(() => {
    const el = column.current;
    if (!el || !beat.scroll) return;
    if (beat.scroll === "top") return glideTo(el, 0, GLIDE_MS);
    const heading = [...el.querySelectorAll("h2")].find((n) => n.textContent?.trim() === beat.scroll);
    if (!heading) return;
    return glideTo(el, heading.offsetTop - HEADING_GAP, GLIDE_MS);
  }, [beat]);

  // A newly picked report opens at its top.
  useEffect(() => {
    if (beat.loading && column.current) column.current.scrollTop = 0;
  }, [beat]);

  const doc = beat.doc;
  return (
    <ScreenPanel w={w} h={h} path={PATH}>
      <PermissionsProvider permissions={["admin", "view_reports"]}>
        <div className="flex min-h-0 flex-1 gap-6">
          <div className="w-72 shrink-0 self-start">
            <ReportNav groups={fx.navGroups} selectedId={doc.id} basePath="/reports" param="report" openGroup="Company" />
          </div>
          <div ref={column} className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            {beat.loading ? (
              <ReportSkeleton actions={<Actions doc={doc} />} pickers={PickerRow({ doc })} />
            ) : (
              <ReportMarkdown
                key={doc.id}
                markdown={doc.markdown}
                narration={doc.narration}
                actions={<Actions doc={doc} />}
                pickers={PickerRow({ doc })}
              />
            )}
          </div>
        </div>
      </PermissionsProvider>
    </ScreenPanel>
  );
}

/** A loaded report held for `hold` ms after a glide to `scroll`. */
const at = (doc: HubDocument, scroll: Beat["scroll"], hold: number): Beat => ({ doc, scroll, ms: GLIDE_MS + hold });

/**
 * Section 1: the report list. Daily Production is open; Production Variance,
 * the Daily Company Digest and the Monthly Company Digest are picked in turn,
 * each loading under the skeleton, then back to Daily Production.
 */
export function LibraryLive() {
  const beats = useMemo<Beat[]>(() => {
    const docs = [dailyProductionDoc(), productionVarianceDoc(), dailyDigestDoc(), monthlyDigestDoc()];
    // Opens on Daily Production already loaded; its skeleton closes the loop.
    const beats = docs.flatMap((doc) => [
      { doc, loading: true, ms: 1000 },
      { doc, ms: 3400 },
    ]);
    return [...beats.slice(1), beats[0]];
  }, []);
  return <HubLive beats={beats} w={1200} h={760} />;
}

/**
 * Section 2: the Monthly Company Digest open; the Daily Company Digest picked,
 * loading in, then read down: the tiles and headline, the exception and the
 * pumpers' comments, the trend charts, revenue by lease and the first lease;
 * back to the top, and the monthly picked again.
 */
export function DigestLive() {
  const beats = useMemo<Beat[]>(() => {
    const monthly = monthlyDigestDoc();
    const daily = dailyDigestDoc();
    return [
      { doc: monthly, ms: 2400 },
      { doc: daily, loading: true, ms: 1200 },
      { doc: daily, ms: 3800 },
      at(daily, "Exceptions", 4200),
      at(daily, "Production trend (last 14 days)", 3000),
      at(daily, "Revenue by lease", 3400),
      at(daily, "Johnson A", 3000),
      at(daily, "top", 1600),
      { doc: monthly, loading: true, ms: 1200 },
    ];
  }, []);
  return <HubLive beats={beats} w={1200} h={980} />;
}

/** How long the voice takes to answer before Orion starts reading. */
const VOICE_WAIT_MS = 1100;

/**
 * Narration without the voice route (which the landing does not serve): the
 * same idle, loading and playing states `useNarration` moves through, with
 * the first clip's wait standing in for synthesis and no audio.
 */
function useStandInNarration() {
  const [state, setState] = useState<NarrationState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const stop = useCallback(() => {
    clearTimeout(timer.current);
    setState("idle");
  }, []);
  const play = useCallback(async () => {
    clearTimeout(timer.current);
    setState("loading");
    timer.current = setTimeout(() => setState("playing"), VOICE_WAIT_MS);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useMemo(() => ({ state, error: null, play, stop }), [state, play, stop]);
}

/**
 * `rest` is the document before anything is pressed; `narrate` presses
 * Narrate (loading, then Stop while he reads); `stop` presses Stop; `open`
 * presses Download and its menu opens; `close` presses it again.
 */
type OutputsPhase = "rest" | "narrate" | "stop" | "open" | "close";
const OUTPUTS: { phase: OutputsPhase; ms: number }[] = [
  { phase: "rest", ms: 1800 },
  { phase: "narrate", ms: VOICE_WAIT_MS + 3600 },
  { phase: "stop", ms: 1600 },
  { phase: "open", ms: 3600 },
  { phase: "close", ms: 1600 },
];

/**
 * A press on a Base UI menu trigger, which toggles its menu on mousedown. The
 * release is left out: fired in the same tick as the press, it lands before
 * the menu has opened and is read as a press outside it.
 */
function press(el: Element | null | undefined) {
  if (!el) return;
  const init = { bubbles: true, cancelable: true, button: 0, view: window };
  el.dispatchEvent(new PointerEvent("pointerdown", { ...init, pointerType: "mouse" }));
  el.dispatchEvent(new MouseEvent("mousedown", init));
}

/**
 * Section 6: the Monthly Company Digest's header. Narrate pressed, Orion
 * reading (Stop), Stop pressed; then Download pressed and its menu open on
 * PDF, Excel and the zipped CSV, held, and closed.
 */
export function OutputsLive() {
  const doc = useMemo(() => monthlyDigestDoc(), []);
  const narration = useStandInNarration();
  const ms = useCallback((i: number) => OUTPUTS[i].ms, []);
  const { phase } = OUTPUTS[useBeats(OUTPUTS.length, ms)];
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!frame) return;
    if (phase === "narrate") {
      frame.querySelector<HTMLButtonElement>('button[aria-label="Narrate this report"]')?.click();
    } else if (phase === "stop") {
      frame.querySelector<HTMLButtonElement>('button[aria-label="Stop narration"]')?.click();
    } else if (phase === "open" || phase === "close") {
      const trigger = frame.querySelector('button[aria-haspopup="menu"]');
      const open = trigger?.getAttribute("aria-expanded") === "true";
      // Pressed on the next tick, outside React's commit, the way a real
      // press arrives. Dispatched from inside the effect the menu ignores it.
      if (open === (phase === "open")) return;
      const id = setTimeout(() => press(trigger), 0);
      return () => clearTimeout(id);
    }
  }, [phase, frame]);

  return (
    <ScreenPanel w={1200} h={460} path={PATH}>
      <NarrationStandInContext.Provider value={narration}>
        <div ref={setFrame} className="relative min-h-0 flex-1">
          <ReportMarkdown
            markdown={doc.markdown}
            narration={doc.narration}
            actions={<Actions doc={doc} container={frame} />}
          />
        </div>
      </NarrationStandInContext.Provider>
    </ScreenPanel>
  );
}
