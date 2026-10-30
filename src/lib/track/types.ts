/** One batch from the tracker to `/api/track`. The route adds `geo` before it reaches the GTM database. */

export type TrackEventType = "pageview" | "scroll_milestone" | "click" | "rage_click" | "dead_click" | "hover";

export interface TrackSession {
  id: string;
  started_at: string;
  last_event_at: string;
  ended_at?: string;
  entry_path: string;
  referrer: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  device: "desktop" | "tablet" | "mobile";
  user_agent: string;
  viewport_w: number;
  viewport_h: number;
  /** Running total: focused, visible and active time only. */
  engaged_ms: number;
  /** Running maximum, % of the document. */
  max_scroll_pct: number;
}

export interface TrackEvent {
  id: string;
  occurred_at: string;
  type: TrackEventType;
  path: string;
  scroll_pct?: number;
  x_pct?: number;
  y_pct?: number;
  el_tag?: string;
  el_id?: string;
  el_class?: string;
  el_text?: string;
  hover_ms?: number;
}

export interface TrackDemoView {
  /** The page it played on. */
  path: string;
  demo: string;
  view_number: number;
  started_at: string;
  /** Null for a demo with no steps. */
  max_progress_pct: number | null;
  completed: boolean;
  watched_ms: number;
}

export interface TrackBatch {
  visitor_id: string;
  /** Snitcher's id for this browser (`radar_device_id`), once its script has set it. */
  snitcher_visitor_id?: string;
  session: TrackSession;
  events: TrackEvent[];
  demo_views: TrackDemoView[];
}
