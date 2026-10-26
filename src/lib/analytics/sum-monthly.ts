import type { MonthlyProduction, WellMonthlySeries } from "@/lib/analytics/types";

/**
 * Several wells' monthly series as one — a lease on the company chart.
 *
 * The same fold `getCompanyAnalytics` does for the company: volumes, revenue
 * and cash flow add; the RATE columns add too, because a lease's rate is the
 * sum of its wells' rates, each over its own measured days (dividing the
 * lease's total by the calendar is what put the decline plot under the
 * production plot for the same barrels). A month is official only when every
 * well's is. Months are the union, oldest first.
 */
export function sumMonthly(series: readonly WellMonthlySeries[]): MonthlyProduction[] {
  const byMonth = new Map<string, MonthlyProduction>();
  for (const w of series) {
    for (const m of w.monthly) {
      const acc = byMonth.get(m.month) ?? {
        month: m.month,
        oilBbl: 0,
        gasMcf: 0,
        water: 0,
        revenue: 0,
        cashFlow: 0,
        official: true,
        oilBblPerDay: 0,
        gasMcfPerDay: 0,
        waterBblPerDay: 0,
      };
      acc.oilBbl += m.oilBbl;
      acc.gasMcf += m.gasMcf;
      acc.water += m.water;
      acc.revenue += m.revenue;
      acc.cashFlow += m.cashFlow;
      acc.official = acc.official && m.official;
      acc.oilBblPerDay = (acc.oilBblPerDay ?? 0) + (m.oilBblPerDay ?? 0);
      acc.gasMcfPerDay = (acc.gasMcfPerDay ?? 0) + (m.gasMcfPerDay ?? 0);
      acc.waterBblPerDay = (acc.waterBblPerDay ?? 0) + (m.waterBblPerDay ?? 0);
      byMonth.set(m.month, acc);
    }
  }
  return [...byMonth.values()].sort((a, b) => (a.month < b.month ? -1 : 1));
}
