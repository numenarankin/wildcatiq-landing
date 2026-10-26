"use client";

// The app's RRC filer settings modal (portals to document.body). Closed on the landing.
import type { FilerSettings } from "@/lib/rrc/form-pr/service";

export function FilerModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: FilerSettings;
}) {
  void open;
  void onClose;
  void initial;
  return null;
}
