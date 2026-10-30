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

/** `use-ai-drawer.ts` DRAWER_DEFAULT_WIDTH. */
const DRAWER_W = 384;

export function AppFrame({
  path,
  crumbs,
  fullBleed,
  drawer,
  sidebarCollapsed = false,
  width = 1600,
  children,
}: {
  /** The app route this screen stands in for; the nav highlights it. */
  path: string;
  crumbs: string[];
  /** Routes the app renders edge to edge (the flow map, Recon, Orion). */
  fullBleed?: boolean;
  /**
   * The Orion drawer (`ai-drawer.tsx`): a flex sibling of the inset, so opening
   * it narrows the whole page, header included, rather than covering it.
   */
  drawer?: { open: boolean; children: React.ReactNode };
  /** The sidebar starts collapsed to its icons, as a user would leave it beside an open drawer. */
  sidebarCollapsed?: boolean;
  /** Canvas width; the height keeps the 16:10 frame. Wider when a drawer would squeeze the page. */
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <ScaledScreen w={width} h={Math.round(width * 0.625)}>
      <ModalScope>
      <ScreenRoute path={path}>
        <TooltipProvider>
          <ChartPrefsProvider defaultRange={null} averageLine={false}>
            <SidebarProvider defaultOpen={!sidebarCollapsed} className="h-full min-h-0">
              <LandingSidebar />
              <SidebarInset className="h-full min-h-0 overflow-hidden">
                <AppHeader crumbs={crumbs} path={path} />
                {fullBleed ? (
                  <div className="flex h-[calc(100%-3.5rem)] min-h-0 flex-col overflow-hidden">{children}</div>
                ) : (
                  <div className="flex w-full flex-1 flex-col overflow-hidden py-4 px-[77px] md:py-6 md:px-[85px]">
                    {children}
                  </div>
                )}
              </SidebarInset>
              {drawer ? (
                <aside
                  aria-hidden={!drawer.open}
                  aria-label="Orion assistant"
                  style={{ width: drawer.open ? DRAWER_W : 0 }}
                  className={cn(
                    "h-full shrink-0 self-start overflow-hidden transition-[width] duration-300 ease-in-out",
                    drawer.open && "border-l border-border"
                  )}
                >
                  <div className="h-full" style={{ width: DRAWER_W }}>
                    {drawer.children}
                  </div>
                </aside>
              ) : null}
            </SidebarProvider>
          </ChartPrefsProvider>
        </TooltipProvider>
      </ScreenRoute>
      </ModalScope>
    </ScaledScreen>
  );
}
