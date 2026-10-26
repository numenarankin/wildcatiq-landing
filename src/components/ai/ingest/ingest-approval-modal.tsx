"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangleIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { Button } from "@/components/ui/button";
import { Spokes } from "@/components/ui/spokes";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { INGEST_TYPE_META } from "@/lib/ai/ingest/types";
import { INGEST_ROW_SCHEMA } from "@/lib/ai/ingest/schemas";
import {
  approveIngestProposal,
  dismissIngestProposal,
  type IngestProposal,
  type WellOption,
} from "@/lib/ai/ingest/actions";
import {
  deriveColumns,
  rowsToDrafts,
  NOTICE_KEY,
  draftsToRows,
  GAUGE_COLUMNS,
  ftKey,
  inKey,
  joinGauge,
  withGaugeParts,
  type Draft,
  type Row,
} from "@/components/ai/ingest/ingest-grid";

interface Props {
  proposal: IngestProposal;
  wellOptions: WellOption[];
  /** Implied well from the current page (`/wells/[well]`), pre-selected in the picker. */
  defaultWellId?: string | null;
  /** How many other proposals are queued behind this one. */
  remaining: number;
  /** Remove this proposal from the queue (approved / dismissed / closed). */
  onResolved: (id: string) => void;
  /**
   * The well this card was approved with. One document produces several
   * well-scoped cards (a service row, the equipment, the downtime), and asking
   * which well on every one of them is asking the same question three times;
   * the queue seeds the next card from this document with the answer.
   */
  onWellPicked?: (wellId: string) => void;
  /** landing: the press the demo makes for the reader, "approve" then "done". */
  script?: "approve" | "done" | null;
}

/** Rows rendered at once. Each cell is a live input, so this bounds how many
 *  controlled fields a single proposal can mount — a long extraction (a year of
 *  daily gauges) would otherwise render thousands and stall the page. */
const ROWS_PER_PAGE = 25;

/** Turn a camelCase schema key into a short human label ("oilProduction" → "Oil Production"). */
function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * One ingest proposal, edit-before-approve: an editable grid of the proposed
 * rows (the upload delivers them ready, already extracted). Production /
 * equipment rows with no verbatim-matched well require a well pick before
 * Approve is enabled.
 */
