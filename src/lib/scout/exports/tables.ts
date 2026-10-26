/**
 * Landing stand-in for the app's `src/lib/scout/exports/tables.ts`: the table
 * ids and titles the Recon dossiers hand their Export menu. The app's columns
 * and serializers are left out because the landing never writes a file.
 */
import type { LeaseDossier, MarketData, WellDossier } from "@/lib/scout/rrc-types";

export type ScoutExportSubject = "operator" | "lease" | "well" | "county" | "field" | "owner" | "market";

export interface ScoutTableAny<D> {
  id: string;
  title: string;
  rows: (dossier: D) => unknown[];
}

const newestFirst = <T extends { cycle: string }>(rows: T[]) => [...rows].sort((a, b) => b.cycle.localeCompare(a.cycle));

export const LEASE_TABLES = {
  production: { id: "production", title: "Production", rows: (d: LeaseDossier) => newestFirst(d.monthly) },
  balances: { id: "balances", title: "Balances", rows: (d: LeaseDossier) => newestFirst(d.monthly) },
  counties: { id: "counties", title: "Counties", rows: (d: LeaseDossier) => d.counties },
  wells: { id: "wells", title: "Wells", rows: (d: LeaseDossier) => d.wells },
  purchaser: { id: "purchaser", title: "Purchasers", rows: (d: LeaseDossier) => d.p4.connections },
} satisfies Record<string, ScoutTableAny<LeaseDossier>>;

export const MARKET_TABLES = {
  counties: { id: "counties", title: "Top counties", rows: (d: MarketData) => d.topCounties },
  fields: { id: "fields", title: "Top fields", rows: (d: MarketData) => d.topFields },
  operators: { id: "operators", title: "Top operators", rows: (d: MarketData) => d.topOperators },
  leases: { id: "leases", title: "Top leases", rows: (d: MarketData) => d.topLeases },
} satisfies Record<string, ScoutTableAny<MarketData>>;

export function leaseExportKey(k: { oil_gas_code: string; district_no: string; lease_no: string }): string {
  return `${k.oil_gas_code}-${k.district_no}-${k.lease_no}`;
}

export const WELL_TABLES = {
  production: {
    id: "production",
    title: "Production",
    rows: (d: WellDossier) => newestFirst(d.productionByTest.length > 0 ? d.productionByTest : d.production),
  },
  tests: { id: "tests", title: "Well tests", rows: (d: WellDossier) => [...d.w10, ...d.g10] },
  completions: { id: "completions", title: "Completions", rows: (d: WellDossier) => d.completions },
} satisfies Record<string, ScoutTableAny<WellDossier>>;
