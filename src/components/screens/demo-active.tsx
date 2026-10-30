"use client";

import { Fragment, createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { demoEnd, demoProgress, demoStart } from "@/lib/track/tracker";

/**
 * Whether a scripted demo should be running. A demo's timeline only advances
 * while its screen is in view: it starts once the visitor has scrolled the
 * screen mostly into view, and when the screen leaves the viewport entirely
 * the demo is remounted, so coming back plays it again from the top rather
 * than mid-way. Outside a provider a demo runs, so a screen rendered on its
 * own still animates.
 *
 * Given a `demo` name, the provider also reports each play to the GTM tracker
 * (`demoStart` when it comes into view, `demoEnd` when it leaves), and the
 * scripted demos inside report how far they got through `useDemoProgress`.
 */
const DemoActiveContext = createContext(true);
const DemoNameContext = createContext<string | null>(null);

export function useDemoActive(): boolean {
  return useContext(DemoActiveContext);
}

/**
 * A scripted demo's place in its script: `step` of `steps`, 0-based. Reported
 * while the demo plays; the last step completes the play, and a loop back to
 * the first step after it starts the next one.
 */
export function useDemoProgress(step: number, steps: number): void {
  const demo = useContext(DemoNameContext);
  const active = useContext(DemoActiveContext);
  useEffect(() => {
    if (demo && active && step >= 0) demoProgress(demo, step, steps);
  }, [demo, active, step, steps]);
}

/**
 * A page-wide pause: while something covers the page (the mobile menu), every
 * demo holds still, so the covering animation has the frame budget to itself.
 * Demos stay mounted and pick up where they stopped.
 */
let paused = false;
const pauseListeners = new Set<() => void>();
export function setDemosPaused(next: boolean) {
  if (next === paused) return;
  paused = next;
  for (const l of pauseListeners) l();
}
function subscribePause(cb: () => void) {
  pauseListeners.add(cb);
  return () => {
    pauseListeners.delete(cb);
  };
}

/**
 * How much of the screen must be showing before its demo runs: this share of
 * the screen, or this share of the viewport for a screen taller than the
 * window can show at that share.
 */
const VISIBLE_SHARE = 0.6;
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

export function DemoActiveProvider({
  children,
  className,
  demo,
}: {
  children: React.ReactNode;
  className?: string;
  /** The demo's name in the GTM data; unnamed demos are not reported. */
  demo?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  // Bumped when the screen scrolls fully out of view; it keys the demo, so the
  // remount (and its restart) happens where nobody is looking.
  const [run, setRun] = useState(0);
  const pageCovered = useSyncExternalStore(subscribePause, () => paused, () => false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let shown = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          if (shown) {
            shown = false;
            if (demo) demoEnd(demo);
            setActive(false);
            setRun((n) => n + 1);
          }
          return;
        }
        const enough =
          entry.intersectionRatio >= VISIBLE_SHARE ||
          entry.intersectionRect.height >= window.innerHeight * VISIBLE_SHARE;
        if (enough && !shown) {
          shown = true;
          if (demo) demoStart(demo);
          setActive(true);
        }
      },
      { threshold: THRESHOLDS },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (shown && demo) demoEnd(demo);
    };
  }, [demo]);

  return (
    <div ref={ref} className={className}>
      <DemoNameContext.Provider value={demo ?? null}>
        <DemoActiveContext.Provider value={active && !pageCovered}>
          <Fragment key={run}>{children}</Fragment>
        </DemoActiveContext.Provider>
      </DemoNameContext.Provider>
    </div>
  );
}
