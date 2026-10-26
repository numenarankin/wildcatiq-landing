"use client";

/**
 * Landing stand-in for the app's `use-rrc-modals.tsx`: the same openers, inert.
 * The app's version fetches each dossier from `/api/scout/*` and stacks the
 * modals; the landing has no route behind them, so a click opens nothing.
 */
/** The lease triple the app's routes take (`lib/scout/lease-key.ts`). */
type PdqLeaseKey = { oil_gas_code: string; district_no: string; lease_no: string };

export function useRrcModals(options?: { onSelectPrincipal?: (name: string) => void }) {
  void options;
  const noop = () => {};
  return {
    openWell: noop as (api: string) => void,
    openOperator: noop as (operatorNumber: string) => void,
    openLease: noop as (key: PdqLeaseKey) => void,
    openField: noop as (fieldNo: string) => void,
    openCounty: noop as (countyNo: string) => void,
    openOwner: noop as (key: unknown) => void,
    loading: false,
    error: null as string | null,
    modals: null as React.ReactNode,
  };
}
