// landing: the two constants the digest markdown reads from the app's
// src/lib/reports/digest/build.ts. The builder itself aggregates org
// production rows; the landing's digest is a fixture.
import type { DigestPeriod } from "@/lib/reports/digest/period";

export const CHART_TRAILING_DAYS: Record<DigestPeriod, number> = {
  daily: 14,
  weekly: 84,
  monthly: 180,
};

export const CHART_TRAILING_LABEL: Record<DigestPeriod, string> = {
  daily: "last 14 days",
  weekly: "last 12 weeks",
  monthly: "last 6 months",
};
