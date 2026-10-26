/**
 * A calendar date typed by hand as MM/DD/YYYY, the way the Recon bar's
 * permit date boxes take it. The slash arrives by itself after the month and
 * the day (`maskDateTyping`), so "01152025" and "01/15/2025" both read as
 * January 15, 2025. Values travel as `YYYY-MM-DD`, the bar's own form.
 */

function daysIn(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Typed text to `YYYY-MM-DD`, or null when it is not a real date. */
export function parseTypedDate(input: string): string | null {
  const t = input.trim();
  let m: RegExpMatchArray | null;
  let y: number, mo: number, d: number;
  if ((m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/))) {
    mo = Number(m[1]);
    d = Number(m[2]);
    y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  } else if ((m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/))) {
    y = Number(m[1]);
    mo = Number(m[2]);
    d = Number(m[3]);
  } else {
    return null;
  }
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > daysIn(y, mo)) return null;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(mo)}-${p(d)}`;
}

/** `YYYY-MM-DD` as the box shows it once committed: "01/15/2025". */
export function formatTypedDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

/**
 * The box's own punctuation, applied as the user types: digits only, slashes
 * after the month and the day. A first digit that cannot start a month ("3")
 * is taken as that month ("03/"), and a day digit that cannot start a day of
 * that month ("4" in "01/4") as that day ("01/04/").
 */
export function maskDateTyping(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length >= 1 && Number(digits[0]) > 1) digits = `0${digits}`;
  if (digits.length >= 3 && Number(digits[2]) > 3) {
    digits = `${digits.slice(0, 2)}0${digits.slice(2)}`;
  }
  digits = digits.slice(0, 8);
  if (digits.length < 2) return digits;
  if (digits.length < 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
