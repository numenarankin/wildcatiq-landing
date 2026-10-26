// Stand-ins for the app's filings server actions. Inert on the landing.
import { downloadFormPr, type GeneratedFormPr } from "@/lib/rrc/form-pr/actions";
import type { PrRecord } from "@/lib/rrc/form-pr/spec";

export async function unmarkFiled(id: string): Promise<{ error?: string }> {
  void id;
  return {};
}

/** The generate step: the same build, after the same pause. */
export async function downloadFormPrFiling(
  cycle: string,
  edited: PrRecord[]
): Promise<{ result?: GeneratedFormPr; error?: string }> {
  return downloadFormPr(cycle, edited);
}
