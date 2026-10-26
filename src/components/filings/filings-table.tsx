"use client";

/**
 * The RRC docket: a header tab per form (only the Form PR today), and under
 * it one table with a row per reporting period (the due date is the modal's,
 * not the row's). A row moves along in one way: Generate (View, once the row
 * has a file) opens the month for reading and editing, and Download in that
 * review is what generates the row's file. Nothing marks a row filed from
 * here; a row already filed keeps Unmark so it can be reopened. Header tabs
 * follow the Leases page.
 */

import { Fragment, useState, useTransition } from "react";
import { DownloadIcon, LoaderIcon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilerModal } from "@/components/reports/form-pr/filer-modal";
import { GeneratedModal } from "@/components/reports/form-pr/generated-modal";
import { generateFormPr, storedFormPr, type GeneratedFormPr } from "@/lib/rrc/form-pr/actions";
import type { FilerSettings } from "@/lib/rrc/form-pr/service";
import { downloadFormPrFiling, unmarkFiled } from "@/lib/rrc/forms/actions";
import { FILING_FORMS, FORM_LABELS, type FormKind } from "@/lib/rrc/forms/schedule";
import type { FilingRow } from "@/lib/rrc/forms/types";

const STATUS_LABEL = { draft: "Not generated", generated: "Generated", filed: "Filed" } as const;

type Review = { result: GeneratedFormPr; readOnly: boolean };

export function FilingsTable({
  rows,
  filer,
  canManage,
}: {
  rows: FilingRow[];
  filer: FilerSettings;
  canManage: boolean;
}) {
  const [form, setForm] = useState<FormKind>(FILING_FORMS[0]);
  const [filerOpen, setFilerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [runs, setRuns] = useState(0);
  const [, start] = useTransition();
  const filerMissing = !filer.agentUserId || !filer.agentName || !filer.agentEmail || !filer.agentPhone;

  const shown = rows.filter((r) => r.form === form);

  function fail(row: FilingRow, message: string) {
    setErrors((s) => ({ ...s, [row.key]: message }));
  }

  /**
   * An open month is rebuilt from the ledger and opened for editing; a filed
   * month shows the file that was handed out, read only, because the ledger
   * has moved on and a rebuild would not be the file the RRC has.
   */
  function openReview(row: FilingRow) {
    setBusy(row.key);
    setErrors((s) => ({ ...s, [row.key]: undefined }));
    start(async () => {
      const filed = row.status === "filed";
      const res = filed ? await storedFormPr(row.period) : await generateFormPr(row.period);
      setBusy(null);
      if (res.error) {
        fail(row, res.error);
        return;
      }
      if (!res.result) {
        fail(row, "No file was generated for this month before it was marked filed.");
        return;
      }
      setRuns((n) => n + 1);
      setReview({ result: res.result, readOnly: filed });
    });
  }

  function closeReview() {
    setReview(null);
    // landing: the app re-reads the docket here (Download may have stored a
    // file on the row); the screen hands the rows in itself.
  }

  function unmark(row: FilingRow) {
    if (!row.id) return;
    const id = row.id;
    setBusy(row.key);
    start(async () => {
      const res = await unmarkFiled(id);
      setBusy(null);
      if (res.error) fail(row, res.error);
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {FILING_FORMS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={form === f}
              onClick={() => setForm(f)}
              className={cn(
                "font-heading text-2xl font-semibold tracking-tight transition-colors",
                form === f ? "text-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              {FORM_LABELS[f]}
              <Badge variant="secondary" className="ml-1.5 -translate-y-2 align-top text-xs font-semibold leading-4 text-muted-foreground">
                Beta
              </Badge>
            </button>
          ))}
        </div>
        {canManage ? (
          <Button size="lg" variant="outline" onClick={() => setFilerOpen(true)}>
            <SettingsIcon />
            RRC filer
          </Button>
        ) : null}
      </div>

      {canManage && filerMissing ? (
        <div className="rounded-[0.15rem] border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm">
          The RRC filer details are not set, so no file can be generated yet.{" "}
          <button type="button" className="font-medium underline" onClick={() => setFilerOpen(true)}>
            Add them
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[0.15rem] border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>File</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No month has ended yet.
                </TableCell>
              </TableRow>
            ) : null}
            {shown.map((r) => {
              const error = errors[r.key];
              const working = busy === r.key;
              return (
                <Fragment key={r.key}>
                  <TableRow className={error ? "border-b-0" : undefined}>
                    <TableCell className="font-medium whitespace-nowrap">{r.periodLabel}</TableCell>
                    <TableCell className="whitespace-nowrap">{STATUS_LABEL[r.status]}</TableCell>
                    <TableCell className="max-w-56 truncate">
                      {r.fileName && r.id ? (
                        <a href={`/filings/${r.id}/download`} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                          <DownloadIcon className="size-3.5 shrink-0" />
                          <span className="truncate">{r.fileName}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {canManage ? (
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => openReview(r)}>
                            {working ? <LoaderIcon className="animate-spin" /> : null}
                            {working ? "Building…" : r.status === "draft" ? "Generate" : "View"}
                          </Button>
                          {r.status === "filed" ? (
                            <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => unmark(r)}>
                              Unmark
                            </Button>
                          ) : null}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                  {error ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-destructive pt-0 text-sm">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {canManage ? <FilerModal open={filerOpen} onClose={() => setFilerOpen(false)} initial={filer} /> : null}
      {review ? (
        <GeneratedModal
          key={`${review.result.summary.cycle}-${runs}`}
          open
          onClose={closeReview}
          result={review.result}
          readOnly={review.readOnly}
          download={downloadFormPrFiling}
        />
      ) : null}
    </div>
  );
}
