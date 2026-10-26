/**
 * landing: the types of the app's src/lib/scout/cad-owners.ts. The app's
 * browser reads of `/api/scout/cad/owners` are left out: the landing has no
 * mineral roll behind it.
 */
import type { OwnerDossier, OwnerMatch } from "@/lib/scout/rrc-types";

export type { OwnerDossier, OwnerMatch };

/** The key of one owner on one county's roll for one tax year. */
export interface OwnerKey {
  county_no: string;
  tax_year: number;
  owner_id: string;
}
