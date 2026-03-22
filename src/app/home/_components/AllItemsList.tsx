"use client";
import * as React from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {cn} from "@/lib/utils";
import Spinner from "@/components/ui/spinner";
import {Bookmark, GridCard, ItemRow, MediaCard} from "@/components/bookmark/Bookmark";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import {NewBookmarkRow, NewBookmarkGridCard, NewBookmarkMediaCard} from "./NewBookmarkPlaceholder";
import type {TypeFilter} from "./AllItemsToolbar";
import type {ViewMode} from "@/store/use-view-options";
import {RowSkeleton, GridSkeleton, MediaSkeleton} from "./ListSkeletons";
import {useViewOptionsStore} from "@/store/use-view-options";

const BORDER_RADIUS_MAP: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
};

const GAP_MAP: Record<string, string> = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

const MB_MAP: Record<string, string> = {
  none: "mb-0",
  xs: "mb-2",
  sm: "mb-4",
  md: "mb-6",
  lg: "mb-8",
};

const COLUMNS_MAP: Record<number, string> = {
  1: "columns-1 lg:columns-2",
  2: "columns-1 xl:columns-2",
  3: "columns-1 lg:columns-2 xl:columns-3",
  4: "columns-1 sm:columns-2 lg:columns-3 xl:columns-4",
  5: "columns-2 sm:columns-3 lg:columns-4 xl:columns-5",
  6: "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6",
};

const GRID_COLS_MAP: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
};

function LoadingSpinner({className}: {className?: string}) {
  return (
    <div className={className}>
      <Spinner className="mx-auto size-4 animate-spin" />
    </div>
  );
}

interface AllItemsListProps {
  view: ViewMode;
  typeFilter: TypeFilter;
  visibleItems: Bookmark[];
  animatingUrl: string | null;
  animatingItemCount: number;
  resolvedBookmarks: Bookmark[];
  isInitialLoad: boolean;
  isFetchingNextPage: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  removingIds: Map<string, "delete" | "archive">;
  scrollAreaRootRef: React.RefObject<HTMLDivElement | null>;
  bottomSentinelRef: React.RefObject<HTMLDivElement | null>;
  onTransitionDone: () => void;
  onItemRemoved: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  openMenu: (item: Bookmark) => void;
  openDeleteDialog: (item: Bookmark) => void;
}

/**
 * Renders the scrollable list of bookmarks in either grid or list view.
 */
export function AllItemsList({
  view,
  typeFilter,
  visibleItems,
  animatingUrl,
  animatingItemCount,
  resolvedBookmarks,
  // isInitialLoad,
  isFetchingNextPage,
  selectionMode,
  selectedIds,
  removingIds,
  scrollAreaRootRef,
  bottomSentinelRef,
  onTransitionDone,
  onItemRemoved,
  toggleSelected,
  setSelected,
  openMenu,
  openDeleteDialog,
  isInitialLoad,
}: AllItemsListProps) {
  // const isInitialLoad = true;
  const isGrid = view === "grid";
  const isMedia = typeFilter === "media";
  const {gridGap, columnSize, borderRadius} = useViewOptionsStore();

  const borderRadiusClass = BORDER_RADIUS_MAP[borderRadius];
  const gapClass = GAP_MAP[gridGap];
  const itemMbClass = MB_MAP[gridGap];
  const columnClass = COLUMNS_MAP[columnSize];
  const gridColsClass = GRID_COLS_MAP[columnSize];

  const containerClassName = cn(
    isMedia && [columnClass, gapClass, "px-6 pb-8"],
    isGrid && !isMedia && ["grid", gridColsClass, gapClass, "px-6 pb-8"],
    !isMedia && !isGrid && "border-t",
  );

  const NewBookmarkPlaceholder = isMedia
    ? NewBookmarkMediaCard
    : isGrid
      ? NewBookmarkGridCard
      : NewBookmarkRow;

  const BookmarkItem = isMedia ? MediaCard : isGrid ? GridCard : ItemRow;
  const skeletonCount = 12;

  const fetchSpinnerClassName =
    isGrid || isMedia
      ? "text-muted-foreground col-span-full py-6 text-center text-xs"
      : "text-muted-foreground px-6 py-6 text-center text-xs";

  const sentinelClassName = isGrid || isMedia ? "col-span-full h-px" : "h-px";

  const renderSkeletonItem = (index: number) => {
    if (isMedia) {
      return (
        <div key={index} className={cn(itemMbClass, "break-inside-avoid")}>
          <MediaSkeleton index={index} borderRadiusClass={borderRadiusClass} />
        </div>
      );
    }

    if (isGrid) {
      return <GridSkeleton key={index} borderRadiusClass={borderRadiusClass} />;
    }

    return <RowSkeleton key={index} />;
  };

  const renderBookmarkItem = (item: Bookmark, index: number) => (
    <AnimatedItem
      key={item.id}
      id={item.id}
      isRemoving={removingIds.has(item.id)}
      onRemoved={onItemRemoved}
      variant={isMedia || view === "grid" ? "grid" : "list"}
      className={isMedia ? cn(itemMbClass, "break-inside-avoid") : undefined}
      kind={removingIds.get(item.id) ?? "delete"}>
      <div
        className="relative"
        onClickCapture={(e) => {
          if (!selectionMode) return;
          e.preventDefault();
          e.stopPropagation();
          toggleSelected(item.id);
        }}>
        <BookmarkItem
          item={item}
          onOpenMenu={openMenu}
          onDelete={openDeleteDialog}
          selectionMode={selectionMode}
          selectionIndex={index}
          selectedIds={selectedIds}
          setSelected={setSelected}
        />
      </div>
    </AnimatedItem>
  );

  const content = isInitialLoad
    ? Array.from({length: skeletonCount}, (_, index) => renderSkeletonItem(index))
    : visibleItems.map(renderBookmarkItem);

  return (
    <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
      <ScrollArea className="h-full" scrollbarGutter>
        <div className={containerClassName}>
          {/* Skeleton placeholder for a newly-added bookmark */}
          {animatingUrl &&
            Array.from({length: animatingItemCount ?? 1}).map((_, i) => (
              <div
                key={`animating-${animatingUrl}-${i}`}
                className={isMedia ? cn(itemMbClass, "break-inside-avoid") : undefined}>
                <NewBookmarkPlaceholder
                  url={animatingUrl}
                  bookmark={resolvedBookmarks.at(i) || null}
                  onDone={i === 0 ? onTransitionDone : () => {}}
                />
              </div>
            ))}
          {content}

          {/* Pagination loader */}
          {isFetchingNextPage && <LoadingSpinner className={fetchSpinnerClassName} />}

          {/* Intersection observer sentinel */}
          <div ref={bottomSentinelRef} aria-hidden className={sentinelClassName} />
        </div>
      </ScrollArea>
    </div>
  );
}
