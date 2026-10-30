"use client";

/**
 * The step clock the Recon dossier demos run on, the way `permits.tsx` and
 * `recon-live.tsx` run theirs: each step does its one thing on the next frame
 * (so it measures what has painted), holds, and hands over to the next; the
 * last hands back to the first. It only runs while the screen is in view
 * (`useDemoActive`) and once the screen says it is ready (the map drawn).
 *
 * The pointer is the shared `DemoCursor`. A step aims it at an element or a
 * map point and presses; the press is a real `click()` on the app's own
 * button, so the app's handler opens the tab or the dossier.
 */
import { useEffect, useRef, useState } from "react";
import { useDemoActive } from "../../demo-active";
import { centreOf, toCanvas, type CursorPoint } from "./cursor";

export type Cursor = (CursorPoint & { down: boolean }) | null;

export interface TourApi {
  /** Glide the pointer to an element's centre. */
  aim(el: Element | null | undefined): void;
  /** Glide the pointer to a point in the viewport (e.g. a projected map point). */
  aimViewport(vx: number, vy: number, from: Element | null): void;
  /** Ring the pointer and click the element it is on. */
  press(el?: HTMLElement | null): void;
  hide(): void;
}

/**
 * A step. Steps are written at module scope and reach the screen's refs and
 * setters through `ctx`, handed over when the step runs, never during render.
 */
export interface TourStep<C> {
  id: string;
  ms: number;
  run?: (t: TourApi, ctx: C) => void;
}

export function useTour<C>(steps: TourStep<C>[], ctx: C, ready = true) {
  const active = useDemoActive();
  const [index, setIndex] = useState(0);
  const [loop, setLoop] = useState(0);
  const [cursor, setCursor] = useState<Cursor>(null);
  const stepsRef = useRef(steps);
  const ctxRef = useRef(ctx);
  useEffect(() => {
    stepsRef.current = steps;
    ctxRef.current = ctx;
  }, [steps, ctx]);

  useEffect(() => {
    if (!active || !ready) return;
    const step = stepsRef.current[index];
    const api: TourApi = {
      aim: (el) => {
        const c = centreOf(el);
        if (c) setCursor({ ...c, down: false });
      },
      aimViewport: (vx, vy, from) => {
        const c = toCanvas(from, vx, vy);
        if (c) setCursor({ ...c, down: false });
      },
      press: (el) => {
        setCursor((c) => (c ? { ...c, down: true } : c));
        el?.click();
      },
      hide: () => setCursor(null),
    };
    const frame = requestAnimationFrame(() => step.run?.(api, ctxRef.current));
    const id = setTimeout(() => {
      const next = (index + 1) % stepsRef.current.length;
      if (next === 0) setLoop((n) => n + 1);
      setIndex(next);
    }, step.ms);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(id);
    };
  }, [active, ready, index]);

  return { step: steps[index]?.id ?? "", loop, cursor };
}

/** A visible tab in `root` whose label starts with `label`. */
export function tabIn(root: Element | null | undefined, label: string): HTMLButtonElement | null {
  const tabs = Array.from(root?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
  return tabs.find((t) => t.offsetWidth > 0 && (t.firstChild?.textContent ?? t.textContent ?? "").trim().startsWith(label)) ?? null;
}

/** A visible button in `root` whose text includes `text`. */
export function buttonIn(root: Element | null | undefined, text: string): HTMLButtonElement | null {
  const buttons = Array.from(root?.querySelectorAll<HTMLButtonElement>("button") ?? []);
  return buttons.find((b) => b.offsetWidth > 0 && (b.textContent ?? "").includes(text)) ?? null;
}
