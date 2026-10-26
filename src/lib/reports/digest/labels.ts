/**
 * Display labels for the digest.
 *
 * Inside a lease's own section, well names start with the lease name -
 * "Ellenburger Deep Unit A #4" under "Ellenburger Deep". The heading already
 * said the lease, so the prefix is pure repetition, and in a pie legend it is
 * expensive repetition: it pushes the part that actually distinguishes one well
 * from another (the unit and number) out past the truncation point, leaving four
 * slices labelled "Ellenburge…". Stripping it buys that width back.
 *
 * Pure module (no DOM, no Node) - safe to import anywhere.
 */

const words = (text: string): string[] => text.trim().split(/\s+/).filter(Boolean);

/**
 * A well's name as it reads INSIDE its own lease section: the leading words it
 * shares with the lease name removed.
 *
 * Matching by WORD, not by character, so a lease whose name is a little longer
 * than the well's prefix still shortens it ("Coyote Draw 12-H" under "Coyote
 * Draw Unit" → "12-H") while a coincidental character overlap doesn't butcher
 * the name ("Big Lakeside 3" never becomes "ide 3").
 *
 * Falls back to the full name when stripping would leave nothing - a well named
 * exactly after its lease keeps its name, since a blank label says less than a
 * repetitive one.
 */
export function wellLabelInLease(wellName: string, leaseName: string): string {
  const well = words(wellName);
  const lease = words(leaseName);
  let i = 0;
  while (
    i < well.length &&
    i < lease.length &&
    well[i].toLowerCase() === lease[i].toLowerCase()
  ) {
    i++;
  }
  if (i === 0 || i === well.length) return wellName.trim();
  // Drop a separator the prefix left behind ("Poage - #7" → "#7").
  return well.slice(i).join(" ").replace(/^[,\-–\u2014:]+\s*/, "");
}
