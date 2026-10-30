/**
 * Recon alerts on the landing: Jim's one saved alert over Young and Jack,
 * and the arrivals its Oct 27 email carries. The approved permit is the one
 * the Permits section opens (`reconPermit`): Tonk Creek Operating's
 * Harlan Ranch 3, issued three days before FIXTURE_TODAY. The other two
 * arrivals are simulated too, by fictional operators absent from the P-5 list.
 *
 * The app's weekly alerts always send on Fridays (`FREQUENCY_LABEL`), so the
 * alert is daily: that is what lets the Tuesday email carry a Saturday
 * approval the mirror picked up Monday night.
 */
import type { ArrivalItem, ReconAlert } from "@/lib/recon-alerts/types";
import { reconAlertEmail } from "@/lib/recon-alerts/email";
import { HARLAN_3_PERMIT_NO, reconPermit } from "./recon-fixture";
import { FIXTURE_TODAY } from "./operator";

const YOUNG = 503;
const JACK = 237;

export const reconAlerts: ReconAlert[] = [
  {
    id: "4f1c2a9e-7b3d-4e8a-9c21-6d5e0f3b8a17",
    orgId: "",
    userId: "",
    name: "Young and Jack",
    countyCodes: [YOUNG, JACK],
    kinds: ["pending_permit", "permit", "well"],
    frequency: "daily",
    sendHour: 7,
    timezone: "America/Chicago",
    enabled: true,
    cursorAt: "2026-10-26T05:12:00Z",
    nextDueAt: "2026-10-28T12:00:00Z",
  },
];

/** Days before FIXTURE_TODAY, as `YYYY-MM-DD`. */
function daysBefore(n: number): string {
  const d = new Date(`${FIXTURE_TODAY}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

const str = (v: unknown) => (typeof v === "string" ? v : null);

export const reconArrivals: ArrivalItem[] = [
  {
    kind: "permit",
    key: HARLAN_3_PERMIT_NO,
    countyCode: YOUNG,
    operatorNumber: str(reconPermit.opNo),
    operatorName: str(reconPermit.op),
    leaseName: str(reconPermit.lease),
    wellNumber: str(reconPermit.well),
    purpose: str(reconPermit.purpose),
    totalDepth: typeof reconPermit.depth === "number" ? reconPermit.depth : null,
    // `days` counts from issue on an approved permit.
    eventDate: daysBefore(typeof reconPermit.days === "number" ? reconPermit.days : 3),
    doc: "1187309",
    firstSeen: "2026-10-27T05:08:00Z",
  },
  {
    kind: "pending_permit",
    key: "1188054",
    countyCode: JACK,
    operatorNumber: "903516",
    operatorName: "LOST VALLEY PETROLEUM INC",
    leaseName: "CRAWFORD-BIRDWELL",
    wellNumber: "2",
    purpose: "Recompletion",
    totalDepth: 5120,
    eventDate: "2026-10-26",
    doc: null,
    firstSeen: "2026-10-27T05:08:00Z",
  },
  {
    kind: "well",
    key: "50385877",
    countyCode: YOUNG,
    operatorNumber: "870392",
    operatorName: "BELKNAP RIDGE OIL CO",
    leaseName: "PROFFITT",
    wellNumber: "11",
    purpose: null,
    totalDepth: 4680,
    eventDate: "2026-10-22",
    doc: null,
    firstSeen: "2026-10-27T05:08:00Z",
  },
];

/** The Oct 27 email, built by the app's own pure email writer. */
export function reconAlertEmailHtml(): string {
  const a = reconAlerts[0];
  return reconAlertEmail({
    alertId: a.id,
    alertName: a.name,
    countyCodes: a.countyCodes,
    kinds: a.kinds,
    items: reconArrivals,
    baseUrl: "https://app.wildcatiq.com",
    dataAsOf: "2026-10-27T05:08:00Z",
    offUrl: "https://app.wildcatiq.com/api/recon-alerts/off",
  }).htmlContent;
}
