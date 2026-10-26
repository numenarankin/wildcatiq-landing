/**
 * Type-only mirror of the app's src/lib/analytics/lease-summaries.ts. The app
 * builds these rows from Supabase; the landing builds them from fixtures.
 */
import type { DayChange } from "@/lib/analytics/last-day-rates";

export interface LeaseSummaryRow {
  key: string;
  leaseId: string | null;
  name: string;
  slug: string | null;
  lastReportedAt: string | null;
  oil24: number;
  gas24: number;
  runs30d: number;
  revenue24: number;
  netRevenue24: number | null;
  nri: number | null;
  change: { oil: DayChange; gas: DayChange; revenue: DayChange };
  change30: { oil: DayChange; gas: DayChange; revenue: DayChange };
}

export interface LeaseWellRow {
  wellId: string;
  name: string;
  lease: string;
  leaseId: string | null;
  oilBbl: number;
  gasMcf: number;
  revenue24: number;
  oilRevenue24: number;
  gasRevenue24: number;
  nri: number | null;
  change: { oil: DayChange; gas: DayChange; revenue: DayChange };
  change30: { oil: DayChange; gas: DayChange; revenue: DayChange };
}

export interface DashboardRollup {
  rows: LeaseSummaryRow[];
  wells: LeaseWellRow[];
}
