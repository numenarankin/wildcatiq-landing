import { z } from "zod";
import {
  allocateLeaseFinancials,
  type OilRunStatementDraft,
} from "@/lib/ai/ingest/oil-run-statement";

/**
 * The runs under a statement line (docs/plans/run-ticket-revenue.md).
 *
 * A purchaser's run statement settles a lease as a list of hauls. The ONE
 * extraction that reads the statement reads those hauls too, as `runs` on the
 * lease's line, so there is a single pass over the paper: the review shows
 * them as soon as it opens, the run tickets proposed after save are built
 * from them, and they are kept on the filed line (in its `raw`) so nothing
 * ever has to read the document again to get them back.
 *
 * Pure and client-safe.
 */

/**
 * One haul as the statement prints it.
 *
 * Plain types only, like the line it sits on: this is part of the schema the
 * extractor is asked to fill, and a preprocess step has no JSON Schema form.
 */
export const statementRunSchema = z.object({
  /** ISO YYYY-MM-DD of the haul; "" when only the period is printed. */
  runDate: z.string().default(""),
  ticketNo: z.string().default(""),
  /** The tank or meter the crude ran off, as printed. */
  tankRef: z.string().default(""),
  transporter: z.string().default(""),
  gravity: z.number().nullable().default(null),
  /** Net barrels on the run. */
  volume: z.number(),
  // Each null when the statement does not print it for the run.
  price: z.number().nullable().default(null),
  grossValue: z.number().nullable().default(null),
  taxes: z.number().nullable().default(null),
  netValue: z.number().nullable().default(null),
});

export type StatementRun = z.infer<typeof statementRunSchema>;

/** Where a line keeps its runs once it leaves the extractor. */
export const RUNS_KEY = "runs";

/** The runs a line carries, from its `raw`. A run that does not parse is left out. */
export function runsOfLine(line: {
  raw?: Record<string, unknown> | null;
}): StatementRun[] {
  const value = line.raw?.[RUNS_KEY];
  if (!Array.isArray(value)) return [];
  const out: StatementRun[] = [];
  for (const item of value) {
    const parsed = statementRunSchema.safeParse(item);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/**
 * Give each run its dollars when the statement prints them once for the lease
 * and not per haul, which is the common layout: one price and one tax rate
 * cover every run, so the split is exactly proportional to barrels. The
 * arithmetic is `allocateLeaseFinancials`, the same one the Data Entry reader
 * uses, so the model is never asked to prorate. Runs the statement did break
 * out are left as printed. Returns new runs; the input is not changed.
 */
export function allocateRunMoney(
  runs: StatementRun[],
  line: { price: number | null; grossValue: number; taxes: number; netValue: number }
): StatementRun[] {
  if (runs.length === 0) return runs;
  const work = runs.map((r) => ({
    volume: r.volume,
    // The lease's PRINTED price is every run's price when a run prints none;
    // seeded here so the split does not replace it with a derived one.
    price: r.price ?? line.price,
    gross: r.grossValue,
    taxes: r.taxes,
    net: r.netValue,
  }));
  // A line with no money at all (a figure the extractor could not read) has
  // nothing to hand down; zeros would print as $0.00 on every run.
  const hasMoney = line.grossValue !== 0 || line.netValue !== 0;
  if (hasMoney) {
    allocateLeaseFinancials(work, {
      gross: line.grossValue,
      taxes: line.taxes,
      net: line.netValue,
    });
  }
  return runs.map((r, i) => ({
    ...r,
    price: work[i].price,
    grossValue: work[i].gross,
    taxes: work[i].taxes,
    netValue: work[i].net,
  }));
}

/** A statement and its lines, as much as the run backfill needs. */
export interface StatementWithRuns {
  purchaser: string;
  statementNo: string;
  periodStart: string;
  periodEnd: string;
  lines: {
    leaseRef: string;
    tankRef: string;
    product: "oil" | "gas";
    raw?: Record<string, unknown> | null;
  }[];
}

/**
 * Statements with runs on their lines, in the shape `runBackfillFromDrafts`
 * turns into tank and run ticket proposals. A run with no tank of its own
 * takes its line's.
 */
export function runDraftsFromStatements(
  statements: StatementWithRuns[]
): OilRunStatementDraft[] {
  const out: OilRunStatementDraft[] = [];
  for (const s of statements) {
    const lines = s.lines
      .filter((l) => l.product === "oil")
      .flatMap((l) =>
        runsOfLine(l).map((r) => ({
          leaseRef: l.leaseRef,
          tankRef: r.tankRef.trim() || l.tankRef,
          ticketNo: r.ticketNo,
          ticketType: "run" as const,
          transporter: r.transporter,
          gravity: r.gravity,
          runDate: r.runDate,
          volume: r.volume,
          price: r.price,
          gross: r.grossValue,
          taxes: r.taxes,
          net: r.netValue,
          sourceText: "",
        }))
      );
    if (lines.length === 0) continue;
    out.push({
      purchaser: s.purchaser,
      purchaserPhone: "",
      purchaserEmail: "",
      statementNo: s.statementNo,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      lines,
    });
  }
  return out;
}
