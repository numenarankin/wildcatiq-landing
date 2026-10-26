"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * Whether a scripted demo should be running. A demo's timeline only advances
 * while its screen is on screen: it starts when the visitor scrolls to it and
 * pauses when they scroll past, so nobody arrives mid-way through a loop that
 * began at page load. Outside a provider a demo runs, so a screen rendered on
 * its own still animates.
 */
const DemoActiveContext = createContext(true);

export function useDemoActive(): boolean {
  return useContext(DemoActiveContext);
}

/** Share of the screen that must be visible before its demo runs. */
const VISIBLE_SHARE = 0.4;

export function DemoActiveProvider({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: VISIBLE_SHARE });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      <DemoActiveContext.Provider value={active}>{children}</DemoActiveContext.Provider>
    </div>
  );
}
