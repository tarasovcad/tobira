"use client";

import React, {useEffect, useMemo} from "react";
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
import {SidebarToggleButton} from "./SidebarToggleButton";

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

  const isCollapsed = state === "collapsed";
  const navTooltipHandle = useMemo(() => TooltipCreateHandle<React.ComponentType>(), []);

  useEffect(() => {
    if (!isCollapsed) {
      navTooltipHandle.close();
    }
  }, [isCollapsed, navTooltipHandle]);

  return (
    <TooltipProvider>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className={cn("px-3 pt-3")}>
            <div className="flex flex-col gap-0.5">
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

            {!isCollapsed && <div className="bg-border my-3 mb-2 h-px w-full" />}
          </div>

          {!isCollapsed && (
            <div className="min-h-0 flex-1">
              <ScrollArea
                className="**:data-[slot=scroll-area-scrollbar]:m-0.5 [&_[data-orientation=horizontal]]:hidden"
                viewportProps={{className: "overflow-x-hidden", tabIndex: -1}}>
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
          <SidebarToggleButton isCollapsed={isCollapsed} />
        </div>
        {isCollapsed && (
          <Tooltip handle={navTooltipHandle}>
            {({payload: Payload}) => (
              <TooltipPopup side="right" align="center" sideOffset={6} size="md">
                {Payload !== undefined && <Payload />}
              </TooltipPopup>
            )}
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
