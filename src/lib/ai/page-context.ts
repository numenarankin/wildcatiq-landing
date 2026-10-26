/**
 * Mirror of the app's AI page-context module: the slice type, the priority
 * and row-cap constants the slice builders read (`context-slices.ts`), and
 * the prompt builder's signature. Nothing sends the result anywhere here.
 */
export interface ContextSlice {
  /** Sort key. Higher wins the budget. See `SLICE_PRIORITY`. */
  priority: number;
  /** Heading, e.g. `Open: operator PETEX (number 123456)`. */
  label: string;
  /** Rendered lines. */
  lines: string[];
}

/** The app's ordering: what is in front of the user outranks what is behind it. */
export const SLICE_PRIORITY = {
  modal: 100,
  selection: 80,
  contents: 60,
  controls: 50,
  ambient: 40,
} as const;

/** Rows a builder lists before it truncates itself and states the count. */
export const MAX_LIST_ROWS = 15;

export function buildPageContext(pathname: string, slices: readonly ContextSlice[]): string {
  void slices;
  return `The user is currently on route ${pathname}.`;
}
