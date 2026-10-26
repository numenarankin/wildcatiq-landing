"use client";

/**
 * The whole filing, before it is filed.
 *
 * Everything the EDI file carries is on this screen and editable: the
 * Identifying Record at the top (the RRC validates the agent's user ID against
 * its own list, PR090), then every PR record with all fifty of its fields, and
 * the file itself as it will be uploaded. A volume with nothing in it shows
 * `0`, because that is what the file writes (the accepted golden file,
 * `write.ts`); a blank text field shows blank. Only a field an issue names is
 * flagged: the RRC requires the field and lease names (PR008/009), and the
 * rest of the text fields are legitimately empty on most records.
 *
 * Locked: a record's identity (district, RRC number, cycle), which is what
 * makes the record that record, and the retired gas code 4 column, which the
 * file writes as a space. In `readOnly` (a filed month) everything is locked
 * and Download hands back the stored file without a rebuild.
 *
 * landing: ported from the app's `src/components/reports/form-pr/generated-modal.tsx`.
 * The server actions are inert stand-ins, the downloads hand nothing to the
 * browser, and four optional props (`inline`, `inlineHeader` and the initial
 * open state of a record, the issues and the file) let a product screen show
 * the review in a given state. Each change is marked `landing:`.
 */

import { createContext, Fragment, useContext, useEffect, useState, useTransition } from "react";
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  LoaderIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SwipeUpModal } from "@/components/wells/swipe-up-modal";
import { cn } from "@/lib/utils";
import {
  downloadFormPr,
  generateFormPr,
  saveRrcFiler,
  type GeneratedFormPr,
} from "@/lib/rrc/form-pr/actions";
import { FIELD_GROUPS } from "@/lib/rrc/form-pr/sheet";
import { FLARE_CODES_FROM, PR_FIELDS, addCycles, type PrFieldKey, type PrHeader, type PrRecord } from "@/lib/rrc/form-pr/spec";
import { recordKey } from "@/lib/rrc/form-pr/record";
import { planExportFiles, recordWriteError } from "@/lib/rrc/form-pr/write";

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const num = new Intl.NumberFormat("en-US");

/** A record as an operator names it: the lease, then its RRC numbers. */
function nameOf(r: PrRecord, our = ""): string {
  const rrc = (r.leaseName as string) || "Unnamed lease";
  const lease = our ? `${rrc} (${our})` : rrc;
  const kind = r.leaseType === "G" ? "gas ID" : "oil lease";
  return `${lease} · District ${r.district}, ${kind} ${r.leaseOrGasId}`;
}

