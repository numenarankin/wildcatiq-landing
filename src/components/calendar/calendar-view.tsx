"use client";

/**
 * landing: the app's calendar-view.tsx (the /agenda page), rendered with its
 * own classes and fed `agenda-fixture.ts`. Not ported: the event and task
 * modals (a click on a chip or a task opens nothing), the server actions and
 * refresh behind each write (a check-off or delete changes local state only),
 * and react-resizable-panels (the overview's month/tasks split is drawn at
 * its default 320px tasks column, not draggable).
 */
import { useMemo, useRef, useState } from "react";
import { useServerState } from "@/hooks/use-server-state";
import { addDays, addMonths, fromISO, toISO } from "@/lib/calendar/dates";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import {
  AssigneeFilter,
  assigneeOptions,
  isVisible,
} from "@/components/calendar/assignee-filter";
import { MonthGrid } from "@/components/calendar/month-grid";
import { WeekGrid } from "@/components/calendar/week-grid";
import { TaskList } from "@/components/calendar/task-list";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Task, TaskStatus } from "@/lib/tasks/tasks";
import type { CalendarEvent } from "@/lib/calendar/calendar";
import { taskDeadlineEvents } from "@/lib/calendar/task-deadlines";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "overview" | "month" | "week" | "board";

/**
 * What the confirm dialog is about to remove. A calendar entry flagged with a
 * `taskId` is a task deadline rather than a `calendar_events` row, so it is
 * resolved to its task up front and deleted as one.
 */
type PendingDelete =
  | { kind: "event"; event: CalendarEvent }
  | { kind: "task"; id: string; title: string; folderId?: string };

/** A task's deadline entry swapped for its new one (or none, when deleted). */
function withTaskDeadline(
  events: CalendarEvent[],
  taskId: string,
  task: Task | null,
): CalendarEvent[] {
  return [
    ...events.filter((e) => e.taskId !== taskId),
    ...(task ? taskDeadlineEvents([task]) : []),
  ];
}

