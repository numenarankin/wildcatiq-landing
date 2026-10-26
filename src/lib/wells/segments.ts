/**
 * A monthly series as a FEW curves, one per regime, decided backward from a
 * known end.
 *
 * The dashboard draws the fleet's current leg from its wells' own curves
 * summed. Everything before that leg is history the per-well curves do not
 * describe, and it is not a line traced through the months (that is the data
 * again, not a model): it is one function per regime, with a kink only at a
 * genuine turn. A fleet that climbed in 2022, fell through 2023, sat on a
 * floor through 2024 and ramped in 2025 is four functions, and a gas fleet
 * that only ever declined is none, because its current leg is its whole life.
 *
 * Decided BACKWARD because the last leg is given — where the per-well curves
 * begin, and at what level — and each earlier regime ends where the later one
 * begins. The turns are found first (`turningPoints`), then each regime gets
 * its function (`segmentedCurve`), pinned at its end to the level the next
 * regime starts at so the curve is continuous and only kinks.
 *
 * Pure, like `arps.ts`; runs on the client over the series the chart has.
 */

import { monthOrdinal, ordinalToYm } from "@/lib/charts/decline-rows";
import {
  despikeHampel,
  fitArpsSweep,
  HAMPEL_K,
  HAMPEL_WINDOW,
  type MonthlyRate,
} from "@/lib/wells/arps";

export type RegimeKind = "incline" | "decline" | "flat";

/** One regime: the months it spans and the function fitted over them. */
export interface Regime {
  kind: RegimeKind;
  /** First month, `YYYY-MM`. */
  from: string;
  /** The month the NEXT regime starts, `YYYY-MM` (exclusive end). */
  to: string;
  /** Rate at `from`. */
  startLevel: number;
  /** Rate at `to`: the next regime's start level. */
  endLevel: number;
  /** The fitted function's own parameters, by kind. */
  params:
    | { kind: "decline"; qi: number; Di: number; b: number }
    | { kind: "incline"; q0: number; k: number; m: number; years: number }
    | { kind: "flat"; level: number };
}

/**
 * A regime must span this many months. A turn needs a quarter on each side
 * to be a turn and not a bad month; a regime of two months is a wobble.
 */
export const MIN_REGIME_MONTHS = 6;

/**
 * A turn has to move the level by this much, as a fraction, to be a regime
 * of its own. The scatter test below is enough on a noisy oil series; on a
 * gas fleet whose gauges agree to three percent month to month, a shelf two
 * percent off the decline through it passed as a regime, and the user is
 * right that a two percent shelf is not a turn. So a regime must either
 * move the level a tenth or be where a tenth's worth of misfit is avoided.
 */
export const MAJOR_TURN = 0.1;

/**
 * A regime is a floor when its slope is not distinguishable from zero: the
 * fitted log slope within two standard errors of nothing, given the series'
 * own scatter. A fraction would not do — a gas fleet easing nine percent
 * over four years is a decline, a floor drifting fifteen percent in ten
 * noisy months is not — and the standard error knows the difference.
 */
export const FLAT_T = 2;

/**
 * Two neighbouring pieces of one kind merge into one regime when their
 * slopes are within this factor: two falls at the same pace are one decline
 * and Arps has the curvature for one easing. A cliff into a floor is not
 * that; the floor keeps its own function, and when it moves less than
 * {@link MAJOR_TURN} over its months it is called the floor it is.
 */
export const SLOPE_ALIKE = 3;

const MAD_TO_SIGMA = 1.4826;

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Robust sigma of a series' month-to-month log change: the gauge noise. */
export function scatter(lnq: readonly number[]): number {
  const d: number[] = [];
  for (let i = 1; i < lnq.length; i++) d.push(lnq[i] - lnq[i - 1]);
  if (d.length === 0) return 0;
  const med = median(d);
  return (MAD_TO_SIGMA * median(d.map((x) => Math.abs(x - med)))) / Math.SQRT2;
}

