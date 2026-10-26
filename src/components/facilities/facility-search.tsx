"use client";

import { useMemo, useRef, useState } from "react";
import { SearchMd } from "@untitledui/icons";
import { XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { KIND_LABEL } from "@/components/facilities/substances";
import { cn } from "@/lib/utils";
import type { FacilityNode } from "@/lib/facilities/graph";

/** Never render the whole fleet into a dropdown; the ranking puts the answer on top. */
const MAX_RESULTS = 8;

/**
 * Rank facilities against a typed query.
 *
 * A prefix match outranks a match in the middle of the name, because an operator
 * typing "roa" means the Roach battery, not "Sky Heighten Roa-something". Below
 * that, shorter names first: "Roach T1" is a better answer to "roach" than
 * "Roach Parrott 19 water meter", and a tie falls back to the name so the list
 * never reshuffles between keystrokes that match equally.
 *
 * Exported for its unit test — no DOM, no React.
 */
export function rankFacilities(
  nodes: FacilityNode[],
  query: string
): FacilityNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { node: FacilityNode; score: number }[] = [];
  for (const node of nodes) {
    const name = node.name.toLowerCase();
    const at = name.indexOf(q);
    // The kind is searchable too, so "meter" lists the meters — it is the second
    // line of every row, and a search that ignored what it displays reads broken.
    const kindHit = KIND_LABEL[node.kind].toLowerCase().includes(q);
    if (at < 0 && !kindHit) continue;
    scored.push({ node, score: at === 0 ? 0 : at < 0 ? 500 : at });
  }
  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        a.node.name.length - b.node.name.length ||
        a.node.name.localeCompare(b.node.name)
    )
    .slice(0, MAX_RESULTS)
    .map((s) => s.node);
}

/**
 * Find-a-facility box for the flow map's toolbar.
 *
 * Searches EVERY node in the graph, not just the ones the current substance and
 * lease filters leave on screen: a search that could not find the gas meter you
 * were looking at a minute ago is a search that makes you undo your filters
 * first. The picking caller is responsible for moving those filters so the card
 * it is asked to centre on actually exists (see `focusNode` in the flow map).
 */
export function FacilitySearch({
  nodes,
  onPick,
  className,
}: {
  nodes: FacilityNode[];
  onPick: (node: FacilityNode) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const results = useMemo(() => rankFacilities(nodes, query), [nodes, query]);
  const showing = open && query.trim().length > 0;

  function pick(node: FacilityNode) {
    onPick(node);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showing || results.length === 0) {
      if (e.key === "Escape") setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[Math.min(active, results.length - 1)]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setOpen(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      {/* `z-10`: the input below carries `backdrop-blur`, which makes it a
          stacking context, and being later in the DOM it painted straight over
          an unlayered icon — present in the markup, invisible on screen. */}
      <SearchMd className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        placeholder="Search facilities"
        aria-label="Search facilities"
        className="h-10 border bg-card/90 pl-9 pr-8 backdrop-blur"
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Deferred, so a mousedown on a result is not cancelled by the blur that
        // precedes its click.
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
      />
      {query ? (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-[0.15rem] p-1 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
        >
          <XIcon className="size-4" />
        </button>
      ) : null}

      {showing ? (
        <div className="absolute left-0 top-[calc(100%+0.35rem)] z-20 w-full overflow-hidden rounded-[0.15rem] border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">
              No facility matches that.
            </p>
          ) : (
            results.map((node, i) => (
              <button
                key={node.id}
                type="button"
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left",
                  i === active ? "bg-accent" : "hover:bg-accent/60"
                )}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  // Keep focus so the deferred blur never races the click.
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                }}
                onClick={() => pick(node)}
              >
                <span className="text-sm font-medium leading-tight">
                  {node.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {KIND_LABEL[node.kind]}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
