// Type-only mirror of the app's src/lib/pricing/realization.ts (server-only there):
// the dated-price lookup reads the models' shape and nothing else.
import type { RealizationModel } from "@/lib/pricing/realization-model";

/**
 * Both commodities' models. `measured` is false when EITHER fell back to the
 * prior, which is the flag the UI reads to mark a figure as an estimate.
 */
export interface RealizationModels {
  oil: RealizationModel;
  gas: RealizationModel;
  measured: boolean;
}
