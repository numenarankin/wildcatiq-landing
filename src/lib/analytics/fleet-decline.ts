/**
 * The company's decline: every lease's own curves, summed forward.
 *
 * ## Why not one curve through the company total
 *
 * Eighty leases declining at eighty rates do not add up to one Arps curve. Fit
 * a single hyperbola to their sum and the fit reads the fleet's 2006 peak as the
 * whole story: at t = 20 years the curve has flattened to nothing, and the card
 * says 0.8%/yr for a fleet whose leases are each falling by ten. That is the
 * arithmetic `boe-decline.ts` used to call "the decline of the money"; it is the
 * decline of a twenty-year-old aggregate.
 *
 * ## Why not a weighted average of the leases' declines either
 *
 * Averaging each lease's decline by its share of production is right for the
 * first instant and wrong for every month after: a lease falling 40%/yr is a
 * smaller share of the fleet by next spring, and a fixed-weight average keeps
 * pretending it is not. It overstates.
 *
 * ## What this does instead
 *
 *   1. One Arps fit per lease per commodity — a lease's oil and its gas are two
 *      curves, not one.
 *   2. Each curve at its own fitted level, through the months it was fitted
 *      on and past today. It used to be re-anchored at the stream's 14-day
 *      EMA ("the field gives the level"), which put a step at today equal to
 *      whatever a few days' gauges were off the monthly trend — a quarter, on
 *      a day three wells dipped — and the forecast ran from that dip for five
 *      years. The 24hr card already says what the field is making now.
 *   3. Project every curve forward month by month and SUM them, in priced
 *      barrels (gas at the gas:oil price ratio, `./boe`).
 *   4. The company's decline is the decline of that sum:
 *      `1 − Σqᵢ(12 mo) / Σqᵢ(0)`.
 *
 * So it IS the decline of the blend — never an average of rates — but the blend
 * is assembled from correctly fitted parts, and it re-weights itself as the
 * parts diverge. Under exponential declines the first year equals the
 * production-weighted average exactly and every later year is lower, which is
 * the mix shift the fixed-weight average cannot see.
 *
 * ## Streams with no curve
 *
 * A stream too young to fit (fewer than six post-peak months) still produces.
 * It is EXCLUDED from the blend, not held flat: a flat line is a decline claim
 * of 0%/yr made on no evidence, and it drags the fleet's number toward nothing
 * in proportion to how little is known. What is known instead is reported as
 * `coverage`: the share of current production the number actually describes.
 *
 * Pure. The loader that assembles each stream's series and current rate is
 * `./company-decline`; the tests here hand-build streams whose answer is known.
 */

import { gasBarrelsPerMcf } from "@/lib/analytics/boe";
import type { CommodityPrices } from "@/lib/analytics/types";
import { monthOrdinal, ordinalToYm } from "@/lib/charts/decline-rows";
import {
  completeMonths,
  curveStartT,
  fitDecline,
  project,
  type MonthlyRate,
} from "@/lib/wells/arps";

export type FleetStream = "oil" | "gas";

/**
 * How far the fleet is projected, in months.
 *
 * Five years, against the eighteen months a single facility's chart uses. The
 * company curve is read as a forecast — where the fleet is heading, not what it
 * did — and a year and a half of tail does not answer that.
 */
export const FLEET_PROJECTION_MONTHS = 60;

/**
 * How far BEHIND the anchor the fleet's curves are drawn, at most, in months.
 *
 * The same anchored curves the projection sums forward, evaluated over the
 * months they are defined on (from each stream's trough, or its peak when it
 * did not ramp) and summed, so the chart shows where the fitted curves came
 * from as well as where they go, with the inclines in. Ten years: the chart
 * opens on five years of history and a reader widening it wants more, but a
 * fleet with a 2006 peak would otherwise ship two decades of per-unit arrays.
 */
export const FLEET_HISTORY_MONTHS = 120;

