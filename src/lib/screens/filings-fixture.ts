/**
 * Sky Resources' Form PR, built the way the app builds it.
 *
 * The docket is `listDocket` (`src/lib/rrc/forms/data.ts`) on 2026-10-27: the
 * current cycle and the eleven before it, minus any cycle whose month has not
 * ended. The current cycle on that day is 202609, so every one of the twelve
 * has ended: 202609 back to 202510. Only September has been downloaded; the
 * rest are owed (`draft`, shown "Not generated"). Nothing is filed, because
 * nothing in the shipped app marks a row filed.
 *
 * The September build is one oil record per lease. Production is the lease's
 * September from the Dashboard's own per-well series (`leaseMonth`), so the
 * Form PR, the Dashboard and Recon's lease dossier carry the same barrels and
 * MCF. Ending storage is the lease tank's September close and opening its
 * August close (`ENDING_STOCK`, from the Documents tank month), so the truck
 * column that balances the two (PR051) is the barrels the statement settled.
 * The EDI text comes from the app's pure writer (`planExportFiles`) and the
 * issues from the app's validator (`validateDraft`) plus the builder's
 * shared-tank note (`derive.ts`), in the order `cycleIssues` lists them.
 */
import type { GeneratedFormPr } from "@/lib/rrc/form-pr/actions";
import type { FilerSettings } from "@/lib/rrc/form-pr/service";
import { assignRecordUniques, recordKey } from "@/lib/rrc/form-pr/record";
import { summaryRows } from "@/lib/rrc/form-pr/sheet";
import {
  PR_FIELDS,
  addCycles,
  currentCycle,
  cycleDueDate,
  cycleHasEnded,
  cycleLabel,
  type PrHeader,
  type PrRecord,
} from "@/lib/rrc/form-pr/spec";
import { validateDraft, type PrIssue } from "@/lib/rrc/form-pr/validate";
import { planExportFiles } from "@/lib/rrc/form-pr/write";
import { dueDate, periodLabel } from "@/lib/rrc/forms/schedule";
import type { FilingRow, FilingStatus } from "@/lib/rrc/forms/types";
import { FIXTURE_TODAY, LEASES, OPERATOR, TANKS } from "./operator";
import { ENDING_STOCK, FIELD_NAME, RRC_LEASE_NO, SKY_OPERATOR_NO, leaseMonth, rrcLeaseName } from "./recon-rrc";

export const FILINGS_TODAY = FIXTURE_TODAY;
export const PR_CYCLE = "202609";

/** The org's RRC filer: the owner uploads the file under his RRC Online user ID. */
export const filer: FilerSettings = {
  agentUserId: "JMORROW",
  agentName: OPERATOR.owner,
  agentEmail: OPERATOR.email,
  agentPhone: OPERATOR.phone,
};

/** The file the app names a cycle by: `PR_<operator number>_<cycle>.EDI` (`service.ts`). */
export const prFileName = (cycle: string) => `PR_${SKY_OPERATOR_NO}_${cycle}.EDI`;

/** Closing gauges, shared with the Recon lease dossier (`recon-rrc.ts`). */
const ENDING = ENDING_STOCK;

/** Lease fuel burned on the heater-treaters, MCF, out of the month's gas. */
const FUEL_SHARE = 0.03;

function blankRecord(): PrRecord {
  const r: Record<string, unknown> = {};
  for (const f of PR_FIELDS) {
    r[f.key] = f.kind === "lit" ? "PR" : f.kind === "yn" ? false : f.kind === "vol" || f.kind === "disp" ? null : "";
  }
  return r as PrRecord;
}

function septemberRecords(): PrRecord[] {
  const month = `${PR_CYCLE.slice(0, 4)}-${PR_CYCLE.slice(4)}`;
  const records = LEASES.map((l) => {
    const v = leaseMonth(l.id, month);
    const end = ENDING[l.id];
    const fuel = Math.round(v.gas * FUEL_SHARE);
    const r = blankRecord();
    Object.assign(r, {
      operatorNo: SKY_OPERATOR_NO,
      district: OPERATOR.district,
      leaseType: "O",
      leaseOrGasId: RRC_LEASE_NO[l.id],
      cycle: PR_CYCLE,
      fieldName: FIELD_NAME,
      leaseName: rrcLeaseName(l),
      gasProduction: v.gas,
      gasDisp1: fuel,
      gasDisp3: v.gas - fuel,
      liqProduction: v.oil,
      liqDisp1: end.aug + v.oil - end.sep,
      liqEndingStorage: end.sep,
    } satisfies Partial<PrRecord>);
    return r;
  });
  assignRecordUniques(PR_CYCLE, records);
  return records;
}

