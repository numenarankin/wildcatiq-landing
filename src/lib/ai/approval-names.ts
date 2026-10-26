/**
 * The app resolves the ids on an approval card to names through a server action
 * as the signed-in user. The landing answers from the fixture's name book.
 */
import type { NameBook } from "@/lib/ai/approval-view";
import { FIXTURE_NAMES } from "@/lib/screens/orion-fixture";

export async function approvalNames(refs: Record<string, string[]>): Promise<NameBook> {
  const out: NameBook = {};
  for (const ids of Object.values(refs)) {
    for (const id of ids) {
      const name = FIXTURE_NAMES[id];
      if (name) out[id] = name;
    }
  }
  return out;
}
