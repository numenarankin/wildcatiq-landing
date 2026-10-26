// Type-only mirror of the app's src/lib/wells/wells.ts: the Arps fit reads ProductionPoint.
export interface ProductionPoint {
  /** Row id, when loaded from the database (absent for unsaved/optimistic rows). */
  id?: string;
  /** Production date as an ISO `YYYY-MM-DD` string. */
  date: string;
  /** Reading time as a 24-hour `HH:MM` string. */
  time: string;
  oilProduction: number;
  /**
   * Which streams were MEASURED on this date, when the row was derived.
   *
   * A derived row exists for the union of the well's three series, so a day the
   * gas meter was read and no tank gauged carries `oilProduction: 0` — and an
   * average that divides by every row reports oil the well never failed to make.
   * Absent on hand-entered rows, where the row is the reading and every field on
   * it was entered together; callers read `?? true` for those.
   */
  measured?: { oil: boolean; gas: boolean; water: boolean };
  /** Oil held in tanks (lease inventory), in barrels. */
  oilStock: number;
  /** Oil sold / hauled, in barrels per day. */
  oilSales: number;
  gasProduction: number;
  saltWater: number;

  // --- Richer daily gas-measurement fields (GBC-7 / gap B.6) ----------------
  // All optional: null/undefined means "not measured that day". These are
  // captured at the well/meter. Field-ops volumes (pulled bottom / water hauled
  // / hot oil) moved to the tank reading (`tank_readings`, GBC-7 follow-up).

  /** Gas orifice plate size (inches). */
  orifice?: number;
  /** Gas differential pressure (inches H₂O). */
  differential?: number;
  /** Corrected hourly volume / chart multiplier. */
  chm?: number;
  /** Casing pressure (psi). */
  casingPressure?: number;
  /** Tubing pressure (psi). */
  tubingPressure?: number;
  /** Flowing/static line pressure (psi). */
  flowPressure?: number;
  /** Choke size (64ths of an inch). */
  choke?: number;
  /** Free-text pumper remarks. */
  remarks?: string;
}
