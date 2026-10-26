"use client";

/**
 * The dashboard's section screens: each one a part of the real page
 * (`src/app/dashboard/page.tsx`) in one state, fed the shared fixture
 * operator, so the brief, the cards, the chart, the table and the pie on the
 * product page print the same numbers as the hero above them.
 */
import { CompanyCharts } from "@/components/analytics/company-charts";
import { LeaseSummaryTable } from "@/components/analytics/lease-summary-table";
import { MorningBriefStatic } from "@/components/analytics/morning-brief";
import { ProductionByWellPie } from "@/components/analytics/production-by-well-pie";
import { SummaryStats } from "@/components/analytics/summary-stats";
import { ChartPrefsProvider } from "@/components/charts/chart-prefs-context";
import { dashboardFixture, FIXTURE_TODAY, morningBrief } from "@/lib/screens/dashboard-fixture";
import { ScreenPanel } from "../../panel";

const PATH = "/dashboard";

/** The four cards with the fleet decline already in, as the page shows them once the history has landed. */
function Cards() {
  const fx = dashboardFixture();
  return <SummaryStats {...fx.cards} decline={fx.fleet.annual} />;
}

/** Section 1: the brief at the top of the page. */
export function BriefScreen() {
  const fx = dashboardFixture();
  return (
    <ScreenPanel w={1200} h={210} path={PATH}>
      <MorningBriefStatic text={morningBrief(fx)} />
    </ScreenPanel>
  );
}

/** Section 2: the stat row. */
export function CardsScreen() {
  return (
    <ScreenPanel w={1200} h={190} path={PATH}>
      <Cards />
    </ScreenPanel>
  );
}

/** Section 4: the company chart on Revenue at 12M, the average line on, October shaded as not yet settled. */
export function ChartScreen() {
  const fx = dashboardFixture();
  return (
    <ScreenPanel w={1200} h={520} path={PATH}>
      <ChartPrefsProvider defaultRange="12M" averageLine>
        <CompanyCharts
          data={fx.monthly}
          wells={fx.byWellMonthly}
          dailyByWell={fx.dailyByWell}
          prices={fx.prices}
          leases={fx.chartLeases}
          nriByLease={fx.nriByLease}
          companyNri={fx.companyNri}
          initialView="revenue"
        />
      </ChartPrefsProvider>
    </ScreenPanel>
  );
}

/** Section 5: the Proj. 12-mo decline card over the chart's Oil decline view. */
export function DeclineScreen() {
  const fx = dashboardFixture();
  return (
    <ScreenPanel w={1200} h={700} path={PATH}>
      <div className="flex flex-col gap-4">
        <Cards />
        <CompanyCharts
          data={fx.monthly}
          wells={fx.byWellMonthly}
          dailyByWell={fx.dailyByWell}
          prices={fx.prices}
          leases={fx.chartLeases}
          nriByLease={fx.nriByLease}
          companyNri={fx.companyNri}
          initialView="decline-oil"
        />
      </div>
    </ScreenPanel>
  );
}

/** Section 6: the lease table, Johnson A opened into its four wells. */
export function TableScreen() {
  const fx = dashboardFixture();
  return (
    <ScreenPanel w={1200} h={600} path={PATH}>
      <LeaseSummaryTable
        rows={fx.leaseRows}
        wells={fx.wellRows}
        decline={fx.declineByRow}
        initialExpanded={["l-johnson"]}
        today={FIXTURE_TODAY}
      />
    </ScreenPanel>
  );
}

/** Section 7: the pie on Revenue by lease, in its cell beside the chart. */
export function PieScreen() {
  const fx = dashboardFixture();
  return (
    <ScreenPanel w={1200} h={520} path={PATH}>
      <div className="grid grid-cols-3 items-stretch gap-4">
        <CompanyCharts
          data={fx.monthly}
          wells={fx.byWellMonthly}
          dailyByWell={fx.dailyByWell}
          prices={fx.prices}
          leases={fx.chartLeases}
          nriByLease={fx.nriByLease}
          companyNri={fx.companyNri}
          className="col-span-2"
        />
        <ProductionByWellPie wells={fx.pieWells} leaseByWell={fx.leaseByWell} />
      </div>
    </ScreenPanel>
  );
}
