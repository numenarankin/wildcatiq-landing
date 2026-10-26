/**
 * Sky Resources' RRC identifiers, with no imports so any fixture can read them
 * (the log header in `mobile-b-fixture.ts` sits under the dashboard fixture).
 * The P-5 number and name are the real operator's. The lease numbers and APIs
 * are simulated, and were checked absent from the RRC's District 09 oil leases
 * and Young County wellbores, so none of them is a real record.
 */

/** Sky Resources' P-5 operator number and name, as the RRC files them. */
export const SKY_OPERATOR_NO = "786408";
export const SKY_P5_NAME = "SKY RESOURCES, INC.";

/** Every Sky lease is carried in the Young County Regular field (a real RRC field). */
export const FIELD_NO = "99480001";
export const FIELD_NAME = "YOUNG COUNTY REGULAR";

/** RRC oil lease numbers, District 09 (simulated), keyed by `LEASES[].id`. */
export const RRC_LEASE_NO: Record<string, string> = {
  "l-johnson": "08622",
  "l-smith": "09127",
  "l-corbett": "09783",
  "l-young": "10356",
  "l-parrott": "12946",
};

/** Eight-digit APIs (Young County prefix 503, simulated), keyed by `WELLS[].id`. */
export const WELL_API: Record<string, string> = {
  "w-ja1": "50334260",
  "w-ja2": "50334318",
  "w-ja3": "50385609",
  "w-ja4": "50334335",
  "w-s1": "50334382",
  "w-s2": "50334383",
  "w-s3": "50334430",
  "w-s4": "50334520",
  "w-rc4": "50336529",
  "w-rc5": "50336538",
  "w-fy2": "50336549",
  "w-fy3": "50336587",
  "w-rp7": "50336592",
  "w-rp8": "50336598",
};

/** `50334520` -> `42-503-34520`, the way a log header or a W-2 prints it. */
export const apiDashed = (api8: string) => `42-${api8.slice(0, 3)}-${api8.slice(3)}`;
