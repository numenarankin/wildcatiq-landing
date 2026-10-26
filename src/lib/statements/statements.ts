// landing: the client-safe part of the app's src/lib/statements/statements.ts.
// The app file also holds the Supabase readers and writers; the landing keeps
// the types and the two pure price helpers the review grid and the statements
// table read, copied verbatim.

export type StatementStatus = "received" | "extracted" | "reviewed";

/** A statement's commodity coverage (line items carry their own product). */
export type StatementProduct = "oil" | "gas" | "mixed";

/** A single line's commodity: statements settle oil and gas separately. */
export type LineProduct = "oil" | "gas";

export interface StatementLineItem {
  id: string;
  statementId: string;
  /** Matched lease id, or null if unmapped. Interest/NRI is held per lease. */
  leaseId: string | null;
  /** Matched tank id (oil lines), or null. The measurement/allocation point. */
  tankId: string | null;
  /** Matched meter id (gas lines), or null. The measurement/allocation point. */
  meterId: string | null;
  /** Lease name/number exactly as printed on the statement. */
  leaseRef: string;
  /** Tank number as printed (oil). */
  tankRef: string;
  /** Meter number as printed (gas). */
  meterRef: string;
  /** Matched-entity display names (joined), "" when unmatched. */
  leaseName: string;
  tankName: string;
  meterName: string;
  product: LineProduct;
  /** Volume sold: bbls for oil, MCF for gas. */
  volume: number;
  price: number | null;
  grossValue: number;
  deducts: number;
  taxes: number;
  netValue: number;
  // Gas-only settlement fields (null on oil lines).
  mmbtu: number | null;
  allocatedQty: number | null;
  producerPct: number | null;
  settleQty: number | null;
  fees: number;
  /** Long-tail fields not promoted to typed columns. */
  raw: Record<string, unknown>;
  position: number;
}

/** A statement header row (index), totals denormalized. */
export interface Statement {
  id: string;
  purchaserId: string | null;
  /** Purchaser name (joined), or "" if none. */
  purchaser: string;
  periodStart: string;
  periodEnd: string;
  product: StatementProduct;
  status: StatementStatus;
  statementNo: string;
  /** The check / ACH number the statement was paid under, or "" if none. */
  checkNo: string;
  storageKey: string | null;
  fileName: string | null;
  mime: string | null;
  size: number | null;
  totalOilBbls: number;
  totalGasMcf: number;
  totalValue: number;
  totalDeducts: number;
  totalTaxes: number;
  notes: string;
  /** Header-level long-tail fields not promoted to typed columns. */
  raw: Record<string, unknown>;
  createdAt: string;
}

/** A statement with its line items (detail view). */
export interface StatementWithLines extends Statement {
  lineItems: StatementLineItem[];
}

/**
 * A line's net value: the printed `netValue` when it is set/nonzero, otherwise
 * derived as gross - deducts - taxes. Statements print net; this keeps the two
 * consistent when only the gross breakdown was captured.
 */
export function lineNetValue(line: {
  grossValue: number;
  deducts: number;
  taxes: number;
  netValue?: number | null;
}): number {
  const net = line.netValue;
  if (net != null && Number.isFinite(net) && net !== 0) return net;
  return (line.grossValue ?? 0) - (line.deducts ?? 0) - (line.taxes ?? 0);
}

/**
 * Null when there is no volume to divide by; the same shape as a price the
 * document never printed.
 */
export function realizedUnitPrice(line: {
  volume: number;
  netValue: number;
}): number | null {
  if (!line.volume) return null;
  return line.netValue / line.volume;
}

/** The price to store and to show for one line: derived on gas, printed on oil. */
export function gasLinePrice(line: {
  product: LineProduct;
  volume: number;
  netValue?: number | null;
  price?: number | null;
  grossValue?: number;
  deducts?: number;
  taxes?: number;
  fees?: number | null;
}): number | null {
  if (line.product !== "gas") return line.price ?? null;
  const netValue =
    line.netValue ??
    lineNetValue({
      grossValue: line.grossValue ?? 0,
      deducts: line.deducts ?? 0,
      taxes: line.taxes ?? 0,
    });
  return realizedUnitPrice({ volume: line.volume, netValue });
}
