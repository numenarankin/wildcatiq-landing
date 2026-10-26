/**
 * A report, as an analyst would say it out loud.
 *
 * Orion reads a report by speaking THIS script, not the markdown. The document's
 * three kinds of block each need different treatment, because reading them
 * literally produces something nobody can follow:
 *
 *  - **Prose** (the AI narrative, the exceptions, the pumper summary) is already
 *    written to be read by a person, so it is spoken verbatim.
 *  - **Charts** are summarized, never enumerated: the listener wants the
 *    conclusion they would have drawn from looking at it - the level, the
 *    direction, the outlier - not ninety daily values.
 *  - **Tables** are read with their values, but framed: what the table covers,
 *    who leads and by how much, how the rest stacks up, and what is missing.
 *    A column of numbers read in sequence is impossible to hold in your head.
 *
 * Everything is derived from the rendered markdown, so any report in the gallery
 * can be narrated and the narration cannot describe something the reader isn't
 * looking at.
 *
 * Pure module (no DOM, no Node) - safe to import anywhere.
 */

import { BLANK_CELL } from "@/lib/export/columns";
import { isMarkdownTotalRow } from "@/lib/export/markdown";
import { parseChartSpec, type DigestChartSpec } from "@/lib/reports/digest/chart-embed";
import {
  integerToWords,
  moneyToWords,
  numberToWords,
  yearToWords,
} from "@/lib/reports/spoken-numbers";
import { parseKpiSpec } from "@/lib/reports/digest/kpi-embed";
import type { KpiTile } from "@/lib/reports/digest/kpi-tiles";

// --- Speech shaping ---------------------------------------------------------

/**
 * Units as they should be SAID, not as a column header abbreviates them.
 *
 * An acronym is hyphenated ("M-C-F"), which is what makes a voice read it letter
 * by letter. Spacing the letters out is not enough and spelling them
 * phonetically is worse: "em see eff" gets read as its own initialism, so the
 * listener hears "E-M-C-F".
 */
const UNITS: [RegExp, string][] = [
  [/\bper bbl\b/gi, "per barrel"],
  [/\bper mcf\b/gi, "per M-C-F"],
  [/\bbbl\/(day|d)\b/gi, "barrels per day"],
  [/\bmcf\/(day|d)\b/gi, "M-C-F per day"],
  [/\bbbl\b/gi, "barrels"],
  [/\bmcf\b/gi, "M-C-F"],
  [/\bUSD\/day\b/gi, "dollars per day"],
  [/\bpsi\b/gi, "P-S-I"],
  [/\bNRI\b/g, "N-R-I"],
  [/\bSWD\b/g, "S-W-D"],
  [/\bRRC\b/g, "R-R-C"],
  [/\bYTD\b/g, "year to date"],
  [/\best\./gi, "estimated"],
  [/\bavg\b/gi, "average"],
  // Month abbreviations: a voice reading "Jul" is a coin flip.
  [/\bJan\b\.?/g, "January"],
  [/\bFeb\b\.?/g, "February"],
  [/\bMar\b\.?/g, "March"],
  [/\bApr\b\.?/g, "April"],
  [/\bJun\b\.?/g, "June"],
  [/\bJul\b\.?/g, "July"],
  [/\bAug\b\.?/g, "August"],
  [/\bSept?\b\.?/g, "September"],
  [/\bOct\b\.?/g, "October"],
  [/\bNov\b\.?/g, "November"],
  [/\bDec\b\.?/g, "December"],
];

/**
 * Markdown → speakable text: emphasis and escapes dropped, dashes turned into
 * pauses a voice can actually render, units spelled the way they're spoken.
 */
