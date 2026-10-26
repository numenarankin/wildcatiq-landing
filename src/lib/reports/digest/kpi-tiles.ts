/**
 * The digest's headline stat tiles, defined once for every surface that shows
 * them.
 *
 * The tiles open the digest - production, water, oil sold, revenue, and on the
 * monthly the realized-vs-benchmark prices - and they are the first thing an
 * owner reads, so what a tile says and how its move is coloured cannot differ
 * between the PDF and the in-app rendering. Both build from this list; the PDF
 * draws them as `<View>` tiles, the markdown view emits them as a `kpi` fence
 * (see `./kpi-embed`), and the narrator reads them as the opening sentences.
 *
 * Pure module (no DOM, no Node) - safe to import anywhere.
 */

import type {
  CompanyDigest,
  DigestPriceMove,
  KpiDelta,
} from "@/lib/reports/digest/types";

/** Which way a tile's move reads: good, bad, or nothing to compare against. */
export type KpiTone = "up" | "down" | "flat";

export interface KpiTile {
  label: string;
  value: string;
  /** The small line under the value ("+8% vs prior"); "" when there is none. */
  note: string;
  tone: KpiTone;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/**
 * "+8% vs prior", or "no prior" when there is nothing to compare against, with
 * the window's coverage appended whenever it is not whole.
 *
 * The percentage is a rate per REPORTED day (see `KpiDelta.changePct`), so a
 * thin window no longer reads as a collapse - but the TOTAL beside it is still
 * only the days that were reported, and a reader comparing this week's barrels
 * to last week's in their head deserves to know the week is half entered.
 */
function deltaNote(d: KpiDelta): string {
  const move =
    d.changePct == null
      ? "no prior"
      : `${d.changePct >= 0 ? "+" : ""}${Math.round(d.changePct)}% vs prior`;
  const thin =
    d.measuredDays != null &&
    d.windowDays != null &&
    d.windowDays > 0 &&
    d.measuredDays < d.windowDays;
  return thin ? `${move} · ${d.measuredDays} of ${d.windowDays} days reported` : move;
}

function toneOf(pct: number | null): KpiTone {
  if (pct == null || Math.round(pct) === 0) return "flat";
  return pct > 0 ? "up" : "down";
}

const tile = (label: string, value: string, d: KpiDelta): KpiTile => ({
  label,
  value,
  note: deltaNote(d),
  tone: toneOf(d.changePct),
});

/** The headline row: volumes, then revenue on the digest's own basis. */
export function headlineTiles(digest: CompanyDigest): KpiTile[] {
  const k = digest.kpis;
  // Oil sold is only meaningful where settlements underlie it (monthly).
  const includeOilSold = digest.period === "monthly";
  return [
    tile("Oil", `${num0.format(k.oil.value)} bbl`, k.oil),
    tile("Gas", `${num0.format(k.gas.value)} mcf`, k.gas),
    tile("Water", `${num0.format(k.water.value)} bbl`, k.water),
    ...(includeOilSold
      ? [tile("Oil Sold", `${num0.format(k.oilSales.value)} bbl`, k.oilSales)]
      : []),
    tile(
      k.revenueBasis === "settled" ? "Revenue (settled)" : "Revenue (est.)",
      usd.format(k.revenue.value),
      k.revenue
    ),
  ];
}

/**
 * Realized price against the commodity benchmark - the differential the operator
 * actually captured. Monthly only, where settled statements make it a fact.
 *
 * The note is deliberately NOT a "vs prior" line: these percentages compare
 * realized against BENCHMARK, and labelling that "vs prior" would be a wrong
 * number stated with a straight face.
 */
export function priceTiles(moves: DigestPriceMove[]): KpiTile[] {
  return moves.map((m) => ({
    label: `${m.product === "oil" ? "Oil" : "Gas"} realized / benchmark`,
    value: `${usd2.format(m.average)} / ${usd2.format(m.benchmarkAverage)}`,
    note:
      m.realizedVsBenchmarkPct == null
        ? ""
        : `${m.realizedVsBenchmarkPct >= 0 ? "+" : ""}${Math.round(m.realizedVsBenchmarkPct)}% vs benchmark`,
    tone: toneOf(m.realizedVsBenchmarkPct),
  }));
}