/** Least-squares line of y on x over [lo, hi): its squared residual, slope and intercept. */
function lineFit(x: readonly number[], y: readonly number[], lo: number, hi: number) {
  const n = hi - lo;
  let sx = 0;
  let sy = 0;
  for (let i = lo; i < hi; i++) {
    sx += x[i];
    sy += y[i];
  }
  const xBar = sx / n;
  const yBar = sy / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = lo; i < hi; i++) {
    sxy += (x[i] - xBar) * (y[i] - yBar);
    sxx += (x[i] - xBar) ** 2;
  }
  const m = sxx > 0 ? sxy / sxx : 0;
  const a = yBar - m * xBar;
  let sse = 0;
  for (let i = lo; i < hi; i++) sse += (y[i] - (a + m * x[i])) ** 2;
  return { sse, m, a, sxx };
}

/**
 * Where the series turns: the boundaries (indices into `rates`) of the few
 * log-linear pieces that describe it, each at least {@link MIN_REGIME_MONTHS}
 * long, chosen by dynamic programming over the squared log residual with a
 * BIC penalty per extra piece (two parameters each), so a piece has to earn
 * its place against the series' own scatter. Then adjacent pieces of one
 * kind are merged: two falls in a row are one decline, and a decline's
 * curvature is Arps's to fit, not a second line's.
 *
 * Returns the start index of each piece, ascending, always beginning at 0.
 */
export function turningPoints(rates: readonly MonthlyRate[]): number[] {
  const n = rates.length;
  if (n < MIN_REGIME_MONTHS) return [0];
  const x = rates.map((r) => monthOrdinal(r.month) / 12);
  const y = despiked(rates);
  const sigma = scatter(y);
  const turn = Math.log(1 + MAJOR_TURN);
  const penalty = Math.max(2 * Math.log(n) * sigma * sigma, MIN_REGIME_MONTHS * turn * turn);

  // best[i] = least penalised cost of describing [0, i); prev[i] = the start
  // of the last piece in that description.
  const best = new Array<number>(n + 1).fill(Infinity);
  const prev = new Array<number>(n + 1).fill(0);
  best[0] = 0;
  for (let i = MIN_REGIME_MONTHS; i <= n; i++) {
    for (let j = 0; j + MIN_REGIME_MONTHS <= i; j++) {
      if (j > 0 && j < MIN_REGIME_MONTHS) continue;
      if (best[j] === Infinity) continue;
      const cost = best[j] + lineFit(x, y, j, i).sse + (j > 0 ? penalty : 0);
      if (cost < best[i]) {
        best[i] = cost;
        prev[i] = j;
      }
    }
  }
  const starts: number[] = [];
  for (let i = n; i > 0; i = prev[i]) starts.unshift(prev[i]);

  // Merge neighbours of one kind and comparable slope (`SLOPE_ALIKE`).
  const pieceOf = (lo: number, hi: number) => {
    const f = lineFit(x, y, lo, hi);
    return { kind: classify(f, sigma), m: f.m };
  };
  // Rises merge whatever their pace: a steep rise easing into its peak is
  // the one logistic ramp, and splitting it is the over-segmentation this
  // module exists to stop.
  const alike = (a: { kind: RegimeKind; m: number }, b: { kind: RegimeKind; m: number }) =>
    a.kind === b.kind &&
    (a.kind !== "decline" ||
      (Math.abs(a.m) <= SLOPE_ALIKE * Math.abs(b.m) && Math.abs(b.m) <= SLOPE_ALIKE * Math.abs(a.m)));
  let merged = starts;
  for (;;) {
    let changed = false;
    const next: number[] = [merged[0]];
    for (let k = 1; k < merged.length; k++) {
      const a = pieceOf(next[next.length - 1], merged[k]);
      const b = pieceOf(merged[k], k + 1 < merged.length ? merged[k + 1] : n);
      if (alike(a, b)) changed = true;
      else next.push(merged[k]);
    }
    merged = next;
    if (!changed) break;
  }
  return merged;
}

/** Rise, fall or floor: the regime's log slope against its standard error. */
function classify(line: { m: number; sxx: number }, sigma: number): RegimeKind {
  const se = line.sxx > 0 ? sigma / Math.sqrt(line.sxx) : Infinity;
  if (Math.abs(line.m) <= FLAT_T * se) return "flat";
  return line.m > 0 ? "incline" : "decline";
}

/** Log rates with lone spike months pulled to their neighbours, as the fitter sees them. */
function despiked(rates: readonly MonthlyRate[]): number[] {
  return despikeHampel(
    rates.map((r) => r.rate),
    HAMPEL_WINDOW,
    HAMPEL_K
  ).map((v) => Math.log(v));
}

const sigmoid = (v: number) => 1 / (1 + Math.exp(-v));

