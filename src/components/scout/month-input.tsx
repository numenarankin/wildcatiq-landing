"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMonth, maskMonthTyping, parseMonth } from "@/lib/charts/parse-month";

/*
 * The one way a month is typed on Recon: the production chart's window ends
 * and the Completions tab's date band share it, so a date box reads and
 * behaves the same wherever it sits on the page.
 */
/**
 * One end of the window, typed as MM/YYYY. The slash arrives by itself after
 * the month (`maskMonthTyping`); a line `parseMonth` cannot read, or an
 * emptied box, is put back to what it was rather than guessed at. Commits on
 * Enter or on leaving the box.
 */
export function MonthInput({
  label,
  value,
  onCommit,
}: {
  label: string;
  /** `YYYY-MM`. */
  value: string;
  onCommit: (cycle: string) => void;
}) {
  const shown = value ? formatMonth(value) : "";
  const [text, setText] = useState(shown);
  // A wheel step or a preset rewrites the window under the box.
  const [seen, setSeen] = useState(shown);
  if (seen !== shown) {
    setSeen(shown);
    setText(shown);
  }
  const commit = () => {
    const parsed = parseMonth(text);
    if (!parsed) {
      setText(shown);
      return;
    }
    setText(formatMonth(parsed));
    if (parsed !== value) onCommit(parsed);
  };
  return (
    <Input
      aria-label={label}
      placeholder="MM/YYYY"
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(maskMonthTyping(e.target.value))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setText(shown);
      }}
      className="h-7 w-[5.5rem] px-2 text-xs tabular-nums"
    />
  );
}
