"use client";

import Link from "next/link";
import { useScreenPath } from "@/components/screens/screen-route";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup } from "@/components/app-shared";
import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** The item's tag ("Beta"), hidden with the labels when the sidebar collapses to icons. */
function NavBadge({ text }: { text?: string }) {
	if (!text) return null;
	return (
		<Badge
			variant="secondary"
			// The button's own gap is 8px; pull the tag in to 4px. On the selected
			// item the button takes the accent colour the tag is made of, so the
			// tag flips to the page background to stay visible.
			className="-ml-1 px-1.5 py-0 text-[10px] font-semibold leading-4 text-muted-foreground group-data-active/menu-button:bg-background group-data-active/menu-button:text-foreground group-data-[collapsible=icon]:hidden"
		>
			{text}
		</Badge>
	);
}

/**
 * Whether a nav path matches the current route. The home route ("/") only
 * matches exactly; every other route also matches its nested sub-routes
 * (e.g. /wells stays active on /wells/123).
 */
function isPathActive(pathname: string, path?: string): boolean {
	if (!path) return false;
	if (path === "/") return pathname === "/";
	return pathname === path || pathname.startsWith(`${path}/`);
}

export function NavGroup({ label, items }: SidebarNavGroup) {
	const pathname = useScreenPath();

	return (
		<SidebarGroup>
			{label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
			<SidebarMenu>
				{items.map((item) => {
					const subActive = item.subItems?.some((i) =>
						isPathActive(pathname, i.path)
					);
					const itemActive = isPathActive(pathname, item.path) || subActive;
					return (
						<Collapsible className="group/collapsible" defaultOpen={itemActive} key={item.title} render={<SidebarMenuItem />}>{item.subItems?.length ? (
									<>
										<CollapsibleTrigger render={<SidebarMenuButton isActive={itemActive} />}>{item.icon}<span>{item.title}</span><ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" /></CollapsibleTrigger>
										<CollapsibleContent>
											<SidebarMenuSub>
												{item.subItems?.map((subItem) => (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton isActive={isPathActive(pathname, subItem.path)} render={<Link href={subItem.path ?? "#"} />}>{subItem.icon}<span>{subItem.title}</span><NavBadge text={subItem.badge} /></SidebarMenuSubButton>
													</SidebarMenuSubItem>
												))}
											</SidebarMenuSub>
										</CollapsibleContent>
									</>
								) : (
									<SidebarMenuButton isActive={itemActive} render={<Link href={item.path ?? "#"} />}>{item.icon}<span>{item.title}</span><NavBadge text={item.badge} /></SidebarMenuButton>
								)}</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
