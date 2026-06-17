"use client";

import {usePathname} from "next/navigation";
import {NAV_ITEMS, NavItem} from "@/components/app-shell/sidebar/SidebarNav";
import {
  SidebarCollectionSkeleton,
  SidebarTagSkeleton,
} from "@/components/app-shell/sidebar/SidebarItems";
import {SidebarToggleButton} from "./SidebarToggleButton";

export function SidebarSkeleton() {
  const pathname = usePathname();

  return (
    <aside className="bg-muted/30 relative h-full w-[224px] shrink-0 overflow-hidden border-r">
      <div className="absolute inset-0 flex min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-3 pt-3">
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
                  />
                );
              })}
            </div>

            <div className="bg-border my-3 mb-2 h-px w-full" />
          </div>

          <div className="bg min-h-0 flex-1">
            {/* Collections Section */}
            <div className="px-3 pt-1">
              <div className="text-muted-foreground flex h-8.75 w-full items-center justify-between rounded-md px-3 py-[7.5px] text-[11px] font-semibold tracking-wider uppercase">
                <span>Collections</span>
              </div>{" "}
              <div className="flex flex-col gap-0.5">
                {[1, 2, 3, 4, 5, 6].map((i, idx) => (
                  <SidebarCollectionSkeleton
                    key={`col-skeleton-${i}`}
                    width={
                      ["w-[60%]", "w-[40%]", "w-[75%]", "w-[50%]", "w-[65%]", "w-[55%]"][idx % 6]
                    }
                  />
                ))}
              </div>
              <div className="bg-border my-3 h-px w-full" />
            </div>

            {/* Tags Section */}
            <div className="px-3">
              <div className="text-muted-foreground flex h-8.75 w-full items-center justify-between rounded-md px-3 py-[7.5px] text-[11px] font-semibold tracking-wider uppercase">
                <span>Tags</span>
              </div>
              <div className="flex flex-col gap-0.5 pb-2">
                {[1, 2, 3, 4, 5, 6].map((i, idx) => (
                  <SidebarTagSkeleton
                    key={`tag-skeleton-${i}`}
                    width={
                      ["w-[50%]", "w-[70%]", "w-[40%]", "w-[60%]", "w-[45%]", "w-[55%]"][idx % 6]
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 p-3 pt-0">
          <SidebarToggleButton isCollapsed={false} disabled />
        </div>
      </div>
    </aside>
  );
}
