/**
 * The landing's behaviour tracker (admin docs/plans/gtm-landing.md). One per
 * page load, started by `<Tracker />` in the root layout, and only where
 * `trackingAllowed()` says so (the live site). Everything it records goes to
 * `/api/track` in batches; nothing is read back.
 *
 * Records: the visit (entry, referrer, source, UTMs, device, viewport,
 * engaged time, max scroll), pageviews, scroll milestones, clicks with rage
 * and dead clicks flagged, hover dwell on links and buttons, and each play
 * of each product demo with how far it got. Never the values typed into a
 * form, never keystrokes.
 */
import { trackingAllowed } from "./config";
import type { TrackBatch, TrackDemoView, TrackEvent, TrackEventType, TrackSession } from "./types";

/** How often queued events go out. */
const SEND_MS = 5000;
/** The engaged-time clock's resolution. */
const TICK_MS = 1000;
/** No pointer, key, scroll or touch for this long and the visitor is idle: engaged time stops. */
const IDLE_MS = 30_000;
/** A tab left this long without an event starts a new visit when it comes back. */
const SESSION_GAP_MS = 30 * 60_000;
/** Characters of an element's visible text kept with a click or hover. */
const TEXT_MAX = 80;
const CLASS_MAX = 160;
/** A rest this long on a link or button is a hover. */
const HOVER_MS = 1000;
/** Rage click: this many clicks inside the window, all within the radius of the latest. */
const RAGE_COUNT = 3;
const RAGE_WINDOW_MS = 1000;
const RAGE_RADIUS_PX = 30;
/** Dead click: nothing interactive was hit and nothing changed for this long. */
const DEAD_MS = 500;
const MILESTONES = [25, 50, 75, 90, 100] as const;
/** Events per request; a beacon body is capped near 64 KB. */
const BATCH_MAX = 100;

const INTERACTIVE =
  "a,button,input,select,textarea,label,summary,option,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=switch],[data-track],[onclick],[contenteditable=true]";
const HOVERABLE = "a,button,[role=button],[role=link],[role=tab],[data-track]";

const ENDPOINT = "/api/track";

const VISITOR_KEY = "wc_vid";
const SESSION_KEY = "wc_session";
const DEMO_COUNT_KEY = "wc_demo_plays";

interface DemoPlay {
  view: TrackDemoView;
  /** The last step index reported. */
  lastStep: number;
}

let started = false;
let visitorId = "";
let session: TrackSession | null = null;
let queue: TrackEvent[] = [];
/** Plays changed since the last send, keyed by `playKey`. */
const dirtyPlays = new Map<string, TrackDemoView>();
/** The plays on screen now, by demo. */
const playKey = (v: TrackDemoView) => `${v.path}|${v.demo}#${v.view_number}`;
const playing = new Map<string, DemoPlay>();
let sessionDirty = true;
let lastActivity = Date.now();
let lastTick = Date.now();
let currentPath = "";
let milestonesHit = new Set<number>();

const now = () => new Date().toISOString();
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

