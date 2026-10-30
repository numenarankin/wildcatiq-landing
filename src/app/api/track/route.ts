import { z } from "zod";
import { TRACKED_HOSTS } from "@/lib/track/config";
import { geoFromHeaders } from "@/lib/track/geo";

export const runtime = "nodejs";

/**
 * The tracker's batches into the GTM database (admin docs/plans/gtm-landing.md).
 *
 * Only production traffic is written: the deployment must be Vercel's
 * production one and the request must come from the live site's own pages.
 * Anything else is answered 204 and dropped, so a preview, localhost or a
 * hand-made request never reaches the data. Location comes from Vercel's
 * headers here, never from the browser.
 *
 * Writes go through the `gtm_ingest` function with the GTM project's secret
 * key (`GTM_SUPABASE_URL`, `GTM_SUPABASE_SECRET_KEY`), one transaction a batch.
 */

/** Batches one IP may send per minute, per server instance. */
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const t = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < t) {
    hits.set(ip, { count: 1, reset: t + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/** Text is cut to length rather than refused: one long class name must not cost the batch. */
const text = (max: number) =>
  z
    .string()
    .transform((s) => s.slice(0, max))
    .nullish();
const iso = z.iso.datetime({ offset: true });
const pct = z.number().min(0).max(100);

const batchSchema = z.object({
  visitor_id: z.uuid(),
  snitcher_visitor_id: z.string().regex(/^[0-9a-f-]{8,64}$/i).optional(),
  session: z.object({
    id: z.uuid(),
    started_at: iso,
    last_event_at: iso,
    ended_at: iso.optional(),
    entry_path: z.string().transform((s) => s.slice(0, 500)),
    referrer: text(500),
    source: text(200),
    utm_source: text(200),
    utm_medium: text(200),
    utm_campaign: text(200),
    utm_term: text(200),
    utm_content: text(200),
    device: z.enum(["desktop", "tablet", "mobile"]),
    user_agent: text(400),
    viewport_w: z.number().int().positive().max(20_000),
    viewport_h: z.number().int().positive().max(20_000),
    engaged_ms: z.number().int().min(0),
    max_scroll_pct: pct,
  }),
  events: z
    .array(
      z.object({
        id: z.uuid(),
        occurred_at: iso,
        type: z.enum(["pageview", "scroll_milestone", "click", "rage_click", "dead_click", "hover"]),
        path: z.string().transform((s) => s.slice(0, 500)),
        scroll_pct: z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(90), z.literal(100)]).optional(),
        x_pct: pct.optional(),
        y_pct: pct.optional(),
        el_tag: text(40),
        el_id: text(160),
        el_class: text(160),
        el_text: text(80),
        hover_ms: z.number().int().min(0).optional(),
      }),
    )
    .max(200),
  demo_views: z
    .array(
      z.object({
        path: z.string().transform((s) => s.slice(0, 500)),
        demo: z.string().min(1).max(80),
        view_number: z.number().int().min(1).max(10_000),
        started_at: iso,
        max_progress_pct: pct.nullable(),
        completed: z.boolean(),
        watched_ms: z.number().int().min(0),
      }),
    )
    .max(50),
});

function fromLiveSite(req: Request): boolean {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return false;
  try {
    return TRACKED_HOSTS.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  if (process.env.VERCEL_ENV !== "production" || !fromLiveSite(req)) {
    return new Response(null, { status: 204 });
  }

  const url = process.env.GTM_SUPABASE_URL;
  const key = process.env.GTM_SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("[track] GTM database not configured: set GTM_SUPABASE_URL and GTM_SUPABASE_SECRET_KEY");
    return new Response(null, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return new Response(null, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });
  // A milestone event without its milestone is malformed; drop that one, keep the rest.
  const batch = parsed.data;
  batch.events = batch.events.filter((e) => (e.type === "scroll_milestone") === (e.scroll_pct !== undefined));

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/gtm_ingest`, {
    method: "POST",
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ p: { ...batch, geo: geoFromHeaders(req.headers) } }),
  });
  if (!res.ok) {
    console.error(`[track] gtm_ingest failed (${res.status}): ${await res.text().catch(() => "")}`);
    return new Response(null, { status: 502 });
  }
  return new Response(null, { status: 204 });
}