let built: GeneratedFormPr | null = null;

/** The September 2026 Form PR as the review opens on it. */
export function septemberFormPr(): GeneratedFormPr {
  if (built) return built;
  const records = septemberRecords();
  const header: Omit<PrHeader, "recordCount" | "currentProductionMonth"> = { delimiter: "tab", ...filer };
  const key = (leaseId: string) => recordKey(records[LEASES.findIndex((l) => l.id === leaseId)]);

  // The builder's note (`derive.ts`, rule TANK): Smith T201 takes oil from
  // Smith and Roy Corbett wells, so it is filed on the lower key and the
  // record carrying it is told.
  const smith = key("l-smith");
  const corbett = key("l-corbett");
  const shared = TANKS.find((t) => t.id === "t-sm-201")!;
  const [carrier, other] = [smith, corbett].sort();
  const derived: PrIssue[] = [
    {
      rule: "TANK",
      level: "warn",
      recordKey: carrier,
      field: "liqEndingStorage",
      message: `${shared.name} holds oil from wells on this record and ${other}. All of it is filed here; move it if it belongs to the other record.`,
    },
  ];
  const spec = validateDraft(header, records, {
    today: FILINGS_TODAY,
    operatorNos: [SKY_OPERATOR_NO],
    priorEnding: new Map(LEASES.map((l) => [key(l.id), ENDING[l.id].aug])),
    onSchedule: new Map(LEASES.map((l) => [key(l.id), true])),
  });

  // `render` in the app's actions: each record issue names its lease first.
  const labels = new Map(records.map((r) => [recordKey(r), `${r.leaseName} (${recordKey(r)})`]));
  const line = (k: string | null, m: string) => (k && labels.get(k) ? `${labels.get(k)}: ${m}` : m);

  const files = planExportFiles(header, records, {
    cycle: PR_CYCLE,
    currentCycle: currentCycle(FILINGS_TODAY),
    operatorLabel: SKY_OPERATOR_NO,
  });
  const base = `PR_${SKY_OPERATOR_NO}_${PR_CYCLE}`;

  built = {
    records,
    files: files.map((f) => ({ name: f.name, text: f.text })),
    sheet: { name: `${base}.xlsx`, base64: "" },
    pdf: { name: `${base}.pdf`, base64: "" },
    summary: {
      cycle: PR_CYCLE,
      month: cycleLabel(PR_CYCLE),
      due: cycleDueDate(PR_CYCLE),
      operator: SKY_OPERATOR_NO,
      recordCount: records.length,
      rows: summaryRows(records),
    },
    localNames: Object.fromEntries(LEASES.map((l) => [key(l.id), l.name])),
    header: { ...header, currentProductionMonth: files.some((f) => f.currentProductionMonth) },
    issues: [...derived, ...spec].map((i) => ({
      level: i.level,
      message: line(i.recordKey, i.message),
      recordKey: i.recordKey,
      field: i.field,
      rule: i.rule,
    })),
  };
  return built;
}

function row(period: string, status: FilingStatus, generatedAt: string | null): FilingRow {
  return {
    key: `PR|${period}|`,
    id: status === "draft" ? null : `filing-pr-${period}`,
    form: "PR",
    period,
    periodLabel: periodLabel("PR", period),
    wellId: "",
    subject: "",
    due: dueDate("PR", period),
    status,
    fileName: status === "draft" ? null : prFileName(period),
    generatedAt,
    filedAt: null,
    confirmationNo: null,
    stale: false,
    note: "",
    details: {},
  };
}

/** The docket, newest cycle first, as `listDocket` lists Form PR. */
export function filingRows(): FilingRow[] {
  const current = currentCycle(FILINGS_TODAY);
  const rows: FilingRow[] = [];
  for (let i = 0; i < 12; i++) {
    const cycle = addCycles(current, -i);
    if (!cycleHasEnded(cycle, FILINGS_TODAY)) continue;
    rows.push(cycle === PR_CYCLE ? row(cycle, "generated", "2026-10-26T15:12:00Z") : row(cycle, "draft", null));
  }
  return rows;
}