function store(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readJson<T>(s: Storage | null, key: string): T | null {
  try {
    const raw = s?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(s: Storage | null, key: string, value: unknown) {
  try {
    s?.setItem(key, JSON.stringify(value));
  } catch {
    // A full or blocked store only loses continuity across reloads.
  }
}

function uuid(): string {
  return crypto.randomUUID();
}

/* ---- The visit ---------------------------------------------------------- */

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|baidu|yandex|ecosia|brave)\./;
const SOCIAL = /(^|\.)(linkedin|lnkd|facebook|fb|instagram|twitter|x|t|reddit|youtube|threads|tiktok)\.(com|co|in|me)$/;

/** A utm_source when there is one, else what kind of place the referrer is. */
function sourceOf(referrer: string | null, utmSource: string | null): string {
  if (utmSource) return utmSource;
  if (!referrer) return "direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "referral";
  }
  if (host === window.location.hostname.replace(/^www\./, "")) return "direct";
  if (SEARCH.test(host)) return "search";
  if (SOCIAL.test(host)) return "social";
  return "referral";
}

function deviceOf(): TrackSession["device"] {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "mobile";
  // iPadOS reports a desktop Safari user agent; a touch screen gives it away.
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return "tablet";
  return "desktop";
}

/** The tab's visit: carried across reloads in sessionStorage, new after a long gap. */
function openSession(): TrackSession {
  const saved = readJson<TrackSession>(store("session"), SESSION_KEY);
  if (saved && Date.now() - Date.parse(saved.last_event_at) < SESSION_GAP_MS) return saved;
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || null;
  const utm = (k: string) => params.get(k)?.slice(0, 200) || null;
  return {
    id: uuid(),
    started_at: now(),
    last_event_at: now(),
    entry_path: window.location.pathname,
    referrer: referrer?.slice(0, 500) ?? null,
    source: sourceOf(referrer, utm("utm_source")),
    utm_source: utm("utm_source"),
    utm_medium: utm("utm_medium"),
    utm_campaign: utm("utm_campaign"),
    utm_term: utm("utm_term"),
    utm_content: utm("utm_content"),
    device: deviceOf(),
    user_agent: navigator.userAgent.slice(0, 400),
    viewport_w: window.innerWidth,
    viewport_h: window.innerHeight,
    engaged_ms: 0,
    max_scroll_pct: 0,
  };
}

function touchSession() {
  if (!session) return;
  session.last_event_at = now();
  sessionDirty = true;
  writeJson(store("session"), SESSION_KEY, session);
}

/* ---- Events ------------------------------------------------------------- */

function push(type: TrackEventType, extra: Omit<TrackEvent, "id" | "occurred_at" | "type" | "path"> = {}) {
  queue.push({ id: uuid(), occurred_at: now(), type, path: currentPath, ...extra });
  touchSession();
}

/** Tag, id, class and the first few words of visible text; nothing from a form field's value. */
function describe(el: Element): Pick<TrackEvent, "el_tag" | "el_id" | "el_class" | "el_text"> {
  const tag = el.tagName.toLowerCase();
  const field = el.matches("input,textarea,select,[contenteditable=true]");
  const text = field ? "" : (el.textContent ?? "").replace(/\s+/g, " ").trim();
  return {
    el_tag: tag,
    el_id: el.id ? el.id.slice(0, CLASS_MAX) : undefined,
    el_class: (el.getAttribute("class") ?? "").slice(0, CLASS_MAX) || undefined,
    el_text: text ? text.slice(0, TEXT_MAX) : undefined,
  };
}

/** A page point as % of the whole document. */
function docPct(pageX: number, pageY: number) {
  const root = document.documentElement;
  return {
    x_pct: round2(clamp((pageX / Math.max(root.scrollWidth, 1)) * 100, 0, 100)),
    y_pct: round2(clamp((pageY / Math.max(root.scrollHeight, 1)) * 100, 0, 100)),
  };
}

function onPageview() {
  const path = window.location.pathname;
  if (path === currentPath) return;
  currentPath = path;
  milestonesHit = new Set();
  push("pageview");
  onScroll();
}

function onScroll() {
  if (!session) return;
  const root = document.documentElement;
  const pct = Math.round(clamp(((window.scrollY + window.innerHeight) / Math.max(root.scrollHeight, 1)) * 100, 0, 100));
  if (pct > session.max_scroll_pct) {
    session.max_scroll_pct = pct;
    sessionDirty = true;
  }
  for (const m of MILESTONES) {
    if (pct >= m && !milestonesHit.has(m)) {
      milestonesHit.add(m);
      push("scroll_milestone", { scroll_pct: m });
    }
  }
}

let recentClicks: { t: number; x: number; y: number }[] = [];
let rageUntil = 0;

function onClick(e: MouseEvent) {
  const target = e.target instanceof Element ? e.target : (e.target as Node | null)?.parentElement;
  if (!target) return;
  const where = docPct(e.pageX, e.pageY);
  const what = describe(target.closest(INTERACTIVE) ?? target);
  push("click", { ...where, ...what });

  // Rage: the burst is counted once, however long it goes on.
  const t = performance.now();
  recentClicks = recentClicks.filter((c) => t - c.t <= RAGE_WINDOW_MS);
  recentClicks.push({ t, x: e.clientX, y: e.clientY });
  // Near THIS click: a click elsewhere a moment earlier must not hide a burst here.
  const near = recentClicks.filter((c) => Math.hypot(c.x - e.clientX, c.y - e.clientY) <= RAGE_RADIUS_PX);
  if (near.length >= RAGE_COUNT && t > rageUntil) push("rage_click", { ...where, ...what });
  if (near.length >= RAGE_COUNT) rageUntil = t + RAGE_WINDOW_MS;

  // Dead: nothing clickable under the pointer, then no navigation and no
  // change near the element. Watching only the element's neighbourhood keeps
  // the demos' constant animation elsewhere on the page from hiding it.
  const interactive =
    target.closest(INTERACTIVE) !== null || window.getComputedStyle(target).cursor === "pointer";
  if (interactive) return;
  const scope = target.parentElement?.parentElement ?? target;
  const href = window.location.href;
  let changed = false;
  const observer = new MutationObserver(() => {
    changed = true;
  });
  observer.observe(scope, { subtree: true, childList: true, attributes: true, characterData: true });
  window.setTimeout(() => {
    observer.disconnect();
    if (!changed && window.location.href === href) push("dead_click", { ...where, ...what });
  }, DEAD_MS);
}

let hovered: { el: Element; t: number } | null = null;

function endHover() {
  if (!hovered) return;
  const ms = Math.round(performance.now() - hovered.t);
  if (ms >= HOVER_MS && hovered.el.isConnected) {
    const r = hovered.el.getBoundingClientRect();
    push("hover", {
      ...docPct(r.left + r.width / 2 + window.scrollX, r.top + r.height / 2 + window.scrollY),
      ...describe(hovered.el),
      hover_ms: ms,
    });
  }
  hovered = null;
}

function onPointerOver(e: PointerEvent) {
  const el = e.target instanceof Element ? e.target.closest(HOVERABLE) : null;
  if (el === hovered?.el) return;
  endHover();
  if (el) hovered = { el, t: performance.now() };
}

function onPointerOut(e: PointerEvent) {
  if (!hovered) return;
  const to = e.relatedTarget instanceof Node ? e.relatedTarget : null;
  if (to && hovered.el.contains(to)) return;
  endHover();
}

function onActivity() {
  lastActivity = Date.now();
}

/** Engaged time for the visit, watch time for the demos on screen. */
function tick() {
  if (!session) return;
  const t = Date.now();
  const delta = Math.min(t - lastTick, TICK_MS * 5);
  lastTick = t;
  const visible = document.visibilityState === "visible" && document.hasFocus();
  if (visible && t - lastActivity < IDLE_MS) {
    session.engaged_ms += delta;
    sessionDirty = true;
    writeJson(store("session"), SESSION_KEY, session);
  }
  // Watching is passive, so a demo's time counts whenever the tab is in
  // front, with no idle cutoff.
  if (visible) {
    for (const play of playing.values()) {
      play.view.watched_ms += delta;
      dirtyPlays.set(playKey(play.view), play.view);
    }
  }
}

/* ---- Sending ------------------------------------------------------------ */

/** Where Snitcher's script keeps its visitor id (cookie and localStorage, JSON-encoded). */
const SNITCHER_ID_KEY = "radar_device_id";

/**
 * Snitcher's own id for this browser, once its script has set it; null
 * before then or where Snitcher does not run. It is the `visitor_uuid` on
 * every Snitcher session, so carrying it on our visitor row is what links a
 * company Snitcher identifies to this visitor.
 */
function snitcherVisitorId(): string | null {
  const clean = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    let v = raw;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "string") v = parsed;
    } catch {
      // Stored bare.
    }
    return /^[0-9a-f-]{8,64}$/i.test(v) ? v : null;
  };
  const stored = clean(store("local")?.getItem(SNITCHER_ID_KEY));
  if (stored) return stored;
  const cookie = document.cookie.split("; ").find((c) => c.startsWith(`${SNITCHER_ID_KEY}=`));
  return cookie ? clean(decodeURIComponent(cookie.slice(SNITCHER_ID_KEY.length + 1))) : null;
}