/**
 * A stream with no filed month in this many months before the anchor is not
 * producing, whatever its curve says, and is not projected.
 *
 * The curve's level at today is the FIT's (see the header), and a fit does
 * not know a well died: a gas stream that stopped last December was still
 * being carried forward at 5 MCF/d from a curve that ended at 5.8. The 14-day
 * EMA does know, but it is a tail that takes months to read as zero (0.1 on
 * that stream), so `current > 0` let it through. Three months: a well gauged
 * monthly can be two months between filings at the turn of a month.
 */
export const FLEET_STALE_MONTHS = 3;



/** One commodity from one lease (or one unassigned well): what the fit reads. */
export interface UnitStream {
  /** The lease or well it belongs to; a label, never dereferenced. */
  unit: string;
  stream: FleetStream;
  /** The monthly rate series the curve is fitted over, oldest first. */
  rates: MonthlyRate[];
  /** What the stream is making now — its 14-day EMA, bbl/d or MCF/d. */
  current: number;
  /**
   * The operator's net revenue interest in the unit (0..1). The weight a
   * stream carries in the priced sum is its dollars times this, so the fleet
   * figure is the decline of the operator's NET revenue: a well on a lease
   * they keep 80% of counts four times one they keep 20% of. Omitted = 1
   * (a single unit's ratio is unchanged by any constant, so a well or lease
   * page need not supply it).
   */
  nri?: number;
  /**
   * What a unit of this stream sells for on ITS lease: $/bbl for oil, $/MCF
   * for gas, the lease's realized price. The weight a stream carries is its
   * revenue (`current × price × nri`), so two gas wells making the same MCF
   * count 2:1 when one's lease settles at $8 and the other's at $4. Omitted =
   * the fleet-wide price passed to {@link fleetDecline}.
   */
  price?: number;
}

/** A month's projected fleet rate, and the decline read off the curve there. */
export interface FleetMonth {
  /** ISO `YYYY-MM`. */
  month: string;
  /** Σ of the streams' projected rates, in the stream's unit (BOE for `boe`). */
  rate: number;
  /**
   * The decline of the sum over the twelve months AFTER this one, as a fraction,
   * or null past the point the projection can see a year ahead.
   */
  decline: number | null;
}

/** One unit's fitted streams: the anchor and a year on in NET revenue, and the whole run per stream. */
export interface UnitProjection {
  /** Net revenue/day at the anchor, and a year on: `Σ nri × rate × price` over its streams. */
  q0: number;
  q12: number;
  /**
   * The unit's projected rate per stream, in that stream's OWN unit and GROSS,
   * month by month from the anchor — `months + 12` entries, like the fleet's
   * sums — so a lease's curve can be drawn ({@link unitProjection}) against
   * the measured rates without the client holding the series it was fitted
   * from. Gross because the chart plots it over gross measurements.
   */
  oil: number[];
  gas: number[];
  /**
   * The unit's NET revenue per day, month by month, in the same barrel
   * equivalents the fleet's `boe` run uses — so a sum of units' rows
   * ({@link unitProjection}) is the fleet's own arithmetic over fewer units.
   */
  net: number[];
  /**
   * The same curves BEHIND the anchor, one entry per month from `start` (the
   * fleet's, {@link FLEET_HISTORY_MONTHS} back at most), zero before a
   * stream's own curve begins. `curveStart` is where each of the unit's
   * fitted streams begins (its trough, or its peak when it did not ramp), so
   * a sum of units ({@link unitHistory}) can start where EVERY curve in it
   * exists. The arrays run twelve months past the anchor too, so each
   * history month's decline is read on the curves' own continuation.
   */
  history: {
    start: string;
    oil: number[];
    gas: number[];
    net: number[];
    curveStart: Partial<Record<FleetStream, string>>;
  };
  /** The unit's interest, kept for the row's own display. */
  nri: number;
}

