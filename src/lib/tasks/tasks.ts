/**
 * landing: the app's lib/tasks/tasks.ts without `getTasks` (a Supabase
 * read); the demos hand the board `agenda-fixture.ts` instead.
 */

/** The kanban columns on the Tasks page, in board order. */
export type TaskStatus = "planned" | "priority" | "doing" | "done";

export type TaskPriority = "Low" | "Medium" | "High";

/** A single work item on the Tasks kanban board. */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Person responsible, free-form (e.g. "J. Hale"). */
  assignee?: string;
  /** Due date as an ISO `YYYY-MM-DD` string, if the task has a deadline. */
  deadline?: string;
  /** Optional due time as a 24-hour `HH:MM` string (only meaningful with `deadline`). */
  deadlineTime?: string;
  /** Project this task belongs to (a folder id), if tagged to one. */
  folderId?: string;
  /** Budgeted amount in USD. A task with a budget set is a project budget line. */
  budget?: number;
  /** Amount spent so far in USD. */
  spend?: number;
}

export interface TaskColumn {
  status: TaskStatus;
  label: string;
}

/**
 * Column definitions, left-to-right.
 *
 * The labels are what the board shows; the `status` values are what is stored,
 * and they keep their original spelling so no row has to be rewritten and
 * nothing that already filters on `planned` or `priority` - the AI task tools,
 * saved links - breaks. Read them as the pair they are: `planned` IS Backlog,
 * `priority` IS Queue.
 */
export const TASK_COLUMNS: TaskColumn[] = [
  { status: "planned", label: "Backlog" },
  { status: "priority", label: "Queue" },
  { status: "doing", label: "Doing" },
  { status: "done", label: "Done" },
];

export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];

/** Sentinel shown in the assignee dropdown for an unassigned task. */
export const UNASSIGNED = "Unassigned";

/**
 * Flatten a rich-text (HTML) description into a single line of plain text for
 * card previews. Returns "" for empty / whitespace-only bodies (including the
 * editor's empty "<p></p>").
 */
export function descriptionPreview(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