function takeBatch(): TrackBatch | null {
  if (!session) return null;
  if (!sessionDirty && queue.length === 0 && dirtyPlays.size === 0) return null;
  const events = queue.slice(0, BATCH_MAX);
  queue = queue.slice(BATCH_MAX);
  const demo_views = [...dirtyPlays.values()].map((v) => ({ ...v }));
  dirtyPlays.clear();
  sessionDirty = false;
  const snitcher_visitor_id = snitcherVisitorId();
  return {
    visitor_id: visitorId,
    ...(snitcher_visitor_id ? { snitcher_visitor_id } : {}),
    session: { ...session },
    events,
    demo_views,
  };
}

/** Put a batch that did not land back in line. */
function requeue(batch: TrackBatch) {
  queue = [...batch.events, ...queue];
  for (const v of batch.demo_views) {
    const key = playKey(v);
    if (!dirtyPlays.has(key)) dirtyPlays.set(key, v);
  }
  sessionDirty = true;
}

async function send() {
  const batch = takeBatch();
  if (!batch) return;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(batch),
      keepalive: true,
    });
    if (!res.ok && res.status >= 500) requeue(batch);
  } catch {
    requeue(batch);
  }
}

/** The page is going away: what is left goes by beacon, which outlives it. */
function sendFinal() {
  endHover();
  if (session) session.ended_at = now();
  sessionDirty = true;
  for (let batch = takeBatch(); batch; batch = takeBatch()) {
    const body = new Blob([JSON.stringify(batch)], { type: "application/json" });
    if (!navigator.sendBeacon(ENDPOINT, body)) {
      requeue(batch);
      break;
    }
  }
  if (session) delete session.ended_at;
}

