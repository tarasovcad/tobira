"use client";

import React from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import type {Collection} from "@/app/actions/collections";
import {NavItem, NAV_ITEMS} from "./SidebarNav";
import {SidebarTags, SidebarTagsType} from "./SidebarTags";
import {SidebarCollections} from "./SidebarCollections";

export function Sidebar({
  tags: initialTags,
  collections: initialCollections,
  onCreateCollection,
  isAuthenticated = false,
}: {
  tags?: SidebarTagsType;
  collections?: Collection[];
  onCreateCollection?: () => void;
  isAuthenticated?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCreateCollection = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    onCreateCollection?.();
  };

  const activeTag =
    searchParams.get("tag")?.trim().replace(/\s+/g, " ").toLowerCase() ??
    searchParams.get("tab")?.trim().replace(/\s+/g, " ").toLowerCase() ??
    null;

  return (
    <aside className="h-full w-[224px] shrink-0 border-r">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-3 pt-3">
            <div className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => {
                const isAllItemsWithFilter =
                  item.href === "/all" &&
                  pathname === "/all" &&
                  (!!activeTag || !!searchParams.get("collection"));
                const isActive = item.href === pathname && !isAllItemsWithFilter;

                return (
                  <NavItem
                    key={item.label}
                    href={item.href}
                    isActive={isActive}
                    icon={item.icon}
                    label={item.label}
                  />
                );
              })}
            </div>

            <div className="bg-border my-4 h-px w-full" />
          </div>

          <div className="min-h-0 flex-1">
            <ScrollArea className="**:data-[slot=scroll-area-scrollbar]:m-0.5">
              <SidebarCollections
                initialCollections={initialCollections}
                onCreateCollection={handleCreateCollection}
              />
              <div className="bg-border my-4 h-px w-full" />
              <SidebarTags initialTags={initialTags} />
            </ScrollArea>
          </div>
        </div>
        <div className="shrink-0 p-3 pt-0">
          <div className="bg-border my-4 h-px w-full" />
          <NavItem
            href="/settings"
            isActive={pathname === "/settings"}
            icon={
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.899 1.79361C11.5904 1.66675 11.1992 1.66675 10.4167 1.66675C9.63416 1.66675 9.24291 1.66675 8.93433 1.79361C8.52283 1.96277 8.19591 2.28723 8.02546 2.69561C7.94766 2.88203 7.91721 3.09883 7.90529 3.41507C7.88778 3.87981 7.64763 4.30999 7.24181 4.54252C6.83598 4.77505 6.34053 4.76636 5.92624 4.54905C5.64431 4.40116 5.43991 4.31893 5.23832 4.2926C4.79674 4.2349 4.35015 4.35366 3.9968 4.62275C3.73178 4.82456 3.53616 5.16083 3.14491 5.83336C2.75367 6.50589 2.55806 6.84215 2.51446 7.17084C2.45631 7.60908 2.57598 8.0523 2.84712 8.403C2.97088 8.56308 3.14481 8.69758 3.41475 8.86591C3.81159 9.11341 4.06693 9.535 4.06691 10.0001C4.06688 10.4652 3.81155 10.8867 3.41475 11.1341C3.14476 11.3025 2.97081 11.4371 2.84704 11.5972C2.5759 11.9478 2.45624 12.391 2.51437 12.8292C2.55797 13.1579 2.7536 13.4942 3.14483 14.1667C3.53607 14.8392 3.7317 15.1756 3.99671 15.3773C4.35006 15.6464 4.79666 15.7652 5.23824 15.7075C5.43981 15.6812 5.64421 15.5989 5.92611 15.4511C6.34043 15.2337 6.83591 15.2251 7.24176 15.4576C7.64761 15.6902 7.88777 16.1203 7.90529 16.5852C7.91721 16.9013 7.94766 17.1182 8.02546 17.3046C8.19591 17.7129 8.52283 18.0374 8.93433 18.2066C9.24291 18.3334 9.63416 18.3334 10.4167 18.3334C11.1992 18.3334 11.5904 18.3334 11.899 18.2066C12.3105 18.0374 12.6374 17.7129 12.8078 17.3046C12.8857 17.1182 12.9162 16.9013 12.9281 16.5851C12.9456 16.1203 13.1857 15.6902 13.5915 15.4576C13.9973 15.225 14.4928 15.2337 14.9072 15.4511C15.1891 15.5989 15.3934 15.6811 15.595 15.7074C16.0366 15.7652 16.4832 15.6464 16.8365 15.3773C17.1016 15.1755 17.2972 14.8392 17.6884 14.1667C18.0797 13.4942 18.2752 13.1579 18.3189 12.8292C18.377 12.391 18.2573 11.9477 17.9862 11.5971C17.8624 11.437 17.6885 11.3024 17.4185 11.1341C17.0217 10.8867 16.7664 10.4651 16.7664 10C16.7664 9.53491 17.0217 9.1135 17.4185 8.86608C17.6886 8.69766 17.8625 8.56316 17.9863 8.403C18.2574 8.05236 18.3771 7.60914 18.319 7.17089C18.2753 6.84221 18.0797 6.50594 17.6885 5.83341C17.2972 5.16089 17.1017 4.82462 16.8366 4.62281C16.4832 4.35371 16.0367 4.23496 15.5951 4.29266C15.3935 4.31899 15.1891 4.40121 14.9072 4.54908C14.4929 4.76641 13.9974 4.7751 13.5916 4.54255C13.1857 4.31001 12.9456 3.8798 12.928 3.41503C12.9161 3.09881 12.8857 2.88202 12.8078 2.69561C12.6374 2.28723 12.3105 1.96277 11.899 1.79361ZM10.4167 12.5001C11.8079 12.5001 12.9357 11.3808 12.9357 10.0001C12.9357 8.61933 11.8079 7.50008 10.4167 7.50008C9.02541 7.50008 7.89763 8.61933 7.89763 10.0001C7.89763 11.3808 9.02541 12.5001 10.4167 12.5001Z"
                  fill="currentColor"
                />
              </svg>
            }
            label="Settings"
          />
        </div>
      </div>
    </aside>
  );
}
