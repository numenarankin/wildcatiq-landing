"use client";

/**
 * The app shell around a product screen: the real sidebar component with the
 * real nav catalog, the top bar, and the main wrapper's padding, all inside a
 * fixed 1600 x 1000 canvas scaled to its container.
 */
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChartPrefsProvider } from "@/components/charts/chart-prefs-context";
import { navGroups } from "@/components/app-shared";
import { NavGroup } from "@/components/nav-group";
import { AppHeader } from "./app-header";
import { ScreenRoute } from "./screen-route";
import { ScaledScreen } from "./shell";
import { ModalScope } from "@/components/wells/swipe-up-modal";

/** The sidebar as the app renders it, every item shown (no permission filter). */
function LandingSidebar() {
  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.devOnly) }))
    .filter((g) => g.items.length > 0);
  return (
    <Sidebar
      className={cn(
        // The kit pins the rail to the viewport height; here it fills the canvas.
        "h-full",
        "*:data-[slot=sidebar-inner]:bg-background",
        "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
      )}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-14 justify-center border-b px-2">
        <SidebarMenuButton render={<a href="#link" />}>
          <Image src="/slim_normal.png" alt="WildcatIQ logo" width={16} height={16} className="size-4 shrink-0" />
          <span className="text-base font-semibold text-foreground!">WildcatIQ</span>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <div className="border-t px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
          <p className="text-nowrap text-[9px] text-muted-foreground">© 2026 Wildcat Labs, Inc.</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppFrame({
  path,
  crumbs,
  fullBleed,
  children,
}: {
  /** The app route this screen stands in for; the nav highlights it. */
  path: string;
  crumbs: string[];
  /** Routes the app renders edge to edge (the flow map, Recon, Orion). */
  fullBleed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ScaledScreen w={1600} h={1000}>
      <ModalScope>
      <ScreenRoute path={path}>
        <TooltipProvider>
          <ChartPrefsProvider defaultRange={null} averageLine={false}>
            <SidebarProvider defaultOpen className="h-full min-h-0">
              <LandingSidebar />
              <SidebarInset className="h-full min-h-0 overflow-hidden">
                <AppHeader crumbs={crumbs} />
                {fullBleed ? (
                  <div className="flex h-[calc(100%-3.5rem)] min-h-0 flex-col overflow-hidden">{children}</div>
                ) : (
                  <div className="flex w-full flex-1 flex-col overflow-hidden py-4 px-[77px] md:py-6 md:px-[85px]">
                    {children}
                  </div>
                )}
              </SidebarInset>
            </SidebarProvider>
          </ChartPrefsProvider>
        </TooltipProvider>
      </ScreenRoute>
      </ModalScope>
    </ScaledScreen>
  );
}
