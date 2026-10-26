/**
 * Stand-ins for the app's Recon alerts server actions
 * (`src/lib/recon-alerts/actions.ts`, which read and write `recon_alerts`
 * under RLS). The landing has no database: the list is handed to the modal
 * as a prop, and a save echoes the draft back without storing it.
 */
import type { ReconAlert, ReconAlertInput } from "./types";

export async function listReconAlerts(): Promise<ReconAlert[]> {
  return [];
}

export async function getReconAlertCounties(id: string): Promise<number[] | null> {
  void id;
  return null;
}

export async function saveReconAlert(id: string | null, input: ReconAlertInput): Promise<ReconAlert> {
  return { ...input, id: id ?? "draft", orgId: "", userId: "", cursorAt: null, nextDueAt: null };
}

export async function setReconAlertEnabled(id: string, enabled: boolean): Promise<void> {
  void id;
  void enabled;
}

export async function deleteReconAlert(id: string): Promise<void> {
  void id;
}
