"use client";

/**
 * landing: shim of the app's facility-writes.tsx. The app routes every map
 * write through server actions; the landing's map runs on fixture data and
 * never writes, so each member is a no-op with a compatible signature. Only
 * the members the copied code calls (`wiring.ts`, `flow-map.tsx`) are typed
 * with their real parameters; the rest are catch-alls.
 */
import { createContext, useContext, type ReactNode } from "react";

type Noop = (...args: unknown[]) => Promise<void>;
const noop: Noop = async () => {};

export interface FacilityWrites {
  deleteFacilityConnection: (connectionId: string) => Promise<void>;
  removeWellFromOilTank: (tankId: string, wellId: string) => Promise<void>;
  removeTankWell: (tankId: string, wellId: string) => Promise<void>;
  removeMeterWell: (meterId: string, wellId: string) => Promise<void>;
  editTank: (tankId: string, patch: { injectionWellId: string | null }) => Promise<void>;
  editBattery: (batteryId: string, patch: { injectionWellId: string | null }) => Promise<void>;
  spliceFacilityIntoConnection: (input: {
    connectionId: string;
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    viaType: string;
    viaId: string;
    substance: string;
  }) => Promise<void>;
  createFacilityConnection: (input: {
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    substance: string;
    sharePct: number;
  }) => Promise<void>;
  setFacilityLease: (input: {
    kind: "well" | "injection" | "tank" | "meter" | "battery";
    id: string;
    leaseId: string | null;
  }) => Promise<void>;
  refresh: () => Promise<void> | void;
}

export const SERVER_WRITES: FacilityWrites = {
  deleteFacilityConnection: noop,
  removeWellFromOilTank: noop,
  removeTankWell: noop,
  removeMeterWell: noop,
  editTank: noop,
  editBattery: noop,
  spliceFacilityIntoConnection: noop,
  createFacilityConnection: noop,
  setFacilityLease: noop,
  refresh: noop,
};

const FacilityWritesContext = createContext<FacilityWrites>(SERVER_WRITES);

export function FacilityWritesProvider({
  writes,
  children,
}: {
  writes: FacilityWrites;
  children: ReactNode;
}) {
  return <FacilityWritesContext.Provider value={writes}>{children}</FacilityWritesContext.Provider>;
}

export function useFacilityWrites(): FacilityWrites {
  return useContext(FacilityWritesContext);
}