export interface FleetDecline {
  /**
   * The card's number: `1 − Σq(12)/Σq(0)` over NET priced barrels (each
   * stream's dollars times its unit's NRI). Null when no stream both fits and
   * produces.
   */
  annual: number | null;
  /**
   * Each unit's own share of the sum, keyed by `UnitStream.unit`, fitted streams
   * only — so a lease's decline is read the same way the fleet's is
   * ({@link unitDecline}), and the rows of a table add up to the card above it.
   */
  byUnit: Record<string, UnitProjection>;
  /** Share (0..1) of current priced production that a fitted curve describes. */
  coverage: number;
  /** Unit-streams with production now, and how many of them fitted a curve. */
  producing: number;
  fitted: number;
  /**
   * The projected fleet, month by month from `anchorMonth`. `oil` and `gas`
   * are GROSS in their own units (drawn over measured rates); `boe` is NET
   * priced barrels, the series `annual` is read off.
   */
  projection: Record<FleetStream | "boe", FleetMonth[]>;
  /**
   * The CURRENT LEG behind the anchor: the same per-well curves, summed,
   * from the month every fitted stream's curve exists — the latest of their
   * troughs and peaks — to the month before `anchorMonth`. That is the leg
   * today is on, and the only months the per-well sum describes in full; a
   * sum drawn earlier is a well short of the fleet. What came before it is
   * the chart's to model as a few regimes of the summed series
   * (`@/lib/wells/segments`), pinned to this leg's first month. Empty when
   * no curve reaches behind the anchor. Each month's `decline` is read over
   * the twelve after it.
   */
  history: Record<FleetStream | "boe", FleetMonth[]>;
  /** The month the projection starts at — the current calendar month. */
  anchorMonth: string;
}

/** A stream with a curve and a level, ready to be summed. */
interface Anchored {
  unit: string;
  stream: FleetStream;
  /** Rate at the anchor month, in the stream's own unit. */
  level: number;
  /** `t` (years from the fit's start) at the anchor month. */
  tNow: number;
  fit: NonNullable<ReturnType<typeof fitDecline>>;
  /** `price × nri ÷ fleet oil price`: a unit of this stream as net barrel equivalents. */
  weight: number;
  /** Month ordinal of the fit's peak (t = 0). */
  startOrd: number;
  /** Month ordinal the curve is defined from: the trough with an incline, else the peak. */
  curveStartOrd: number;
}

/**
 * @param now the date the projection is anchored on; the current calendar month.
 * @param months how many months forward to project. Twelve more are computed so
 *   the last projected month still has a decline to read.
 */
