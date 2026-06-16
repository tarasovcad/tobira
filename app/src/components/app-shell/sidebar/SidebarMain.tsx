"use client";

import React, {useMemo} from "react";
import {usePathname} from "next/navigation";
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
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar);

  const isCollapsed = state === "collapsed";
  const navTooltipHandle = useMemo(() => TooltipCreateHandle<React.ComponentType>(), []);

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={cn("px-3 pt-3")}>
            <div className="flex flex-col">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === pathname;

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
          {/*<div className="bg-border my-3 h-px w-full" />*/}
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
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={cn(
                  "transition-[transform,color] duration-150 ease-out",
                  isCollapsed ? "rotate-180" : "",
                )}>
                <path
                  d="M5.83333 2.5C3.99238 2.5 2.5 3.99238 2.5 5.83333V14.1667C2.5 16.0076 3.99238 17.5 5.83333 17.5V2.5Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.5 17.5H14.1667C16.0076 17.5 17.5 16.0076 17.5 14.1667V5.83333C17.5 3.99238 16.0076 2.5 14.1667 2.5H7.5V17.5ZM13.9226 7.74407C14.248 8.06952 14.248 8.59717 13.9226 8.92258L12.8452 10L13.9226 11.0774C14.248 11.4028 14.248 11.9305 13.9226 12.2559C13.5972 12.5813 13.0695 12.5813 12.7441 12.2559L11.0774 10.5892C10.752 10.2638 10.752 9.73617 11.0774 9.41075L12.7441 7.74407C13.0695 7.41864 13.5972 7.41864 13.9226 7.74407Z"
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
