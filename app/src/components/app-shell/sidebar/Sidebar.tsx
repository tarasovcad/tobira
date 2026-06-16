"use client";

import type {Collection} from "@/app/actions/collections";
import type {SidebarTag} from "@/features/home/types";
import {SidebarMain} from "./SidebarMain";
import {SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON} from "./sidebar-constants";
import {cn} from "@/lib/utils";
import {useSidebarStore} from "@/store/use-sidebar-store";
import {useHasMounted} from "@/lib/hooks/use-has-mounted";

export function Sidebar({
  allCollections,
  allTags,
  isAuthenticated = false,
  userId,
}: {
  allCollections?: Collection[];
  allTags?: SidebarTag[];
  isAuthenticated?: boolean;
  userId?: string;
}) {
  const hasMounted = useHasMounted();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const sidebarIsOpen = hasMounted ? isOpen : true;
  const contentState = sidebarIsOpen ? "expanded" : "collapsed";

  return (
    <aside
      className={cn(
        "bg-muted/30 relative h-full shrink-0 overflow-hidden border-r transition-[width] duration-200 ease-linear",
      )}
      style={{
        width: sidebarIsOpen ? SIDEBAR_WIDTH : SIDEBAR_WIDTH_ICON,
      }}>
      <SidebarMain
        allCollections={allCollections}
        allTags={allTags}
        isAuthenticated={isAuthenticated}
        userId={userId}
        state={contentState}
      />
    </aside>
  );
}
