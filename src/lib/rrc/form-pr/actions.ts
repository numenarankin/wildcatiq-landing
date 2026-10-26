/**
 * Landing stand-ins for the app's Form PR server actions
 * (`src/lib/rrc/form-pr/actions.ts`, "use server"). The types are the app's.
 * The actions are inert: the landing never builds a file on a server, it
 * shows a month the fixture built with the app's own pure writer
 * (`src/lib/screens/filings-fixture.ts`).
 */
import type { PrRecord } from "@/lib/rrc/form-pr/spec";
import type { FilerSettings } from "@/lib/rrc/form-pr/service";
import type { SummaryRow } from "@/lib/rrc/form-pr/sheet";

type Result = { error?: string };

export interface GeneratedFile {
  name: string;
  text: string;
}

export interface GeneratedFormPr {
  /** The records as they will be written, for the operator to read and edit. */
  records: PrRecord[];
  files: GeneratedFile[];
  /** The same records as a spreadsheet: a summary sheet and every PR field. */
  sheet: { name: string; base64: string };
  /** The same records on the RRC's paper form (`pdf.ts`). */
  pdf: { name: string; base64: string };
  /** What the file says, in the figures an operator checks before filing. */
  summary: {
    cycle: string;
    month: string;
    due: string;
    operator: string;
    recordCount: number;
    rows: SummaryRow[];
  };
  /** The Identifying Record this file carries, and what it says about itself. */
  header: FilerSettings & { delimiter: string; currentProductionMonth: boolean };
  /** What the operator calls each record's lease(s), keyed by record key with
   *  no commingle permit, since field 45 is the RRC's name and not theirs. */
  localNames: Record<string, string>;
  /** What the RRC would take exception to, worst first, each naming its field. */
  issues: {
    level: "block" | "warn";
    message: string;
    recordKey: string | null;
    field: string | null;
    rule: string;
  }[];
}

export async function saveRrcFiler(input: FilerSettings): Promise<Result> {
  void input;
  return {};
}

/** How long the app's build takes to come back, so the demo's Building… reads as one. */
export const BUILD_MS = 1100;

/** The fixture's September, after the pause a real build takes; any other month has nothing. */
export async function generateFormPr(cycle: string): Promise<{ result?: GeneratedFormPr; error?: string }> {
  const { PR_CYCLE, septemberFormPr } = await import("@/lib/screens/filings-fixture");
  await new Promise((r) => setTimeout(r, BUILD_MS));
  return cycle === PR_CYCLE ? { result: septemberFormPr() } : { error: "No production is on file for this month." };
}

export async function storedFormPr(cycle: string): Promise<{ result?: GeneratedFormPr; error?: string }> {
  void cycle;
  return {};
}

export async function downloadFormPr(
  cycle: string,
  edited: PrRecord[]
): Promise<{ result?: GeneratedFormPr; error?: string }> {
  void edited;
  return generateFormPr(cycle);
}
