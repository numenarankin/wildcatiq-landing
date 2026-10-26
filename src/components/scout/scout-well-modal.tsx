"use client";

/**
 * landing: the app's ScoutWellModal (`scout-well-modal.tsx` there) over the
 * static dossier files in public/api/scout/rrc/well/<api8>.json in place of
 * the mirror route. No officers (the app's second read, `getWellDetail`), so
 * the Principals tab stays hidden. `tab` lets a scripted screen drive the
 * tab row.
 */
import { useEffect, useState } from "react";
import { WellModal, type WellTabKey } from "./well-modal";
import { api8 } from "@/lib/scout/format";
import type { PdqLeaseKey } from "@/lib/scout/lease-key";
import type { WellDossier } from "@/lib/scout/rrc-types";

const cache = new Map<string, Promise<WellDossier | null>>();

/** The static dossier, fetched once; a screen can warm it before its loop opens the modal. */
export function loadWellDossier(api: number): Promise<WellDossier | null> {
  const key = api8(api);
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/api/scout/rrc/well/${key}.json`).then((r) => (r.ok ? (r.json() as Promise<WellDossier>) : null));
    cache.set(key, p);
  }
  return p;
}

export function ScoutWellModal({
  api,
  elevated = false,
  inline = false,
  tab,
  onTabChange,
  onClose,
  onBack,
  onSelectOperator,
  onSelectPrincipal,
  onSelectLease,
}: {
  /** Null closes the modal; the last dossier stays mounted for the animation. */
  api: number | null;
  elevated?: boolean;
  /** In place, with the title bar; see `LeaseModal`/`WellModal`. */
  inline?: boolean;
  tab?: WellTabKey;
  onTabChange?: (tab: WellTabKey) => void;
  onClose: () => void;
  onBack?: () => void;
  onSelectOperator: (operatorNumber: number) => void;
  onSelectPrincipal: (name: string) => void;
  onSelectLease?: (key: PdqLeaseKey) => void;
}) {
  const [dossier, setDossier] = useState<WellDossier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The API the body currently describes. Held separately from `api` so the
  // close animation plays over the well that was open, not over a blank modal.
  const [shownApi, setShownApi] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (api == null) return;
      setShownApi(api);
      setLoading(true);
      setError(null);
      setDossier(null);
      const found = await loadWellDossier(api);
      if (!active) return;
      if (found) setDossier(found);
      else setError("This wellbore is not in the RRC mirror.");
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
    // Deliberately NOT cleared when `api` goes null — see `shownApi`.
  }, [api]);

  return (
    <WellModal
      well={dossier}
      apiNumber={shownApi != null ? api8(shownApi) : undefined}
      open={api != null}
      loading={loading}
      error={error}
      tab={tab}
      onTabChange={onTabChange}
      onClose={onClose}
      onBack={onBack}
      // The mirror keys operators as strings; every Scout surface keys them by number.
      onSelectOperator={(n) => onSelectOperator(Number(n))}
      onSelectPrincipal={onSelectPrincipal}
      onSelectLease={onSelectLease}
      elevated={elevated}
      inline={inline}
    />
  );
}
