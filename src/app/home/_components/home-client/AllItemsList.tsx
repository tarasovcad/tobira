"use client";
import * as React from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {cn} from "@/lib/utils";
import Spinner from "@/components/ui/spinner";
import {
  getTableBookmarkColumnsClass,
  GridCard,
  ItemList,
  MediaCard,
  MinimalItemRow,
  TableItemRow,
} from "@/components/bookmark/Bookmark";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import type {Bookmark} from "@/components/bookmark/types";
import {
  NewBookmarkList,
  NewBookmarkGridCard,
  NewBookmarkMediaCard,
} from "../NewBookmarkPlaceholder";
import type {TypeFilter} from "../AllItemsToolbar";
import type {ViewMode} from "@/store/use-view-options";
import {ListSkeleton, GridSkeleton, MediaSkeleton} from "../ListSkeletons";
import {useViewOptionsStore} from "@/store/use-view-options";
import {getCurrentAllItemsView, getAllItemsListViewOptions} from "../all-items-list-view-options";

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

export function AllItemsList({
  view,
  typeFilter,
  visibleItems,
  animatingUrl,
  animatingItemCount,
  resolvedBookmarks,
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
  const currentView = getCurrentAllItemsView(view, typeFilter);
  const isGrid = currentView === "grid";
  const isTable = currentView === "table";
  const isMediaGrid = isGrid && typeFilter === "media";

  const gridGap = useViewOptionsStore((state) => state.gridGap);
  const columnSize = useViewOptionsStore((state) => state.columnSize);
  const borderRadius = useViewOptionsStore((state) => state.borderRadius);
  const contentToggles = useViewOptionsStore((state) => state.contentToggles);

  const {borderRadiusClass, gapClass, gridColsClass} = getAllItemsListViewOptions({
    borderRadius,
    gridGap,
    columnSize,
  });

  const layoutConfig = (() => {
    switch (currentView) {
      case "grid":
        return {
          containerClassName: cn("grid", gridColsClass, gapClass, "px-6 pb-8"),
          NewBookmarkPlaceholder: isMediaGrid ? NewBookmarkMediaCard : NewBookmarkGridCard,
          BookmarkItem: isMediaGrid ? MediaCard : GridCard,
          fetchSpinnerClassName: "text-muted-foreground col-span-full py-6 text-center text-xs",
          sentinelClassName: "col-span-full h-px",
          animatedVariant: "grid" as const,
          renderSkeletonItem: (index: number) =>
            isMediaGrid ? (
              <MediaSkeleton key={index} index={index} borderRadiusClass={borderRadiusClass} />
            ) : (
              <GridSkeleton key={index} borderRadiusClass={borderRadiusClass} />
            ),
        };
      case "table":
        return {
          containerClassName: "px-6 pb-8",
          NewBookmarkPlaceholder: NewBookmarkList,
          BookmarkItem: TableItemRow,
          fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
          sentinelClassName: "h-px",
          animatedVariant: "list" as const,
          renderSkeletonItem: (index: number) => <ListSkeleton key={index} />,
        };
      case "compact":
        return {
          containerClassName: "border-t",
          NewBookmarkPlaceholder: NewBookmarkList,
          BookmarkItem: MinimalItemRow,
          fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
          sentinelClassName: "h-px",
          animatedVariant: "list" as const,
          renderSkeletonItem: (index: number) => <ListSkeleton key={index} />,
        };
      case "list":
        return {
          containerClassName: "border-t",
          NewBookmarkPlaceholder: NewBookmarkList,
          BookmarkItem: ItemList,
          fetchSpinnerClassName: "text-muted-foreground px-6 py-6 text-center text-xs",
          sentinelClassName: "h-px",
          animatedVariant: "list" as const,
          renderSkeletonItem: (index: number) => <ListSkeleton key={index} />,
        };
    }
  })();

  const {
    containerClassName,
    NewBookmarkPlaceholder,
    BookmarkItem,
    fetchSpinnerClassName,
    sentinelClassName,
    animatedVariant,
    renderSkeletonItem,
  } = layoutConfig;

  const skeletonCount = 12;

  const renderBookmarkItem = (item: Bookmark, index: number) => (
    <AnimatedItem
      key={item.id}
      id={item.id}
      isRemoving={removingIds.has(item.id)}
      onRemoved={onItemRemoved}
      variant={animatedVariant}
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

  const showSourceColumn = contentToggles.source;
  const showSavedDateColumn = contentToggles.savedDate;
  const tableColumnsClass = getTableBookmarkColumnsClass(showSourceColumn, showSavedDateColumn);

  return (
    <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
      <ScrollArea className="h-full" scrollbarGutter>
        <div className={containerClassName}>
          {isTable ? (
            <>
              <div className="overflow-hidden rounded-lg border">
                <div
                  className={cn(
                    "bg-muted/40 text-muted-foreground grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b px-4 py-2 text-xs font-medium tracking-wide uppercase",
                    tableColumnsClass,
                  )}>
                  <div className="w-8 shrink-0" />
                  <div>Title</div>
                  {showSourceColumn && (
                    <div className="hidden min-w-0 truncate md:block">Source</div>
                  )}
                  {showSavedDateColumn && <div className="hidden shrink-0 md:block">Saved</div>}
                </div>

                {animatingUrl &&
                  Array.from({length: animatingItemCount ?? 1}).map((_, i) => (
                    <div key={`animating-${animatingUrl}-${i}`}>
                      <NewBookmarkPlaceholder
                        url={animatingUrl}
                        bookmark={resolvedBookmarks.at(i) || null}
                        onDone={i === 0 ? onTransitionDone : () => {}}
                      />
                    </div>
                  ))}
                {content}

                {isFetchingNextPage && <LoadingSpinner className={fetchSpinnerClassName} />}
              </div>

              <div ref={bottomSentinelRef} aria-hidden className={sentinelClassName} />
            </>
          ) : (
            <>
              {animatingUrl &&
                Array.from({length: animatingItemCount ?? 1}).map((_, i) => (
                  <div key={`animating-${animatingUrl}-${i}`}>
                    <NewBookmarkPlaceholder
                      url={animatingUrl}
                      bookmark={resolvedBookmarks.at(i) || null}
                      onDone={i === 0 ? onTransitionDone : () => {}}
                    />
                  </div>
                ))}
              {content}

              {isFetchingNextPage && <LoadingSpinner className={fetchSpinnerClassName} />}

              <div ref={bottomSentinelRef} aria-hidden className={sentinelClassName} />
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
