/**
 * Company digest → markdown.
 *
 * A fourth rendering of the digest, beside the PDF document, the HTML email, and
 * the CSV/XLSX sheets - and, like them, it reads from the same `CompanyDigest`
 * object, so it cannot disagree with them on a number.
 *
 * It carries EVERYTHING the PDF carries. The digest is a composite document, and
 * a text view that quietly dropped the narrative, the exceptions, the pumper
 * summary, or the charts would be the most misleading kind of preview: it looks
 * complete. So:
 *  - narrative, exceptions and comments summary come across as prose and bullets;
 *  - the KPI tiles are the same tiles, from the same `headlineTiles` list the
 *    PDF renders, emitted as a ```kpi fence the renderer turns into cards;
 *  - the charts are the SAME charts: emitted as fenced ```chart blocks that the
 *    markdown renderer draws with the very code the PDF draws them with
 *    (`./chart-elements`), so every bar, axis and legend matches.
 *
 * Pure module (no DOM, no Node) - safe to import anywhere.
 */

import { tableToMarkdown } from "@/lib/export/markdown";
import { CHART_TRAILING_LABEL } from "@/lib/reports/digest/build";
import { CHART_COLORS } from "@/lib/reports/digest/chart-scale";
import {
  NARROW_WIDTH,
  WIDE_WIDTH,
} from "@/lib/reports/digest/chart-elements";
import { wellLabelInLease } from "@/lib/reports/digest/labels";
import { kpiFence } from "@/lib/reports/digest/kpi-embed";
import { headlineTiles, priceTiles } from "@/lib/reports/digest/kpi-tiles";
import {
  chartFence,
  type BarChartSpec,
  type PieChartSpec,
} from "@/lib/reports/digest/chart-embed";
import {
  digestRollupColumns,
  digestWellColumns,
  leaseRollupRows,
} from "@/lib/reports/digest/export";
import type {
  CompanyDigest,
  DigestLeaseSection,
} from "@/lib/reports/digest/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const PERIOD_TITLE: Record<CompanyDigest["period"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

/** A bar chart, drawn by the PDF's own chart code. */
const bar = (spec: Omit<BarChartSpec, "kind">): string =>
  chartFence({ kind: "bar", ...spec });

/** A pie chart with its legend of values and shares, likewise. */
const pie = (spec: Omit<PieChartSpec, "kind">): string =>
  chartFence({ kind: "pie", ...spec });

/** Two charts side by side, as they sit on the PDF's lease page. */
const chartRow = (charts: (BarChartSpec | PieChartSpec)[]): string =>
  chartFence({ kind: "row", charts });

/** A lease's own page: totals line, production chart, well shares, well table. */
function leaseBlocks(
  lease: DigestLeaseSection,
  digest: CompanyDigest,
  includeOilSold: boolean
): string[] {
  const revenueLabel =
    digest.kpis.revenueBasis === "settled" ? "settled" : "est.";
  const totals = [
    `${num0.format(lease.oil)} bbl oil`,
    `${num0.format(lease.gas)} mcf gas`,
    `${num0.format(lease.water)} bbl water`,
    ...(includeOilSold ? [`${num0.format(lease.oilSales)} bbl sold`] : []),
    `${usd.format(lease.revenue)} ${revenueLabel}`,
    `${lease.wells.length} well${lease.wells.length === 1 ? "" : "s"}`,
  ].join(" · ");

  // Wells are allocated by their share of the lease's oil; a lease with no oil
  // this period falls back to revenue, exactly as the PDF's pie does.
  const oilTotal = lease.wells.reduce((s, w) => s + w.oil, 0);
  const byOil = oilTotal > 0;
  const allocation = lease.wells.map((w) => ({
    // The section heading already says the lease; repeating it in every slice
    // label just eats the width the well number needs.
    label: wellLabelInLease(w.wellName, lease.name),
    value: byOil ? w.oil : w.revenue,
  }));

  return [
    `## ${lease.name}`,
    totals,
    // Oil and water share one axis (both barrels, and the ratio is the point);
    // gas is mcf, so it gets its own chart beside the allocation pie.
    bar({
      title: `Oil and water (bbl/day, ${CHART_TRAILING_LABEL[digest.period]})`,
      series: lease.daily.oil,
      color: CHART_COLORS.oil,
      label: "Oil",
      second: {
        series: lease.daily.water,
        color: CHART_COLORS.water,
        label: "Water",
      },
    }),
    chartRow([
      {
        kind: "bar",
        title: `Gas (mcf/day, ${CHART_TRAILING_LABEL[digest.period]})`,
        series: lease.daily.gas,
        color: CHART_COLORS.gas,
        width: WIDE_WIDTH,
      },
      {
        kind: "pie",
        title: byOil
          ? "Well allocation (share of lease oil)"
          : "Well allocation (share of lease revenue)",
        data: allocation,
        format: byOil ? "bbl" : "usd",
        width: NARROW_WIDTH,
      },
    ]),
    tableToMarkdown(
      digestWellColumns(includeOilSold),
      lease.wells.map((w) => ({ ...w, leaseName: lease.name }))
    ),
  ];
}

