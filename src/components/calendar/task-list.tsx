"use client";

import { useState } from "react";
import { CalendarClockIcon, CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RowDeleteButton } from "@/components/row-delete-button";
import { formatDeadline } from "@/components/tasks/task-card";
import { TASK_PRIORITIES, type Task } from "@/lib/tasks/tasks";

/**
 * The overview's rows: soonest deadline first (undated last), then highest
 * priority. The order ignores status, so a task checked off stays where it was.
 *
 * Done tasks show while they are still current (due today or later) or were
 * checked off in this visit (`checked`); older ones live on the board, so the
 * list doesn't fill up with history.
 */
export function tasksInOrder(
  tasks: Task[],
  today: string,
  checked: ReadonlySet<string> = new Set(),
): Task[] {
  const rank = (task: Task) => TASK_PRIORITIES.indexOf(task.priority);
  return tasks
    .filter(
      (task) =>
        task.status !== "done" ||
        checked.has(task.id) ||
        (task.deadline !== undefined && task.deadline >= today),
    )
    .sort((a, b) => {
      if (a.deadline !== b.deadline) {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      return (
        (a.deadlineTime ?? "").localeCompare(b.deadlineTime ?? "") ||
        rank(b) - rank(a)
      );
    });
}

/** The overview's task column: one row per task, beside the month. */
export function TaskList({
  tasks,
  today,
  onOpen,
  onToggleDone,
  onDelete,
}: {
  tasks: Task[];
  today: string;
  onOpen: (task: Task) => void;
  /** Check a task off, or back on. */
  onToggleDone: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  // Checked off here, so the row stays put (greyed) rather than vanishing.
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set());
  const rows = tasksInOrder(tasks, today, checked);

  function toggle(task: Task) {
    if (task.status !== "done") {
      setChecked((prev) => new Set(prev).add(task.id));
    }
    onToggleDone(task);
  }

  return (
    <aside className="flex min-h-0 flex-1 flex-col border-t">
      <div className="border-b bg-muted/50 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Tasks
      </div>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto">
        {rows.map((task) => {
          const done = task.status === "done";
          return (
            <li
              key={task.id}
              onClick={() => onOpen(task)}
              className="group/row flex cursor-pointer items-center gap-3 px-3 py-3.5 hover:bg-muted/40"
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={`${done ? "Reopen" : "Complete"} ${task.title}`}
                // Stop the click/key from also opening the task editor.
                onClick={(event) => {
                  event.stopPropagation();
                  toggle(task);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                  done
                    ? "border-foreground bg-foreground text-background"
                    : "border-neutral-400 hover:bg-muted",
                )}
              >
                {done && <CheckIcon className="size-3.5" strokeWidth={3} />}
              </button>
              <div className={cn("min-w-0 flex-1", done && "opacity-60")}>
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    done
                      ? "text-muted-foreground line-through"
                      : "text-foreground",
                  )}
                >
                  {task.title}
                </p>
                {(task.deadline || task.assignee) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {task.deadline && (
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 tabular-nums",
                          !done && task.deadline < today && "text-destructive",
                        )}
                      >
                        <CalendarClockIcon className="size-3.5" />
                        {formatDeadline(task.deadline, task.deadlineTime)}
                      </span>
                    )}
                    {task.assignee && (
                      <span className="truncate">{task.assignee}</span>
                    )}
                  </div>
                )}
              </div>
              <RowDeleteButton
                label={`Delete ${task.title}`}
                icon={XIcon}
                onDelete={() => onDelete(task)}
                className="opacity-0 transition-[color,background-color,opacity] focus-visible:opacity-100 group-hover/row:opacity-100"
              />
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
