"use client";

// landing: the app's drawer store is a zustand store shared by the shell and
// the Orion drawer. The landing has no drawer, so the hook answers a closed
// drawer with the same selector signature.

interface AiDrawerState {
  open: boolean;
  width: number;
  renderedWidth: number;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  setWidth: (width: number) => void;
}

export const DRAWER_MIN_WIDTH = 320;
export const DRAWER_MAX_WIDTH = 720;
export const DRAWER_DEFAULT_WIDTH = 384;

const CLOSED: AiDrawerState = {
  open: false,
  width: DRAWER_DEFAULT_WIDTH,
  renderedWidth: 0,
  toggle: () => {},
  setOpen: () => {},
  setWidth: () => {},
};

export function useAiDrawer<T>(selector: (s: AiDrawerState) => T): T {
  return selector(CLOSED);
}
