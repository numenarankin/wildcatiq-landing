/**
 * What KIND of thing did someone just paste?
 *
 * The answer decides the filename an "Add History" paste is queued under, and
 * the filename decides how far the paste gets: only a spreadsheet or delimited
 * extension reaches `parseTable`, and only a parsed table reaches the GreaseBook
 * readers and the structured mapper. A GreaseBook page pasted as `.txt` is
 * transcribed and read by a model instead — slower and costlier, for a layout
 * that can be parsed exactly.
 *
 * Tabs and commas are judged differently on purpose. A TAB is nearly proof by
 * itself, since prose does not contain one, so a single line of several tabs is
 * enough — which matters because a web-page paste wraps cells onto lines of
 * their own and most of its lines then carry no tab at all. A COMMA is ordinary
 * punctuation, so it takes several per line, on most lines, before this calls it
 * a table; otherwise a two-line message to the pumper would be read as a CSV.
 *
 * Pure, and outside the component, so the rule is testable and there is one of
 * it.
 */

export interface PasteKind {
  /** Extension to name the queued file with. */
  ext: "tsv" | "csv" | "txt";
  mime: string;
}

export function pasteKind(text: string): PasteKind {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "")
    .slice(0, 20);
  if (lines.length < 2) return { ext: "txt", mime: "text/plain" };

  const tabs = lines.map((l) => l.split("\t").length - 1);
  if (tabs.some((n) => n >= 2) || tabs.filter((n) => n >= 1).length >= 2) {
    return { ext: "tsv", mime: "text/tab-separated-values" };
  }
  const commas = lines.map((l) => l.split(",").length - 1);
  if (commas.filter((n) => n >= 2).length >= Math.ceil(lines.length / 2)) {
    return { ext: "csv", mime: "text/csv" };
  }
  return { ext: "txt", mime: "text/plain" };
}
