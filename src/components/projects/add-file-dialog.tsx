"use client";

// The app's knowledge-base picker (a dialog over the project's files). The
// Orion composer mounts it closed; it never opens on the landing.
import type { KBFile } from "@/lib/kb/types";

export function AddFileDialog({
  open,
  onOpenChange,
  existingIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIds: Set<string>;
  onAdd: (files: KBFile[]) => void;
}) {
  void open;
  void onOpenChange;
  void existingIds;
  void onAdd;
  return null;
}
