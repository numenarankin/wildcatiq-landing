/**
 * landing: shim of the app's "use server" src/lib/scout/queries.ts. The filters
 * bar calls `searchOperators` as the user types an operator name; there is no
 * RRC database behind the landing, so it answers with no matches.
 */
import type { OperatorMatch } from "@/lib/scout/types";

export async function searchOperators(query: string): Promise<OperatorMatch[]> {
  void query;
  return [];
}
