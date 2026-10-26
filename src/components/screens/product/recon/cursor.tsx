"use client";

/**
 * The scripted pointer the Recon demos press with, as the home page's Recon
 * demo draws it. It is `fixed`, which inside the transformed screen canvas
 * positions against the canvas, so `toCanvas` maps a viewport point (from
 * `getBoundingClientRect`) back into the canvas's unscaled pixels.
 */

export type CursorPoint = { x: number; y: number };

export function toCanvas(from: Element | null, vx: number, vy: number): CursorPoint | null {
  const canvas = from?.closest<HTMLElement>("[data-screen-canvas]");
  if (!canvas || !canvas.offsetWidth) return null;
  const cr = canvas.getBoundingClientRect();
  const scale = cr.width / canvas.offsetWidth;
  return { x: (vx - cr.left) / scale, y: (vy - cr.top) / scale };
}

/** The centre of an element, in canvas pixels. */
export function centreOf(el: Element | null | undefined): CursorPoint | null {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return toCanvas(el, b.left + b.width / 2, b.top + b.height / 2);
}

export function DemoCursor({ x, y, down }: CursorPoint & { down: boolean }) {
  return (
    <div
      className="pointer-events-none fixed z-[120] transition-[left,top] duration-700 ease-[cubic-bezier(.22,.61,.36,1)]"
      style={{ left: x, top: y }}
    >
      {down && <span className="absolute -left-3 -top-3 size-6 animate-ping rounded-full bg-black/40" />}
      <svg
        width="22"
        height="26"
        viewBox="0 0 22 26"
        className="-translate-x-[3px] -translate-y-[2px] drop-shadow-[0_1px_2px_rgba(0,0,0,.5)]"
      >
        <path
          d="M3 2 L3 20 L8 15.5 L11.5 23 L14.5 21.7 L11 14.2 L18 14 Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
