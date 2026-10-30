/**
 * landing: the RRC mirror the app's Recon components fetch
 * (`/api/scout/rrc/lease/...`, `/api/scout/rrc/operator/<no>/tree`) and the
 * operator dossier's server actions (`getOperatorProfile`,
 * `getOperatorWellRates` in the app's "use server" `queries.ts`), answered
 * from the fixtures. Two operators are on file: Sky Resources (the fixture
 * operator) and Tonk Creek Operating (the neighbour, `recon-tonk-fixture.ts`).
 */
import type { LeaseDossier, OperatorTree } from "@/lib/scout/rrc-types";
import type { OperatorProfile, OperatorWellRates } from "@/lib/scout/types";
import { reconLeaseDossier, skyTree } from "@/lib/screens/recon-dossier-fixture";
import { SKY_OPERATOR_NO } from "@/lib/screens/recon-rrc";
import { TONK, tonkLeaseDossier, tonkProfile, tonkTree, tonkWellRates } from "@/lib/screens/recon-tonk-fixture";

const pad6 = (n: string | number) => String(n).padStart(6, "0");

export function mirrorLease(leaseNo: string): LeaseDossier | null {
  return reconLeaseDossier(leaseNo) ?? tonkLeaseDossier(leaseNo);
}

export function mirrorOperatorTree(operatorNo: string): OperatorTree | null {
  const no = pad6(operatorNo);
  if (no === SKY_OPERATOR_NO) return skyTree();
  if (no === TONK.no) return tonkTree();
  return null;
}

/** The operator dossier's one read. Only Tonk Creek's profile is built. */
export async function getOperatorProfile(operatorNumber: number): Promise<OperatorProfile> {
  if (pad6(operatorNumber) === TONK.no) return tonkProfile();
  throw new Error("404");
}

export async function getOperatorWellRates(operatorNumber: number): Promise<OperatorWellRates> {
  if (pad6(operatorNumber) === TONK.no) return tonkWellRates();
  return { byApi: {}, capped: false };
}
