"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * A block that rises and fades in on load. Animates `transform` and `opacity`
 * as whole values, which motion hands to the browser's compositor, so a busy
 * main thread (the demo screens rendering) cannot drop its frames. With
 * `afterPaint` it waits until the page has painted twice, so a heavy child
 * mounts first and only then moves.
 */
export function Rise({
  delay = 0,
  distance = 16,
  duration = 0.7,
  afterPaint = false,
  className,
  children,
}: {
  /** Seconds after the start. */
  delay?: number;
  /** Pixels it rises from. */
  distance?: number;
  /** Seconds. */
  duration?: number;
  afterPaint?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [painted, setPainted] = useState(!afterPaint);

  useEffect(() => {
    if (!afterPaint) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setPainted(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [afterPaint]);

  if (reduce) return <div className={className}>{children}</div>;

  const hidden = { opacity: 0, transform: `translateY(${distance}px)` };
  const shown = { opacity: 1, transform: "translateY(0px)" };
  return (
    <motion.div
      className={className}
      initial={hidden}
      animate={painted ? shown : hidden}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
