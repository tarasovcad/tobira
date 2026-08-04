"use client";

import {Button} from "@/components/ui/coss/button";
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import {Skeleton} from "@/components/ui/coss/skeleton";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import {
  getCurrentAllItemsView,
  getBookmarkWidthForType,
  getAllItemsListViewOptions,
} from "@/features/all-items/components/all-items-list-view-options";
import {getAllItemsListLayoutConfig} from "@/features/all-items/components/all-items-list-layout";
import {HomeToolbar} from "@/features/home/components/HomeToolbar";
import type {SortMode, TypeFilter} from "@/features/home/types";
import {getLayoutOptions, useViewOptionsStore} from "@/store/use-view-options";

const SKELETON_ROWS = 8;
const STAT_LABEL_WIDTHS = ["w-[60px]", "w-[90px]", "w-[67px]", "w-[68px]"];

export function BinPageSkeleton({typeFilter, sort}: {typeFilter: TypeFilter; sort: SortMode}) {
  const view = useViewOptionsStore((state) => state.view);
  const currentView = getCurrentAllItemsView(view, typeFilter);
  const layoutOptions = useViewOptionsStore((state) =>
    getLayoutOptions(state.viewOptionsByLayout, currentView),
  );
  const {gridGap, columnSize, borderRadius} = layoutOptions;
  const bookmarkWidth = getBookmarkWidthForType(layoutOptions.bookmarkWidthByType, typeFilter);
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
      <div className="border-b px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-foreground text-[22px] font-[550]">Bin</h1>
            <p className="text-muted-foreground text-sm">/</p>
            <p className="text-muted-foreground text-sm">
              Deleted bookmarks you can restore or permanently remove.
            </p>
          </div>
          <Button variant="destructive-outline" type="button">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.24601 3.33334H2.16699C1.89085 3.33334 1.66699 3.5572 1.66699 3.83334C1.66699 4.10948 1.89085 4.33334 2.16699 4.33334H2.66697C2.66699 4.34494 2.6674 4.35662 2.66822 4.36836L3.2281 12.3418C3.32005 13.6513 4.4092 14.6667 5.72196 14.6667H10.2787C11.5915 14.6667 12.6806 13.6513 12.7725 12.3418L13.3325 4.36836C13.3333 4.35662 13.3337 4.34494 13.3337 4.33334H13.8337C14.1098 4.33334 14.3337 4.10948 14.3337 3.83334C14.3337 3.5572 14.1098 3.33334 13.8337 3.33334H10.7547C10.4547 2.09005 9.33573 1.16667 8.00039 1.16667C6.66504 1.16667 5.54599 2.09005 5.24601 3.33334ZM6.29188 3.33334H9.70886C9.44219 2.65056 8.77752 2.16667 8.00039 2.16667C7.22319 2.16667 6.55853 2.65056 6.29188 3.33334ZM6.66699 6.50001C6.94313 6.50001 7.16699 6.72387 7.16699 7.00001V10.8333C7.16699 11.1095 6.94313 11.3333 6.66699 11.3333C6.39085 11.3333 6.16699 11.1095 6.16699 10.8333V7.00001C6.16699 6.72387 6.39085 6.50001 6.66699 6.50001ZM9.33366 6.50001C9.60979 6.50001 9.83366 6.72387 9.83366 7.00001V10.8333C9.83366 11.1095 9.60979 11.3333 9.33366 11.3333C9.05753 11.3333 8.83366 11.1095 8.83366 10.8333V7.00001C8.83366 6.72387 9.05753 6.50001 9.33366 6.50001Z"
                fill="currentColor"
              />
            </svg>
            Empty bin
          </Button>
        </div>

        <div className="border-border mt-2 flex flex-wrap items-center gap-x-4 gap-y-3 border-t pt-4 xl:border-t-0 xl:pt-0">
          {STAT_LABEL_WIDTHS.map((labelWidth, index) => (
            <div key={labelWidth} className="contents">
              {index > 0 && <div className="bg-border h-5 w-px" aria-hidden />}
              <div className="flex items-baseline gap-2">
                <Skeleton className={`h-5 ${labelWidth}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <HomeToolbar
        typeFilter={typeFilter}
        onTypeChange={() => {}}
        sort={sort}
        onSortChange={() => {}}
        selectionMode={false}
      />

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
