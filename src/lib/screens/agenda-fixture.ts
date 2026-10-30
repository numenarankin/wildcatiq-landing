/**
 * Sky Resources' agenda on the fixture day: the tasks board and the calendar
 * events the /agenda page reads (`getTasks`, `getCalendarEvents`), in the
 * shapes those reads return. Everything dated here is a fact another page
 * already shows:
 *
 * - Brushy Fork pickups are the dashboard's run tickets (`runTickets`), on the
 *   lease's oil tank at the haul time the tank pages use.
 * - Roy Corbett 4's shut-in, pulling unit and return are `EVENTS.rc4Downtime`
 *   and the pulling-unit ticket on Documents (`CORBETT_JOB`).
 * - Smith 4's fluid level is Jim's reply on Smith 4's thread ("Shoot a fluid
 *   level Thursday"), the stuffing box his Oct 26 comment, the thief hatch
 *   Luis's Johnson A W1 note.
 * - The Johnson A 3 test is the task Orion proposes on the Orion page, saved.
 * - The Form PR task is due on the date the brief and Filings print.
 *
 * Task deadlines reach the calendar the way the page puts them there
 * (`taskDeadlineEvents`), so the board and the month never disagree.
 */
import type { CalendarEvent } from "@/lib/calendar/calendar";
import { taskDeadlineEvents } from "@/lib/calendar/task-deadlines";
import type { Task } from "@/lib/tasks/tasks";
import { dueDate } from "@/lib/rrc/forms/schedule";
import { dashboardFixture } from "./dashboard-fixture";
import { CORBETT_JOB } from "./documents-fixture";
import { HAUL_TIME, leaseTank } from "./documents-tanks";
import { permitTaskPart } from "./orion-fixture";
import { EVENTS, FIXTURE_TODAY, LEASES, OPERATOR, PURCHASERS, WELLS } from "./operator";

export { FIXTURE_TODAY };

/** The office manager, the one member operator.ts doesn't name. */
export const OFFICE_MANAGER = "Dana Whitley";

/** The org's members, as the page takes them off the people directory. */
export const AGENDA_MEMBERS = [OPERATOR.owner, OPERATOR.pumper, OFFICE_MANAGER];

/** Who is looking: the owner. */
export const AGENDA_VIEWER = OPERATOR.owner;

const wellName = (id: string) => WELLS.find((w) => w.id === id)!.name;
const leaseName = (id: string) => LEASES.find((l) => l.id === id)!.name;
const p = (text: string) => `<p>${text}</p>`;

const RC4 = wellName(EVENTS.rc4Downtime.well);
const PR_DUE = dueDate("PR", EVENTS.reportMonth.replace("-", ""));
const permitTask = permitTaskPart("saved") as unknown as {
  input: { title: string; dueDate: string; assignee: string; notes: string };
};

/** The board, newest first as `getTasks` orders it. */
export function agendaTasks(): Task[] {
  return [
    {
      id: "task-ja3-test",
      title: permitTask.input.title,
      description: p(permitTask.input.notes),
      status: "priority",
      priority: "High",
      assignee: permitTask.input.assignee,
      deadline: permitTask.input.dueDate,
    },
    {
      id: "task-s4-fluid",
      title: "Shoot fluid level on Smith 4",
      description: p("Pumping off again, 2 hrs cut from the timer. Look at the SPM after."),
      status: "priority",
      priority: "High",
      assignee: OPERATOR.pumper,
      deadline: "2026-10-29",
      deadlineTime: "09:00",
    },
    {
      id: "task-s4-grease",
      title: "Grease stuffing box, Smith 4",
      description: p("Polish rod was dry on the last round."),
      status: "doing",
      priority: "Low",
      assignee: OPERATOR.pumper,
      deadline: FIXTURE_TODAY,
    },
    {
      id: "task-jaw-hatch",
      title: "Install thief hatch gasket, Johnson A W1",
      description: p("Hatch leaking on the water tank. New gasket on order."),
      status: "doing",
      priority: "Medium",
      assignee: OPERATOR.pumper,
      deadline: "2026-10-28",
    },
    {
      id: "task-bf-recon",
      title: `Reconcile ${PURCHASERS.oil} September statement`,
      description: p("Match each run ticket to a haul on file before the revenue posts."),
      status: "doing",
      priority: "Medium",
      assignee: OFFICE_MANAGER,
      deadline: "2026-10-28",
    },
    {
      id: "task-form-pr",
      title: "File September Form PR",
      description: p("Generate in Filings, review, download, upload to RRC Online."),
      status: "priority",
      priority: "High",
      assignee: OFFICE_MANAGER,
      deadline: PR_DUE,
    },
    {
      id: "task-bf-tickets",
      title: `Request October run tickets from ${PURCHASERS.oil}`,
      status: "planned",
      priority: "Low",
      assignee: OFFICE_MANAGER,
      deadline: "2026-11-05",
    },
    {
      id: "task-rp7-line",
      title: "Bid flowline replacement, Roach Parrott 7",
      description: p("Line to T501 has two clamps on it. Get two bids on 2 in poly."),
      status: "planned",
      priority: "Medium",
      assignee: OPERATOR.owner,
      deadline: "2026-11-13",
    },
    {
      id: "task-fy-bottoms",
      title: "Clean out Fannie Young T401 bottoms",
      description: p("Call a vac truck after the next pickup."),
      status: "planned",
      priority: "Low",
      assignee: OPERATOR.pumper,
    },
    {
      id: "task-s2-rubbers",
      title: "Replace stuffing box rubbers, Smith 2",
      status: "planned",
      priority: "Low",
      assignee: OPERATOR.pumper,
    },
    {
      id: "task-royalty",
      title: "Mail September royalty checks",
      status: "done",
      priority: "Medium",
      assignee: OFFICE_MANAGER,
      deadline: "2026-10-20",
    },
    {
      id: "task-rc4-pump",
      title: `Pull and rerun pump, ${RC4}`,
      description: p(CORBETT_JOB.notes),
      status: "done",
      priority: "High",
      assignee: OPERATOR.pumper,
      deadline: CORBETT_JOB.date,
    },
    {
      id: "task-fy2-hotoil",
      title: "Hot oil Fannie Young 2A",
      status: "done",
      priority: "Low",
      assignee: OPERATOR.pumper,
      deadline: "2026-10-08",
    },
  ];
}

