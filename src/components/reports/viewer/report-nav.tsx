"use client";

import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface NavGroup {
  group: string;
  items: { id: string; title: string }[];
}

/**
 * The report list, one collapsible section per group. Only one group opens by
 * default (plus whichever section holds the current sample, so a deep link
 * never lands with its own entry hidden) - the full list is long enough that
 * showing every group at once buries the one you're working in.
 */
export function ReportNav({
  groups,
  selectedId,
  basePath,
  param,
  openGroup,
}: {
  groups: NavGroup[];
  selectedId: string;
  /** Route the entries link to (e.g. "/reports"). */
  basePath: string;
  /** Query parameter carrying the entry id (e.g. "report"). */
  param: string;
  /** Group open by default, alongside whichever holds the current entry. */
  openGroup: string;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {groups.map(({ group, items }) => (
        <Collapsible
          key={group}
          // Uncontrolled: a section the user opens stays open while they click
          // through its samples (client navigation doesn't remount this).
          defaultOpen={
            group === openGroup || items.some((i) => i.id === selectedId)
          }
        >
          <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors">
            <ChevronRightIcon className="size-3.5 transition-transform group-data-[panel-open]:rotate-90" />
            {group}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-1 mb-2 flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`${basePath}?${param}=${encodeURIComponent(item.id)}`}
                    // Selected reads as a quiet tint + weight, the way the app
                    // sidebar marks its active item - not a filled slab.
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      item.id === selectedId
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </nav>
  );
}
