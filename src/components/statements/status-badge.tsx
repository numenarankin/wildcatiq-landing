import { cn } from "@/lib/utils";
import type { StatementStatus } from "@/lib/statements/statements";

/** Human labels for the statement lifecycle. */
export const STATUS_LABEL: Record<StatementStatus, string> = {
  received: "Received",
  extracted: "Extracted",
  reviewed: "Reviewed",
};

const STATUS_CLS: Record<StatementStatus, string> = {
  received: "bg-muted text-muted-foreground",
  extracted: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  // Terminal: a reviewed statement is in the ledger.
  reviewed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

/** A small pill showing where a statement sits in its lifecycle. */
export function StatusBadge({ status }: { status: StatementStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-wider",
        STATUS_CLS[status]
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
