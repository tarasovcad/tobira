"use client";

import {usePathname} from "next/navigation";
import {NAV_ITEMS, NavItem} from "@/components/app-shell/sidebar/SidebarNav";
import {
  SidebarCollectionSkeleton,
  SidebarTagSkeleton,
} from "@/components/app-shell/sidebar/SidebarItems";
import {SidebarToggleButton} from "./SidebarToggleButton";
import {
  DEFAULT_SIDEBAR_PREFERENCES,
  type SidebarPreferences,
  type SidebarSectionId,
  type SidebarSectionLimit,
} from "@/lib/sidebar-preferences";

const SIDEBAR_WIDTH = "224px";
const SIDEBAR_WIDTH_ICON = "60px";

const COLLECTION_SKELETON_WIDTHS = [
  "w-[60%]",
  "w-[40%]",
  "w-[75%]",
  "w-[50%]",
  "w-[65%]",
  "w-[55%]",
];
const TAG_SKELETON_WIDTHS = ["w-[50%]", "w-[70%]", "w-[40%]", "w-[60%]", "w-[45%]", "w-[55%]"];

export function SidebarSkeleton({
  preferences = DEFAULT_SIDEBAR_PREFERENCES,
}: {
  preferences?: SidebarPreferences;
}) {
  const pathname = usePathname();
  const isCollapsed = preferences.collapsed;

  return (
    <aside
      className="bg-muted/30 relative h-full shrink-0 overflow-hidden border-r"
      style={{width: isCollapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH}}>
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
                    collapsed={isCollapsed}
                  />
                );
              })}
            </div>

            {!isCollapsed && <div className="bg-border my-3 mb-2 h-px w-full" />}
          </div>

          {!isCollapsed && (
            <div className="bg min-h-0 flex-1 overflow-hidden">
              {preferences.sections.map(([section, limit], index) => (
                <div key={section}>
                  <SidebarSkeletonSection section={section} limit={limit} />
                  {index < preferences.sections.length - 1 && (
                    <div className="px-3">
                      <div className="bg-border my-3 h-px w-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 p-3 pt-0">
          <SidebarToggleButton isCollapsed={isCollapsed} disabled />
        </div>
      </div>
    </aside>
  );
}

function SidebarSkeletonSection({
  section,
  limit,
}: {
  section: SidebarSectionId;
  limit: SidebarSectionLimit;
}) {
  const isCollections = section === "collections";
  const title = isCollections ? "Collections" : "Tags";
  const widths = isCollections ? COLLECTION_SKELETON_WIDTHS : TAG_SKELETON_WIDTHS;
  const SkeletonItem = isCollections ? SidebarCollectionSkeleton : SidebarTagSkeleton;

  return (
    <div className={isCollections ? "px-3 pt-1" : "px-3"}>
      <div className="text-muted-foreground flex h-8.75 w-full items-center justify-between rounded-md px-3 py-[7.5px] text-[11px] font-semibold tracking-wider uppercase">
        <span>{title}</span>
      </div>
      <div className="flex flex-col gap-0.5 pb-2">
        {Array.from({length: limit}, (_, idx) => (
          <SkeletonItem key={`${section}-skeleton-${idx}`} width={widths[idx % widths.length]} />
        ))}
      </div>
    </div>
  );
}