export function CalendarView({
  today,
  events: serverEvents,
  tasks: serverTasks,
  assignees,
  viewer,
  initialView = "overview",
}: {
  today: string;
  events: CalendarEvent[];
  /** All tasks, so a clicked task deadline can open its editor in place. */
  tasks: Task[];
  /** Assignable people for the task modal (org members). */
  assignees: string[];
  /** The signed-in person's name, so a task assigned "Me" resolves to them. */
  viewer?: string;
  /** Which view to open on (e.g. "board" via a task deep-link). */
  initialView?: CalendarViewMode;
}) {
  // Entries land, move and vanish the moment the modal closes; the refresh after
  // each write hands both lists back to the server, which also undoes a failure.
  const [events, setEvents] = useServerState(serverEvents);
  const [tasks, setTasks] = useServerState(serverTasks);
  const [view, setView] = useState<CalendarViewMode>(initialView);
  const [cursorISO, setCursorISO] = useState(today);
  const [deleting, setDeleting] = useState<PendingDelete | null>(null);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const cursor = useMemo(() => fromISO(cursorISO), [cursorISO]);

  // Who can be filtered on - see `assigneeOptions`.
  const filterOptions = useMemo(
    () =>
      assigneeOptions(
        assignees,
        tasks.map((task) => task.assignee),
        viewer,
      ),
    [assignees, tasks, viewer],
  );

  const visibleTasks = useMemo(
    () => tasks.filter((task) => isVisible(hidden, task.assignee, viewer)),
    [tasks, hidden, viewer],
  );

  /*
   * The filter reaches the month and week grids too, via the SAME task list the
   * board renders. A task deadline on the calendar IS a task, so filtering it
   * out of one view and not the other would put two views of one set of tasks
   * visibly at odds. Real calendar events are untouched: they are not tasks and
   * the control does not claim to filter them.
   */
  const visibleEvents = useMemo(() => {
    if (hidden.size === 0) return events;
    const shownTaskIds = new Set(visibleTasks.map((t) => t.id));
    return events.filter((e) => !e.taskId || shownTaskIds.has(e.taskId));
  }, [events, visibleTasks, hidden]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of visibleEvents) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          Number(b.allDay) - Number(a.allDay) ||
          (a.start ?? "").localeCompare(b.start ?? ""),
      );
    }
    return map;
  }, [visibleEvents]);

  function navigate(delta: number) {
    setCursorISO((iso) => {
      const date = fromISO(iso);
      return view === "week"
        ? toISO(addDays(date, delta * 7))
        : toISO(addMonths(date, delta));
    });
  }

  function handleEventClick(event: CalendarEvent) {
    // A task deadline opens the task editor in place (there's no calendar_events
    // row to edit). Fall back to the board only if the task isn't loaded here.
    if (event.taskId) {
      // landing: the task editor is not ported, so this goes nowhere.
      const task = tasks.find((t) => t.id === event.taskId);
      if (!task) setView("board");
      return;
    }
    // landing: the app opens the event modal here.
  }

  /** Resolve a clicked calendar entry to the thing that actually gets deleted. */
  function toPendingDelete(event: CalendarEvent): PendingDelete {
    if (!event.taskId) return { kind: "event", event };
    // A task deadline whose task isn't loaded here still has an id, which is
    // all `deleteTask` needs; the folder tag only steers revalidation.
    const task = tasks.find((t) => t.id === event.taskId);
    return {
      kind: "task",
      id: event.taskId,
      title: task?.title ?? event.title,
      folderId: task?.folderId,
    };
  }

  // landing: the app persists each write and refreshes; here the local
  // change is the whole of it.
  function handleConfirmDelete() {
    const target = deleting;
    if (!target) return;
    if (target.kind === "task") {
      setTasks((prev) => prev.filter((t) => t.id !== target.id));
      setEvents((prev) => withTaskDeadline(prev, target.id, null));
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== target.event.id));
    }
  }

  // The column a task was checked off from, so unchecking puts it back there.
  const statusBeforeDone = useRef(new Map<string, TaskStatus>());

  function handleToggleDone(task: Task) {
    const status: TaskStatus =
      task.status === "done"
        ? (statusBeforeDone.current.get(task.id) ?? "planned")
        : "done";
    if (status === "done") statusBeforeDone.current.set(task.id, task.status);
    const saved: Task = { ...task, status };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? saved : t)));
    setEvents((prev) => withTaskDeadline(prev, task.id, saved));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CalendarToolbar
        view={view}
        onView={setView}
        cursor={cursor}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onNewTask={() => {}}
        onNewEvent={() => {}}
        filter={
          <AssigneeFilter
            options={filterOptions}
            hidden={hidden}
            viewer={viewer}
            onChange={setHidden}
          />
        }
      />
      {view === "board" ? (
        // The exact tasks-page board, embedded (its own add/edit modals + DnD).
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-8">
          <TasksBoard
            tasks={visibleTasks}
            assignees={assignees}
            embedded
            hideHeader
          />
        </div>
      ) : view === "overview" ? (
        // landing: plain flex boxes stand in for the app's Group / Panel /
        // Separator at their default layout.
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <MonthGrid
              cursor={cursor}
              today={today}
              eventsByDate={eventsByDate}
              onEventClick={handleEventClick}
              onEventDelete={(event) => setDeleting(toPendingDelete(event))}
            />
          </div>
          {/* Same divider as the project workspace's panels. */}
          <div
            className={cn(
              "w-1 shrink-0 cursor-col-resize bg-border/60 transition-colors",
              "hover:bg-data-accent/50 data-[state=dragging]:bg-data-accent/70",
            )}
          />
          <div className="flex w-[320px] min-w-0 shrink-0 flex-col">
            <TaskList
              tasks={visibleTasks}
              today={today}
              onOpen={() => {}}
              onToggleDone={handleToggleDone}
              onDelete={(task) =>
                setDeleting({
                  kind: "task",
                  id: task.id,
                  title: task.title,
                  folderId: task.folderId,
                })
              }
            />
          </div>
        </div>
      ) : view === "month" ? (
        <MonthGrid
          cursor={cursor}
          today={today}
          eventsByDate={eventsByDate}
          onEventClick={handleEventClick}
          onEventDelete={(event) => setDeleting(toPendingDelete(event))}
        />
      ) : (
        <WeekGrid
          cursor={cursor}
          today={today}
          eventsByDate={eventsByDate}
          onEventClick={handleEventClick}
          onEventDelete={(event) => setDeleting(toPendingDelete(event))}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
        title={
          deleting
            ? `Delete ${deleting.kind === "task" ? deleting.title : deleting.event.title}?`
            : "Delete?"
        }
        description={
          deleting?.kind === "task"
            ? "This permanently removes the task, not just its deadline. This can't be undone."
            : "This permanently removes the event. This can't be undone."
        }
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