export function fleetDecline(
  streams: UnitStream[],
  prices: CommodityPrices | undefined,
  now: Date,
  months: number
): FleetDecline {
  const anchorMonth = now.toISOString().slice(0, 7);
  const anchorOrd = monthOrdinal(anchorMonth);
  /*
   * Everything is weighed in REVENUE: a stream's rate times what its own lease
   * sells that stream for, net of the operator's interest. Expressed in barrel
   * equivalents at the fleet oil price so the `boe` run keeps the scale the
   * chart has always drawn; the constant cancels in every ratio. A stream with
   * no price of its own takes the fleet-wide one, and with no prices at all
   * gas is worth the usual fallback fraction of a barrel (`gasBarrelsPerMcf`).
   */
  const oilPerBbl = prices?.oilPerBbl != null && prices.oilPerBbl > 0 ? prices.oilPerBbl : 1;
  const fleetPrice = (stream: FleetStream) =>
    stream === "oil" ? oilPerBbl : oilPerBbl * gasBarrelsPerMcf(prices);
  const weightOf = (s: UnitStream) =>
    ((s.price != null && Number.isFinite(s.price) && s.price >= 0 ? s.price : fleetPrice(s.stream)) /
      oilPerBbl) *
    nriOf(s);
  /** A stream's weight at a rate: its net revenue, in barrel equivalents. */
  const netBarrels = (s: UnitStream, rate: number) => rate * weightOf(s);

  const anchored: Anchored[] = [];
  const byUnit: Record<string, UnitProjection> = {};
  let producing = 0;
  let producingWeight = 0;
  let fittedWeight = 0;

  for (const s of streams) {
    if (!(s.current > 0)) continue; // nothing now → no weight, whatever its past
    const lastOrd = s.rates.length > 0 ? monthOrdinal(s.rates[s.rates.length - 1].month) : -Infinity;
    if (anchorOrd - lastOrd > FLEET_STALE_MONTHS) continue; // not producing (see `FLEET_STALE_MONTHS`)
    producing += 1;
    producingWeight += netBarrels(s, s.current);

    /*
     * THE MONTH IN PROGRESS IS NOT FITTED. On the 1st it is one day of gauges
     * averaged as if it were a month, and the despike then judges it against
     * whole months with nothing on its far side; as the month fills in that
     * value drifts, and on the next 1st the whole edge reshuffles. Measured
     * on a real fleet: the company figure moved by hundredths of a point on
     * an ordinary day and 1.3 points at the month boundary, with one
     * short-history lease going 17% to 5% overnight. The curve is fitted on
     * complete months; the anchor still reads the latest days (`current`).
     */
    const fitted = completeMonths(s.rates, anchorMonth);
    const fit = fitDecline(fitted);
    if (!fit) continue;

    const startOrd = monthOrdinal(fit.startMonth);
    const tNow = Math.max(0, (anchorOrd - startOrd) / 12);
    const level = project(fit, tNow);
    if (!(level > 0)) continue;

    anchored.push({
      unit: s.unit,
      stream: s.stream,
      level,
      tNow,
      fit,
      weight: weightOf(s),
      startOrd,
      curveStartOrd: startOrd + Math.round(curveStartT(fit) * 12),
    });
    // The same quantity as the denominator, so coverage is a share of what is
    // produced now — not of what the curves say it will have fallen to.
    fittedWeight += netBarrels(s, s.current);
    const u = (byUnit[s.unit] ??= {
      q0: 0,
      q12: 0,
      oil: [],
      gas: [],
      net: [],
      history: { start: anchorMonth, oil: [], gas: [], net: [], curveStart: {} },
      nri: nriOf(s),
    });
    u.q0 += netBarrels(s, level);
    u.q12 += netBarrels(s, level * (project(fit, tNow + 1) / project(fit, tNow)));
  }

  // Twelve past the asked span, so `decline` is defined on every asked month.
  const span = months + 12;
  const sum = { oil: new Array<number>(span + 1).fill(0), gas: new Array<number>(span + 1).fill(0) };
  // The priced sum, net: what `annual` is read off.
  const net = new Array<number>(span + 1).fill(0);
  // Each unit's curves behind the anchor, over one shared span: from the
  // earliest curve start, capped. The fleet's leg is their sum from the
  // LATEST curve start (`unitHistory`).
  const earliest = anchored.reduce((e, a) => Math.min(e, a.curveStartOrd), anchorOrd);
  const back = Math.min(anchorOrd - earliest, FLEET_HISTORY_MONTHS);
  const from = anchorOrd - back;
  for (const u of Object.values(byUnit)) {
    u.oil = new Array<number>(span + 1).fill(0);
    u.gas = new Array<number>(span + 1).fill(0);
    u.net = new Array<number>(span + 1).fill(0);
    u.history = {
      start: ordinalToYm(from),
      oil: new Array<number>(back + 12).fill(0),
      gas: new Array<number>(back + 12).fill(0),
      net: new Array<number>(back + 12).fill(0),
      curveStart: {},
    };
  }
  for (const a of anchored) {
    const base = project(a.fit, a.tNow);
    const unit = byUnit[a.unit];
    for (let k = 0; k <= span; k++) {
      const q = a.level * (project(a.fit, a.tNow + k / 12) / base);
      sum[a.stream][k] += q;
      unit[a.stream][k] += q;
      unit.net[k] += q * a.weight;
      net[k] += q * a.weight;
    }
    // The same curve over the months before the anchor that it is defined on.
    const cs = unit.history.curveStart[a.stream];
    const csOrd = Math.max(a.curveStartOrd, from);
    if (cs == null || monthOrdinal(cs) < csOrd) unit.history.curveStart[a.stream] = ordinalToYm(csOrd);
    for (let o = csOrd; o < anchorOrd + 12; o++) {
      const i = o - from;
      const q = project(a.fit, (o - a.startOrd) / 12);
      unit.history[a.stream][i] += q;
      unit.history.net[i] += q * a.weight;
    }
  }
  const projection = fleetMonths({ oil: [], gas: [] }, [], sum, net, anchorMonth, months).projection;
  const history = unitHistory({ byUnit, anchorMonth }, Object.keys(byUnit));
  return {
    annual: anchored.length > 0 ? projection.boe[0].decline : null,
    byUnit,
    coverage: producingWeight > 0 ? fittedWeight / producingWeight : 0,
    producing,
    fitted: anchored.length,
    projection,
    history,
    anchorMonth,
  };
}

