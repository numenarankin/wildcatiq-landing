"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { AlertTriangleIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gasLinePrice, lineNetValue } from "@/lib/statements/statements";
import type { StatementWarning } from "@/lib/statements/checks";
import { runsOfLine } from "@/lib/statements/line-runs";
import { LineRuns } from "@/components/statements/line-runs";
import { cn } from "@/lib/utils";

/** Editable statement header (the fields above the line items). */
export interface ReviewHeader {
  purchaser: string;
  statementNo: string;
  /** The check / ACH number the statement was paid under ("" when not printed). */
  checkNo: string;
  periodStart: string;
  periodEnd: string;
  product: "oil" | "gas" | "mixed";
  notes: string;
}

/** Editable settlement line (no line id - held in memory during review). */
export interface ReviewLine {
  /**
   * The stored line this row is. Absent on a line the reviewer just added, and on
   * every line of an upload that has not been saved yet. Carried through the save
   * so per-line state (a deletion, a pinned lease, a chosen category) survives an
   * edit instead of being wiped by a wholesale replace.
   */
  id?: string;
  leaseId: string | null;
  /**
   * The printed lease name folds to two leases on file, so nothing was matched.
   * Advisory: it changes what the reviewer is told, never what is saved.
   */
  leaseAmbiguous?: boolean;
  tankId: string | null;
  meterId: string | null;
  leaseRef: string;
  tankRef: string;
  meterRef: string;
  product: "oil" | "gas";
  volume: number;
  price: number | null;
  grossValue: number;
  deducts: number;
  taxes: number;
  netValue: number;
  mmbtu: number | null;
  allocatedQty: number | null;
  producerPct: number | null;
  settleQty: number | null;
  fees: number;
  raw?: Record<string, unknown>;
}

/**
 * Entity option for a connected select.
 *
 * `name` / `number` are the MATCHABLE identifiers behind the label, so the grid
 * and the backfill collectors can ask the shared matcher instead of parsing the
 * display label apart. The shape is a `MatchTarget`
 * (docs/plans/statement-lease-matching.md).
 */
export interface EntityOption {
  id: string;
  /** Display label (name, optionally with the number). */
  label: string;
  name?: string | null;
  number?: string | null;
}

export function blankLine(product: "oil" | "gas" = "oil"): ReviewLine {
  return {
    leaseId: null,
    tankId: null,
    meterId: null,
    leaseRef: "",
    tankRef: "",
    meterRef: "",
    product,
    volume: 0,
    price: null,
    grossValue: 0,
    deducts: 0,
    taxes: 0,
    netValue: 0,
    mmbtu: null,
    allocatedQty: null,
    producerPct: null,
    settleQty: null,
    fees: 0,
    raw: {},
  };
}

const labelCls =
  "font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground";

/** Sentinel for the "unmatched" option (base-ui Select can't bind ""). */
const UNMATCHED = "__unmatched__";

/**
 * The shared extract/review editor: a header form + an editable table of
 * settlement line items. Columns are driven by the statement's commodity - an
 * oil statement shows only oil columns, a gas statement only gas columns (never
 * both). Lease and the measurement point (tank for oil, meter for gas) are
 * connected selects that resolve to real entities; the printed identifier is the
 * fallback when unmatched. Purely controlled - the parent owns state + saves.
 */
