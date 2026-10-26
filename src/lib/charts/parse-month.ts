/**
 * A month typed by hand, in the forms people actually type, to `YYYY-MM`:
 *
 *   2020-01   01/2020   1/2020   Jan 2020   January 2020   Jan 20   1-2020
 *
 * Null for anything else, so the box can refuse it rather than guess. A
 * two-digit year is read as 2000-2099: the RRC series start in 1993, but a
 * typed "20" means 2020 to anyone who types it.
 */
const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function year(s: string): number | null {
  if (!/^\d{2}$|^\d{4}$/.test(s)) return null;
  const n = Number(s);
  return s.length === 2 ? 2000 + n : n;
}

function ym(y: number, m: number): string | null {
  if (m < 1 || m > 12 || y < 1900 || y > 2100) return null;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function parseMonth(input: string): string | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  let m: RegExpMatchArray | null;
  // 2020-01, 2020/01, 2020-1
  if ((m = t.match(/^(\d{4})[-/.](\d{1,2})$/))) return ym(Number(m[1]), Number(m[2]));
  // 01/2020, 1-2020, 1.20
  if ((m = t.match(/^(\d{1,2})[-/.](\d{2}|\d{4})$/))) {
    const y = year(m[2]);
    return y == null ? null : ym(y, Number(m[1]));
  }
  // Jan 2020, January 2020, jan20, Jan-2020
  if ((m = t.match(/^([a-z]{3,9})[\s\-/.]*(\d{2}|\d{4})$/))) {
    const idx = MONTHS.findIndex((name) => m![1].startsWith(name));
    const y = year(m[2]);
    return idx < 0 || y == null ? null : ym(y, idx + 1);
  }
  return null;
}

/** `YYYY-MM` as the box shows it once committed: "01/2020", the typed form. */
export function formatMonth(cycle: string): string {
  const [y, m] = cycle.split("-");
  return `${m}/${y}`;
}

/**
 * The box's own punctuation, applied as the user types: digits only, the
 * slash arriving by itself after the month, so "012020" and "01/2020" both
 * read as January 2020 and nobody has to find the slash key. A first digit
 * that cannot start a month ("3") is taken as that month ("03/").
 */
export function maskMonthTyping(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length >= 1 && Number(digits[0]) > 1) digits = `0${digits}`;
  digits = digits.slice(0, 6);
  if (digits.length < 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
