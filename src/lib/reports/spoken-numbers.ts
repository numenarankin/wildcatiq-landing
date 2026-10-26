/**
 * Numbers as a person says them.
 *
 * A text-to-speech voice reads "$2,320,090" and "1,104.5" by guessing, and it
 * guesses badly: it stalls on the grouping commas, runs the digits together, or
 * drops the decimal. Since the narration script is text we control end to end,
 * every figure is spelled out in words before it reaches the voice - there is
 * then nothing left to interpret.
 *
 * Pure module (no DOM, no Node) - safe to import anywhere.
 */

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty",
  "ninety",
];
const SCALES: [number, string][] = [
  [1_000_000_000, "billion"],
  [1_000_000, "million"],
  [1_000, "thousand"],
];

/** A whole number in words ("thirty-three thousand nine hundred ninety"). */
export function integerToWords(value: number): string {
  const n = Math.trunc(Math.abs(value));
  if (value < 0) return `negative ${integerToWords(n)}`;
  if (n < 20) return ONES[n];
  if (n < 100) {
    const rest = n % 10;
    return rest ? `${TENS[Math.floor(n / 10)]}-${ONES[rest]}` : TENS[Math.floor(n / 10)];
  }
  if (n < 1000) {
    const rest = n % 100;
    const head = `${ONES[Math.floor(n / 100)]} hundred`;
    return rest ? `${head} ${integerToWords(rest)}` : head;
  }
  for (const [scale, name] of SCALES) {
    if (n >= scale) {
      const rest = n % scale;
      const head = `${integerToWords(Math.floor(n / scale))} ${name}`;
      return rest ? `${head} ${integerToWords(rest)}` : head;
    }
  }
  return String(n);
}

/** Digits after the point, said one at a time: 1.25 → "one point two five". */
function decimalsToWords(decimals: string): string {
  const digits = decimals.replace(/0+$/, "");
  if (!digits) return "";
  return ` point ${digits.split("").map((d) => ONES[Number(d)]).join(" ")}`;
}

/** Any number in words, decimals included. */
export function numberToWords(value: number): string {
  const [whole, decimals = ""] = String(Math.abs(value)).split(".");
  const sign = value < 0 ? "negative " : "";
  return `${sign}${integerToWords(Number(whole))}${decimalsToWords(decimals)}`;
}

/**
 * A dollar amount in words. Cents are only spoken when there are any - an
 * operator says "sixty-eight dollars and forty cents" for a price and just
 * "forty-three thousand dollars" for a revenue line.
 */
export function moneyToWords(value: number): string {
  const negative = value < 0;
  const abs = Math.abs(value);
  const dollars = Math.trunc(abs);
  const cents = Math.round((abs - dollars) * 100);
  const parts = [`${integerToWords(dollars)} dollar${dollars === 1 ? "" : "s"}`];
  if (cents > 0) {
    parts.push(`and ${integerToWords(cents)} cent${cents === 1 ? "" : "s"}`);
  }
  return `${negative ? "minus " : ""}${parts.join(" ")}`;
}

/** A four-digit year the way it's said: 2026 → "twenty twenty-six". */
export function yearToWords(year: number): string {
  if (year < 1000 || year > 2999) return integerToWords(year);
  const head = Math.floor(year / 100);
  const tail = year % 100;
  if (tail === 0) return `${integerToWords(head)} hundred`;
  if (tail < 10) return `${integerToWords(head)} oh ${ONES[tail]}`;
  return `${integerToWords(head)} ${integerToWords(tail)}`;
}