function bytesOf(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const sumOf = (r: PrRecord, kind: "liq" | "gas") =>
  PR_FIELDS.filter((f) => f.kind === "disp" && f.key.startsWith(kind)).reduce(
    (s, f) => s + ((r[f.key] as number | null) ?? 0),
    0
  );

const isEmpty = (v: unknown) => v === null || v === "" || v === undefined;

/**
 * The file as it stands with the records on screen: the same pure writer the
 * server uses, on the same records, so the preview IS the bytes Download will
 * hand out (a record the format cannot express is left out here as there).
 */
function previewFiles(cycle: string, header: GeneratedFormPr["header"], records: PrRecord[]) {
  const writable = records.filter((r) => !recordWriteError(r));
  const operators = [...new Set(writable.map((r) => r.operatorNo))];
  const h: Omit<PrHeader, "recordCount" | "currentProductionMonth"> = {
    delimiter: header.delimiter === "rcb" ? "rcb" : "tab",
    agentUserId: header.agentUserId,
    agentName: header.agentName,
    agentEmail: header.agentEmail,
    agentPhone: header.agentPhone,
  };
  return planExportFiles(h, writable, {
    cycle,
    // Header item 7 came from the server's build; a non-current cycle only
    // needs to differ from `cycle` here.
    currentCycle: header.currentProductionMonth ? cycle : addCycles(cycle, 1),
    operatorLabel: operators.length === 1 ? operators[0] : "multi",
  });
}

interface Flag {
  level: "block" | "warn";
  messages: string[];
}

/**
 * landing: the presses a scripted demo makes in this modal for the reader,
 * through the same handlers a click uses: Download (the EDI file), Close, and
 * a keystroke in one record's field (`edit`, the value the field holds after
 * it). A new `edit` object is a new keystroke.
 */
export type FormPrScript =
  | "download"
  | "close"
  | { edit: { at: number; field: PrFieldKey; value: string } }
  | null;
export const FormPrScriptContext = createContext<FormPrScript>(null);

/** Mounted per generate (the panel keys it), so a fresh build starts clean. */
export function GeneratedModal({
  open,
  onClose,
  result,
  readOnly = false,
  download: downloadAction = downloadFormPr,
  // landing: render in place and open on a given state.
  inline = false,
  inlineHeader = false,
  initialExpanded = null,
  initialIssuesOpen = false,
  initialFileOpen = false,
}: {
  open: boolean;
  onClose: () => void;
  result: GeneratedFormPr;
  /** A filed month: nothing edits, Download hands back the stored file. */
  readOnly?: boolean;
  /** The generate step. The Filings page passes the one that also stores the file on its row. */
  download?: (cycle: string, edited: PrRecord[]) => Promise<{ result?: GeneratedFormPr; error?: string }>;
  // landing: see the header comment.
  inline?: boolean;
  inlineHeader?: boolean;
  initialExpanded?: number | null;
  initialIssuesOpen?: boolean;
  initialFileOpen?: boolean;
}) {
  const [current, setCurrent] = useState<GeneratedFormPr>(result);
  const [records, setRecords] = useState<PrRecord[]>(result.records);
  const [filer, setFiler] = useState(result.header);
  const [expanded, setExpanded] = useState<number | null>(initialExpanded);
  const [issuesOpen, setIssuesOpen] = useState(initialIssuesOpen);
  const [fileOpen, setFileOpen] = useState(initialFileOpen);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const { summary, issues, files, localNames } = current;
  /** What the operator calls this record's lease(s), if it is not the RRC's name. */
  const ourName = (r: PrRecord): string => {
    const our = localNames[recordKey({ ...r, comminglePermitNo: "" })] ?? "";
    return our && our.toLowerCase() !== ((r.leaseName as string) || "").trim().toLowerCase() ? our : "";
  };
  const blocks = issues.filter((i) => i.level === "block");
  const edited = !readOnly && JSON.stringify(records) !== JSON.stringify(current.records);
  /** Gas code 4 was retired 2021-09 (spec:25-38): locked and blank from then on. */
  const code4Retired = summary.cycle >= FLARE_CODES_FROM;
  const preview = readOnly ? files : previewFiles(summary.cycle, filer, records);

  /**
   * The issues to mark on one control.
   *
   * A flag goes on whatever MAKES IT GO AWAY, not on the field it is about.
   * Gas with nowhere to go is marked on the two disposition columns the
   * operator chooses between, not on the production it was measured as; a
   * battery serving two records is marked on the picker that moves it, not on
   * the storage figure it left behind.
   */
  const RESOLVED_BY: Record<string, PrFieldKey[] | "record"> = {
    GASTAKE: ["gasDisp2", "gasDisp3"],
    TANK: "record",
  };

  function flagOf(key: string | null, control: PrFieldKey | "record"): Flag | null {
    const hits = issues.filter((i) => {
      if (i.recordKey !== key) return false;
      const where = RESOLVED_BY[i.rule];
      if (where) return where === "record" ? control === "record" : where.includes(control as PrFieldKey);
      return i.field === control;
    });
    if (hits.length === 0) return null;
    return {
      level: hits.some((i) => i.level === "block") ? "block" : "warn",
      messages: hits.map((i) => i.message),
    };
  }

  function setField(at: number, field: PrFieldKey, raw: string) {
    setRecords((rows) =>
      rows.map((r, i) => {
        if (i !== at) return r;
        const def = PR_FIELDS.find((f) => f.key === field)!;
        if (def.kind === "vol" || def.kind === "disp") {
          if (raw.trim() === "") return { ...r, [field]: null } as PrRecord;
          const n = Number(raw);
          return Number.isFinite(n) ? ({ ...r, [field]: n } as PrRecord) : r;
        }
        if (def.kind === "yn") return { ...r, [field]: raw === "Y" } as PrRecord;
        return { ...r, [field]: raw } as PrRecord;
      })
    );
  }

  /**
   * Report a record's production under another one: its volumes are added to
   * the target and it leaves the file. This is how a well flowing to a battery
   * on another lease is filed, and it is a change to THIS file only, nothing in
   * the ledger. Generating the month again brings it back.
   */
  function moveInto(from_: number, to: number) {
    setRecords((rows) => {
      const from = rows[from_];
      if (!from) return rows;
      return rows
        .map((r, i) => {
          if (i !== to) return r;
          const merged = { ...r } as PrRecord;
          for (const f of PR_FIELDS) {
            if (f.kind !== "vol" && f.kind !== "disp") continue;
            const a = (r[f.key] as number | null) ?? 0;
            const b = (from[f.key] as number | null) ?? 0;
            if (a === 0 && b === 0 && f.kind === "disp" && r[f.key] == null && from[f.key] == null) continue;
            (merged as Record<string, unknown>)[f.key] = a + b;
          }
          return merged;
        })
        .filter((_, i) => i !== from_);
    });
    setExpanded(null);
  }

  /** The filer lives on the org, so it saves where it is typed and the month is
   *  rebuilt, keeping the header on screen and the header in the file the same. */
  function saveFiler() {
    setError(null);
    start(async () => {
      const res = await saveRrcFiler({
        agentUserId: filer.agentUserId,
        agentName: filer.agentName,
        agentEmail: filer.agentEmail,
        agentPhone: filer.agentPhone,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      const fresh = await generateFormPr(summary.cycle);
      if (fresh.result) {
        setCurrent(fresh.result);
        setFiler(fresh.result.header);
      }
    });
  }

  type Format = "pdf" | "edi" | "sheet";
  const FORMATS: { format: Format; label: string }[] = [
    { format: "pdf", label: "PDF" },
    { format: "edi", label: "EDI" },
    { format: "sheet", label: "Spreadsheet" },
  ];

  /** Hand the browser one takeaway of a generated month. */
  // landing: the app hands the browser the EDI, PDF or workbook here; the
  // landing has no file to hand out.
  function handOut(what: Format, g: GeneratedFormPr) {
    void what;
    void g;
    void bytesOf;
  }

  const script = useContext(FormPrScriptContext);
  useEffect(() => {
    if (script === "download" && !pending) download("edi");
    if (script === "close") onClose();
    // landing: the field's own onChange handler, with the typed value.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a scripted keystroke, one per step
    if (script && typeof script === "object") setField(script.edit.at, script.edit.field, script.edit.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on the script step only
  }, [script]);

  function download(what: Format) {
    setError(null);
    if (readOnly) {
      // The stored month, as handed out; nothing is rebuilt.
      handOut(what, current);
      return;
    }
    start(async () => {
      // Rebuilt server-side with the edits in place, so the file, the form and
      // the spreadsheet are written from the same records and the month is
      // re-checked before it goes out. This is the generate step.
      const res = await downloadAction(summary.cycle, records);
      if (res.error || !res.result) {
        console.error(`[form-pr] download failed for ${summary.cycle}:`, res.error);
        setError(res.error ?? "The file could not be built.");
        return;
      }
      setCurrent(res.result);
      setRecords(res.result.records);
      setFiler(res.result.header);
      handOut(what, res.result);
    });
  }

  return (
    <SwipeUpModal open={open} onClose={onClose} title={`Form PR ${summary.month}`}
      className="max-w-[92rem]"
      inline={inline}
      inlineHeader={inlineHeader}
    >
      {/* The card is a flex column with `overflow-hidden`, so the body has to be
          the scroller: without `min-h-0` + `overflow-y-auto` a long table
          overflows the card and its bottom padding is clipped away. */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-5 pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Operator</dt>
              <dd className="font-medium tabular-nums">{summary.operator || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Records</dt>
              <dd className="font-medium tabular-nums">{summary.recordCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Due</dt>
              <dd className="font-medium tabular-nums">
                {dateFmt.format(new Date(`${summary.due}T00:00:00Z`))}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">File</dt>
              <dd className="font-medium">{files.map((f) => f.name).join(", ")}</dd>
            </div>
          </dl>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button size="lg" className="bg-black text-white hover:bg-neutral-800" disabled={pending} />}
            >
              {pending ? <LoaderIcon className="animate-spin" /> : <DownloadIcon />}
              {pending ? "Building…" : edited ? "Download with edits" : "Download"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {FORMATS.map(({ format, label }) => (
                <DropdownMenuItem key={format} className="cursor-pointer" onClick={() => download(format)}>
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <section className="rounded-[0.15rem] border px-4 py-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stacked
              label="Agent user ID"
              value={filer.agentUserId}
              missing={isEmpty(filer.agentUserId)}
              max={9}
              onChange={(v) => setFiler({ ...filer, agentUserId: v })}
              onCommit={saveFiler}
              readOnly={readOnly}
            />
            <Stacked
              label="Agent name"
              value={filer.agentName}
              missing={isEmpty(filer.agentName)}
              max={50}
              onChange={(v) => setFiler({ ...filer, agentName: v })}
              onCommit={saveFiler}
              readOnly={readOnly}
            />
            <Stacked
              label="Agent e-mail"
              value={filer.agentEmail}
              missing={!filer.agentEmail.includes("@")}
              max={50}
              onChange={(v) => setFiler({ ...filer, agentEmail: v })}
              onCommit={saveFiler}
              readOnly={readOnly}
            />
            <Stacked
              label="Agent phone"
              value={filer.agentPhone}
              missing={filer.agentPhone.replace(/\D/g, "").length !== 10}
              max={10}
              onChange={(v) => setFiler({ ...filer, agentPhone: v })}
              onCommit={saveFiler}
              readOnly={readOnly}
            />
            <Stacked label="Records" value={String(summary.recordCount)} readOnly numeric />
            <Stacked label="Current month" value={filer.currentProductionMonth ? "Y" : "N"} readOnly />
          </div>
        </section>

        {issues.length > 0 ? (
          <section className="rounded-[0.15rem] border">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium"
              onClick={() => setIssuesOpen((v) => !v)}
            >
              {issuesOpen ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
              <AlertTriangleIcon className={blocks.length ? "text-destructive size-4" : "size-4 text-amber-500"} />
              {blocks.length > 0
                ? `${blocks.length} ${blocks.length === 1 ? "thing" : "things"} the RRC will reject`
                : `${issues.length} ${issues.length === 1 ? "note" : "notes"}`}
            </button>
            {issuesOpen ? (
              <ul className="divide-y border-t text-sm">
                {issues.map((i, n) => (
                  <li key={n} className="flex items-start gap-2 px-4 py-2">
                    <AlertTriangleIcon
                      className={
                        i.level === "block"
                          ? "text-destructive mt-0.5 size-3.5 shrink-0"
                          : "mt-0.5 size-3.5 shrink-0 text-amber-500"
                      }
                    />
                    <span className={i.level === "block" ? undefined : "text-muted-foreground"}>{i.message}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-[0.15rem] border">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium"
            onClick={() => setFileOpen((v) => !v)}
          >
            {fileOpen ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
            File
            <span className="text-muted-foreground font-normal">
              {preview.map((f) => f.name).join(", ")}
              {edited ? " · with edits" : ""}
            </span>
          </button>
          {fileOpen ? (
            <div className="divide-y border-t">
              {preview.map((f) => (
                <FileText key={f.name} name={f.name} text={f.text} many={preview.length > 1} />
              ))}
            </div>
          ) : null}
        </section>

        {/* No overflow of its own: `overflow-x-auto` computes overflow-y to
            auto as well, which put a second scrollbar inside the table. The
            modal body is the only scroller; `shrink-0` keeps this at its full
            height inside it. */}
        <div className="shrink-0 rounded-[0.15rem] border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-0" />
                <TableHead>Record</TableHead>
                <TableHead>Lease</TableHead>
                <TableHead className="text-right">Oil produced</TableHead>
                <TableHead className="text-right">Oil disposed</TableHead>
                <TableHead className="text-right">In tanks</TableHead>
                <TableHead className="text-right">Gas produced</TableHead>
                <TableHead className="text-right">Gas disposed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r, at) => {
                const key = recordKey(r);
                const isOpen = expanded === at;
                const rowIssues = issues.filter((i) => i.recordKey === key);
                return (
                  <Fragment key={at}>
                    <TableRow className={isOpen ? "border-b-0" : undefined}>
                      <TableCell className="w-0 pr-0">
                        <button
                          type="button"
                          aria-label={isOpen ? "Hide every field" : "Show every field"}
                          // Inline elements sit on the text baseline; the caret
                          // has to centre on the row like every other cell.
                          className="text-muted-foreground hover:text-foreground flex items-center"
                          onClick={() => setExpanded(isOpen ? null : at)}
                        >
                          {isOpen ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {rowIssues.length > 0 ? (
                            <FlagMark
                              flag={{
                                level: rowIssues.some((i) => i.level === "block") ? "block" : "warn",
                                messages: rowIssues.map((i) => i.message),
                              }}
                            />
                          ) : null}
                          {key}
                          {r.corrected ? <span className="text-muted-foreground">· corrected</span> : null}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isEmpty(r.leaseName) ? (
                          <span className="text-muted-foreground/70">empty</span>
                        ) : (
                          (r.leaseName as string)
                        )}
                        {ourName(r) ? (
                          <span className="text-muted-foreground"> ({ourName(r)})</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <NumberCell
                          value={r.liqProduction as number | null}
                          flag={flagOf(key, "liqProduction")}
                          onChange={(v) => setField(at, "liqProduction", v)}
                          readOnly={readOnly}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {num.format(sumOf(r, "liq"))}
                      </TableCell>
                      <TableCell className="text-right">
                        <NumberCell
                          value={r.liqEndingStorage as number | null}
                          flag={flagOf(key, "liqEndingStorage")}
                          onChange={(v) => setField(at, "liqEndingStorage", v)}
                          readOnly={readOnly}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumberCell
                          value={r.gasProduction as number | null}
                          flag={flagOf(key, "gasProduction")}
                          onChange={(v) => setField(at, "gasProduction", v)}
                          readOnly={readOnly}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {num.format(sumOf(r, "gas"))}
                      </TableCell>
                    </TableRow>
                    {isOpen ? (
                      <TableRow>
                        <TableCell colSpan={8} className="pt-2 pb-5">
                          <div className="flex flex-col gap-5">
                            {readOnly ? null : (
                            <div className="mb-[-0.5rem] flex flex-wrap items-center gap-3 text-sm">
                              <span className="flex shrink-0 items-center gap-1.5">
                                <FlagMark flag={flagOf(key, "record")} />
                                Report this production under
                              </span>
                              <Select
                                value={String(at)}
                                onValueChange={(v) => v && Number(v) !== at && moveInto(at, Number(v))}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-8 w-full min-w-72 sm:w-auto sm:min-w-[28rem]",
                                    ringFor(flagOf(key, "record"))
                                  )}
                                >
                                  {/* This Select hands the raw VALUE to its
                                      child; the index is not what to show. */}
                                  <SelectValue>
                                    {(v) => {
                                      const t = records[Number(v)] ?? r;
                                      return nameOf(t, ourName(t));
                                    }}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {records.map((o, i) => (
                                    <SelectItem key={i} value={String(i)}>
                                      {nameOf(o, ourName(o))}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            )}
                            {FIELD_GROUPS.map((g) => (
                              <div key={g.title} className="flex flex-col gap-3">
                                <h4 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                  {g.title}
                                </h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                                  {g.keys.map((k) => {
                                    const def = PR_FIELDS.find((f) => f.key === k)!;
                                    const v = r[k];
                                    if (def.kind === "yn") {
                                      return (
                                        <div key={k} className="flex min-w-0 flex-col gap-1">
                                          <span className="text-muted-foreground truncate text-xs">{def.label}</span>
                                          <Select
                                            value={v ? "Y" : "N"}
                                            onValueChange={(val) => val && setField(at, k, val)}
                                            disabled={readOnly}
                                          >
                                            <SelectTrigger className="h-8 w-full">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="N">N</SelectItem>
                                              <SelectItem value="Y">Y</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      );
                                    }
                                    const volume = def.kind === "vol" || def.kind === "disp";
                                    const locked = readOnly || def.kind === "lit" || (k === "gasDisp4" && code4Retired);
                                    return (
                                      <Stacked
                                        key={k}
                                        // A name or a remark needs room to be
                                        // read; a volume or a code does not.
                                        className={def.max >= 20 ? "sm:col-span-2" : undefined}
                                        label={def.label}
                                        value={
                                          def.kind === "lit" ? "PR"
                                          : k === "gasDisp4" && code4Retired ? ""
                                          : v == null ? (volume ? "0" : "")
                                          : String(v)
                                        }
                                        max={def.max}
                                        numeric={volume}
                                        readOnly={locked}
                                        flag={flagOf(key, k)}
                                        onChange={(val) => setField(at, k, val)}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </SwipeUpModal>
  );
}

/** The mark beside a flagged field; hovering it says what is wrong. */
function FlagMark({ flag }: { flag: Flag | null | undefined }) {
  if (!flag) return null;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <AlertTriangleIcon
            className={cn("size-3.5 shrink-0", flag.level === "block" ? "text-destructive" : "text-amber-500")}
          />
        }
      />
      <TooltipContent className="max-w-80">
        {flag.messages.map((m, n) => (
          <p key={n}>{m}</p>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}

/** Label over input, for the header row where horizontal space is what there is. */
function Stacked({
  label,
  value,
  onChange,
  onCommit,
  max,
  numeric,
  readOnly,
  missing,
  flag,
  className,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onCommit?: () => void;
  max?: number;
  numeric?: boolean;
  readOnly?: boolean;
  missing?: boolean;
  flag?: Flag | null;
  className?: string;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span
        className={cn(
          "text-muted-foreground flex items-center gap-1 truncate text-xs",
          readOnly && "opacity-70"
        )}
      >
        <FlagMark flag={flag} />
        {label}
      </span>
      <Input
        className={cn("h-8 w-full", numeric && "tabular-nums", ringFor(flag, missing))}
        inputMode={numeric ? "numeric" : "text"}
        maxLength={max}
        readOnly={readOnly}
        disabled={readOnly}
        placeholder={missing ? "empty" : undefined}
        title={flag?.messages.join("\n")}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => onCommit?.()}
      />
    </label>
  );
}

function ringFor(flag: Flag | null | undefined, missing?: boolean) {
  if (flag?.level === "block") return "ring-destructive/60 ring-1 ring-inset";
  if (flag?.level === "warn") return "ring-1 ring-inset ring-amber-500/60";
  if (missing) return "ring-muted-foreground/25 ring-1 ring-inset";
  return "";
}

function NumberCell({
  value,
  onChange,
  flag,
  readOnly,
}: {
  value: number | null;
  onChange: (raw: string) => void;
  flag?: Flag | null;
  readOnly?: boolean;
}) {
  return (
    <Input
      className={cn("ml-auto h-8 w-24 text-right tabular-nums", ringFor(flag))}
      inputMode="numeric"
      readOnly={readOnly}
      disabled={readOnly}
      title={flag?.messages.join("\n")}
      // An empty volume is written `0`, so it reads `0`.
      value={value == null ? "0" : String(value)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * One file of the export, line for line as it will be uploaded. Tabs are shown
 * as a mark so an empty field is visible; CRLF is the line break.
 */
function FileText({ name, text, many }: { name: string; text: string; many: boolean }) {
  const lines = text.split("\r\n").filter((l) => l.length > 0);
  return (
    <div className="px-4 py-3">
      {many ? <div className="text-muted-foreground mb-2 text-xs">{name}</div> : null}
      <pre className="overflow-x-auto font-mono text-xs leading-5 whitespace-pre">
        {lines.map((line, n) => (
          <div key={n}>
            {line.split("\t").map((cell, i, all) => (
              <Fragment key={i}>
                {cell}
                {i < all.length - 1 ? <span className="text-muted-foreground/50">⇥</span> : null}
              </Fragment>
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}
