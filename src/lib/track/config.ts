/**
 * Where tracking runs: the live site only. Localhost, Vercel previews and any
 * other host record nothing, so testing never reaches the GTM data
 * (admin docs/plans/gtm-landing.md, "Only production traffic is recorded").
 * Shared by the tracker, the Snitcher script and `/api/track`.
 */

/** The hosts whose visits count. */
export const TRACKED_HOSTS: readonly string[] = ["wildcatiq.ai", "www.wildcatiq.ai"];

/** `?notrack=1` stops tracking in this browser for good; `?notrack=0` undoes it. */
const NOTRACK_KEY = "wc_notrack";

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Apply `?notrack=` from the address bar, then answer whether this browser opted out. */
function optedOut(): boolean {
  const flag = new URLSearchParams(window.location.search).get("notrack");
  const store = storage();
  if (flag === "1") store?.setItem(NOTRACK_KEY, "1");
  if (flag === "0") store?.removeItem(NOTRACK_KEY);
  return store?.getItem(NOTRACK_KEY) === "1";
}

/** Whether this page view may be tracked. Browser only. */
export function trackingAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (!TRACKED_HOSTS.includes(window.location.hostname)) return false;
  if (navigator.webdriver) return false;
  return !optedOut();
}
