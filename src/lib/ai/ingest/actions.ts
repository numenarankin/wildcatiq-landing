/**
 * landing: the ingest actions' types at their app path, and the two the
 * approval card calls, answered locally. Approve resolves after the pause a
 * real write takes and reports every row added; nothing is stored.
 */
import type { IngestType } from "@/lib/ai/ingest/types";

export interface IngestProposal {
  id: string;
  type: IngestType;
  fileName: string;
  wellId: string | null;
  tankId: string | null;
  meterId: string | null;
  rows: unknown[];
  status: string;
  createdAt: string;
  sourcePages?: number[] | null;
}

export interface WellOption {
  id: string;
  name: string;
}

export interface ApproveResult {
  ok: boolean;
  added?: number;
  updated?: number;
  skipped?: number;
  error?: string;
}

const WRITE_MS = 900;

export async function approveIngestProposal(
  _id: string,
  input: { rows: unknown[]; wellId?: string | null }
): Promise<ApproveResult> {
  await new Promise((r) => setTimeout(r, WRITE_MS));
  return { ok: true, added: input.rows.length, updated: 0, skipped: 0 };
}

export async function dismissIngestProposal(id: string): Promise<{ ok: boolean }> {
  void id;
  return { ok: true };
}