export function StatementReview({
  header,
  lines,
  warnings = [],
  leases,
  tanks,
  meters,
  onHeaderChange,
  onLinesChange,
}: {
  header: ReviewHeader;
  lines: ReviewLine[];
  /**
   * Deterministic findings for THIS statement (see `@/lib/statements/checks`).
   * Advisory only - they badge the offending row, they never block a save and
   * they never change a value. Optional so the extract-from-chat path and the
   * statement detail page can render the editor without computing them.
   */
  warnings?: StatementWarning[];
  leases: EntityOption[];
  tanks: EntityOption[];
  meters: EntityOption[];
  onHeaderChange: (patch: Partial<ReviewHeader>) => void;
  onLinesChange: (lines: ReviewLine[]) => void;
}) {
  const isGas = header.product === "gas";

  // Findings addressed to the header rather than a line (period, printed total).
  const headerWarnings = warnings.filter((w) => w.line === null);
  /**
   * Findings for line `i`, collapsed to one string.
   *
   * `unmatched-lease` is deliberately NOT one of them. A lease that resolved to
   * nothing is the ordinary state of the first statement a lease appears on -
   * the upload offers to create it as an approval card - and tinting the line
   * amber for it drowned the findings that mean the numbers are wrong. The
   * dimmed printed ref in the lease select is that signal, and it is enough.
   */
  const lineWarning = (i: number): string | null => {
    const hits = warnings.filter(
      (w) => w.line === i && w.code !== "unmatched-lease"
    );
    return hits.length ? hits.map((w) => w.message).join("\n") : null;
  };

  function patchLine(i: number, patch: Partial<ReviewLine>) {
    onLinesChange(
      lines.map((l, idx) => {
        if (idx !== i) return l;
        const next = { ...l, ...patch };
        if (!("netValue" in patch)) next.netValue = lineNetValue(next);
        // The gas price follows its inputs. Correcting a volume or a fee and
        // leaving the price at what it was would leave the line stating a rate
        // its own numbers contradict.
        if (next.product === "gas") next.price = gasLinePrice(next);
        return next;
      })
    );
  }

  function addLine() {
    onLinesChange([...lines, blankLine(isGas ? "gas" : "oil")]);
  }

  // Column layout per commodity. Each numeric column renders a NumberCell.
  const numCols: {
    key: keyof ReviewLine;
    label: string;
    allowEmpty?: boolean;
    /** Money reads as money, price to four decimals; volumes get grouping; a
     *  percentage gets neither. */
    format?: "usd" | "price" | "qty" | "plain";
    /** Computed from other fields on the line - shown, never typed into. */
    derived?: boolean;
  }[] = isGas
    ? [
        { key: "volume", label: "MCF", format: "qty" },
        { key: "mmbtu", label: "MMBTU", allowEmpty: true, format: "qty" },
        {
          key: "allocatedQty",
          label: "Alloc Qty",
          allowEmpty: true,
          format: "qty",
        },
        { key: "producerPct", label: "Prod %", allowEmpty: true },
        {
          key: "settleQty",
          label: "Settle Qty",
          allowEmpty: true,
          format: "qty",
        },
        // Derived, not read: no gas statement prints a price per MCF. See
        // `realizedUnitPrice`.
        {
          key: "price",
          label: "$/MCF",
          allowEmpty: true,
          format: "price",
          derived: true,
        },
        { key: "grossValue", label: "Gross", format: "usd" },
        { key: "deducts", label: "Deducts", format: "usd" },
        { key: "taxes", label: "Taxes", format: "usd" },
        { key: "fees", label: "Fees", format: "usd" },
        { key: "netValue", label: "Net", format: "usd" },
      ]
    : [
        { key: "volume", label: "Volume (bbl)", format: "qty" },
        // Oil statements DO print a price per barrel, so it stays what the
        // purchaser printed rather than a derivation of their own totals.
        { key: "price", label: "$/BBL", allowEmpty: true, format: "price" },
        { key: "grossValue", label: "Gross", format: "usd" },
        { key: "deducts", label: "Deducts", format: "usd" },
        { key: "taxes", label: "Taxes", format: "usd" },
        { key: "netValue", label: "Net", format: "usd" },
      ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header-level findings: the period doesn't make sense, or the line items
          don't add up to the total the document itself printed. */}
      {headerWarnings.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-[0.15rem] border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          {headerWarnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}

      {/* One grid for the whole statement: what the document says about itself,
          then the lines it settles. The lines used to sit in a separate table
          that scrolled sideways inside a pane too narrow to hold it, which read
          as a second, unrelated form. */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Purchaser">
          <Input
            value={header.purchaser}
            onChange={(e) => onHeaderChange({ purchaser: e.target.value })}
            placeholder="Crude / gas buyer"
          />
        </Field>
        <Field label="Statement #">
          <Input
            value={header.statementNo}
            onChange={(e) => onHeaderChange({ statementNo: e.target.value })}
            placeholder="-"
          />
        </Field>
        <Field label="Check #">
          <Input
            value={header.checkNo}
            onChange={(e) => onHeaderChange({ checkNo: e.target.value })}
            placeholder="-"
          />
        </Field>
        <Field label="Commodity">
          <Select
            value={header.product}
            onValueChange={(v) =>
              onHeaderChange({ product: v as ReviewHeader["product"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v) => (v === "gas" ? "Gas" : v === "mixed" ? "Mixed" : "Oil")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oil">Oil</SelectItem>
              <SelectItem value="gas">Gas</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Period start">
          <DatePicker
            value={header.periodStart ? parseISO(header.periodStart) : null}
            onChange={(d) =>
              onHeaderChange({ periodStart: d ? format(d, "yyyy-MM-dd") : "" })
            }
            className="w-full"
          />
        </Field>
        <Field label="Period end">
          <DatePicker
            value={header.periodEnd ? parseISO(header.periodEnd) : null}
            onChange={(d) =>
              onHeaderChange({ periodEnd: d ? format(d, "yyyy-MM-dd") : "" })
            }
            className="w-full"
          />
        </Field>

        {/* The lines continue the SAME form. No heading, no panel, no rule
            across the grid: a settlement statement is its lines - the purchaser
            and period at the top are the header ON them, not a separate record
            they belong to - and boxing them off made the reviewer read the two
            halves as unrelated. */}
        {lines.map((l, i) => (
          <div
            key={i}
            className={cn(
              "col-span-2 grid grid-cols-2 gap-3",
              // Tint the whole line rather than one field: a finding like "net
              // doesn't match gross − deducts − taxes" implicates the line, not
              // a single number, and guessing which one is wrong is the
              // reviewer's job, not ours. No warning, no box.
              lineWarning(i) && "-mx-2 rounded-[0.15rem] bg-amber-500/5 px-2 py-2"
            )}
          >
            <Field label="Lease">
              <EntitySelect
                options={leases}
                value={l.leaseId}
                printedRef={l.leaseRef}
                ambiguous={l.leaseAmbiguous}
                onChange={(id) => patchLine(i, { leaseId: id })}
              />
            </Field>
            <Field label={isGas ? "Meter" : "Tank"}>
              {isGas ? (
                <EntitySelect
                  options={meters}
                  value={l.meterId}
                  printedRef={l.meterRef}
                  onChange={(id) => patchLine(i, { meterId: id })}
                />
              ) : (
                <EntitySelect
                  options={tanks}
                  value={l.tankId}
                  printedRef={l.tankRef}
                  onChange={(id) => patchLine(i, { tankId: id })}
                />
              )}
            </Field>

            {/* The money, three across: every column the commodity calls for is
                visible at once, which the sideways-scrolling table could not do
                in a pane this wide. */}
            <div className="col-span-2 grid grid-cols-3 gap-3">
              {numCols.map((c) => (
                <Field key={c.key} label={c.label}>
                  <NumberCell
                    // A derived column is COMPUTED here, not read off the line:
                    // whatever price a row happens to carry, a gas line shows
                    // net over MCF.
                    value={
                      c.derived
                        ? gasLinePrice(l)
                        : ((l[c.key] as number | null) ?? null)
                    }
                    allowEmpty={c.allowEmpty}
                    format={c.format}
                    readOnly={c.derived}
                    onValue={(n) =>
                      patchLine(i, {
                        [c.key]: c.allowEmpty ? n : (n ?? 0),
                      } as Partial<ReviewLine>)
                    }
                  />
                </Field>
              ))}
            </div>

            {/* The hauls this line settles, as the same read that produced
                the line found them. Collapsed; nothing on a line without any. */}
            <LineRuns runs={runsOfLine(l)} />

            {/* Only where they mean something: a second line needs to be
                separable from the first, and a sole line has nothing to
                separate from. */}
            {(lines.length > 1 || lineWarning(i)) && (
              <div className="col-span-2 flex items-center justify-end gap-1">
                {lineWarning(i) && (
                  // The finding in WORDS. It used to be a bare triangle with the
                  // message in a `title`, which meant the one thing the tint was
                  // there to communicate was the one thing you could not read.
                  <span className="mr-auto flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-500">
                    <AlertTriangleIcon className="mt-px size-3.5 shrink-0" />
                    <span className="whitespace-pre-line">{lineWarning(i)}</span>
                  </span>
                )}
                {lines.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onLinesChange(lines.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2Icon />
                    Remove line {i + 1}
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="col-span-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={addLine}>
            <PlusIcon />
            Add line
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

/**
 * A connected select over real entities (lease / tank / meter). Shows the matched
 * entity's label, or the printed `ref` as an "unmatched" hint when nothing is
 * selected. Reuses base-ui's function-child to render the label (it shows the raw
 * value otherwise).
 */
function EntitySelect({
  options,
  value,
  printedRef,
  ambiguous = false,
  onChange,
}: {
  options: EntityOption[];
  value: string | null;
  printedRef: string;
  /**
   * The printed ref names more than one entity on file. Only the copy changes:
   * leaving it unmatched must not read as "this will be created", because what
   * this row needs is the reviewer picking WHICH of the two it is.
   */
  ambiguous?: boolean;
  onChange: (id: string | null) => void;
}) {
  // The printed ref, dimmed - NOT a warning icon. An unmatched lease is the
  // normal state of a statement the first time its lease is seen, and flagging
  // every one of them as a fault trained the reviewer to ignore the one glyph
  // that does mean something (a line-level finding).
  const unmatchedLabel = printedRef ? (
    <span className="text-muted-foreground">{printedRef}</span>
  ) : (
    <span className="text-muted-foreground">- Unmatched -</span>
  );
  return (
    <Select
      value={value || UNMATCHED}
      onValueChange={(v) => onChange(v && v !== UNMATCHED ? v : null)}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          {(v) =>
            !v || v === UNMATCHED
              ? unmatchedLabel
              : (options.find((o) => o.id === v)?.label ?? unmatchedLabel)
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNMATCHED}>
          {/* What leaving it unmatched MEANS, which is that this one gets
              created: the upload proposes the printed ref as a new lease / tank
              / meter, so "Unmatched" described the row's state while "new"
              describes what happens to it. Only with a ref to create - with
              nothing printed there is nothing to make. */}
          {!printedRef
            ? "- Unmatched -"
            : ambiguous
              ? `${printedRef} (matches more than one)`
              : `${printedRef} (new)`}
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const usdFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const qtyFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
/**
 * Realized price, to four decimals.
 *
 * A purchaser prices crude to a hundredth of a cent - $80.6900 and $80.6932 are
 * different statements - and rounding it to two on screen makes the reviewer's
 * only check of the price column (against the page) come out wrong by dollars
 * once it is multiplied by a thousand barrels.
 */
const priceFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

/**
 * Controlled numeric cell. Accepts only number-ish text (no stepper chrome).
 * Empty maps to null; callers coerce to 0 for required fields, or keep null for
 * optional ones (`allowEmpty`, e.g. price, gas fields).
 *
 * FORMATTED AT REST, RAW WHILE EDITING. `113696.36` and `$113,696.36` are the
 * same figure, but only one of them can be checked against the document at a
 * glance - and grouping is what makes a misplaced digit visible at all. The
 * formatting comes off the moment the field takes focus, because a caret inside
 * a string with commas and a currency symbol in it is where editing goes wrong.
 */
function NumberCell({
  value,
  onValue,
  allowEmpty = false,
  format = "plain",
  readOnly = false,
}: {
  value: number | null;
  onValue: (n: number | null) => void;
  allowEmpty?: boolean;
  /** How the figure reads when the field is not being edited. */
  format?: "usd" | "price" | "qty" | "plain";
  /**
   * A computed figure. Shown in the same place as the rest so the line reads as
   * one row of numbers, but not typed into: an edit would be overwritten by the
   * next recompute, which is worse than not offering it.
   */
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const display =
    value == null
      ? ""
      : editing || format === "plain"
        ? String(value)
        : format === "usd"
          ? usdFmt.format(value)
          : format === "price"
            ? priceFmt.format(value)
            : qtyFmt.format(value);

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      onFocus={() => setEditing(!readOnly)}
      onBlur={() => setEditing(false)}
      onChange={(e) => {
        // Strip what the formatter added, so a paste of "$113,696.36" is read
        // rather than rejected character by character.
        const raw = e.target.value.replace(/[$,\s]/g, "");
        if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
        if (raw === "" || raw === "-" || raw === ".") {
          onValue(allowEmpty ? null : 0);
          return;
        }
        const n = Number(raw);
        if (!Number.isNaN(n)) onValue(n);
      }}
      placeholder={allowEmpty ? "-" : "0"}
      className={cn(
        "text-right tabular-nums",
        readOnly && "cursor-default bg-muted/40 text-muted-foreground"
      )}
    />
  );
}
