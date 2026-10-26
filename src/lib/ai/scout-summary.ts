/**
 * landing: stand-in for the app's "use server" src/lib/ai/scout-summary.ts.
 * The app writes the summary with a model call over the dossier's figures.
 * The landing makes no model call, so the button answers with the dossier's
 * own latest month, stated plainly.
 */
import { reconLeaseDossier } from "@/lib/screens/recon-dossier-fixture";
import { api8, fmtVol, titleCase } from "@/lib/scout/format";
import type { WellDossier } from "@/lib/scout/rrc-types";

export interface ScoutSummary {
  text: string;
  cached: boolean;
  error?: string;
}

export async function summariseLease(oilGasCode: string, districtNo: string, leaseNo: string): Promise<ScoutSummary> {
  void oilGasCode;
  void districtNo;
  const lease = reconLeaseDossier(leaseNo);
  const last = lease?.monthly.filter((m) => m.reported).at(-1);
  if (!lease || !last) return { text: "", cached: false, error: "No record for that lease." };
  return {
    text: `${titleCase(lease.lease_name)} reported ${fmtVol(last.oil_prod_vol)} bbl of oil and ${fmtVol(last.csgd_prod_vol)} MCF of casinghead gas in ${last.cycle} from ${lease.wells.length} producing wells.`,
    cached: true,
  };
}

export async function summariseWell(api: string): Promise<ScoutSummary> {
  // landing: the dossier is the static file the well modal reads.
  const res = await fetch(`/api/scout/rrc/well/${api8(Number(api))}.json`);
  const well: WellDossier | null = res.ok ? await res.json() : null;
  const series = well ? (well.productionByTest.length > 0 ? well.productionByTest : well.production) : [];
  const last = series.filter((m) => m.reported).at(-1);
  if (!well || !last) return { text: "", cached: false, error: "No record for that well." };
  const h = well.header;
  return {
    text: `${titleCase(h.lease_name)} ${h.well_no_display ?? h.well_no ?? ""} produced ${fmtVol(last.oil_prod_vol)} bbl of oil and ${fmtVol(last.csgd_prod_vol)} MCF of casinghead gas in ${last.cycle}, operated by ${titleCase(h.operator_name ?? "")}.`,
    cached: true,
  };
}
