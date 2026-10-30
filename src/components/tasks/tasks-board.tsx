"use client";

/**
 * landing: the app's tasks-board.tsx, rendered with its own classes. Not
 * ported: react-dnd (the app wraps the columns in a `DndProvider`), the
 * add/edit `TaskModal`, and the server actions and refresh behind each write.
 * A move or delete here changes the local list only.
 */
import { useCallback, useState } from "react";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TaskColumn } from "@/components/tasks/task-column";
import { useServerState } from "@/hooks/use-server-state";
import { TASK_COLUMNS, type Task, type TaskStatus } from "@/lib/tasks/tasks";

export function TasksBoard({
  tasks: initial,
  assignees,
  folderId,
  embedded = false,
  hideHeader = false,
  addOpen: addOpenProp,
  onAddOpenChange,
}: {
  tasks: Task[];
  assignees: string[];
  /** When set, new tasks are tagged to this project (folder). */
  folderId?: string;
  /** Embedded in the project page: drop the page title (the tab menu owns it). */
  embedded?: boolean;
  /** Drop the header row entirely (title + add button) - the host provides its
   * own add control, e.g. the calendar toolbar's "New Task". */
  hideHeader?: boolean;
  /** Controlled add-task modal, for a host with its own add button (the project
   * toolbar's "New Task"). Left uncontrolled, the board owns the state. */
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
}) {
  // Cards move the moment they're dragged or typed; the refresh that follows
  // each write hands the list back to the server.
  const [tasks, setTasks] = useServerState<Task[]>(initial);
  const [addOpenState, setAddOpenState] = useState(false);
  // landing: no TaskModal; the add control is drawn and opens nothing.
  void addOpenProp;
  void addOpenState;
  void folderId;
  void assignees;
  const setAddOpen = onAddOpenChange ?? setAddOpenState;
  const [deleting, setDeleting] = useState<Task | null>(null);

  const handleDropTask = useCallback(
    (taskId: string, status: TaskStatus) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    },
    // `setTasks` is a `useState` setter passed through `useServerState`, so it is
    // stable; it is listed because the lint can't see that through a custom hook.
    [setTasks]
  );

  // landing: the app opens the task in its edit modal.
  const handleOpenTask = useCallback((task: Task) => void task, []);
  const handleDeleteTask = useCallback((task: Task) => setDeleting(task), []);

  function handleConfirmDelete() {
    const task = deleting;
    if (!task) return;
    // Drop the card immediately, then persist. On failure the refresh re-fetches
    // the true list, so a task that survived on the server comes back.
    // landing: nothing to persist.
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      {!hideHeader && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-4",
            embedded ? "justify-end" : "justify-between"
          )}
        >
          {!embedded && (
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Tasks
            </h1>
          )}
          <Button size="lg" onClick={() => setAddOpen(true)}>
            <PlusIcon />
            Task
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
        {TASK_COLUMNS.map((column) => (
          <TaskColumn
            key={column.status}
            column={column}
            tasks={tasks.filter((t) => t.status === column.status)}
            onDropTask={handleDropTask}
            onOpenTask={handleOpenTask}
            onDeleteTask={handleDeleteTask}
          />
        ))}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title={deleting ? `Delete ${deleting.title}?` : "Delete?"}
        description="This permanently removes the task. This can't be undone."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
