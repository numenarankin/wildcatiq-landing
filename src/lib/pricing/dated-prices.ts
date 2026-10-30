import type { PricePoint } from "@/lib/pricing/types";
import type { RealizationModels } from "@/lib/pricing/realization";
import {
  realizedPriceByDate,
  realizedPriceByMonth,
} from "@/lib/pricing/daily-realized";

/**
 * A facility's realized prices ON PAST DATES, for the chart's revenue view.
 *
 * `byDate` holds the days a measured series covers (the close on or before
 * each, forward-filled); `byMonth` holds every month the benchmark traded in,
 * for the state-reported history rows, which are monthly averages. A row
 * looks itself up by date, then by its month, then takes today's price
 * (`pricesOn`), so decades-old RRC months the feed never reaches are still
 * drawn rather than dropped, at the same fallback they always had.
 *
 * Pure: the page fetches the closes (`getDatedPrices`) and this does the
 * arithmetic, so the lookup can be checked by hand.
 */
export interface DatedPrices {
  oilByDate: Record<string, number>;
  gasByDate: Record<string, number>;
  oilByMonth: Record<string, number>;
  gasByMonth: Record<string, number>;
}

export function datedPricesFrom(
  oilHistory: PricePoint[],
  gasHistory: PricePoint[],
  models: RealizationModels,
  dates: string[]
): DatedPrices {
  return {
    oilByDate: realizedPriceByDate(oilHistory, gasHistory, models.oil, dates),
    gasByDate: realizedPriceByDate(gasHistory, oilHistory, models.gas, dates),
    oilByMonth: realizedPriceByMonth(oilHistory, gasHistory, models.oil),
    gasByMonth: realizedPriceByMonth(gasHistory, oilHistory, models.gas),
  };
}

/** The price a `YYYY-MM-DD` row is valued at: its day, else its month, else today. */
export function pricesOn(
  dated: DatedPrices | undefined,
  today: { oilPerBbl: number; gasPerMcf: number },
  date: string
): { oilPerBbl: number; gasPerMcf: number } {
  const month = date.slice(0, 7);
  return {
    oilPerBbl: dated?.oilByDate[date] ?? dated?.oilByMonth[month] ?? today.oilPerBbl,
    gasPerMcf: dated?.gasByDate[date] ?? dated?.gasByMonth[month] ?? today.gasPerMcf,
  };
}

/** Every `YYYY-MM-DD` from `from` to `to` inclusive; empty when `to` < `from`. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  let ms = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  for (; ms <= end; ms += 86_400_000) out.push(new Date(ms).toISOString().slice(0, 10));
  return out;
}
