/**
 * The Pumper Report's fixed copy, written once.
 *
 * The chart title and the methodology note appear in three renderings (PDF,
 * markdown, the in-app modal). Keeping the strings here means a wording change
 * lands everywhere at once, and the definition of a "visit" is stated in exactly
 * the same words wherever the reader meets it.
 *
 * No em dashes or en dashes anywhere in report copy (owner preference).
 */

/** The chart's title, including its unit, as every rendering states it. */
export const COVERAGE_CHART_TITLE =
  "Facilities visited (% of all facilities, by day)";

/**
 * How the rate is measured. Secondary to the numbers: it earns trust, but it is
 * not the news, so every rendering places it under the headline, not above it.
 */
export const COVERAGE_METHOD_NOTE =
  "A facility counts as visited on a day when anything was logged against it that day: " +
  "a tank gauge, a meter reading. A tank battery is one facility however many tanks sit on " +
  "it, since the pumper makes one stop; water tanks, gas meters and water meters each count " +
  "on their own.";
