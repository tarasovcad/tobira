"use client";

import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {Skeleton} from "@/components/coss-ui/skeleton";
import type {SortMode, TypeFilter} from "../../_types";
import {ListSkeleton} from "../ListSkeletons";
import {HomeToolbar} from "../home-client/HomeToolbar";

const SKELETON_ROWS = 8;

export function BookmarksLoader({
  showCount = true,
  typeFilter,
  sort,
}: {
  showCount?: boolean;
  typeFilter: TypeFilter;
  sort: SortMode;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <HomeToolbar
        typeFilter={typeFilter}
        onTypeChange={() => {}}
        sort={sort}
        onSortChange={() => {}}
        selectionMode={false}
        onSelectionEnabledChange={() => {}}
      />

      {showCount && (
        <div className="text-muted-foreground border-border flex items-center gap-2 border-b px-6 py-3 text-sm">
          <Skeleton className="h-5 w-9 rounded-[2px]" />
        </div>
      )}

      <div className="h-auto min-h-0 flex-1">
        <ScrollArea className="h-full" scrollbarGutter>
          <div className="w-full">
            {Array.from({length: SKELETON_ROWS}, (_, index) => (
              <ListSkeleton key={index} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
