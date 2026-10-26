"use client";

/**
 * landing: the app's Minerals tab reads the county appraisal roll over
 * `/api/scout/cad`. Only Archer County's roll is loaded (`cad.ts`), and the
 * fixture's leases are in Martin County, so the tab never mounts here.
 */
import type { OwnerKey } from "@/lib/scout/cad-owners";

export function LeaseMineralsPanel(props: {
  leaseKey: { oil_gas_code: string; district_no: string; lease_no: string };
  countyNo: string;
  onSelectOwner?: (owner: OwnerKey) => void;
}) {
  void props;
  return null;
}