export function IngestApprovalModal({
  proposal,
  wellOptions,
  defaultWellId,
  remaining,
  onResolved,
  onWellPicked,
  script = null,
}: Props) {
  const meta = INGEST_TYPE_META[proposal.type];
  const rows = proposal.rows as Row[];
  // Pin column order to the type's schema field order, so headers and values
  // line up the same way every time (not the model's arbitrary JSON key order).
  const schemaOrder = useMemo(() => {
    const shape = (
      INGEST_ROW_SCHEMA[proposal.type] as { shape?: Record<string, unknown> }
    ).shape;
    return shape ? Object.keys(shape) : [];
  }, [proposal.type]);
  const columns = useMemo(
    () => deriveColumns(rows, schemaOrder),
    [rows, schemaOrder]
  );

  const gaugeKeys = GAUGE_COLUMNS[proposal.type] ?? [];
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    withGaugeParts(rowsToDrafts(rows, columns), gaugeKeys)
  );
  // Seed the picker from the proposal's matched well, else the well the user is
  // currently viewing (only among wells that actually exist in the options).
  const [wellId, setWellId] = useState<string>(() => {
    if (proposal.wellId) return proposal.wellId;
    if (defaultWellId && wellOptions.some((w) => w.id === defaultWellId)) {
      return defaultWellId;
    }
    return "";
  });
  // id -> name, so the trigger renders the well's name and not its slug.
  const wellItems = useMemo(
    () => Object.fromEntries(wellOptions.map((w) => [w.id, w.name])),
    [wellOptions]
  );
  // Row paging. Every cell is a controlled <Input>, so a proposal with hundreds
  // of rows renders hundreds x columns live inputs at once — enough to bog the
  // whole page down. Only the current page is mounted; `drafts` still holds
  // every row, so approve/dismiss and editing semantics are unchanged.
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(drafts.length / ROWS_PER_PAGE));
  // Clamp rather than store a corrected page: removing rows can shrink the list
  // past the current page, and a stale index would render an empty table.
  const safePage = Math.min(page, pageCount - 1);
  const pageStart = safePage * ROWS_PER_PAGE;
  const pageDrafts = drafts.slice(pageStart, pageStart + ROWS_PER_PAGE);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    added: number;
    updated: number;
    skipped: number;
  } | null>(null);

  // Well-scoped types always show the picker (pre-seeded above) so the user can
  // confirm or change it; the picker value is the source of truth.
  const resolvedWell = meta.needsWell ? wellId : "";
  const canApprove =
    !saving && drafts.length > 0 && (!meta.needsWell || Boolean(resolvedWell));

  function updateCell(index: number, key: string, value: string) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [key]: value } : d))
    );
  }
  /** Edit a gauge's feet or inches; the inches written are recomputed from both. */
  function updateGauge(index: number, key: string, part: "ft" | "in", value: string) {
    setDrafts((prev) =>
      prev.map((d, i) => {
        if (i !== index) return d;
        const next = { ...d, [part === "ft" ? ftKey(key) : inKey(key)]: value };
        return { ...next, [key]: joinGauge(next[ftKey(key)] ?? "", next[inKey(key)] ?? "") };
      })
    );
  }
  function removeRow(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }
  function addRow() {
    const empty: Draft = {};
    for (const c of columns) empty[c.key] = "";
    setDrafts((prev) => [...prev, empty]);
  }

  async function handleApprove() {
    if (!canApprove) return;
    setSaving(true);
    setError(null);
    try {
      const res = await approveIngestProposal(proposal.id, {
        rows: draftsToRows(drafts, columns),
        wellId: resolvedWell || undefined,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to add the records.");
        setSaving(false);
        return;
      }
      if (resolvedWell) onWellPicked?.(resolvedWell);
      setResult({
        added: res.added ?? 0,
        updated: res.updated ?? 0,
        skipped: res.skipped ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add the records.");
      setSaving(false);
    }
  }

  async function handleDismiss() {
    setSaving(true);
    try {
      await dismissIngestProposal(proposal.id);
    } catch (err) {
      console.error("dismissIngestProposal failed", err);
    }
    onResolved(proposal.id);
  }

  // Closing the modal (X / backdrop) must actually dismiss the proposal — else
  // it stays `pending` in the DB and re-surfaces on the next fetch/Realtime
  // merge. Once approved there's nothing left to dismiss, so just close.
  function handleClose() {
    if (result) {
      onResolved(proposal.id);
      return;
    }
    void handleDismiss();
  }

  // landing: the scripted presses, made through the same handlers a click uses.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the press is the script's, not a derivation
    if (script === "approve" && !result && !saving) void handleApprove();
    if (script === "done" && result) onResolved(proposal.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on the script step only
  }, [script, result]);

  const title = `Add ${drafts.length} ${drafts.length === 1 ? meta.singular : meta.plural}?`;
  const description =
    (proposal.fileName ? `From ${proposal.fileName}. ` : "") +
    (remaining > 0 ? `${remaining} more from this upload.` : "");

  return (
    <SwipeUpModal
      open
      onClose={handleClose}
      title={title}
      description={description || undefined}
      className="h-[85%] w-[95%] max-w-[1400px]"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {result ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
            <p className="text-sm">
              Added <span className="font-semibold">{result.added}</span>{" "}
              {result.added === 1 ? meta.singular : meta.plural}
              {/* An update overwrote data that was already on file — the one
                  outcome the user most needs told, so it is never collapsed
                  into the "added" count. */}
              {result.updated > 0 && (
                <>
                  , updated{" "}
                  <span className="font-semibold">{result.updated}</span>{" "}
                  already on file
                </>
              )}
              {result.skipped > 0 && (
                <>
                  , skipped{" "}
                  <span className="font-semibold">{result.skipped}</span> as
                  duplicate{result.skipped === 1 ? "" : "s"}
                </>
              )}
              .
            </p>
            <Button onClick={() => onResolved(proposal.id)}>Done</Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mx-5 mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {meta.needsWell && (
              <div className="flex items-center gap-3 border-b px-5 py-3">
                <label className="text-sm font-medium">Well</label>
                {/* `wells.id` is a slug, so without an item map Base UI's
                    SelectValue prints "roy-corbett-2" — which reads as an
                    unresolved field rather than as the well it already matched. */}
                <Select
                  items={wellItems}
                  value={wellId}
                  onValueChange={(v) => setWellId(v ?? "")}
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Choose a well…" />
                  </SelectTrigger>
                  <SelectContent>
                    {wellOptions.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
              {drafts.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground">
                  No rows left. Dismiss this card or add one.
                </p>
              ) : (
                <table className="w-full min-w-max text-sm">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      {columns.map((c) => (
                        <th
                          key={c.key}
                          className={cn(
                            "px-2 py-2 font-medium whitespace-nowrap",
                            // Match the cell content: number cells are right-
                            // aligned, so their header must be too, or the label
                            // sits at the opposite end of the value.
                            c.type === "number" ? "text-right" : "text-left"
                          )}
                        >
                          {humanize(c.key)}
                          {gaugeKeys.includes(c.key) ? " (ft / in)" : ""}
                        </th>
                      ))}
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageDrafts.map((draft, j) => {
                      // Index into the FULL draft list — edits and removals
                      // address the real row, not its position on this page.
                      const i = pageStart + j;
                      const notice = draft[NOTICE_KEY];
                      return (
                      <tr
                        key={i}
                        className={cn(
                          "border-b last:border-0",
                          // A row the proposing step could not decide about.
                          // Tinted, never dropped: see `suppress.ts`.
                          notice && "bg-amber-500/5"
                        )}
                      >
                        {columns.map((c) =>
                          gaugeKeys.includes(c.key) ? (
                          <td key={c.key} className="px-1 py-1">
                            {/* Read off the stick as feet then inches, like the
                                tank's own gauge form. Inches take decimals, so
                                80.5" stays 80.5 rather than rounding to a quarter. */}
                            <div className="flex items-center justify-end gap-1">
                              <Input
                                value={draft[ftKey(c.key)] ?? ""}
                                inputMode="numeric"
                                aria-label={`${humanize(c.key)} feet`}
                                onChange={(e) => updateGauge(i, c.key, "ft", e.target.value)}
                                className="h-8 w-14 border-transparent bg-transparent px-2 text-right tabular-nums shadow-none focus-visible:border-input"
                              />
                              <span className="text-xs text-muted-foreground">ft</span>
                              <Input
                                value={draft[inKey(c.key)] ?? ""}
                                inputMode="decimal"
                                aria-label={`${humanize(c.key)} inches`}
                                onChange={(e) => updateGauge(i, c.key, "in", e.target.value)}
                                className="h-8 w-16 border-transparent bg-transparent px-2 text-right tabular-nums shadow-none focus-visible:border-input"
                              />
                              <span className="text-xs text-muted-foreground">in</span>
                            </div>
                          </td>
                          ) : (
                          <td key={c.key} className="px-1 py-1">
                            <Input
                              value={draft[c.key] ?? ""}
                              inputMode={c.type === "number" ? "decimal" : "text"}
                              onChange={(e) => updateCell(i, c.key, e.target.value)}
                              className={cn(
                                "h-8 border-transparent bg-transparent px-2 shadow-none focus-visible:border-input",
                                c.type === "number"
                                  ? "min-w-[6rem] text-right tabular-nums"
                                  : "min-w-[9rem]"
                              )}
                            />
                          </td>
                          )
                        )}
                        <td className="px-1">
                          {/* Right-aligned so the trash button sits in the same
                              place on every row, flagged or not. */}
                          <div className="flex items-center justify-end gap-0.5">
                            {notice ? (
                              <Tooltip>
                                <TooltipTrigger
                                  render={<span className="flex cursor-help" />}
                                  aria-label={notice}
                                >
                                  <AlertTriangleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">{notice}</TooltipContent>
                              </Tooltip>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Remove row"
                              onClick={() => removeRow(i)}
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {pageCount > 1 && (
              <div className="flex items-center justify-between gap-3 border-t px-5 py-2">
                <span className="ty-body-1 text-tertiary-text tabular-nums">
                  Rows {pageStart + 1}–{pageStart + pageDrafts.length} of{" "}
                  {drafts.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage === 0}
                  >
                    Previous
                  </Button>
                  <span className="ty-body-1 text-tertiary-text tabular-nums">
                    {safePage + 1} / {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage >= pageCount - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addRow}
                disabled={columns.length === 0}
              >
                <PlusIcon className="size-4" /> Add row
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={saving}
                >
                  Dismiss
                </Button>
                <Button type="button" onClick={handleApprove} disabled={!canApprove}>
                  {saving && <Spokes data-icon="inline-start" />}
                  Approve
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </SwipeUpModal>
  );
}
