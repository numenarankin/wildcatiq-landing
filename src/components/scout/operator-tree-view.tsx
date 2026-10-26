"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRightIcon, CircleIcon, FolderIcon } from "lucide-react";
import { Picker } from "./map-filters";
import { ScoutLeaseModal } from "./scout-lease-modal";
import { ScoutWellModal } from "./scout-well-modal";
import { Input } from "@/components/ui/input";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { searchOperators } from "@/lib/scout/queries";
import { mirrorOperatorTree } from "@/lib/scout/rrc-mirror";
import { api8, partyName, titleCase } from "@/lib/scout/format";
import type { OperatorMatch } from "@/lib/scout/types";
import type { OperatorTree, OperatorTreeLease } from "@/lib/scout/rrc-types";
import type { PdqLeaseKey } from "@/lib/scout/lease-key";
import type { OwnerKey } from "@/lib/scout/cad-owners";
import { cn } from "@/lib/utils";

/*
 * ===========================================================================
 * OPERATOR TREE VIEW — Recon's Browse view.
 * ===========================================================================
 *
 * A sidebar and a pane. The sidebar takes an operator name and shows every
 * lease that operator holds as a tree, each lease opening to its wells; the
 * pane shows the dossier of whichever lease or well is picked. The map is not
 * involved: this is for a reader who knows the company and wants its holdings
 * as a list, not as dots.
 *
 * The dossiers are the SAME components the map opens as modals (`LeaseModal`,
 * `WellModal`), rendered in place through their `inline` prop, so a lease here
 * reads exactly as it does from the map. Links inside them (the operator, a
 * field, a mineral owner, a well on the Wells tab) open modals through the
 * host's dossier stack, as they do everywhere else.
 *
 * Data: `/api/scout/rrc/operator/<no>/tree` (`getOperatorTree`), uncapped.
 */

type Picked =
  | { kind: "lease"; key: PdqLeaseKey }
  | { kind: "well"; api: number };

const leaseId = (l: PdqLeaseKey) => `${l.oil_gas_code}/${l.district_no}/${l.lease_no}`;

const sameLease = (a: PdqLeaseKey, b: PdqLeaseKey) => leaseId(a) === leaseId(b);

