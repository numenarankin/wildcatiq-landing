import { TRACKED_HOSTS } from "@/lib/track/config";

/** Requests one IP may make per minute, per server instance. */
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(req: Request): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const t = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.reset < t) {
    hits.set(ip, { count: 1, reset: t + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/** In production only the live site's own pages may call; locally anything may. */
function allowedOrigin(req: Request): boolean {
  if (process.env.VERCEL_ENV !== "production") return true;
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return false;
  try {
    return TRACKED_HOSTS.includes(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** The /api/book routes' shared gates: origin, rate limit, JSON body, honeypot. A Response means refuse with it. */
export async function gate(req: Request): Promise<Response | Record<string, unknown>> {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });
  if (rateLimited(req)) return Response.json({ error: "rate" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return Response.json({ error: "input" }, { status: 400 });
  // Hidden from people; bots fill it.
  if (body.website) return Response.json({ error: "input" }, { status: 400 });
  return body;
}