/** The complete digest as markdown - every block the PDF renders, in its order. */
export function digestToMarkdown(digest: CompanyDigest): string {
  const includeOilSold = digest.period === "monthly";
  const showComments = digest.period === "daily";
  const trailing = CHART_TRAILING_LABEL[digest.period];
  const blocks: string[] = [
    `# ${PERIOD_TITLE[digest.period]} Company Digest`,
    `_${digest.window.label}_`,
  ];

  // Stats first, exactly as the PDF cover opens: the numbers, then the prose
  // that explains them.
  blocks.push(kpiFence(headlineTiles(digest)));
  if (includeOilSold && digest.priceMoves.length > 0) {
    blocks.push(kpiFence(priceTiles(digest.priceMoves)));
  }

  if (digest.summary) {
    blocks.push("## Headline");
    blocks.push(digest.summary);
  }

  // Exceptions: the monthly reports settled fact, so it carries none by design
  // and says nothing rather than showing an empty block.
  if (digest.exceptions.length > 0) {
    blocks.push("## Exceptions");
    blocks.push(digest.exceptions.map((e) => `- ${e.message}`).join("\n"));
  } else if (digest.period !== "monthly") {
    blocks.push("## Exceptions");
    blocks.push(
      "Nothing flagged: every battery is within 20% of its 30-day moving average."
    );
  }

  if (showComments) {
    blocks.push("## What the pumpers reported");
    blocks.push(
      digest.commentsSummary ||
        "No comments were logged by the pumpers for this period."
    );
  }

  blocks.push(`## Production trend (${trailing})`);
  blocks.push(
    bar({
      title: "Oil production (bbl/day)",
      series: digest.charts.oil,
      color: CHART_COLORS.oil,
    })
  );
  blocks.push(
    bar({
      title: "Gas production (mcf/day)",
      series: digest.charts.gas,
      color: CHART_COLORS.gas,
    })
  );
  blocks.push(
    bar({
      title: "Water production (bbl/day)",
      series: digest.charts.water,
      color: CHART_COLORS.water,
    })
  );

  blocks.push("## Revenue by lease");
  if (digest.leases.length === 0) {
    blocks.push(`No production recorded for ${digest.window.label}.`);
  } else {
    blocks.push(
      pie({
        title:
          digest.kpis.revenueBasis === "settled"
            ? "Share of settled revenue"
            : "Share of estimated revenue",
        data: digest.leases.map((l) => ({ label: l.name, value: l.revenue })),
        format: "usd",
      })
    );
    blocks.push("**By lease**");
    blocks.push(
      tableToMarkdown(digestRollupColumns(includeOilSold), leaseRollupRows(digest))
    );
    if (digest.unallocatedRevenue > 0) {
      blocks.push(
        `${usd.format(digest.unallocatedRevenue)} of settled revenue is not attributed to a well (posted without a tank or meter link, so there is no allocation basis). Company revenue is the sum of the leases above plus this amount.`
      );
    }
  }

  for (const lease of digest.leases) {
    blocks.push(...leaseBlocks(lease, digest, includeOilSold));
  }

  return blocks.join("\n\n");
}