/** Monday 7:00 at the office, the five Mondays the October grid shows. */
const MEETINGS = ["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"];

/** Loads on the October grid (Sep 27 to Oct 31), up to today. */
function pickups(): CalendarEvent[] {
  return dashboardFixture()
    .runTickets.filter((t) => t.date >= "2026-09-27" && t.date <= FIXTURE_TODAY)
    .map((t) => ({
      id: `ev-haul-${t.leaseId}-${t.date}`,
      title: `${PURCHASERS.oil} pickup, ${leaseTank(t.leaseId).name}`,
      date: t.date,
      allDay: false,
      start: HAUL_TIME,
      end: "11:20",
      category: "logistics" as const,
      location: leaseName(t.leaseId),
    }));
}

/** The `calendar_events` rows in the October window. */
export function agendaCalendarEvents(): CalendarEvent[] {
  const meetings: CalendarEvent[] = MEETINGS.map((date) => ({
    id: `ev-meeting-${date}`,
    title: "Field meeting",
    date,
    allDay: false,
    start: "07:00",
    end: "07:30",
    category: "office",
    location: `${OPERATOR.city} office`,
    people: AGENDA_MEMBERS,
  }));
  const rc4 = EVENTS.rc4Downtime;
  const rest: CalendarEvent[] = [
    {
      id: "ev-chem-ja",
      title: "Chemical treatment, Johnson A",
      date: "2026-10-07",
      allDay: false,
      start: "09:00",
      end: "11:00",
      category: "maintenance",
      location: "Johnson A",
    },
    {
      id: "ev-rrc-insp",
      title: "RRC field inspection, Smith",
      date: "2026-10-09",
      allDay: false,
      start: "10:00",
      end: "12:00",
      category: "compliance",
      location: "Smith",
      people: [OPERATOR.pumper],
    },
    {
      id: "ev-rc4-down",
      title: `${RC4} down`,
      date: rc4.from,
      allDay: true,
      category: "production",
      location: leaseName("l-corbett"),
      description: rc4.reason,
    },
    {
      id: "ev-rc4-pull",
      title: `Pulling unit on ${RC4}`,
      date: CORBETT_JOB.date,
      allDay: false,
      start: "07:00",
      end: "15:30",
      category: "maintenance",
      location: leaseName("l-corbett"),
      people: [OPERATOR.pumper],
      description: `${CORBETT_JOB.vendor}. ${CORBETT_JOB.job}.`,
    },
    {
      id: "ev-rc4-on",
      title: `${RC4} back on`,
      date: rc4.to,
      allDay: true,
      category: "production",
      location: leaseName("l-corbett"),
    },
    {
      id: "ev-swd-elec",
      title: "Electrician at Smith SWD 1",
      date: FIXTURE_TODAY,
      allDay: false,
      start: "08:00",
      end: "12:00",
      category: "maintenance",
      location: "Smith",
    },
    {
      id: "ev-cpa",
      title: "CPA call, September close",
      date: FIXTURE_TODAY,
      allDay: false,
      start: "14:00",
      end: "15:00",
      category: "office",
      people: [OPERATOR.owner, OFFICE_MANAGER],
    },
  ];
  return [...meetings, ...pickups(), ...rest];
}

/** What the page hands `CalendarView`: the events plus each task's deadline. */
export function agendaEvents(): CalendarEvent[] {
  return [...agendaCalendarEvents(), ...taskDeadlineEvents(agendaTasks())];
}
