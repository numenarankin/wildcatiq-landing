/**
 * landing: the RRC mirror the app's Recon components fetch
 * (`/api/scout/rrc/lease/...`, `/api/scout/rrc/operator/<no>/tree`),
 * answered from the fixture operator. Only Sky Resources' leases are on file.
 */
import type { LeaseDossier, OperatorTree } from "@/lib/scout/rrc-types";
import { reconLeaseDossier, skyTree } from "@/lib/screens/recon-dossier-fixture";
import { SKY_OPERATOR_NO } from "@/lib/screens/recon-rrc";

export function mirrorLease(leaseNo: string): LeaseDossier | null {
  return reconLeaseDossier(leaseNo);
}

export function mirrorOperatorTree(operatorNo: string): OperatorTree | null {
  return operatorNo.padStart(6, "0") === SKY_OPERATOR_NO ? skyTree() : null;
}
