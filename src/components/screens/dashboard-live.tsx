"use client";

/**
 * The dashboard as the app renders it: the app's own MorningBrief layout,
 * DashboardOverview (stat cards, company chart, lease table) and pie, fed the
 * fixture operator instead of Supabase.
 */
import { DashboardOverview } from "@/components/analytics/dashboard-overview";
import { ProductionByWellPie } from "@/components/analytics/production-by-well-pie";
import { MorningBriefStatic } from "@/components/analytics/morning-brief";
import { dashboardFixture, morningBrief } from "@/lib/screens/dashboard-fixture";
import { AppFrame } from "./app-frame";

export function DashboardLive() {
  const fx = dashboardFixture();
  return (
    <AppFrame path="/dashboard" crumbs={["Dashboard"]}>
      <div className="flex flex-1 flex-col gap-4">
        <MorningBriefStatic text={morningBrief(fx)} />
        <DashboardOverview
          {...fx.cards}
          monthly={fx.monthly}
          byWellMonthly={fx.byWellMonthly}
          dailyByWell={fx.dailyByWell}
          prices={fx.prices}
          nriByLease={fx.nriByLease}
          companyNri={fx.companyNri}
          leaseRows={fx.leaseRows}
          wellRows={fx.wellRows}
          chartLeases={fx.chartLeases}
          pie={<ProductionByWellPie wells={fx.pieWells} leaseByWell={fx.leaseByWell} />}
        />
      </div>
    </AppFrame>
  );
}
