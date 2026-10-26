/**
 * Form PR validation: the RRC's business rules (spec:188-799) plus the format
 * rules a file must pass before the RRC reads a single record. Pure.
 *
 * Level policy (plan, "Business rules and how we treat each"): everything the
 * RRC rejects, and every discrepancy we can evaluate from our own data, BLOCKS
 * export; a discrepancy means a correction letter for the client. `warn` is for
 * what we cannot know (agent authorization, PR090) or what is legal but worth a
 * look (an H-8 threshold, an opening that moved).
 */

import {
  FIRST_CYCLE,
  FLARE_AUTHORITIES,
  FLARE_CODES_FROM,
  FLARE_REMARK_REQUIRED_FROM,
  GAS_DISP_KEYS,
  LIQ_DISP_KEYS,
  PR_DISTRICTS,
  PR_FIELDS,
  TANK_CAR_DISTRICTS,
  cycleHasEnded,
  isCycle,
  type PrFieldKey,
  type PrHeader,
  type PrRecord,
  type PrVolumeKey,
} from "./spec";
import { recordKey } from "./record";
import { sanitizeText } from "./write";

export type IssueLevel = "block" | "warn";

export interface PrIssue {
  /** RRC rule number (`PR051`) or our own format check (`FMT`). */
  rule: string;
  level: IssueLevel;
  /** The record it belongs to, or null for a header / file issue. */
  recordKey: string | null;
  /** The field to focus, when there is one. */
  field: PrFieldKey | keyof PrHeader | null;
  message: string;
  /** What fixes it in place, when the fix is a ledger setting rather than a field. */
  ref?: IssueRef;
}

export type IssueRef =
  | { kind: "ticket"; id: string; tankName: string; netBbls: number; ticketType: string }
  | { kind: "meter"; id: string; name: string }
  | { kind: "tank"; id: string; name: string; options: string[] }
  | { kind: "upload" };

export interface ValidateContext {
  /** ISO date the check runs on; decides which cycles are filable (PR094). */
  today: string;
  /** The org's P-5 numbers, six digits (PR003). Omit to skip. */
  operatorNos?: readonly string[];
  /** Reported ending storage for the PRIOR cycle, by record key (PR051/052). */
  priorEnding?: ReadonlyMap<string, number>;
  /** Ending storage the FOLLOWING cycle was filed on, by record key (PR051/052). */
  followingOpening?: ReadonlyMap<string, number>;
  /** Whether the record exists on the RRC schedule (PR002). Absent key = unknown. */
  onSchedule?: ReadonlyMap<string, boolean>;
  /** Whether an original report exists for record + cycle (PR096). Absent key = unknown. */
  hasOriginal?: ReadonlyMap<string, boolean>;
}

const n = (v: number | null): number => v ?? 0;

/** Liquid / gas product names as the RRC's rule table uses them. */
function products(r: PrRecord) {
  const oil = r.leaseType !== "G";
  return {
    liq: oil ? "Oil" : "Cond",
    gas: oil ? "Csgd" : "Gas",
    rule: (oilRule: string, gasRule: string) => (oil ? oilRule : gasRule),
  };
}

