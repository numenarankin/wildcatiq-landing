import type { Substance, FacilityKind, FlowView } from "@/lib/facilities/graph";

/**
 * Substance colors + facility presentation for the Facilities canvas. Oil / gas /
 * water follow the field convention (green / red / blue) so the flowlines read at
 * a glance. Values are hex (not theme tokens) because they color SVG strokes and
 * must stay legible in both light and dark.
 */
export const SUBSTANCE_COLOR: Record<Substance, string> = {
  oil: "#16a34a", // green-600
  gas: "#dc2626", // red-600
  water: "#2563eb", // blue-600
};

/** What the operator calls each stream. Produced water is saltwater in the field
 *  and on every surface of this page, so it is named that everywhere. */
export const SUBSTANCE_LABEL: Record<Substance, string> = {
  oil: "Oil",
  gas: "Gas",
  water: "Saltwater",
};

/** The map's views in menu order: every stream at once first, then each one. */
export const FLOW_VIEWS: FlowView[] = ["all", "oil", "gas", "water"];

export const VIEW_LABEL: Record<FlowView, string> = {
  all: "All",
  ...SUBSTANCE_LABEL,
};

/**
 * A card with no stream of its own on the all view: a well makes all three,
 * so no one colour is its. The theme's muted ink, so it reads as a card and
 * not as a fourth stream.
 */
export const NEUTRAL_COLOR = "var(--muted-foreground)";

/**
 * The stream a card is drawn in. On a single-stream view, that stream; on the
 * all view, the facility's own (an oil tank is green, a gas meter red), and
 * null for a well, which has no one stream.
 */
export function cardStream(node: { kind: FacilityKind; substances: Substance[] }, view: FlowView): Substance | null {
  if (view !== "all") return view;
  if (node.kind === "well") return null;
  return node.substances[0] ?? null;
}

/**
 * A rate as the map PRINTS it — one decimal below 100, whole numbers above.
 *
 * Exported as a number, not just as text, because the headline is the sum of the
 * cards and has to be the sum of the numbers the operator can actually read. Add
 * the underlying values instead and ten cards rounded to the nearest barrel miss
 * the total by up to five, which is the page telling them two different things.
 */
export function roundRate(value: number): number {
  return Math.abs(value) < 100 ? Math.round(value * 10) / 10 : Math.round(value);
}

/** {@link roundRate}, formatted. */
export function rateText(value: number): string {
  return roundRate(value).toLocaleString("en-US", { maximumFractionDigits: 1 });
}

/**
 * A total of already-rounded card values. Printed as it is — NOT rounded again,
 * which above 100 would drop the tenth the cards contributed and undo the point.
 */
export function totalText(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

/** Unit for a substance's flow label. Gas is mcf/d; liquids are bbl/d. */
export function flowUnit(substance: Substance): string {
  return substance === "gas" ? "mcf/d" : "bbl/d";
}

export const KIND_LABEL: Record<FacilityKind, string> = {
  well: "Well",
  injection: "SWD Well",
  tank: "Tank",
  meter: "Meter",
  battery: "Battery",
  gatherer: "Haul-off",
};

/** Lucide icon name per kind (resolved to a component where rendered). */
export const KIND_ICON: Record<FacilityKind, string> = {
  well: "Circle",
  injection: "Droplet",
  tank: "Cylinder",
  meter: "Gauge",
  battery: "Layers",
  gatherer: "Truck",
};
