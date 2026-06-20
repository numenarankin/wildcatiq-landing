"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { DemoScreen } from "@/components/demos/demo-screens";

/**
 * Scroll-driven product showcase.
 *
 * Desktop: as the user scrolls into the section the large "main" demo screen
 * shrinks and docks to the right, vertically centered, then stays pinned and
 * cycles through demo clips while the matching header + caption fade in on the
 * left.
 *
 * Mobile: the pinned/dock interaction doesn't translate, so we render the same
 * demos as a simple vertical stack (copy + full-width gif each). Layout is
 * chosen before paint via a media query so there's no flash and the navbar
 * anchor ids exist only once.
 *
 * Everything is placeholder (gray screens) for now - swap the gray panels for
 * real gifs later.
 */

interface Demo {
  eyebrow: string;
  header: string;
  caption: string;
}

const DEMOS: readonly Demo[] = [
  {
    eyebrow: "Chat + Voice",
    header: "Just talk to it",
    caption:
      "Type or tap the mic and ask: “how did the Johnson lease produce last month?” It answers back, out loud and on the screen.",
  },
  {
    eyebrow: "Well logs",
    header: "Read a log without a geologist",
    caption:
      "Open a well log right in your browser. It marks the pay zones and porosity and tells you, in plain words, which intervals are worth a second look.",
  },
  {
    eyebrow: "Production",
    header: "Log it in the field, track it from the office",
    caption:
      "Your pumpers log oil, gas, and water straight from the field in seconds. Management sees every well trending in one place and can point at a dip in the chart and ask what happened.",
  },
  {
    eyebrow: "Documents",
    header: "Analyze any document instantly",
    caption:
      "Open a lease, a contract, or a well file and put it to work. It pulls the key dates and obligations, flags the terms that could cost you, and checks them against the rest of your paperwork in seconds.",
  },
  {
    eyebrow: "Your books",
    header: "Know which wells actually make money",
    caption:
      "It reads your statements and invoices and drafts the bookkeeping for you, dated to the production month and matched to each well. Then it shows profit and lifting cost per well, so you finally know which ones earn and which ones bleed.",
  },
  {
    eyebrow: "The whole picture",
    header: "Insights across your entire operation",
    caption:
      "It's been reading your logs, your production, and your books all along, so you can ask what no spreadsheet could: “which wells logged good pay but are barely producing and losing money?” You get a straight answer back.",
  },
] as const;

// Fraction of the scroll devoted to the intro "shrink and dock" transition.
// The remaining scroll is split evenly across the demos.
const SHRINK_END = 1 / (DEMOS.length + 1);

// Navbar deep-links: maps a section id (the nav tab) to the demo index it should
// land on, so clicking a tab scrolls to where that frame is active.
const NAV_ANCHORS: { id: string; index: number }[] = [
  { id: "exploration", index: 1 }, // Well logs
  { id: "production", index: 2 }, // Production
  { id: "finance", index: 4 }, // Your books
  { id: "operations", index: 5 }, // The whole picture
];

const NAV_ID_BY_INDEX = new Map<number, string>(
  NAV_ANCHORS.map(({ id, index }) => [index, id]),
);

/**
 * Top offset (as a % of the tall section) at which demo `i` is centered in its
 * active band. Derived from the scroll math: demo i is active for
 * scrollYProgress in [(i+1)/(N+1), (i+2)/(N+1)); the midpoint maps to this
 * fraction of the section height. Landing here shows that frame docked.
 */
function anchorTopPercent(index: number): number {
  const n = DEMOS.length;
  return ((index + 1.5) * n) / (n + 1) ** 2 * 100;
}

// Run before paint on the client so the mobile/desktop choice never flashes.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function ScrollDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Screen geometry: full-width container → smaller, right-aligned.
  const width = useTransform(scrollYProgress, [0, SHRINK_END], ["100%", "56%"]);
  const right = useTransform(scrollYProgress, [0, SHRINK_END], ["0%", "2%"]);
  // Left-hand copy only appears once the screen has docked.
  const textOpacity = useTransform(
    scrollYProgress,
    [SHRINK_END * 0.7, SHRINK_END],
    [0, 1],
  );

  const [active, setActive] = useState(0);
  // Full app layout while large; switch to the tight, zoomed-in layout once the
  // screen has docked (shrunk small).
  const [docked, setDocked] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setDocked(v >= SHRINK_END);
    const cycle = (v - SHRINK_END) / (1 - SHRINK_END);
    const index = Math.min(
      DEMOS.length - 1,
      Math.max(0, Math.floor(cycle * DEMOS.length)),
    );
    setActive(index);
  });

  // --- Mobile: simple vertical stack of copy + full-width gif ---------------
  if (isMobile) {
    return (
      <section className="border-y border-white/5">
        <div className="mx-auto max-w-xl space-y-16 px-6 py-20">
          {DEMOS.map((demo, i) => (
            <div key={demo.header} id={NAV_ID_BY_INDEX.get(i)} className="scroll-mt-24">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                {demo.eyebrow}
              </p>
              <h2 className="mt-2 font-sans text-2xl font-medium leading-tight tracking-tight">
                {demo.header}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">
                {demo.caption}
              </p>
              <div className="mt-5 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-white">
                <DemoScreen index={i} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // --- Desktop: pinned screen that shrinks, docks, and cycles ---------------
  const current = DEMOS[active];

  return (
    <section
      ref={ref}
      style={{ height: `${(DEMOS.length + 1) * 100}vh` }}
      className="relative"
    >
      {/* Invisible scroll anchors for the navbar deep-links. Each sits at the
          offset where its mapped demo frame is active. */}
      {NAV_ANCHORS.map(({ id, index }) => (
        <span
          key={id}
          id={id}
          aria-hidden
          className="absolute left-0 h-px w-px"
          style={{ top: `${anchorTopPercent(index)}%` }}
        />
      ))}

      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="relative mx-auto h-full max-w-7xl px-6 lg:px-10">
          {/* Left: header + caption that cycles with the active demo */}
          <motion.div
            style={{ opacity: textOpacity }}
            className="absolute left-6 top-1/2 w-[30%] max-w-sm -translate-y-1/2 lg:left-10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <p className="text-sm font-semibold uppercase tracking-wider text-muted">
                  {current.eyebrow}
                </p>
                <h2 className="mt-3 font-sans text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
                  {current.header}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {current.caption}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Right: the demo screen - shrinks, docks, then cycles gifs */}
          <motion.div
            style={{ width, right, top: "50%", y: "-50%" }}
            className="absolute aspect-[16/9] overflow-hidden rounded-xl border border-border bg-white/[0.06]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${active}-${docked}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="h-full w-full"
              >
                <DemoScreen index={active} compact={docked} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
