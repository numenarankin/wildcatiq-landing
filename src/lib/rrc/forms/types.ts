/**
 * What the Filings page renders and what its actions take. Client-safe: types
 * and the hand-entered field catalogue only.
 */

import type { FormKind } from "./schedule";

export type FilingStatus = "draft" | "generated" | "filed";

/** The hand-entered fields, per form, as strings the modal edits. */
export type FilingDetails = Record<string, string>;

export interface FilingRow {
  /** `form|period|wellId`, the docket key a stored row is laid over. */
  key: string;
  /** The stored row's id, or null while the filing is only owed. */
  id: string | null;
  form: FormKind;
  period: string;
  periodLabel: string;
  /** The well the form is about, or "" for a Form PR. */
  wellId: string;
  subject: string;
  due: string;
  status: FilingStatus;
  fileName: string | null;
  generatedAt: string | null;
  filedAt: string | null;
  confirmationNo: string | null;
  /** W-10/G-10: the latest test is older than the window, or there is none. */
  stale: boolean;
  /** What the row is built on: "Last test Aug 14, 2025", "No readings", "". */
  note: string;
  details: FilingDetails;
}

export interface DetailField {
  key: string;
  label: string;
  /** `text` (default), `number`, or a fixed choice list. */
  kind?: "text" | "number" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
}

/** The hand-entered fields of each form, in the order the modal shows them. */
export function detailFields(form: FormKind): DetailField[] {
  switch (form) {
    case "PR":
      return [];
    case "H10":
      return [
        { key: "cycleEndMonth", label: "Cycle year ends in month (1-12)", kind: "number", required: true },
        { key: "uicNo", label: "UIC number", required: true },
        {
          key: "uicType",
          label: "UIC type",
          kind: "select",
          required: true,
          options: [
            { value: "1", label: "Disposal in a non-productive zone" },
            { value: "2", label: "Disposal in a productive zone" },
            { value: "3", label: "Injection in a productive zone" },
            { value: "4", label: "Other" },
            { value: "6", label: "Gas storage in a reservoir (R96)" },
          ],
        },
        { key: "wellNo", label: "RRC well number", required: true },
        { key: "intervalTop", label: "Injection interval top (ft)", kind: "number", required: true },
        { key: "intervalBottom", label: "Injection interval bottom (ft)", kind: "number", required: true },
        { key: "packerDepth", label: "Tubing packer depth (ft)", kind: "number", required: true },
        {
          key: "ownSource",
          label: "Fluid from own sources only",
          kind: "select",
          options: [
            { value: "Y", label: "Yes" },
            { value: "N", label: "No" },
          ],
        },
        {
          key: "injectionThrough",
          label: "Injection through",
          kind: "select",
          options: [
            { value: "1", label: "Tubing" },
            { value: "2", label: "Casing" },
          ],
        },
        { key: "pctSaltwater", label: "Saltwater %", kind: "number" },
        { key: "pctFreshWater", label: "Fresh water %", kind: "number" },
        { key: "pctFracFlowback", label: "Fracture water flowback %", kind: "number" },
        { key: "pctOther", label: "Other %", kind: "number" },
      ];
    case "W10":
      return [
        { key: "fieldNo", label: "RRC field number (8 digits)", required: true },
        { key: "wellNo", label: "RRC well number", required: true },
        {
          key: "producingMethod",
          label: "Producing method",
          kind: "select",
          required: true,
          options: [
            { value: "F", label: "Flowing" },
            { value: "P", label: "Pumping" },
            { value: "G", label: "Gas lift" },
          ],
        },
        {
          key: "expandedAllocation",
          label: "Expanded allocation (SWR 38)",
          kind: "select",
          options: [
            { value: "N", label: "No" },
            { value: "Y", label: "Yes" },
          ],
        },
        { key: "bradenheadPsi", label: "Bradenhead pressure (psi)", kind: "number" },
        { key: "bradenheadReason", label: "Bradenhead reason", kind: "select", required: true, options: BRADENHEAD },
      ];
    case "G10":
      return [
        { key: "fieldNo", label: "RRC field number (8 digits)", required: true },
        { key: "wellNo", label: "RRC well number", required: true },
        { key: "gasGravity", label: "Gas specific gravity", kind: "number", required: true },
        { key: "condensateGravity", label: "Condensate gravity (API)", kind: "number" },
        { key: "siwhPsi", label: "Shut-in wellhead pressure (psi or EXC)", required: true },
        { key: "flowingPsi", label: "Flowing wellhead pressure (psi)", kind: "number" },
        { key: "bottomHolePsi", label: "Bottom hole pressure (psi)", kind: "number" },
        { key: "bradenheadPsi", label: "Bradenhead pressure (psi)", kind: "number" },
        { key: "bradenheadReason", label: "Bradenhead reason", kind: "select", required: true, options: BRADENHEAD },
      ];
    case "P18":
      return [
        { key: "systemSerialNo", label: "P-18 system serial number" },
        { key: "uicNo", label: "UIC number", required: true },
        { key: "wellNo", label: "RRC well number" },
        { key: "survey", label: "Survey / abstract" },
        { key: "gathererRrcId", label: "Gatherer RRC ID" },
        {
          key: "purpose",
          label: "Purpose of filing",
          kind: "select",
          options: [
            { value: "Monthly", label: "Monthly" },
            { value: "Initial", label: "Initial" },
            { value: "Corrected", label: "Corrected" },
            { value: "Final", label: "Final" },
          ],
        },
      ];
  }
}

const BRADENHEAD = [
  { value: "1", label: "Actual measurement" },
  { value: "2", label: "Single string casing" },
  { value: "3", label: "SWR 17 exception, field is exempt" },
  { value: "4", label: "Buried, unable to monitor" },
  { value: "5", label: "Data not collected" },
];

/** The defaults a fresh row starts from, before the operator edits anything. */
export function defaultDetails(form: FormKind): FilingDetails {
  switch (form) {
    case "H10":
      return { cycleEndMonth: "12", uicType: "1", ownSource: "Y", injectionThrough: "1", pctSaltwater: "100", pctFreshWater: "0", pctFracFlowback: "0", pctOther: "0" };
    case "W10":
      return { producingMethod: "P", expandedAllocation: "N", bradenheadReason: "5" };
    case "G10":
      return { bradenheadReason: "5" };
    case "P18":
      return { purpose: "Monthly" };
    case "PR":
      return {};
  }
}

/** The required hand-entered fields still blank. */
export function missingDetails(form: FormKind, details: FilingDetails): string[] {
  return detailFields(form)
    .filter((f) => f.required && !(details[f.key] ?? "").trim())
    .map((f) => f.label);
}