/**
 * Raw per-stream runs — the months behind the anchor, then the `months + 12`
 * from it — as chart series, BOE at the price ratio, each month carrying the
 * decline of the twelve after it, read across the anchor so the last history
 * months have one too.
 */
function fleetMonths(
  past: { oil: number[]; gas: number[] },
  /** The net priced-barrel run behind the anchor, already summed by the caller. */
  pastBoe: number[],
  raw: { oil: number[]; gas: number[] },
  /** The net priced-barrel run from the anchor, already summed by the caller. */
  boe: number[],
  anchorMonth: string,
  months: number
): { history: Record<FleetStream | "boe", FleetMonth[]>; projection: Record<FleetStream | "boe", FleetMonth[]> } {
  const anchorOrd = monthOrdinal(anchorMonth);
  const series = (before: number[], after: number[]) => {
    const all = [...before, ...after];
    const at = (i: number): FleetMonth => ({
      month: ordinalToYm(anchorOrd - before.length + i),
      rate: all[i],
      decline: i + 12 < all.length && all[i] > 0 ? 1 - all[i + 12] / all[i] : null,
    });
    const history: FleetMonth[] = [];
    for (let i = 0; i < before.length; i++) history.push(at(i));
    const projection: FleetMonth[] = [];
    for (let i = before.length; i < before.length + months + 1 && i < all.length; i++) {
      projection.push(at(i));
    }
    return { history, projection };
  };
  const oil = series(past.oil, raw.oil);
  const gas = series(past.gas, raw.gas);
  const b = series(pastBoe, boe);
  return {
    history: { oil: oil.history, gas: gas.history, boe: b.history },
    projection: { oil: oil.projection, gas: gas.projection, boe: b.projection },
  };
}

/** A stream's interest, 1 when the caller did not say. */
function nriOf(s: Pick<UnitStream, "nri">): number {
  return s.nri == null || !Number.isFinite(s.nri) ? 1 : s.nri;
}

/** The unit key `company-decline` files a well under. */
export function wellUnitKey(wellId: string): string {
  return `well:${wellId}`;
}

/**
 * The unit keys behind one dashboard row: its wells'. A lease row is its
 * wells summed, and the unassigned row is the unassigned wells summed, so both
 * are the same call over a different list.
 */
export function wellUnitKeys(wellIds: readonly string[]): string[] {
  return wellIds.map(wellUnitKey);
}

/**
 * Some units' projection as chart series — a lease's curve on the company
 * chart, read off the same runs the fleet's is, so isolating a lease shows a
 * piece of the fleet curve rather than a refit. Empty series when none of the
 * units fitted a stream.
 */
export function unitProjection(
  fleet: Pick<FleetDecline, "byUnit" | "anchorMonth" | "projection">,
  units: string[]
): Record<FleetStream | "boe", FleetMonth[]> {
  const parts = units.map((u) => fleet.byUnit[u]).filter((p): p is UnitProjection => p != null);
  if (parts.length === 0) return { oil: [], gas: [], boe: [] };
  const { raw, net } = unitProjectionRuns(parts);
  const none = { oil: [], gas: [] };
  return fleetMonths(none, [], raw, net, fleet.anchorMonth, fleet.projection.boe.length - 1).projection;
}

