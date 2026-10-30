"use client";

/**
 * What the Documents page's web demos drive the app's own components with:
 * a phase clock that only runs on screen, and the browser events a person's
 * hands would make (a click, typing into a field, dropping a file, pasting
 * text), dispatched on the real controls so the components' own handlers run.
 */
import { useEffect, useState } from "react";
import { useDemoActive } from "../../demo-active";

/**
 * Walks `order` on a loop while the screen is in view, holding each phase for
 * its `hold`; `loop` counts the restarts, a key that remounts the screen fresh.
 */
export function usePhases<P extends string>(order: readonly P[], hold: Record<P, number>) {
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
  return { phase: order[at], loop, active };
}

/** An element under `root` matching `selector` whose trimmed text is `label`. */
export function byText<T extends HTMLElement = HTMLElement>(root: ParentNode | null | undefined, selector: string, label: string): T | undefined {
  return Array.from(root?.querySelectorAll<T>(selector) ?? []).find((b) => b.textContent?.trim() === label);
}

/** Sets a React-controlled input's value the way typing does, so its `onChange` runs. */
export function typeInto(input: HTMLInputElement | null | undefined, value: string) {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

/** A file dragged over `target` (`over`) or let go on it (`drop`). */
export function dragFile(target: Element | null | undefined, file: File, kind: "over" | "drop") {
  if (!target) return;
  const dt = new DataTransfer();
  dt.items.add(file);
  const type = kind === "over" ? "dragover" : "drop";
  target.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
}

/**
 * A paste of `text` on the page. Returns false where the browser builds the
 * event without the clipboard payload (it then reaches the listener empty).
 */
export function pasteText(text: string): boolean {
  const dt = new DataTransfer();
  dt.setData("text/plain", text);
  const event = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
  if (!event.clipboardData?.getData("text/plain")) return false;
  document.dispatchEvent(event);
  return true;
}
