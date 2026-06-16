"use client";

import React, {useMemo} from "react";
import {usePathname} from "next/navigation";
import {useQueryStates} from "nuqs";
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import type {Collection} from "@/app/actions/collections";
import {NavItem, NAV_ITEMS} from "./SidebarNav";
import {SidebarTags, type SidebarTagsType} from "./SidebarTags";
import {SidebarCollections} from "./SidebarCollections";
import {cn} from "@/lib/utils";
import {
  Tooltip,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
} from "@/components/ui/coss/tooltip";
import {homeFilterParsers} from "@/lib/query-params";
import {useSidebarStore} from "@/store/use-sidebar-store";

interface SidebarMainProps {
  allCollections?: Collection[];
  allTags?: SidebarTagsType;
  isAuthenticated?: boolean;
  userId?: string;
  state: "expanded" | "collapsed";
}

export function SidebarMain({
  allCollections,
  allTags,
  isAuthenticated = false,
  userId,
  state,
}: SidebarMainProps) {
  const pathname = usePathname();
  const [{tag}] = useQueryStates(homeFilterParsers);
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);

  const activeTag = tag?.trim() || null;
  const isCollapsed = state === "collapsed";
  const navTooltipHandle = useMemo(() => TooltipCreateHandle<React.ComponentType>(), []);

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={cn("px-3 pt-3")}>
            <div className="flex flex-col">
              {NAV_ITEMS.map((item) => {
                const isAllItemsWithFilter =
                  item.href === "/home" && pathname === "/home" && !!activeTag;

                const isActive = item.href === pathname && !isAllItemsWithFilter;

                return (
                  <NavItem
                    key={item.label}
                    href={item.href}
                    isActive={isActive}
                    icon={item.icon}
                    label={item.label}
                    disabled={item.disabled}
                    collapsed={isCollapsed}
                    tooltipHandle={isCollapsed ? navTooltipHandle : undefined}
                  />
                );
              })}
            </div>

            <div className="bg-border my-3 h-px w-full" />
          </div>

          {!isCollapsed && (
            <div className="min-h-0 flex-1">
              <ScrollArea
                className="**:data-[slot=scroll-area-scrollbar]:m-0.5"
                viewportProps={{tabIndex: -1}}>
                <SidebarCollections
                  allCollections={allCollections}
                  isAuthenticated={isAuthenticated}
                  userId={userId}
                />
                <div className="px-3">
                  <div className="bg-border my-3 h-px w-full" />
                </div>

                <SidebarTags allTags={allTags} userId={userId} />
              </ScrollArea>
            </div>
          )}
        </div>

        <div className={cn("shrink-0 p-3 pt-0")}>
          <div className="bg-border my-3 h-px w-full" />
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-fit items-center rounded-md text-sm font-medium transition-[padding] duration-50 ease-linear",
              "hover:bg-muted hover:text-foreground cursor-pointer bg-transparent",
              "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              "justify-start px-2 py-2",
              "text-secondary",
            )}>
            <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
              <svg
                width="20"
                height="20"
                viewBox="0 0 22 22"
                fill="none"
                className={cn(
                  "transition-[transform,color] duration-150 ease-out",
                  isCollapsed ? "rotate-180" : "",
                )}
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.41667 2.75C4.39162 2.75 2.75 4.39162 2.75 6.41667V15.5833C2.75 17.6083 4.39162 19.25 6.41667 19.25V2.75Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.25 19.25H15.5833C17.6083 19.25 19.25 17.6083 19.25 15.5833V6.41667C19.25 4.39162 17.6083 2.75 15.5833 2.75H8.25V19.25ZM15.3148 8.51848C15.6728 8.87647 15.6728 9.45688 15.3148 9.81484L14.1297 11L15.3148 12.1852C15.6728 12.5431 15.6728 13.1236 15.3148 13.4815C14.9569 13.8395 14.3765 13.8395 14.0185 13.4815L12.1852 11.6482C11.8272 11.2902 11.8272 10.7098 12.1852 10.3518L14.0185 8.51848C14.3765 8.16051 14.9569 8.16051 15.3148 8.51848Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </button>
        </div>
        <Tooltip handle={navTooltipHandle}>
          {({payload: Payload}) => (
            <TooltipPopup side="right" align="center" sideOffset={6} size="md">
              {Payload !== undefined && isCollapsed && <Payload />}
            </TooltipPopup>
          )}
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
