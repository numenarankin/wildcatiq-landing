"use client";

/**
 * The app publishes what is on screen to Orion and lets Orion drive the page.
 * The landing has no live Orion, so every hook here is a no-op with the app's
 * signature.
 */
import type { ContextSlice } from "@/lib/ai/page-context";
import type { UIMessage } from "@/lib/ai/sdk";

export function usePageContextSlice(id: string, slice: ContextSlice | null | unknown): void {
  void id;
  void slice;
}

/** Every published slice, read at send time. Nothing publishes on the landing. */
export function currentSlices(): ContextSlice[] {
  return [];
}

/** Applies page directives Orion produced. Nothing to apply on the landing. */
export function usePageActionDispatch(messages: UIMessage[]): void {
  void messages;
}
