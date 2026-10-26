import type { IngestType } from "@/lib/ai/ingest/types";

/**
 * Production history first. A document uploaded as history is read for the
 * volumes it records, so those cards are reviewed before the equipment, service
 * and notes the same scan noticed on the way. In this order within the group;
 * every other type keeps the order the scan produced it in.
 */
const PRODUCTION_FIRST: readonly IngestType[] = [
  "production",
  "tankReadings",
  "runTickets",
  "meterReadings",
  "meterVolumes",
  "disposalReadings",
  "wellTests",
  "gasTests",
];

function rank(type: IngestType): number {
  const i = PRODUCTION_FIRST.indexOf(type);
  return i === -1 ? PRODUCTION_FIRST.length : i;
}

/** Stable sort: production-history types first, everything else after. */
export function productionFirst<T extends { type: IngestType }>(items: T[]): T[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item.type) - rank(b.item.type) || a.i - b.i)
    .map(({ item }) => item);
}
