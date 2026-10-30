"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { trackingAllowed } from "@/lib/track/config";
import { startTracking } from "@/lib/track/tracker";

/**
 * Snitcher's visitor-identification tracker, the snippet from the Snitcher
 * dashboard verbatim (Settings > Tracker), loaded the way Snitcher's docs give
 * for the App Router (reference/snitcher-com/docs/product/tracker/installation.md):
 * `afterInteractive`, so it never holds up the page's first paint.
 *
 * Under the same rule as our own tracker (`trackingAllowed`): the live site
 * only, never localhost, a preview or a `?notrack=1` browser. Our tracker reads
 * the visitor id this script stores (`radar_device_id`) and keeps it on our
 * visitor row, which is how a company Snitcher identifies joins our data.
 */
const SNIPPET = `!function(e){"use strict";var t=e&&e.namespace;if(t&&e.profileId&&e.cdn){var i=window[t];if(i&&Array.isArray(i)||(i=window[t]=[]),!i.initialized&&!i._loaded)if(i._loaded)console&&console.warn("[Radar] Duplicate initialization attempted");else{i._loaded=!0;["track","page","identify","company","group","alias","ready","debug","on","off","once","trackClick","trackSubmit","trackLink","trackForm","pageview","screen","reset","register","setAnonymousId","addSourceMiddleware","addIntegrationMiddleware","addDestinationMiddleware","giveCookieConsent","denyCookieConsent"].forEach((function(e){var a;i[e]=(a=e,function(){var e=window[t];if(e.initialized)return e[a].apply(e,arguments);var i=[].slice.call(arguments);return i.unshift(a),e.push(i),e})})),-1===e.apiEndpoint.indexOf("http")&&(e.apiEndpoint="https://"+e.apiEndpoint),i.bootstrap=function(){var t,i=document.createElement("script");i.async=!0,i.type="text/javascript",i.id="__radar__",i.setAttribute("data-settings",JSON.stringify(e)),i.src=[-1!==(t=e.cdn).indexOf("http")?"":"https://",t,"/releases/latest/radar.min.js"].join("");var a=document.scripts[0];a.parentNode.insertBefore(i,a)},i.bootstrap()}}else"undefined"!=typeof console&&console.error("[Radar] Configuration incomplete")}({
  "apiEndpoint": "radar.snitcher.com",
  "cdn": "cdn.snitcher.com",
  "namespace": "Snitcher",
  "profileId": "sT7BCWxt4z"
});`;

export function SnitcherTracker() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    // The host is only known in the browser, so the decision is made after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one decision per page load, from browser-only state
    setAllowed(trackingAllowed());
  }, []);
  if (!allowed) return null;
  return (
    <Script
      id="snitcher-tracker"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: SNIPPET }}
      onReady={startTracking}
    />
  );
}
