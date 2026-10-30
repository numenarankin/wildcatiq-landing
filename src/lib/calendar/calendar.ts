/**
 * landing: the types half of the app's lib/calendar/calendar.ts. The reads
 * (`getCalendarEvents`, `getTaskDeadlineEvents`) go through Supabase and are
 * not ported; the demos hand the view `agenda-fixture.ts` instead.
 */

/**
 * Operations calendar events - field work, maintenance, hauling, regulatory
 * deadlines, and office items. Times are local `HH:MM` strings; all-day items
 * omit them.
 */

/** Broad category for an event, used for subtle visual differentiation. */
export type EventCategory =
  | "production"
  | "maintenance"
  | "logistics"
  | "compliance"
  | "office";

export interface CalendarEvent {
  id: string;
  title: string;
  /** Date as an ISO `YYYY-MM-DD` string. */
  date: string;
  /** True for all-day items; `start`/`end` are omitted when true. */
  allDay: boolean;
  /** Start time as a 24-hour `HH:MM` string (timed events only). */
  start?: string;
  /** End time as a 24-hour `HH:MM` string (timed events only). */
  end?: string;
  category: EventCategory;
  /** Optional location / lease the event takes place at. */
  location?: string;
  /** Optional attendees. */
  people?: string[];
  /** Optional free-form notes. */
  description?: string;
  /**
   * Set when this entry is a task deadline surfaced on the calendar rather than
   * a real `calendar_events` row. Such entries are read-only here (clicking
   * them links back to the task) and cannot be edited via the event modal.
   */
  taskId?: string;
}

