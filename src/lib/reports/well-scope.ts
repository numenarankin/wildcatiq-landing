/**
 * A production report narrowed to one lease and/or one well (Daily, Weekly,
 * Monthly, Quarterly and Annual Production) - pure, no I/O.
 *
 * The narrowing happens BEFORE the report is built, by reading only the picked
 * wells' production, so every figure in it (the Total row included) is the sum
 * over exactly those wells.
 */

export interface ScopeWell {
  id: string;
  name: string;
  leaseId?: string | null;
}

export interface ScopeLease {
  id: string;
  name: string;
}

export interface WellScope {
  /** The wells to read, or undefined for every well. */
  wellIds?: string[];
  /** "Lease: Roach · Well: Roach 7", or undefined when unnarrowed. */
  label?: string;
}

/**
 * The wells a lease / well pick covers. A well that is not on the picked lease
 * covers nothing, rather than one pick being quietly ignored; an id that
 * matches no well (a hand-edited URL) also covers nothing.
 */
export function wellScope(
  wells: ScopeWell[],
  leases: ScopeLease[],
  pick: { lease?: string; well?: string }
): WellScope {
  if (!pick.lease && !pick.well) return {};
  let pool = wells;
  const parts: string[] = [];
  if (pick.lease) {
    pool = pool.filter((w) => w.leaseId === pick.lease);
    const name = leases.find((l) => l.id === pick.lease)?.name;
    parts.push(`Lease: ${name ?? "unknown"}`);
  }
  if (pick.well) {
    pool = pool.filter((w) => w.id === pick.well);
    const name = wells.find((w) => w.id === pick.well)?.name;
    parts.push(`Well: ${name ?? "unknown"}`);
  }
  return { wellIds: pool.map((w) => w.id), label: parts.join(" · ") };
}

/** Two subtitle parts as one line, either of which may be absent. */
export function joinSubtitle(
  ...parts: (string | undefined)[]
): string | undefined {
  const kept = parts.filter((p): p is string => !!p);
  return kept.length ? kept.join(" · ") : undefined;
}