/** Some units' runs from the anchor, summed per stream and in net barrels. */
function unitProjectionRuns(parts: UnitProjection[]): {
  raw: { oil: number[]; gas: number[] };
  net: number[];
} {
  const span = parts[0].oil.length;
  const raw = { oil: new Array<number>(span).fill(0), gas: new Array<number>(span).fill(0) };
  const net = new Array<number>(span).fill(0);
  for (const p of parts) {
    for (let k = 0; k < span; k++) {
      raw.oil[k] += p.oil[k] ?? 0;
      raw.gas[k] += p.gas[k] ?? 0;
      net[k] += p.net[k] ?? 0;
    }
  }
  return { raw, net };
}

/**
 * Some units' current leg BEHIND the anchor, summed — the history half of
 * {@link unitProjection} — per stream from the latest of the units' curve
 * starts in that stream, and for `boe` from the latest in either, so every
 * month of it has every curve in it. Empty series when none of the units
 * fitted a stream, or none of their curves reaches behind the anchor.
 */
export function unitHistory(
  fleet: Pick<FleetDecline, "byUnit" | "anchorMonth">,
  units: string[]
): Record<FleetStream | "boe", FleetMonth[]> {
  const parts = units.map((u) => fleet.byUnit[u]).filter((p): p is UnitProjection => p != null);
  if (parts.length === 0) return { oil: [], gas: [], boe: [] };
  const run = parts[0].history.oil.length;
  const back = run - 12; // the last twelve are the curves' own months past the anchor, for the declines
  const from = monthOrdinal(parts[0].history.start);
  const past = { oil: new Array<number>(run).fill(0), gas: new Array<number>(run).fill(0) };
  const net = new Array<number>(run).fill(0);
  const latest: Record<FleetStream, number> = { oil: -Infinity, gas: -Infinity };
  for (const p of parts) {
    for (let i = 0; i < run; i++) {
      past.oil[i] += p.history.oil[i] ?? 0;
      past.gas[i] += p.history.gas[i] ?? 0;
      net[i] += p.history.net[i] ?? 0;
    }
    for (const s of ["oil", "gas"] as const) {
      const cs = p.history.curveStart[s];
      if (cs != null) latest[s] = Math.max(latest[s], monthOrdinal(cs));
    }
  }
  const cut = (xs: number[], startOrd: number) => {
    const i = Number.isFinite(startOrd) ? Math.max(0, startOrd - from) : back;
    return { before: xs.slice(i, back), after: xs.slice(back) };
  };
  const oil = cut(past.oil, latest.oil);
  const gas = cut(past.gas, latest.gas);
  const boeStart = Math.max(...(["oil", "gas"] as const).filter((s) => Number.isFinite(latest[s])).map((s) => latest[s]));
  const b = cut(net, boeStart);
  const series = (before: number[], after: number[]) =>
    fleetMonths({ oil: before, gas: [] }, [], { oil: after, gas: [] }, [], fleet.anchorMonth, 0).history.oil;
  return { oil: series(oil.before, oil.after), gas: series(gas.before, gas.after), boe: series(b.before, b.after) };
}

/**
 * The decline of some units' sum — one lease's row, or the unassigned wells'
 * row, read off the same projections the fleet number is. Null when none of
 * them has a fitted stream, which is a dash rather than a zero.
 */
export function unitDecline(
  byUnit: Record<string, UnitProjection>,
  units: string[]
): number | null {
  let q0 = 0;
  let q12 = 0;
  for (const u of units) {
    const p = byUnit[u];
    if (!p) continue;
    q0 += p.q0;
    q12 += p.q12;
  }
  return q0 > 0 ? 1 - q12 / q0 : null;
}
