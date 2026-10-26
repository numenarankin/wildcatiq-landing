"use client";

/** Wells mode over Young County, west of Graham: the RRC's own well marks once the bubbles break. */
import { reconWellFilters } from "@/lib/screens/recon-fixture";
import { ReconMapScene } from "./map-scene";

export function ReconLayersScreen() {
  return <ReconMapScene filters={reconWellFilters} center={[-98.7, 33.14]} zoom={10.4} />;
}
