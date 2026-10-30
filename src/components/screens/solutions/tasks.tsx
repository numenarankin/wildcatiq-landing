"use client";

/**
 * The Tasks board on /agenda (`CalendarView` on its Tasks tab), fed
 * `agenda-fixture.ts`: Backlog, Queue, Doing and Done across the owner, the
 * pumper and the office.
 */
import { CalendarView } from "@/components/calendar/calendar-view";
import { AppFrame } from "@/components/screens/app-frame";
import {
  AGENDA_MEMBERS,
  AGENDA_VIEWER,
  FIXTURE_TODAY,
  agendaEvents,
  agendaTasks,
} from "@/lib/screens/agenda-fixture";

export function TasksScreen() {
  return (
    <AppFrame path="/agenda" crumbs={["Agenda"]} fullBleed>
      <CalendarView
        today={FIXTURE_TODAY}
        events={agendaEvents()}
        tasks={agendaTasks()}
        assignees={AGENDA_MEMBERS}
        viewer={AGENDA_VIEWER}
        initialView="board"
      />
    </AppFrame>
  );
}
