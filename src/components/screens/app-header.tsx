"use client";

/**
 * The app's top bar (src/components/app-header.tsx there), rendered with its
 * own classes and the same controls, minus the data behind them: a fixed
 * price ticker, an idle Orion and voice toggle, a quiet bell and the account
 * avatar. The breadcrumb is given rather than read from the route.
 */
import { BellIcon, MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DecorIcon } from "@/components/decor-icon";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { SparkleIcon } from "@/components/ai/sparkle-icon";
import { DeltaPct } from "@/components/delta-pct";
import { navLinks } from "@/components/app-shared";

const QUOTES = [
  { label: "WTI", unit: "/bbl", price: 61.42, changePct: 0.82 },
  { label: "Nat Gas", unit: "/MCF", price: 3.18, changePct: -1.21 },
];

export function AppHeader({ crumbs, path, initials = "JM" }: { crumbs: string[]; path?: string; initials?: string }) {
  // The first crumb is the section, with its sidebar icon (app-breadcrumbs.tsx).
  const section = path ? navLinks.find((item) => item.path === `/${path.split("/")[1]}`) : undefined;
  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex shrink-0 items-center gap-2 px-4 md:px-6",
        "h-14 justify-between border-b",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      {/* landing: the app's header shades itself and the backdrop is cut
          around it; at the canvas's scale that seam lands between real
          pixels and shows as a line, so no shade is mounted and the backdrop
          covers the header too. */}
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator className="mr-2 h-4 data-[orientation=vertical]:self-center" orientation="vertical" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <BreadcrumbItem key={c}>
                  {i > 0 && <BreadcrumbSeparator />}
                  {i === 0 && section ? (
                    last ? (
                      <BreadcrumbPage className="flex items-center gap-2 [&>svg]:size-3.5">
                        {section.icon}
                        {c}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href="#" className="flex items-center gap-2 [&>svg]:size-3.5">
                        {section.icon}
                        {c}
                      </BreadcrumbLink>
                    )
                  ) : last ? (
                    <BreadcrumbPage>{c}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href="#">{c}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-3 pr-2 lg:flex" aria-label="Commodity prices">
          {QUOTES.map((q) => (
            <span key={q.label} className="flex items-baseline gap-1 whitespace-nowrap">
              <span className="ty-body-1 font-medium text-tertiary-text">{q.label}</span>
              <span className="ty-body-1 font-semibold tabular-nums text-primary-text">${q.price.toFixed(2)}</span>
              <DeltaPct value={q.changePct / 100} className="ty-body-1" />
            </span>
          ))}
        </div>
        <div className="relative z-20 flex items-center gap-3">
          <Button aria-label="Talk to Orion" size="icon-sm" variant="outline">
            <MicIcon />
          </Button>
          <Button aria-label="Chat with Orion" size="icon-sm" variant="outline">
            <SparkleIcon />
          </Button>
          <Button aria-label="Notifications" size="icon-sm" variant="outline">
            <span className="relative inline-flex">
              <BellIcon />
            </span>
          </Button>
        </div>
        <Separator className="h-4 data-[orientation=vertical]:self-center" orientation="vertical" />
        <div className="relative z-20 flex items-center">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