function arpsRaw(qi: number, Di: number, b: number, t: number): number {
  if (b <= 1e-9) return qi * Math.exp(-Di * t);
  return qi / Math.pow(1 + b * Di * t, 1 / b);
}

/**
 * One function per regime over `rates`, decided backward from `endMonth`
 * (exclusive: the first month of the leg that follows, which is NOT fitted
 * here) at `endLevel`, the level that leg starts at.
 *
 * Each regime is fitted to ITS OWN months: a floor is the mean of them, a
 * decline is Arps over them, an incline is the logistic ramp between its
 * first and last quarter. Only the last regime is pinned, at its end, to
 * `endLevel`, so the curve meets the per-well leg. Regimes are not pinned to
 * each other: where the series turned smoothly their fits meet within the
 * noise, and where it fell off a cliff — sixty to forty-one in a month —
 * the step is what happened, and a curve bent to hide it is wrong on both
 * sides of it. Empty when there are too few months before `endMonth` for one
 * regime.
 */
export function segmentedCurve(
  rates: readonly MonthlyRate[],
  endMonth: string,
  endLevel: number
): Regime[] {
  const endOrd = monthOrdinal(endMonth);
  const before = rates
    .filter((r) => r.rate > 0 && monthOrdinal(r.month) < endOrd)
    .sort((a, b) => (a.month < b.month ? -1 : 1));
  if (before.length < MIN_REGIME_MONTHS || !(endLevel > 0)) return [];

  const starts = turningPoints(before);
  const x = before.map((r) => monthOrdinal(r.month) / 12);
  const y = despiked(before);
  const sigma = scatter(y);
  const n = starts.length;
  const quarter = (lo: number, hi: number) => Math.exp(mean(y.slice(lo, hi)));
  const bounds = starts.map((lo, i) => ({ lo, hi: i + 1 < n ? starts[i + 1] : before.length }));
  const lines = bounds.map(({ lo, hi }) => lineFit(x, y, lo, hi));
  /*
   * A regime's kind is its slope against its standard error, with one
   * reading for context: a gentle stretch that moves less than `MAJOR_TURN`
   * beside a steep neighbour of the same sign is the floor the user sees
   * after a cliff, not a second decline — while a lone gentle fall over four
   * years, a gas fleet easing nine percent, is the decline it is.
   */
  const kinds = lines.map((line, i) => {
    const kind = classify(line, sigma);
    if (kind === "flat") return kind;
    const change = Math.abs(line.m * (x[bounds[i].hi - 1] - x[bounds[i].lo]));
    const steepNeighbour = [lines[i - 1], lines[i + 1]].some(
      (nb) => nb != null && Math.sign(nb.m) === Math.sign(line.m) && Math.abs(nb.m) >= SLOPE_ALIKE * Math.abs(line.m)
    );
    return change <= Math.log(1 + MAJOR_TURN) && steepNeighbour ? "flat" : kind;
  });

  const regimes: Regime[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const { lo, hi } = bounds[i];
    const last = i === n - 1;
    const kind = kinds[i];
    const from = before[lo].month;
    const to = last ? endMonth : before[hi].month;
    const years = (monthOrdinal(to) - monthOrdinal(from)) / 12;
    const flat = (level: number): Regime => ({
      kind: "flat",
      from,
      to,
      startLevel: level,
      endLevel: level,
      params: { kind: "flat", level },
    });
    let regime: Regime;
    if (kind === "flat") {
      regime = flat(last ? endLevel : quarter(lo, hi));
    } else if (kind === "incline") {
      const q0 = quarter(lo, Math.min(hi, lo + 3));
      const top = last ? endLevel : quarter(Math.max(lo, hi - 3), hi);
      if (!(q0 < top)) {
        regime = flat(last ? endLevel : quarter(lo, hi));
      } else {
        let best: { k: number; m: number; err: number } | null = null;
        const kMin = 2 / years;
        for (let ki = 0; ki <= 24; ki++) {
          const k = kMin * Math.pow(48 / kMin, ki / 24);
          for (let mi = 1; mi < 24; mi++) {
            const m = -years * (mi / 24);
            let err = 0;
            for (let j = lo; j < hi; j++) {
              const t = x[j] - monthOrdinal(to) / 12;
              err += (Math.log(q0 + (top - q0) * shape(k, m, years, t)) - y[j]) ** 2;
            }
            if (!best || err < best.err) best = { k, m, err };
          }
        }
        regime = {
          kind,
          from,
          to,
          startLevel: q0,
          endLevel: top,
          params: { kind, q0, k: best!.k, m: best!.m, years },
        };
      }
    } else {
      const ts = [];
      const qs = [];
      for (let j = lo; j < hi; j++) {
        ts.push(x[j] - monthOrdinal(from) / 12);
        qs.push(Math.exp(y[j]));
      }
      let fit: { qi: number; Di: number; b: number } | null = null;
      if (last) {
        // Pinned at the end: qi is whatever carries the curve to the pin.
        let best: { qi: number; Di: number; b: number; err: number } | null = null;
        for (let bi = 0; bi <= 10; bi++) {
          const b = bi / 10;
          for (let di = 0; di <= 30; di++) {
            const Di = 0.02 * Math.pow(150, di / 30); // 0.02 .. 3 per year
            const qi = endLevel / arpsRaw(1, Di, b, years);
            let err = 0;
            for (let j = 0; j < ts.length; j++) err += (Math.log(arpsRaw(qi, Di, b, ts[j])) - y[lo + j]) ** 2;
            if (!best || err < best.err) best = { qi, Di, b, err };
          }
        }
        fit = best;
      } else {
        fit = fitArpsSweep(ts, qs);
      }
      if (!fit) {
        regime = flat(last ? endLevel : quarter(lo, hi));
      } else {
        const { qi, Di, b } = fit;
        regime = {
          kind,
          from,
          to,
          startLevel: qi,
          endLevel: arpsRaw(qi, Di, b, years),
          params: { kind, qi, Di, b },
        };
      }
    }
    regimes.unshift(regime);
  }
  return regimes;
}

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((t, v) => t + v, 0) / xs.length;
}