export function OperatorTreeView({
  onSelectOperator,
  onSelectPrincipal,
  onSelectLease,
  onSelectWell,
  onSelectOwner,
  initialOperator = null,
  initialExpanded = [],
  initialLease = null,
}: {
  onSelectOperator: (operatorNumber: number) => void;
  onSelectPrincipal: (name: string) => void;
  onSelectLease: (key: PdqLeaseKey) => void;
  onSelectWell: (api: number) => void;
  onSelectOwner: (key: OwnerKey, name?: string | null) => void;
  /** landing: the operator a product screen opens on, its tree already loaded. */
  initialOperator?: OperatorMatch | null;
  /** landing: lease numbers shown open. */
  initialExpanded?: string[];
  /** landing: the lease shown in the pane. */
  initialLease?: PdqLeaseKey | null;
}) {
  const [operator, setOperator] = useState<OperatorMatch | null>(initialOperator);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OperatorMatch[]>([]);
  const [tree, setTree] = useState<OperatorTree | null>(() =>
    initialOperator ? mirrorOperatorTree(String(initialOperator.operator_number)) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set((tree?.leases ?? []).filter((l) => initialExpanded.includes(l.lease_no)).map((l) => leaseId(l)))
  );
  const [picked, setPicked] = useState<Picked | null>(initialLease ? { kind: "lease", key: initialLease } : null);
  /** Narrows the tree to leases whose name or number contains it. */
  const [leaseQuery, setLeaseQuery] = useState("");

  const shown = useMemo(() => {
    const leases = tree?.leases ?? [];
    const q = leaseQuery.trim().toLowerCase();
    if (!q) return leases;
    return leases.filter(
      (l) =>
        (l.lease_name ?? "").toLowerCase().includes(q) || l.lease_no.includes(q)
    );
  }, [tree, leaseQuery]);

  // The bar's operator search, debounced the same way (see map-filters.tsx).
  useEffect(() => {
    if (operator) return;
    const q = query.trim();
    const t = setTimeout(() => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      searchOperators(q).then(setResults).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, operator]);

  // Same shape as `ScoutLeaseModal`'s fetch: every state update happens inside
  // the scheduled callback, never in the effect body.
  useEffect(() => {
    if (!operator) return;
    // landing: the seeded operator's tree is already loaded; keep its open rows.
    if (tree && Number(tree.operator_number) === operator.operator_number) return;
    let active = true;
    async function load() {
      if (!operator) return;
      setLoading(true);
      setError(null);
      setTree(null);
      setExpanded(new Set());
      setPicked(null);
      setLeaseQuery("");
      try {
        // landing: the app fetches `/api/scout/rrc/operator/<no>/tree`.
        const found = mirrorOperatorTree(String(operator.operator_number).padStart(6, "0"));
        if (!found) throw new Error("404");
        if (active) setTree(found);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error && err.message === "404"
            ? "This operator is not in the RRC mirror."
            : "Could not load the operator's leases."
        );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
    // landing: `tree` is read only to skip the seeded load, not to re-run it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operator]);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pickLease = (l: OperatorTreeLease) => {
    const key = { oil_gas_code: l.oil_gas_code, district_no: l.district_no, lease_no: l.lease_no };
    setPicked({ kind: "lease", key });
    if (l.wells.length > 0) toggle(leaseId(key));
  };

  const pickedLease = picked?.kind === "lease" ? picked.key : null;
  const pickedApi = picked?.kind === "well" ? picked.api : null;

  return (
    <div className="absolute inset-0 z-20 flex bg-background">
      <aside className="flex w-80 shrink-0 flex-col border-r">
        <div className="shrink-0 border-b px-3 py-2">
          <Picker
            width="w-full"
            selected={
              operator
                ? [
                    {
                      key: operator.operator_number,
                      label:
                        partyName(operator.operator_name) ||
                        String(operator.operator_number),
                    },
                  ]
                : []
            }
            clearLabel="Clear operator"
            onRemove={() => {
              setOperator(null);
              setQuery("");
              setResults([]);
              setTree(null);
              setPicked(null);
              setLeaseQuery("");
            }}
            query={query}
            onQuery={setQuery}
            placeholder="Search operator…"
            results={results.map((o) => ({
              key: o.operator_number,
              label: partyName(o.operator_name) || String(o.operator_number),
              onPick: () => {
                setOperator(o);
                setResults([]);
              },
            }))}
          />
          {tree && tree.leases.length > 0 && (
            <Input
              value={leaseQuery}
              onChange={(e) => setLeaseQuery(e.target.value)}
              placeholder="Search leases…"
              aria-label="Search leases"
              className="mt-2 h-7 text-xs"
            />
          )}
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto py-1">
          {loading ? (
            <LoadingScreen label="Loading leases" />
          ) : error ? (
            <p className="px-3 py-2 text-sm text-destructive">{error}</p>
          ) : tree ? (
            <ul role="tree" aria-label={partyName(tree.operator_name)}>
              <li role="treeitem" aria-expanded aria-selected={false}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => onSelectOperator(Number(tree.operator_number))}
                >
                  <span className="truncate font-semibold">
                    {partyName(tree.operator_name)}
                  </span>
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                    {leaseQuery.trim()
                      ? `${shown.length.toLocaleString()} of ${tree.leases.length.toLocaleString()}`
                      : tree.leases.length.toLocaleString()}
                  </span>
                </button>
                {tree.leases.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    No leases of record.
                  </p>
                ) : shown.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    No leases match.
                  </p>
                ) : (
                  <ul role="group">
                    {shown.map((l) => {
                      const key = {
                        oil_gas_code: l.oil_gas_code,
                        district_no: l.district_no,
                        lease_no: l.lease_no,
                      };
                      const id = leaseId(key);
                      const open = expanded.has(id);
                      const selected = pickedLease != null && sameLease(pickedLease, key);
                      return (
                        <li
                          key={id}
                          role="treeitem"
                          aria-selected={selected}
                          aria-expanded={l.wells.length > 0 ? open : undefined}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1 pr-3 text-sm hover:bg-muted",
                              selected && "bg-muted"
                            )}
                            style={{ paddingLeft: "0.75rem" }}
                          >
                            {l.wells.length > 0 ? (
                              <button
                                type="button"
                                aria-label={open ? `Collapse ${titleCase(l.lease_name) || l.lease_no}` : `Expand ${titleCase(l.lease_name) || l.lease_no}`}
                                aria-expanded={open}
                                onClick={() => toggle(id)}
                                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <ChevronRightIcon
                                  className={cn("size-4 transition-transform", open && "rotate-90")}
                                />
                              </button>
                            ) : (
                              <span className="size-5 shrink-0" />
                            )}
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
                              onClick={() => pickLease(l)}
                            >
                              <FolderIcon className="size-4 shrink-0 text-data-accent" fill="currentColor" />
                              <span className="truncate">
                                {titleCase(l.lease_name) || `Lease ${l.lease_no}`}
                              </span>
                              <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                                {l.oil_gas_code === "O" ? "O" : "G"}-{l.lease_no}
                              </span>
                              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                {l.wells.length}
                              </span>
                            </button>
                          </div>
                          {open && l.wells.length > 0 && (
                            <ul role="group">
                              {l.wells.map((w) => {
                                const api = Number(w.api_number);
                                const on = pickedApi === api;
                                return (
                                  <li key={w.api_number} role="treeitem" aria-selected={on}>
                                    <button
                                      type="button"
                                      className={cn(
                                        "flex w-full items-center gap-2 py-1 pr-3 text-left text-sm hover:bg-muted",
                                        on && "bg-muted"
                                      )}
                                      style={{ paddingLeft: "2.5rem" }}
                                      onClick={() => setPicked({ kind: "well", api })}
                                    >
                                      <CircleIcon className="size-2 shrink-0 text-muted-foreground" fill="currentColor" />
                                      {/* The well's name as the RRC and the well
                                          modal give it: lease name + well number. */}
                                      <span className="truncate">
                                        {`${titleCase(w.lease_name) || titleCase(l.lease_name) || "Lease"} ${w.well_no ?? ""}`.trim()}
                                      </span>
                                      <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                                        {api8(api)}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            </ul>
          ) : null}
        </div>
      </aside>

      {/* The pane: the dossier in place, full width, no chart beside it. The
          SwipeUpModal contract holds (a fixed-height flex column), so the tabs
          and panes lay out exactly as they do in the modal. */}
      <section className="flex min-h-0 flex-1 flex-col">
        {picked === null ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {tree ? "Pick a lease or well." : "Search for an operator."}
            </p>
          </div>
        ) : null}
        <ScoutLeaseModal
          inline
          leaseKey={pickedLease}
          onClose={() => setPicked(null)}
          onSelectOperator={onSelectOperator}
          onSelectWell={onSelectWell}
          onSelectOwner={onSelectOwner}
        />
        <ScoutWellModal
          inline
          api={pickedApi}
          onClose={() => setPicked(null)}
          onSelectOperator={onSelectOperator}
          onSelectPrincipal={onSelectPrincipal}
          onSelectLease={onSelectLease}
        />
      </section>
    </div>
  );
}