/* ---- Public API --------------------------------------------------------- */

/** Start tracking this page load, once, where it is allowed. */
export function startTracking(): void {
  if (started || !trackingAllowed()) return;
  started = true;

  const local = store("local");
  visitorId = local?.getItem(VISITOR_KEY) ?? "";
  if (!visitorId) {
    visitorId = uuid();
    local?.setItem(VISITOR_KEY, visitorId);
  }
  session = openSession();
  writeJson(store("session"), SESSION_KEY, session);

  // The app router changes the URL with the History API; each change is a pageview.
  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method].bind(history);
    history[method] = (...args: Parameters<History["pushState"]>) => {
      original(...args);
      window.setTimeout(onPageview, 0);
    };
  }
  window.addEventListener("popstate", onPageview);
  onPageview();

  let scrollFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      onActivity();
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        onScroll();
      });
    },
    { passive: true },
  );
  document.addEventListener("click", onClick, { capture: true, passive: true });
  document.addEventListener("pointerover", onPointerOver, { passive: true });
  document.addEventListener("pointerout", onPointerOut, { passive: true });
  for (const type of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const) {
    window.addEventListener(type, onActivity, { passive: true });
  }

  window.setInterval(tick, TICK_MS);
  window.setInterval(() => void send(), SEND_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendFinal();
    else lastTick = Date.now();
  });
  window.addEventListener("pagehide", sendFinal);
}

/** A demo came on screen and started from the top: a new play. */
export function demoStart(demo: string): void {
  if (!started) return;
  // Plays are counted per page: the home page's Orion demo and the Orion
  // page's are two demos to the reader.
  const path = window.location.pathname;
  const counts = readJson<Record<string, number>>(store("session"), DEMO_COUNT_KEY) ?? {};
  const view_number = (counts[`${path}|${demo}`] ?? 0) + 1;
  counts[`${path}|${demo}`] = view_number;
  writeJson(store("session"), DEMO_COUNT_KEY, counts);
  const view: TrackDemoView = {
    path,
    demo,
    view_number,
    started_at: now(),
    max_progress_pct: null,
    completed: false,
    watched_ms: 0,
  };
  playing.set(demo, { view, lastStep: -1 });
  dirtyPlays.set(playKey(view), view);
}

/**
 * The demo reached `step` of `steps` (0-based). The last step is 100% and
 * completes the play; a demo that loops back to its first step after
 * completing has started its next play.
 */
export function demoProgress(demo: string, step: number, steps: number): void {
  if (!started) return;
  let play = playing.get(demo);
  if (!play) return;
  if (step < play.lastStep && play.view.completed) {
    demoStart(demo);
    play = playing.get(demo)!;
  }
  const pct = steps > 1 ? Math.round((clamp(step, 0, steps - 1) / (steps - 1)) * 100) : 100;
  play.view.max_progress_pct = Math.max(play.view.max_progress_pct ?? 0, pct);
  if (pct === 100) play.view.completed = true;
  play.lastStep = step;
  dirtyPlays.set(playKey(play.view), play.view);
}

/** The demo left the screen; its play is over. */
export function demoEnd(demo: string): void {
  const play = playing.get(demo);
  if (!play) return;
  dirtyPlays.set(playKey(play.view), play.view);
  playing.delete(demo);
}