function shape(k: number, m: number, years: number, t: number): number {
  const s0 = sigmoid(k * (-years - m));
  const s1 = sigmoid(-k * m);
  return (sigmoid(k * (t - m)) - s0) / (s1 - s0);
}

/** The curve's rate at `month`, or null outside every regime. */
export function regimeRate(regimes: readonly Regime[], month: string): number | null {
  const r = regimes.find((g) => month >= g.from && month < g.to);
  if (!r) return null;
  const t = (monthOrdinal(month) - monthOrdinal(r.from)) / 12;
  switch (r.params.kind) {
    case "flat":
      return r.params.level;
    case "decline":
      return arpsRaw(r.params.qi, r.params.Di, r.params.b, t);
    case "incline": {
      const { q0, k, m, years } = r.params;
      return q0 + (r.endLevel - q0) * shape(k, m, years, t - years);
    }
  }
}

/**
 * The curve's decline AT `month`, per year, as the lease chart reports it:
 * the fall over the following twelve months on a decline's own Arps, the
 * relative slope on an incline (negative), nothing on a floor. Null outside
 * every regime.
 */
export function regimeDecline(regimes: readonly Regime[], month: string): number | null {
  const r = regimes.find((g) => month >= g.from && month < g.to);
  if (!r) return null;
  const t = (monthOrdinal(month) - monthOrdinal(r.from)) / 12;
  switch (r.params.kind) {
    case "flat":
      return 0;
    case "decline": {
      const { qi, Di, b } = r.params;
      const now = arpsRaw(qi, Di, b, t);
      return now > 0 ? 1 - arpsRaw(qi, Di, b, t + 1) / now : 0;
    }
    case "incline": {
      const { q0, k, m, years } = r.params;
      const tt = t - years;
      const s0 = sigmoid(k * (-years - m));
      const s1 = sigmoid(-k * m);
      const sig = sigmoid(k * (tt - m));
      const q = q0 + (r.endLevel - q0) * shape(k, m, years, tt);
      const slope = ((r.endLevel - q0) * k * sig * (1 - sig)) / (s1 - s0);
      return q > 0 ? -slope / q : 0;
    }
  }
}

/** The months a regime list covers, first to last, for a chart's rows. */
export function regimeMonths(regimes: readonly Regime[]): string[] {
  if (regimes.length === 0) return [];
  const out: string[] = [];
  const end = monthOrdinal(regimes[regimes.length - 1].to);
  for (let o = monthOrdinal(regimes[0].from); o < end; o++) out.push(ordinalToYm(o));
  return out;
}
