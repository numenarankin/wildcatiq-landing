"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { Row } from "@/components/scout/modal-ui";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/*
 * Click-to-edit furniture for the invoice modals.
 *
 * Shared by the filed-invoice viewer (`invoice-doc-modal.tsx`) and the pre-save
 * review (`invoice-review-modal.tsx`), so an invoice is edited the same way
 * before it is filed and after. One copy: two would drift on the things that
 * are easy to get subtly wrong — what Escape does, how money is parsed, which
 * picker a date opens.
 *
 * Every control commits on its own (blur or Enter; Escape abandons) and hands
 * back a plain string; the caller decides what that means for its record. The
 * furniture is the well Info sheet's: the same click-to-edit row, the same
 * input. Dropdowns are the app's `Select` and dates the app's `DatePicker`,
 * never the browser's own.
 */

/**
 * A typed money/number string as a number, null for cleared, or undefined for
 * something that is not a number — which is abandoned, never saved as zero.
 */
export function money(text: string): number | null | undefined {
  const raw = text.trim().replace(/[$,]/g, "");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** The well Info sheet's value box, so an edit here looks like an edit there. */
const VALUE_INPUT =
  "w-full rounded-sm bg-transparent px-1.5 py-1 outline-none placeholder:text-muted-foreground/50 focus:bg-muted focus:ring-1 focus:ring-ring";

/**
 * A `Row` that is edited by clicking its value.
 *
 * Same layout as `Row` (label left, value right, one line) so a viewer and an
 * editor read identically, with two differences an editor needs: an EMPTY value
 * still renders — as a dash — because a field with nothing in it is exactly the
 * one that needs filling, and `Row` hides those; and the value is a button that
 * swaps for an input. Commit on blur or Enter; Escape puts the stored value
 * back. `raw` is what the input opens with when the display is formatted
 * (money), so the reader edits `2253.24`, not `$2,253.24`.
 */
export function EditableRow({
  label,
  value,
  raw,
  kind = "text",
  mono = false,
  editable,
  onCommit,
  labelEditable = false,
  onCommitLabel,
}: {
  label: string;
  value: string | null;
  raw?: string;
  kind?: "text" | "date" | "money";
  mono?: boolean;
  editable: boolean;
  onCommit: (next: string) => void;
  /** The tax row: its LABEL is the vendor's wording, and it is a field too. */
  labelEditable?: boolean;
  onCommitLabel?: (next: string) => void;
}) {
  if (!editable) return <Row label={label} value={value} mono={mono} />;
  if (kind === "date") {
    return (
      <div className="flex items-center justify-between gap-6 py-1.5 text-sm">
        <span className="shrink-0 text-muted-foreground">{label}</span>
        <InlineDate value={value} onCommit={onCommit} ariaLabel={label} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-6 py-1.5 text-sm">
      {labelEditable && onCommitLabel ? (
        <InlineText
          value={label}
          onCommit={onCommitLabel}
          ariaLabel="Tax label"
          className="shrink-0 text-muted-foreground"
          inputClassName="w-40"
        />
      ) : (
        <span className="shrink-0 text-muted-foreground">{label}</span>
      )}
      <InlineText
        value={raw ?? value ?? ""}
        display={value}
        kind={kind}
        onCommit={onCommit}
        ariaLabel={label}
        className={cn("text-right font-medium", mono && "font-mono text-xs")}
        inputClassName="w-44 text-right"
      />
    </div>
  );
}

/** A `Row` whose value is one of a fixed few; clicking it opens the choices. */
export function SelectRow({
  label,
  value,
  options,
  editable,
  onCommit,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  editable: boolean;
  onCommit: (next: string) => void;
}) {
  const current = options.find((o) => o.value === value)?.label ?? value;
  if (!editable) return <Row label={label} value={current} />;
  return (
    <div className="flex items-center justify-between gap-6 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <InlineSelect value={value} options={options} onCommit={onCommit} ariaLabel={label} />
    </div>
  );
}

/**
 * The click-to-edit primitive under every field here: a value that becomes an
 * input when clicked, and a button until then.
 *
 * `value` is the editable text; `display` is what to show at rest when the two
 * differ (a formatted amount). Idle it shows `display ?? value`, or a dash so
 * an empty field is still something to click.
 */
export function InlineText({
  value,
  display,
  kind = "text",
  onCommit,
  ariaLabel,
  className,
  inputClassName,
  placeholder = "—",
}: {
  value: string;
  display?: string | null;
  kind?: "text" | "money";
  onCommit: (next: string) => void;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const abandoned = useRef(false);

  function open() {
    setDraft(value);
    setEditing(true);
  }
  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next !== value.trim()) onCommit(next);
  }

  if (!editing) {
    const shown = display ?? value;
    return (
      <button
        type="button"
        onClick={open}
        aria-label={`Edit ${ariaLabel}`}
        className={cn(
          "min-w-0 cursor-text truncate rounded-sm px-1.5 py-0.5 text-left hover:bg-muted",
          !shown && "text-muted-foreground/60",
          className
        )}
      >
        {shown || placeholder}
      </button>
    );
  }
  return (
    <input
      autoFocus
      type="text"
      inputMode={kind === "money" ? "decimal" : undefined}
      value={draft}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (abandoned.current) {
          abandoned.current = false;
          setEditing(false);
          return;
        }
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          abandoned.current = true;
          e.currentTarget.blur();
        }
      }}
      className={cn(VALUE_INPUT, "text-sm", className, inputClassName)}
    />
  );
}

/**
 * The same, for a value chosen from a fixed list — the app's own `Select`, as
 * the ledger's cells use it, never the browser's. The trigger IS the idle
 * display, styled to sit in a row like the text fields around it; the list
 * commits on choice.
 */
export function InlineSelect({
  value,
  options,
  onCommit,
  ariaLabel,
  className,
}: {
  value: string;
  options: { value: string; label: string }[];
  onCommit: (next: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  // Base UI's SelectValue stringifies the raw value unless the Root is given
  // an item map, which would print `field_ticket` where "Field ticket" belongs.
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]));
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => {
        if (v && v !== value) onCommit(v);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn(INLINE_TRIGGER, "font-medium", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A date, edited with the app's `DatePicker` — never `<input type="date">`,
 * whose editor belongs to the operating system and looks different on every
 * device the crew opens this on. Speaks ISO `YYYY-MM-DD` with `""` for unset,
 * converted without a timezone hop: `new Date("2026-03-12")` is UTC midnight
 * and reads as the 11th west of Greenwich. Clearing is picking the selected
 * day again, which the calendar reports as no selection.
 */
export function InlineDate({
  value,
  onCommit,
  ariaLabel,
  placeholder = "—",
  className,
}: {
  value: string | null;
  onCommit: (next: string) => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
}) {
  const date = value ? isoToLocalDate(value) : null;
  return (
    <span aria-label={ariaLabel}>
      <DatePicker
        value={date}
        placeholder={placeholder}
        onChange={(d) => {
          const next = d ? format(d, "yyyy-MM-dd") : "";
          if (next !== (value ?? "")) onCommit(next);
        }}
        className={cn(INLINE_TRIGGER, "font-mono text-xs", className)}
      />
    </span>
  );
}

/** `YYYY-MM-DD` as a local-time Date, so the calendar highlights the right day. */
function isoToLocalDate(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * A picker sitting inside a text row: no border and no shadow until hovered,
 * the same footprint as the click-to-edit text beside it.
 */
const INLINE_TRIGGER =
  "h-7 border-transparent bg-transparent px-1.5 shadow-none hover:bg-muted dark:bg-transparent";

