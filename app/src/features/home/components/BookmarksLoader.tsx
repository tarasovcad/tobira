"use client";

import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {Skeleton} from "@/components/coss-ui/skeleton";
import {useViewOptionsStore} from "@/store/use-view-options";
import type {SortMode, TypeFilter} from "@/features/home/types";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import {HomeToolbar} from "@/features/home/components/HomeToolbar";
import {
  getCurrentAllItemsView,
  getBookmarkWidthForType,
  getAllItemsListViewOptions,
} from "@/features/all-items/components/all-items-list-view-options";
import {getAllItemsListLayoutConfig} from "@/features/all-items/components/all-items-list-layout";
import {cn} from "@/lib/utils";

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
  const view = useViewOptionsStore((state) => state.view);
  const gridGap = useViewOptionsStore((state) => state.gridGap);
  const columnSize = useViewOptionsStore((state) => state.columnSize);
  const borderRadius = useViewOptionsStore((state) => state.borderRadius);
  const bookmarkWidth = useViewOptionsStore((state) =>
    getBookmarkWidthForType(state.bookmarkWidthByType, typeFilter),
  );

  const currentView = getCurrentAllItemsView(view, typeFilter);
  const isMediaGrid = currentView === "grid" && typeFilter === "media";
  const {borderRadiusClass, gapClass, gridColsClass, masonryColsClass} = getAllItemsListViewOptions(
    {
      borderRadius,
      gridGap,
      columnSize,
    },
  );
  const layoutConfig = getAllItemsListLayoutConfig({
    view: currentView,
    borderRadiusClass,
    gapClass,
    gridColsClass,
    masonryColsClass,
    isMediaGrid,
    bookmarkWidth,
    typeFilter,
  });

  const skeletons = Array.from({length: SKELETON_ROWS}, (_, index) =>
    layoutConfig.renderSkeletonItem(index),
  );
  const content = layoutConfig.isTable ? (
    <BookmarkTableShell>{skeletons}</BookmarkTableShell>
  ) : (
    skeletons
  );

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
        <div
          className={cn(
            "text-muted-foreground border-border flex items-center gap-2 px-6 py-3 text-sm",
            currentView === "compact" && "border-b",
            currentView === "list" && "border-b",
          )}>
          <Skeleton className="h-5 w-9 rounded-[2px]" />
        </div>
      )}

      <div className="h-auto min-h-0 flex-1">
        <ScrollArea className="h-full" scrollbarGutter>
          <div className={layoutConfig.wrapperClassName}>
            <div className={layoutConfig.containerClassName}>{content}</div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
