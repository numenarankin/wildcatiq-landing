"use client";

/**
 * The October month on /agenda (`CalendarView` on its Month tab), fed
 * `agenda-fixture.ts`: field, office and haul events with each task deadline
 * flagged on its due day.
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

export function CalendarScreen() {
  return (
    <AppFrame path="/agenda" crumbs={["Agenda"]} fullBleed>
      <CalendarView
        today={FIXTURE_TODAY}
        events={agendaEvents()}
        tasks={agendaTasks()}
        assignees={AGENDA_MEMBERS}
        viewer={AGENDA_VIEWER}
        initialView="month"
      />
    </AppFrame>
  );
}