export function speakable(text: string): string {
  let out = text
    .replace(/\\([|*_`])/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/(?<!\w)_(.+?)_(?!\w)/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\s*[-–]\s*/g, ", ")
    .replace(/\s*·\s*/g, ", ")
    .replace(/%/g, " percent")
    .replace(/\s+/g, " ")
    .trim();
  for (const [pattern, spoken] of UNITS) out = out.replace(pattern, spoken);
  return spellFigures(out);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Words that mark the number before them as a quantity rather than a name. */
const UNIT_WORDS =
  // Units appear here as they are SAID, because `speakable` has already expanded
  // the abbreviations by the time figures are spelled ("psi" is "P-S-I" now).
  "percent|barrels?|M-C-F|dollars?|cents?|days?|wells?|lines?|rows?|points?|hours?|P-S-I|thousand|million";

/**
 * Spell out the figures inside text that was written for the eye - the AI
 * narrative, an exception bullet, a window label. Only figures: a number that
 * is part of a name ("Unit A #4", "Big Lake 1401", "12-H") is left alone,
 * because turning an identifier into words makes it harder to recognize, not
 * easier.
 */
function spellFigures(text: string): string {
  return (
    text
      // ISO dates read as three numbers otherwise ("2026-07-23").
      .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_, y, m, d) =>
        `${sayDate(`${y}-${m}-${d}`)}`
      )
      // An ISO month ("2026-06") is a period label, not a subtraction.
      .replace(/\b(\d{4})-(\d{2})\b/g, (_, y: string, m: string) => {
        const month = MONTHS[Number(m) - 1];
        return month ? `${month} ${yearToWords(Number(y))}` : `${y}-${m}`;
      })
      // Money, with or without cents.
      .replace(/\$\s?(\d[\d,]*(?:\.\d+)?)/g, (_, digits: string) =>
        moneyToWords(Number(digits.replace(/,/g, "")))
      )
      // Grouped numbers are always quantities - no one names a well "1,104".
      .replace(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g, (match) =>
        numberToWords(Number(match.replace(/,/g, "")))
      )
      // A year, said as a year.
      .replace(/\b(19|20)\d{2}\b/g, (match) => yearToWords(Number(match)))
      // Anything else only when a unit follows it and says what it is.
      .replace(
        new RegExp(`\\b(\\d+(?:\\.\\d+)?)(?=\\s(?:${UNIT_WORDS})\\b)`, "gi"),
        (match) => numberToWords(Number(match))
      )
      // "…against 640", "…versus 3.2": a comparison names a quantity too.
      .replace(
        /\b(against|versus|vs\.?|than|compared with|compared to)\s(\d+(?:\.\d+)?)\b/gi,
        (_, word: string, digits: string) => `${word} ${numberToWords(Number(digits))}`
      )
      // "a 30-day average" reads as a compound, not as a bare number.
      .replace(/\b(\d+)-(day|week|month|year)\b/gi, (_, n: string, unit: string) =>
        `${integerToWords(Number(n))}-${unit}`
      )
  );
}

/** Number behind a formatted cell ("$1,284,310" → 1284310); null when it isn't one. */
function numberOf(cell: string): number | null {
  const cleaned = cell.replace(/[$,\s]/g, "").replace(/[%]/g, "");
  if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * A figure the way it's said aloud: rounded to the precision a person would
 * quote, then spelled out in words so the voice has nothing to interpret.
 */
function say(n: number, opts: { money?: boolean } = {}): string {
  const abs = Math.abs(n);
  // Big numbers get quoted at scale ("two point three million"), not digit by
  // digit - nobody says two million three hundred twenty thousand and ninety.
  if (abs >= 1_000_000) {
    const millions = Math.round(n / 100_000) / 10;
    return `${numberToWords(millions)} million${opts.money ? " dollars" : ""}`;
  }
  if (abs >= 10_000) {
    const thousands = Math.round(n / 1_000);
    return `${integerToWords(thousands)} thousand${opts.money ? " dollars" : ""}`;
  }
  if (opts.money) return moneyToWords(Math.round(n * 100) / 100);
  return numberToWords(abs < 10 ? Math.round(n * 10) / 10 : Math.round(n));
}

/** "up 12 percent" / "down 12 percent" / "flat" for a signed percentage. */
function sayChange(pct: number): string {
  const rounded = Math.round(pct);
  if (rounded === 0) return "flat against the prior period";
  return `${rounded > 0 ? "up" : "down"} ${integerToWords(Math.abs(rounded))} percent from the prior period`;
}

/** Join clauses into one sentence with an Oxford-comma list. */
function list(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

// --- Block model ------------------------------------------------------------

interface Table {
  headers: string[];
  rows: string[][];
}

type Block =
  | { kind: "title"; text: string }
  | { kind: "section"; text: string }
  /** A bold-only line ("**By lease**") - a caption for what follows, not prose. */
  | { kind: "label"; text: string }
  | { kind: "prose"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "table"; table: Table }
  | { kind: "chart"; spec: DigestChartSpec }
  | { kind: "kpis"; tiles: KpiTile[] };

const cells = (line: string): string[] =>
  line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim());

const isDivider = (line: string): boolean =>
  /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes("-");

/** Markdown → the blocks a narrator cares about, in document order. */
function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flush = (): void => {
    if (paragraph.length) {
      const text = paragraph.join(" ");
      blocks.push(
        /^\*\*[^*]+\*\*$/.test(text.trim())
          ? { kind: "label", text: text.trim().slice(2, -2) }
          : { kind: "prose", text }
      );
      paragraph = [];
    }
    if (bullets.length) {
      blocks.push({ kind: "bullets", items: bullets });
      bullets = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flush();
      const lang = trimmed.slice(3).trim();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      if (lang === "chart") {
        const spec = parseChartSpec(body.join("\n"));
        if (spec) blocks.push({ kind: "chart", spec });
      } else if (lang === "kpi") {
        const spec = parseKpiSpec(body.join("\n"));
        if (spec) blocks.push({ kind: "kpis", tiles: spec.tiles });
      }
      continue;
    }

    if (!trimmed) {
      flush();
      continue;
    }

    if (trimmed.startsWith("# ")) {
      flush();
      blocks.push({ kind: "title", text: trimmed.slice(2).trim() });
      continue;
    }
    if (/^#{2,6} /.test(trimmed)) {
      flush();
      blocks.push({ kind: "section", text: trimmed.replace(/^#+\s*/, "") });
      continue;
    }
    if (/^[-*] /.test(trimmed)) {
      if (paragraph.length) flush();
      bullets.push(trimmed.slice(2).trim());
      continue;
    }
    // A table: a header row, its alignment divider, then body rows.
    if (trimmed.startsWith("|") && isDivider(lines[i + 1] ?? "")) {
      flush();
      const headers = cells(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(cells(lines[i].trim()));
        i++;
      }
      i--;
      blocks.push({ kind: "table", table: { headers, rows } });
      continue;
    }
    if (bullets.length) flush();
    paragraph.push(trimmed);
  }
  flush();
  return blocks;
}

// --- Charts: the conclusion, not the data -----------------------------------

/** Where a series sits, where it's going, and what stands out. */
function narrateBar(spec: Extract<DigestChartSpec, { kind: "bar" }>): string {
  const points = spec.series;
  const subject = speakable(spec.title.replace(/\s*\(.*?\)\s*$/, "")).toLowerCase();
  if (points.length === 0) return `There's no ${subject} data in this window.`;

  const values = points.map((p) => p.value);
  if (values.every((v) => v === 0)) {
    return `${cap(subject)} is flat at zero across the whole window, so that chart is empty by definition.`;
  }
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const third = Math.max(1, Math.floor(values.length / 3));
  const opening = values.slice(0, third).reduce((s, v) => s + v, 0) / third;
  const closing = values.slice(-third).reduce((s, v) => s + v, 0) / third;
  const drift = opening > 0 ? ((closing - opening) / opening) * 100 : 0;
  const trend =
    Math.abs(drift) < 5
      ? "holding steady"
      : drift > 0
        ? `trending up, the back end running about ${integerToWords(Math.round(Math.abs(drift)))} percent above where it started`
        : `trending down, the back end running about ${integerToWords(Math.round(Math.abs(drift)))} percent below where it started`;

  let peak = points[0];
  let trough = points[0];
  for (const p of points) {
    if (p.value > peak.value) peak = p;
    if (p.value < trough.value) trough = p;
  }
  const zeroDays = values.filter((v) => v === 0).length;

  const clauses = [
    `${cap(subject)} averaged about ${say(mean)} ${unitOf(spec.title)}, ${trend}`,
    `the best day was ${sayDate(peak.date)} at ${say(peak.value)} and the weakest ${sayDate(trough.date)} at ${say(trough.value)}`,
  ];
  if (zeroDays > 0) {
    clauses.push(
      `${integerToWords(zeroDays)} ${zeroDays === 1 ? "day shows" : "days show"} nothing at all, which is worth a look`
    );
  }
  if (spec.second) {
    const other = spec.second.series.reduce((s, p) => s + p.value, 0);
    const own = values.reduce((s, v) => s + v, 0);
    if (own > 0) {
      const ratio = other / own;
      clauses.push(
        `${spec.second.label.toLowerCase()} runs about ${numberToWords(Math.round(ratio * 10) / 10)} to one against it`
      );
    }
  }
  return `${list(clauses)}.`;
}

/**
 * A coverage line is an attendance story: the rate, which way it is moving, and
 * the worst day. Spoken as percentages, since the axis is a share of a whole.
 */
function narrateCoverage(
  spec: Extract<DigestChartSpec, { kind: "coverage" }>
): string {
  const points = spec.series;
  if (points.length === 0) return "There are no days in this coverage window.";
  const values = points.map((p) => p.value);
  const mean =
    spec.averagePct ?? values.reduce((s, v) => s + v, 0) / values.length;
  const half = Math.max(1, Math.floor(values.length / 2));
  const first = values.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const last = values.slice(-half).reduce((s, v) => s + v, 0) / half;
  const move = last - first;
  const trend =
    Math.abs(move) < 3
      ? "holding roughly level across the period"
      : move > 0
        ? `improving, the back half averaging about ${integerToWords(Math.round(Math.abs(move)))} points higher than the front`
        : `slipping, the back half averaging about ${integerToWords(Math.round(Math.abs(move)))} points lower than the front`;

  let worst = points[0];
  let best = points[0];
  for (const p of points) {
    if (p.value < worst.value) worst = p;
    if (p.value > best.value) best = p;
  }
  const blank = values.filter((v) => v === 0).length;
  const clauses = [
    `Coverage averaged about ${integerToWords(Math.round(mean))} percent of facilities a day, ${trend}`,
    `the strongest day was ${sayDate(best.date)} at ${integerToWords(Math.round(best.value))} percent and the weakest ${sayDate(worst.date)} at ${integerToWords(Math.round(worst.value))} percent`,
  ];
  if (blank > 0) {
    clauses.push(
      `${integerToWords(blank)} ${blank === 1 ? "day has" : "days have"} no readings at all`
    );
  }
  return `${list(clauses)}.`;
}

/** A pie is a concentration story: who dominates, and how long the tail is. */
function narratePie(spec: Extract<DigestChartSpec, { kind: "pie" }>): string {
  const data = [...spec.data].sort((a, b) => b.value - a.value);
  const total = data.reduce((s, d) => s + d.value, 0);
  const subject = speakable(spec.title).toLowerCase();
  if (data.length === 0 || total <= 0) {
    return `There's nothing to allocate for ${subject} in this window.`;
  }
  const money = spec.format === "usd";
  const unit = spec.format === "bbl" ? " barrels" : "";
  const share = (v: number): string =>
    integerToWords(Math.round((v / total) * 100));
  const [first, second] = data;
  const parts = [
    `On ${subject}, ${speakable(first.label)} carries ${share(first.value)} percent at ${say(first.value, { money })}${unit}`,
  ];
  if (second) {
    parts.push(
      `${speakable(second.label)} is next at ${share(second.value)} percent`
    );
  }
  const rest = data.slice(2);
  if (rest.length > 0) {
    const restTotal = rest.reduce((s, d) => s + d.value, 0);
    parts.push(
      rest.length === 1
        ? `and the last one is ${share(restTotal)} percent`
        : `and the other ${integerToWords(rest.length)} together come to ${share(restTotal)} percent`
    );
  }
  const concentration =
    first.value / total >= 0.5
      ? " So it's concentrated: over half of it sits in one place."
      : "";
  return `${parts.join(", ")}.${concentration}`;
}

/** The unit a chart title declares, spoken ("Oil production (bbl/day)"). */
function unitOf(title: string): string {
  const match = /\(([^)]*)\)/.exec(title);
  if (!match) return "";
  const unit = match[1].split(",")[0].trim();
  return speakable(unit);
}

/** "2026-07-06" → "July 6" (UTC, no locale surprises). */
function sayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}`;
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// --- Stat tiles: the opening numbers ----------------------------------------

/**
 * The headline tiles are the first thing said, because they are the first thing
 * read. Each tile is one clause - the measure, the figure, the move - so the
 * opening lands as "oil was X, down Y percent" rather than as four numbers.
 */
function narrateTiles(tiles: KpiTile[]): string {
  if (tiles.length === 0) return "";
  // A slash is a comparison the eye reads instantly and the ear cannot: the
  // price tiles say "realized / benchmark", which has to be spoken as one.
  const spoken = (text: string): string =>
    speakable(text.replace(/\s*\/\s*/g, " against "));
  const clauses = tiles.map((tile) => {
    const measure = spoken(tile.label.replace(/\s*\(([^)]*)\)/, ", $1,"));
    const value = spoken(tile.value);
    if (!tile.note || tile.note === "no prior") {
      const tail = tile.note === "no prior" ? ", with no prior period to compare" : "";
      return `${measure} ${value}${tail}`;
    }
    const pct = /(-?\d+)%/.exec(tile.note)?.[1];
    const against = /benchmark/i.test(tile.note) ? "the benchmark" : "the prior period";
    if (pct == null) return `${measure} ${value}`;
    const n = Number(pct);
    const move =
      n === 0
        ? `level with ${against}`
        : `${n > 0 ? "up" : "down"} ${integerToWords(Math.abs(n))} percent on ${against}`;
    return `${measure} ${value}, ${move}`;
  });
  return `${list(clauses)}.`;
}

// --- Tables: values, but framed ---------------------------------------------

/** How many rows get read out individually before the rest are summarized. */
const ROWS_READ = 4;

/**
 * A metric table (Metric / Value / Prior / Change) is the headline, and it is
 * the one table that should be read row by row: four or five figures, each with
 * its own move, is exactly what a person expects to hear first.
 */
function narrateMetricTable(table: Table): string {
  const idx = (name: string): number =>
    table.headers.findIndex((h) => h.toLowerCase().startsWith(name));
  const iMetric = idx("metric");
  const iValue = idx("value");
  const iChange = table.headers.findIndex((h) =>
    h.toLowerCase().includes("change")
  );
  const sentences = table.rows.map((row) => {
    const { name, unit, qualifier, money } = splitMetric(row[iMetric] ?? "");
    const raw = row[iValue] ?? "";
    const n = numberOf(raw);
    const figure =
      n == null
        ? speakable(raw)
        : `${say(n, { money: money || raw.includes("$") })}${unit ? ` ${unit}` : ""}`;
    const subject = qualifier ? `${name}, ${qualifier},` : name;
    const change = iChange >= 0 ? numberOf(row[iChange] ?? "") : null;
    return change == null
      ? `${subject} came in at ${figure}`
      : `${subject} came in at ${figure}, ${sayChange(change)}`;
  });
  return `${sentences.join(". ")}.`;
}

/**
 * A metric label carries three different things in one string: the measure, its
 * unit, and sometimes a basis. "Oil (bbl)" is a unit; "Revenue (estimated)" is a
 * qualifier, and reading it as a unit produces "74 thousand estimated", which
 * says nothing about dollars.
 */
function splitMetric(label: string): {
  name: string;
  unit: string;
  qualifier: string;
  money: boolean;
} {
  const paren = /\(([^)]*)\)/.exec(label)?.[1]?.trim() ?? "";
  const name = speakable(label.replace(/\s*\([^)]*\)/, ""));
  const isUnit = /^(bbl|mcf|usd|\$|bbl\/day|mcf\/day)$/i.test(paren);
  return {
    name,
    unit: isUnit ? speakable(paren) : "",
    qualifier: isUnit ? "" : speakable(paren),
    money: /revenue|price|dollar|cost|expense/i.test(label),
  };
}

/**
 * Any other table: say what it covers, read the top few rows against the total,
 * summarize the tail, and flag blanks - the shape a person can actually hold in
 * their head, with the real numbers still in it.
 */
function narrateTable(table: Table, subject: string): string {
  // A total line is not one of the lines it totals: read as a row, it would
  // rank first and double the sum.
  const { headers } = table;
  const rows = table.rows.filter((r) => !isMarkdownTotalRow(r));
  if (rows.length === 0) return `${cap(subject)} has no rows.`;
  if (headers.some((h) => h.toLowerCase().startsWith("metric"))) {
    return narrateMetricTable(table);
  }

  // The label column is the first one whose cells aren't numbers. For the figure
  // to talk about, money wins - that is the column a reader cares about - and
  // failing that the FIRST numeric column, which is the headline measure;
  // picking the last would leave a report talking about its downtime column.
  const numeric = headers.map((_, c) =>
    rows.every((r) => r[c] == null || r[c] === BLANK_CELL || numberOf(r[c]) != null)
  );
  const isMoney = headers.map((_, c) =>
    rows.some((r) => (r[c] ?? "").includes("$"))
  );
  const iLabel = numeric.findIndex((n) => !n);
  const iMoney = isMoney.lastIndexOf(true);
  const iValue = iMoney >= 0 ? iMoney : numeric.indexOf(true);
  const labelOf = (r: string[]): string =>
    speakable(r[iLabel >= 0 ? iLabel : 0] ?? "");

  if (iValue < 0) {
    return `${cap(subject)} lists ${integerToWords(rows.length)} ${rows.length === 1 ? "row" : "rows"}: ${list(rows.slice(0, ROWS_READ).map(labelOf))}.`;
  }

  // Headers wear their units in parentheses ("Oil (bbl/d)"); spoken, the
  // brackets are noise.
  const header = speakable(headers[iValue] ?? "").replace(/[()]/g, "");
  const money = rows.some((r) => (r[iValue] ?? "").includes("$"));
  const valued = rows
    .map((r) => ({ label: labelOf(r), value: numberOf(r[iValue] ?? "") }))
    .filter((r): r is { label: string; value: number } => r.value != null);
  const blanks = rows.length - valued.length;
  const total = valued.reduce((s, r) => s + r.value, 0);
  const ranked = [...valued].sort((a, b) => b.value - a.value);
  const shown = ranked.slice(0, ROWS_READ);
  const rest = ranked.slice(ROWS_READ);

  const count = `${integerToWords(rows.length)} ${rows.length === 1 ? "line" : "lines"}`;
  const opening = money
    ? `${cap(subject)} covers ${count} totalling ${say(total, { money })}`
    : `${cap(subject)} covers ${count}, ${say(total)} ${header.toLowerCase()} between them`;
  const read = shown.map((r, i) => {
    const pct = total > 0 ? Math.round((r.value / total) * 100) : 0;
    const value = say(r.value, { money });
    return i === 0
      ? `${r.label} leads with ${value}, ${integerToWords(pct)} percent of it`
      : `${r.label} ${value}`;
  });
  const clauses = [opening, ...read];
  if (rest.length > 0) {
    const restTotal = rest.reduce((s, r) => s + r.value, 0);
    clauses.push(
      rest.length === 1
        ? `and the last line is ${say(restTotal, { money })}`
        : `the remaining ${integerToWords(rest.length)} add up to ${say(restTotal, { money })}`
    );
  }
  if (blanks > 0) {
    clauses.push(
      `${integerToWords(blanks)} ${blanks === 1 ? "line has" : "lines have"} no figure at all`
    );
  }
  return `${list(clauses)}.`;
}

// --- The script -------------------------------------------------------------

/** Section lead-ins, rotated so a long report doesn't chant one phrase. */
const LEAD_INS = ["Next:", "Moving on:", "Then:", "After that:"];

/**
 * Turn a rendered report into the script Orion speaks: prose verbatim, charts
 * as conclusions, tables as framed figures.
 */
export function narrateMarkdown(markdown: string): string {
  const blocks = parseBlocks(markdown);
  const out: string[] = [];
  let section = "the report";
  let sectionCount = 0;
  // The last thing announced by name. A single-table report repeats its own
  // name as title, heading and table subject; saying it three times in a row is
  // what makes generated narration sound like a machine.
  let announced = "";
  const same = (a: string, b: string): boolean =>
    a.trim().toLowerCase() === b.trim().toLowerCase();
  // A caption ("**By lease**") names the block under it; it is spoken as that
  // block's subject rather than announced on its own.
  let caption = "";

  const speak = (text: string): void => {
    const trimmed = text.trim();
    // A clause that already ends in punctuation (including a closing quote)
    // keeps it; anything else gets a full stop so the voice lands the pause.
    if (trimmed) out.push(/[.!?]["')\]]?$/.test(trimmed) ? trimmed : `${trimmed}.`);
  };

  for (const block of blocks) {
    switch (block.kind) {
      case "title":
        speak(`Here's the ${speakable(block.text)}`);
        announced = speakable(block.text);
        break;
      case "section": {
        section = speakable(block.text);
        caption = "";
        if (same(section, announced)) break;
        const lead = LEAD_INS[sectionCount % LEAD_INS.length];
        sectionCount++;
        out.push(sectionCount === 1 ? `${section}.` : `${lead} ${section}.`);
        announced = section;
        break;
      }
      case "label":
        caption = speakable(block.text);
        break;
      case "prose":
        speak(speakable(block.text));
        break;
      case "bullets":
        // Bullets are the exceptions list: each one is already a sentence a
        // person wrote, so they are spoken as written, in order.
        block.items.forEach((item, i) =>
          speak(`${i === 0 ? "First, " : ""}${speakable(item)}`)
        );
        break;
      case "kpis":
        speak(narrateTiles(block.tiles));
        break;
      case "table": {
        const subject = caption || section;
        speak(narrateTable(block.table, same(subject, announced) ? "it" : subject));
        announced = subject;
        caption = "";
        break;
      }
      case "chart":
        if (block.spec.kind === "row") {
          block.spec.charts.forEach((c) =>
            speak(c.kind === "bar" ? narrateBar(c) : narratePie(c))
          );
        } else if (block.spec.kind === "bar") {
          speak(narrateBar(block.spec));
        } else if (block.spec.kind === "coverage") {
          speak(narrateCoverage(block.spec));
        } else {
          speak(narratePie(block.spec));
        }
        caption = "";
        break;
    }
  }

  out.push("That's the picture.");
  // One last sweep: any figure a clause built from raw values still carries
  // gets spelled out, so nothing digit-shaped reaches the voice.
  return (
    spellFigures(
      out
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .replace(/\.\s*\./g, ".")
    )
      // Spelling a figure out can leave a sentence starting in lower case
      // ("… Ellenburger Deep. six hundred thirty-eight barrels"); a voice hears
      // the difference in how the sentence is attacked.
      .replace(/([.!?]\s+)([a-z])/g, (_, punct: string, letter: string) =>
        `${punct}${letter.toUpperCase()}`
      )
  );
}
