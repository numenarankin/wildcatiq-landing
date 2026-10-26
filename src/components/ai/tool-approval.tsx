"use client";

import { useEffect, useState } from "react";
import { CheckIcon, Volume2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UIMessage } from "@/lib/ai/sdk"; // landing: the AI SDK is not installed; type-only mirror
import {
  approvalRefs,
  describeApproval,
  describeOutcome,
  humanizeKey,
  type ApprovalView,
  type NameBook,
} from "@/lib/ai/approval-view";
import { approvalNames } from "@/lib/ai/approval-names";

export interface PendingApproval {
  id: string;
  name: string;
  input: unknown;
}

/** A write the user already answered, with what came of it. */
export interface SettledWrite {
  toolCallId: string;
  name: string;
  input: unknown;
  output: unknown;
  state: "output-available" | "output-error" | "output-denied";
}

type ToolPart = {
  type: string;
  state?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: { id: string; approved?: boolean };
};

/** Write-tool calls in a message awaiting the user's approve/deny. */
export function pendingApprovals(message: UIMessage): PendingApproval[] {
  const out: PendingApproval[] = [];
  for (const part of message.parts) {
    const p = part as ToolPart;
    if (p.type.startsWith("tool-") && p.state === "approval-requested" && p.approval) {
      out.push({ id: p.approval.id, name: p.type.slice("tool-".length), input: p.input });
    }
  }
  return out;
}

/**
 * Write-tool calls the user has answered and that have run (or been declined):
 * the same card then shows the outcome. Only calls that went through an approval
 * count; a read's result is not the user's to review.
 */
export function settledWrites(message: UIMessage): SettledWrite[] {
  const out: SettledWrite[] = [];
  for (const part of message.parts) {
    const p = part as ToolPart;
    if (!p.type.startsWith("tool-") || !p.approval || !p.toolCallId) continue;
    if (p.state !== "output-available" && p.state !== "output-error" && p.state !== "output-denied") continue;
    out.push({
      toolCallId: p.toolCallId,
      name: p.type.slice("tool-".length),
      input: p.input,
      output: p.state === "output-error" ? { ok: false, error: p.errorText } : p.output,
      state: p.state,
    });
  }
  return out;
}

/**
 * The names behind the ids a call carries, from the server, as the signed-in
 * user. `undefined` while loading, `null` when the lookup failed (the card then
 * renders with ids hidden, as it would without names).
 */
function useNameBook(name: string, input: unknown): NameBook | null | undefined {
  const [book, setBook] = useState<NameBook | null | undefined>(undefined);
  const refs = approvalRefs(name, input);
  const key = JSON.stringify(refs);
  useEffect(() => {
    if (key === "{}") return; // nothing to look up
    let live = true;
    approvalNames(JSON.parse(key) as Record<string, string[]>)
      .then((b) => live && setBook(b))
      .catch(() => live && setBook(null));
    return () => {
      live = false;
    };
  }, [key]);
  return key === "{}" ? {} : book;
}

/** The card read aloud: the title, then every row by name. */
export function readOutText(view: ApprovalView): string {
  const parts = [view.title];
  if (view.table) {
    const { rows, groups } = view.table;
    if (groups && groups.length > 1) {
      for (const g of groups) parts.push(`${g.label}: ${rows.slice(g.from, g.from + g.count).map((r) => r.join(", ")).join("; ")}`);
    } else {
      for (const r of rows) parts.push(r.join(", "));
    }
  } else {
    for (const f of view.fields) parts.push(`${f.label}: ${f.value}`);
  }
  return parts.join(". ");
}

function RowsTable({ table }: { table: NonNullable<ApprovalView["table"]> }) {
  const groups = table.groups && table.groups.length > 1 ? table.groups : null;
  const body = (rows: string[][], offset: number) =>
    rows.map((row, i) => (
      <tr key={offset + i} className="border-b border-border last:border-0">
        {row.map((cell, j) => (
          <td key={j} className="whitespace-nowrap px-2 py-1 text-primary-text">
            {cell}
          </td>
        ))}
      </tr>
    ));
  return (
    // Every row, scrolling: the wrong one is as likely to be the 200th as the first.
    <div className="mt-3 max-h-80 overflow-auto rounded-[0.15rem] border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0">
          <tr className="border-b border-border bg-background-subtle text-left text-tertiary-text">
            {table.columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-2 py-1 font-medium">
                {humanizeKey(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups
            ? groups.map((g) => (
                <GroupRows key={`${g.label}-${g.from}`} label={g.label} count={g.count} cols={table.columns.length}>
                  {body(table.rows.slice(g.from, g.from + g.count), g.from)}
                </GroupRows>
              ))
            : body(table.rows, 0)}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({
  label,
  count,
  cols,
  children,
}: {
  label: string;
  count: number;
  cols: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="border-b border-border bg-background-subtle/60">
        <td colSpan={Math.max(cols, 1)} className="px-2 py-1 font-medium text-primary-text">
          {label} <span className="text-tertiary-text">({count})</span>
        </td>
      </tr>
      {children}
    </>
  );
}

/** Approve / deny card for a single pending write-tool call. */
export function ApprovalCard({
  request,
  onApprove,
  onDeny,
  onReadOut,
}: {
  request: PendingApproval;
  onApprove: () => void;
  onDeny: () => void;
  /** Voice: speak the card. Given, a "Read them out" button appears. */
  onReadOut?: (text: string) => void;
}) {
  const book = useNameBook(request.name, request.input);
  const view = describeApproval(request.name, request.input, book ?? undefined);

  return (
    <div className="rounded-[0.15rem] border border-border bg-background p-3">
      <p className="ty-body-2 line-clamp-2 font-medium text-primary-text" title={view.title}>
        {view.title}
      </p>
      {view.summary && <p className="mt-0.5 text-xs text-secondary-text">{view.summary}</p>}
      <p className="mt-0.5 text-xs text-tertiary-text">Orion needs your OK before this is saved.</p>

      {view.fields.length > 0 && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          {view.fields.map((f, i) => (
            <div key={`${f.label}-${i}`} className="contents">
              <dt className="text-tertiary-text">{f.label}</dt>
              <dd className="text-primary-text break-words">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {view.table && view.table.columns.length > 0 && <RowsTable table={view.table} />}

      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" onClick={onApprove}>
          <CheckIcon />
          Approve
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDeny}>
          <XIcon />
          Deny
        </Button>
        {onReadOut && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onReadOut(readOutText(view))}>
            <Volume2Icon />
            Read them out
          </Button>
        )}
      </div>
    </div>
  );
}

/** The same card after the user answered: what was saved, or which rows were refused and why. */
export function OutcomeCard({ write }: { write: SettledWrite }) {
  const book = useNameBook(write.name, write.input);
  const outcome = describeOutcome(write.name, write.input, write.output, write.state, book ?? undefined);
  const refused = outcome.refused.length > 0;
  return (
    <div className="rounded-[0.15rem] border border-border bg-background p-3">
      <p className="ty-body-2 font-medium text-primary-text">{outcome.title}</p>
      {refused && (
        <div className="mt-2 max-h-80 overflow-auto rounded-[0.15rem] border border-border">
          <table className="w-full text-xs">
            <tbody>
              {outcome.refused.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-2 py-1 font-medium text-primary-text">{r.label}</td>
                  <td className="px-2 py-1 text-primary-text">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
