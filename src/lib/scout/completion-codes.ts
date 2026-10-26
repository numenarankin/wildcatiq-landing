/*
 * ===========================================================================
 * W-2 / G-1 COMPLETION CODES — the integer fields on a filed completion report.
 * ===========================================================================
 *
 * The RRC's "Completion Information in Data Format" feed carries these four
 * fields as bare integers; the labels are the manual's own
 * (`rrc-data/manuals/completion_manual.pdf`, "Data Definitions", PACKET
 * section). Every reader that shows a packet decodes through here, so the
 * dossier, the permit panel and Orion cannot call the same code three things.
 *
 * Not the W-1 FILING_PURPOSE_CODE: that is a different list on a different
 * form (`FILING_PURPOSE` in `rrc-queries.ts`), and the two share digits.
 */

/** PACKET.COMPLETION_TYPE */
export const COMPLETION_TYPE: Record<string, string> = {
  "1": "New well",
  "2": "Deepening",
  "3": "Plug back",
  "4": "Sidetrack",
  "5": "Horizontal",
  "6": "Reentry",
  "7": "Other",
};

/** PACKET.PURPOSE_OF_FILING */
export const COMPLETION_PURPOSE: Record<string, string> = {
  "1": "Initial potential",
  "2": "Retest",
  "3": "Reclass oil to gas",
  "4": "Reclass gas to oil",
  "5": "Reclass injection to producing",
  "6": "Reclass producing to injection",
  "7": "Well record only",
};

/** PACKET.WELLBORE_PROFILE */
export const WELLBORE_PROFILE: Record<string, string> = {
  "1": "Horizontal",
  "2": "Directional",
  "3": "Vertical",
  "4": "Sidetrack",
  "999": "Unknown",
};

/** PACKET.WELL_TYPE — the well's status as filed, not oil-vs-gas. */
export const COMPLETION_WELL_TYPE: Record<string, string> = {
  "1": "Producing",
  "2": "Shut-in producer",
  "3": "Active UIC",
  "4": "Shut-in UIC",
};

/** The label for a code, or the code itself when the manual has no row for it. */
export function decodeCompletionCode(
  table: Record<string, string>,
  code: string | null | undefined
): string | null {
  const c = (code ?? "").trim();
  if (!c) return null;
  return table[c] ?? c;
}

/**
 * The feed's `MM/DD/YYYY` text as `YYYY-MM-DD`, the spelling every other date
 * in Scout uses; blank and anything else is null. The feed leaves
 * `approved_dt` empty on a packet the RRC has not approved yet.
 */
export function mdyToIso(v: string | null | undefined): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((v ?? "").trim());
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

/** `rrc.wellbore`'s `CCYYMMDD` text as `YYYY-MM-DD`; 0, blank and junk are null. */
export function ymd8ToIso(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  if (!/^(19|20)\d{6}$/.test(s)) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}`;
}