export function validateHeader(h: Omit<PrHeader, "recordCount" | "currentProductionMonth">): PrIssue[] {
  const out: PrIssue[] = [];
  const add = (field: keyof PrHeader, message: string) =>
    out.push({ rule: "FMT", level: "block", recordKey: null, field, message });
  if (!h.agentUserId.trim()) add("agentUserId", "The RRC Online user ID of the person uploading this file is missing.");
  else if (h.agentUserId.length > 9) add("agentUserId", "The agent user ID is longer than 9 characters.");
  if (!h.agentName.trim()) add("agentName", "The agent name is missing.");
  else if (h.agentName.length > 50) add("agentName", "The agent name is longer than 50 characters.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(h.agentEmail.trim())) add("agentEmail", "The agent e-mail address is not a valid address.");
  else if (h.agentEmail.length > 50) add("agentEmail", "The agent e-mail is longer than 50 characters.");
  if (h.agentPhone.replace(/\D/g, "").length !== 10) add("agentPhone", "The agent phone number must be 10 digits.");
  if (h.agentUserId.trim()) {
    out.push({
      rule: "PR090",
      level: "warn",
      recordKey: null,
      field: "agentUserId",
      message: `The RRC rejects the whole file unless ${h.agentUserId.trim()} is authorized to file electronically for every operator in it.`,
    });
  }
  return out;
}

export function validateRecord(r: PrRecord, ctx: ValidateContext): PrIssue[] {
  const out: PrIssue[] = [];
  const key = recordKey(r);
  const p = products(r);
  const block = (rule: string, field: PrFieldKey | null, message: string) =>
    out.push({ rule, level: "block", recordKey: key, field, message });
  const warn = (rule: string, field: PrFieldKey | null, message: string) =>
    out.push({ rule, level: "warn", recordKey: key, field, message });

  // --- Format: lengths and whole numbers --------------------------------------
  for (const f of PR_FIELDS) {
    const v = r[f.key];
    if (f.kind === "text") {
      const s = sanitizeText(String(v ?? ""));
      if (s.length > f.max) block("FMT", f.key, `${f.label} is ${s.length} characters; the RRC allows ${f.max}.`);
    } else if (f.kind === "vol" || f.kind === "disp") {
      if (v == null) continue;
      const num = v as number;
      if (!Number.isInteger(num) || num < 0) {
        const rule = f.key.startsWith("gas") ? p.rule("PR084", "PR085") : p.rule("PR027", "PR028");
        block(rule, f.key, `${f.label} must be a whole number of 0 or more, not ${num}.`);
      } else if (String(num).length > f.max) {
        block("FMT", f.key, `${f.label} is more than ${f.max} digits.`);
      }
    }
  }

  // --- Identity ---------------------------------------------------------------
  if (!/^\d{6}$/.test(r.operatorNo)) block("PR003", "operatorNo", "The operator number must be the 6-digit P-5 number.");
  else if (ctx.operatorNos && !ctx.operatorNos.includes(r.operatorNo)) {
    block("PR003", "operatorNo", `Operator ${r.operatorNo} is not one of this company's RRC operator numbers.`);
  }
  if (!(PR_DISTRICTS as readonly string[]).includes(r.district)) {
    block("PR002", "district", `District "${r.district}" is not an RRC district.`);
  }
  if (r.leaseType === "P") block("FMT", "leaseType", "Pending reports (no lease number yet) are not supported yet.");
  else if (r.leaseType !== "O" && r.leaseType !== "G") block("FMT", "leaseType", "Lease type must be O (oil lease) or G (gas well).");

  const ids = [r.leaseOrGasId, r.drillingPermitNo, r.apiNo].filter((s) => s !== "");
  if (ids.length === 0) block("PR007", "leaseOrGasId", "The record has no RRC lease number or gas ID.");
  else if (ids.length > 1) block("PR092", "leaseOrGasId", "Only one RRC identifier is allowed per record.");
  if (r.leaseType === "O" && r.leaseOrGasId && !/^\d{5}$/.test(r.leaseOrGasId)) {
    block("PR007", "leaseOrGasId", `An oil lease number is 5 digits; "${r.leaseOrGasId}" is not.`);
  }
  if (r.leaseType === "G" && r.leaseOrGasId && !/^\d{6}$/.test(r.leaseOrGasId)) {
    block("PR007", "leaseOrGasId", `A gas ID is 6 digits; "${r.leaseOrGasId}" is not.`);
  }
  if (ctx.onSchedule?.get(key) === false) {
    block("PR002", "leaseOrGasId", `District ${r.district} ${r.leaseType === "G" ? "gas ID" : "lease"} ${r.leaseOrGasId} is not on the RRC schedule.`);
  }
  if (!r.fieldName.trim()) block("PR008", "fieldName", "The field name, exactly as on the RRC proration schedule, is missing.");
  if (!r.leaseName.trim()) block("PR009", "leaseName", "The lease name, exactly as on the RRC proration schedule, is missing.");
  if (r.leaseType === "G") {
    // PR010 (gas well number required) is not applied: item 46 is required
    // only on pending reports (spec:1109) and the accepted golden file leaves
    // it blank on every gas well. PR011 still checks one that is given.
    if (r.gasWellNo.trim() && !/\d/.test(r.gasWellNo)) block("PR011", "gasWellNo", "The gas well number must contain at least one digit.");
  }

  // --- Cycle ------------------------------------------------------------------
  if (!isCycle(r.cycle)) block("PR093", "cycle", `The cycle "${r.cycle}" is not a YYYYMM month.`);
  else if (r.cycle < FIRST_CYCLE || !cycleHasEnded(r.cycle, ctx.today)) {
    block("PR094", "cycle", `The RRC does not accept reports for ${r.cycle} yet or any more.`);
  }

  // --- Corrected / commingle ----------------------------------------------------
  if (r.corrected && ctx.hasOriginal?.get(key) === false) {
    block("PR096", "corrected", "This is marked corrected but the RRC has no original report for this lease and month.");
  }
  if (r.leaseTotalLine) block("PR023", "leaseTotalLine", "Leases on more than one commingle permit are not supported yet.");
  if (r.comminglePermitNo && !/^\d{4,5}$/.test(r.comminglePermitNo)) {
    block("PR016", "comminglePermitNo", "A commingle permit number is 4 or 5 digits.");
  }
  if (r.comminglePermitNo === "9292" && !r.commingleRemark.trim()) {
    block("PR016", "commingleRemark", "Commingle permit 9292 needs the one-time use explanation.");
  }

  // --- Remarks required when a coded volume is > 0 ------------------------------
  if (n(r.liqDisp3) > 0 && !r.liqDisp3Remark.trim()) {
    block(p.rule("PR029", "PR030"), "liqDisp3Remark", `${p.liq} code 3 (tank cleaning) needs the tank service and/or R-2 facility name.`);
  }
  if (n(r.liqDisp4) > 0 && !r.liqDisp4Remark.trim()) {
    block(p.rule("PR031", "PR032"), "liqDisp4Remark", `${p.liq} code 4 (circulating) needs the lease where the oil was used.`);
  }
  if (n(r.liqDisp6) > 0 && !r.liqDisp6Remark.trim() && !r.liqDisp3Remark.trim()) {
    block(p.rule("PR033", "PR034"), "liqDisp6Remark", `${p.liq} code 6 (sedimentation) needs the tank service and/or R-2 facility name.`);
  }
  if (n(r.liqDisp75) > 0 && !r.liqDisp75Remark.trim()) {
    block(p.rule("PR037", "PR038"), "liqDisp75Remark", `${p.liq} code 75 (other) needs an explanation.`);
  }
  if (n(r.gasDisp7) > 0 && !r.gasDisp7Plant.trim()) {
    block(p.rule("PR066", "PR067"), "gasDisp7Plant", `${p.gas} code 7 (carbon black) needs the plant name.`);
  }
  if (n(r.liqDisp8) > n(r.liqProduction)) {
    block(p.rule("PR039", "PR040"), "liqDisp8", `${p.liq} code 8 (skim) cannot exceed production.`);
  }
  if (n(r.liqDisp2) > 0 && !TANK_CAR_DISTRICTS.includes(r.district)) {
    block(p.rule("PR057", "PR058"), "liqDisp2", "Code 2 (tank car or barge) is only valid in districts 02, 03 and 04.");
  }
  if (n(r.liqDisp5) > 5) {
    warn("H-8", "liqDisp5", `${r.liqDisp5} bbl lost: a loss over 5 bbl also needs a Form H-8.`);
  }

  // --- Gas code 4 vs 10/11 by cycle ---------------------------------------------
  if (isCycle(r.cycle) && r.cycle >= FLARE_CODES_FROM) {
    if (n(r.gasDisp4) > 0 || r.gasDisp4Remark.trim()) {
      block(p.rule("PR064", "PR065"), "gasDisp4", "Gas code 4 was replaced by codes 10 (flared) and 11 (vented) from September 2021.");
    }
    const flare = [
      { vol: "gasDisp10", remark: "gasDisp10Remark", rule: p.rule("PR097", "PR098"), what: "flared" },
      { vol: "gasDisp11", remark: "gasDisp11Remark", rule: p.rule("PR099", "PR100"), what: "vented" },
    ] as const;
    for (const f of flare) {
      const remark = r[f.remark].trim();
      if (n(r[f.vol]) > 0 && !remark && r.cycle >= FLARE_REMARK_REQUIRED_FROM) {
        block(f.rule, f.remark, `Gas ${f.what} needs its authority: one or more of AR, AE, EP, EX.`);
      }
      if (remark) {
        const bad = remark.split(/\s+/).filter((c) => !(FLARE_AUTHORITIES as readonly string[]).includes(c));
        if (bad.length > 0) {
          block(f.rule, f.remark, `"${bad.join(" ")}" is not an authority code; use AR, AE, EP or EX separated by spaces.`);
        }
      }
    }
  } else if (isCycle(r.cycle)) {
    if (n(r.gasDisp10) > 0 || n(r.gasDisp11) > 0 || r.gasDisp10Remark || r.gasDisp11Remark) {
      block(p.rule("PR097", "PR098"), "gasDisp10", "Gas codes 10 and 11 are only accepted from September 2021; use code 4 before that.");
    }
    if (n(r.gasDisp4) > 0 && !r.gasDisp4Remark.trim()) {
      block(p.rule("PR064", "PR065"), "gasDisp4Remark", "Gas code 4 (vented or flared) needs a remark.");
    }
  }

  // --- Out of balance -----------------------------------------------------------
  const gasOut = GAS_DISP_KEYS.reduce((s, k) => s + n(r[k]), 0);
  if (n(r.gasProduction) !== gasOut) {
    block(
      p.rule("PR078", "PR079"),
      "gasProduction",
      `${p.gas} is out of balance: ${n(r.gasProduction)} MCF produced, ${gasOut} MCF disposed.`
    );
  }
  const liqOut = liquidDispositions(r);
  const prior = ctx.priorEnding?.get(key);
  if (prior != null) {
    const expected = prior + n(r.liqProduction) - liqOut;
    if (expected !== n(r.liqEndingStorage)) {
      block(
        p.rule("PR051", "PR052"),
        "liqEndingStorage",
        `${p.liq} is out of balance with last month: ${prior} on hand + ${n(r.liqProduction)} produced − ${liqOut} disposed = ${expected}, but ending storage is ${n(r.liqEndingStorage)}.`
      );
    }
  }
  const following = ctx.followingOpening?.get(key);
  if (following != null && following !== n(r.liqEndingStorage)) {
    warn(
      p.rule("PR051", "PR052"),
      "liqEndingStorage",
      `Next month was filed opening at ${following} bbl; ending at ${n(r.liqEndingStorage)} puts next month out of balance, so it needs a corrected report too.`
    );
  }
  return out;
}

/** Sum of every liquid disposition column. */
export function liquidDispositions(r: PrRecord): number {
  return LIQ_DISP_KEYS.reduce((s, k: PrVolumeKey) => s + n(r[k]), 0);
}

/** Duplicate reports in one file (PR005, and PR026 for commingle lines). */
export function validateDuplicates(records: PrRecord[]): PrIssue[] {
  const seen = new Map<string, number>();
  for (const r of records) seen.set(recordKey(r), (seen.get(recordKey(r)) ?? 0) + 1);
  const out: PrIssue[] = [];
  for (const [key, count] of seen) {
    if (count > 1) {
      out.push({
        rule: key.split("-").length > 3 ? "PR026" : "PR005",
        level: "block",
        recordKey: key,
        field: null,
        message: `This lease is reported ${count} times in the file.`,
      });
    }
  }
  return out;
}

/** Every issue for a draft: header, each record, and the file as a whole. */
export function validateDraft(
  header: Omit<PrHeader, "recordCount" | "currentProductionMonth">,
  records: PrRecord[],
  ctx: ValidateContext
): PrIssue[] {
  return [
    ...validateHeader(header),
    ...records.flatMap((r) => validateRecord(r, ctx)),
    ...validateDuplicates(records),
  ];
}

export function hasBlocking(issues: PrIssue[]): boolean {
  return issues.some((i) => i.level === "block");
}
