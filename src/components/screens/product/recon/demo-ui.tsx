"use client";

/**
 * What the scripted Recon demos need beyond the pointer.
 *
 * `DemoMenu` is the open state of a dropdown. The app's Select and Popover
 * portal their popups to `document.body`, which is outside the scaled screen
 * canvas, so a real one would open unscaled and off to one side. This draws
 * the open popup inside the canvas, under the real trigger, with the classes
 * `ui/select.tsx` (`SelectContent`, `SelectItem`) gives it; the choice is then
 * applied through the same state the real control writes.
 *
 * `typeInto` types into a real input the way a keyboard does, so the
 * component's own `onChange` runs.
 */
import { CheckIcon } from "lucide-react";
import { toCanvas, type CursorPoint } from "./cursor";

export type CanvasRect = { x: number; y: number; w: number; h: number };

/** An element's box in canvas pixels. */
export function rectOf(el: Element | null | undefined): CanvasRect | null {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const a = toCanvas(el, b.left, b.top);
  const z = toCanvas(el, b.right, b.bottom);
  if (!a || !z) return null;
  return { x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y };
}

/** A point inside an element, as a share of its box (centre by default). */
export function pointIn(el: Element | null | undefined, fx = 0.5, fy = 0.5): CursorPoint | null {
  const r = rectOf(el);
  return r ? { x: r.x + r.w * fx, y: r.y + r.h * fy } : null;
}

/** The first element under `root` matching `selector` whose text starts with `text`. */
export function byText(root: ParentNode | null | undefined, selector: string, text: string): HTMLElement | null {
  return (
    Array.from(root?.querySelectorAll<HTMLElement>(selector) ?? []).find(
      (e) => e.offsetWidth > 0 && (e.textContent ?? "").trim().startsWith(text)
    ) ?? null
  );
}

/**
 * Types `text` into a React-controlled input one character at a time.
 * Returns a cancel function.
 */
export function typeInto(input: HTMLInputElement | null | undefined, text: string, every = 110): () => void {
  if (!input) return () => {};
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  input.focus();
  let i = 0;
  const id = setInterval(() => {
    i++;
    setter?.call(input, text.slice(0, i));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    if (i >= text.length) clearInterval(id);
  }, every);
  return () => clearInterval(id);
}

/** Clears a React-controlled input. */
export function clearInput(input: HTMLInputElement | null | undefined) {
  if (!input) return;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.blur();
}

export function DemoMenu<T extends string>({
  anchor,
  items,
  value,
  hover,
  minWidth = 144,
}: {
  /** The trigger's box, in canvas pixels. */
  anchor: CanvasRect;
  items: { v: T; label: string }[];
  /** The selected value, ticked as `SelectItem` ticks it. */
  value: T | null;
  /** The item under the pointer, highlighted as the app's focus style does. */
  hover?: T | null;
  minWidth?: number;
}) {
  return (
    <div
      data-demo-menu
      className="pointer-events-none fixed z-[115] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100"
      style={{ left: anchor.x, top: anchor.y + anchor.h + 4, minWidth: Math.max(minWidth, anchor.w) }}
    >
      <div className="overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
        {items.map((it) => (
          <div
            key={it.v}
            data-demo-item={it.v}
            className={`relative flex w-full items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-xs ${
              hover === it.v ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            <span className="flex flex-1 whitespace-nowrap">{it.label}</span>
            {value === it.v && (
              <span className="absolute right-2 flex size-4 items-center justify-center">
                <CheckIcon className="size-4" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
