/**
 * The shapes a hub report's pickers are described in. Client-safe, so the
 * picker component can read them without importing the server-only sources.
 */

/**
 * A report's query params (`?period=`, `?battery=`, `?tank=`), normalized by
 * the report's own `params`. Only the keys the report reads; never blank.
 */
export type ReportParams = Record<string, string>;

/** One picker in a report's header, bound to one query param. */
export interface ReportPicker {
  param: string;
  /** The current value; "" when nothing is picked (the "all" choice). */
  value: string;
  /** The label of the "all" choice. Absent when the picker has none. */
  allLabel?: string;
  options: { value: string; label: string }[];
  /** Params dropped when this one changes (a tank that is not on the new battery). */
  clears?: string[];
  /**
   * Narrows the report to a subset of facilities (lease, well, battery, tank)
   * rather than choosing its period. Shown at the right, under the actions.
   */
  filter?: boolean;
}

/**
 * The params after picking `value` ("" for the "all" choice) in `picker`:
 * the pick set or dropped, and whatever it `clears` dropped with it.
 */
export function nextParams(
  params: ReportParams,
  picker: Pick<ReportPicker, "param" | "clears">,
  value: string
): ReportParams {
  const next: ReportParams = { ...params };
  for (const p of picker.clears ?? []) delete next[p];
  if (value) next[picker.param] = value;
  else delete next[picker.param];
  return next;
}
