"use client";
import * as React from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {cn} from "@/lib/utils";
import Spinner from "@/components/shadcn/coss-ui";
import {Bookmark, GridCard, ItemRow, MediaCard} from "@/components/bookmark/Bookmark";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import {NewBookmarkRow, NewBookmarkGridCard} from "./NewBookmarkPlaceholder";
import type {ViewMode, TypeFilter} from "./AllItemsToolbar";
import {RowSkeleton, GridSkeleton, MediaSkeleton} from "./ListSkeletons";
import {useMediaLayoutStore} from "@/store/use-media-layout";

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
  resolvedBookmark: Bookmark | null;
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
  resolvedBookmark,
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
  const {gapSize, columnSize} = useMediaLayoutStore();

  const gapClass =
    gapSize === "none"
      ? "gap-0"
      : gapSize === "small"
        ? "gap-2"
        : gapSize === "large"
          ? "gap-8"
          : "gap-4";

  const itemMbClass =
    gapSize === "none"
      ? "mb-0"
      : gapSize === "small"
        ? "mb-2"
        : gapSize === "large"
          ? "mb-8"
          : "mb-4";

  const columnClass =
    columnSize === "s"
      ? "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
      : columnSize === "l"
        ? "columns-1 lg:columns-2 xl:columns-3"
        : columnSize === "xl"
          ? "columns-1 xl:columns-2"
          : "columns-1 sm:columns-2 lg:columns-3 xl:columns-4";

  const containerClassName = isMedia
    ? `${columnClass} ${gapClass} px-6 pb-8`
    : isGrid
      ? "grid grid-cols-1 gap-6 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "border-t";

  const NewBookmarkPlaceholder = isGrid ? NewBookmarkGridCard : NewBookmarkRow;
  const BookmarkItem = isMedia ? MediaCard : isGrid ? GridCard : ItemRow;

  const fetchSpinnerClassName =
    isGrid || isMedia
      ? "text-muted-foreground col-span-full py-6 text-center text-xs"
      : "text-muted-foreground px-6 py-6 text-center text-xs";

  const sentinelClassName = isGrid || isMedia ? "col-span-full h-px" : "h-px";

  return (
    <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
      <ScrollArea className="h-full" scrollbarGutter scrollFade>
        <div className={containerClassName}>
          {/* Skeleton placeholder for a newly-added bookmark */}
          {animatingUrl && (
            <div className={isMedia ? cn(itemMbClass, "break-inside-avoid") : undefined}>
              <NewBookmarkPlaceholder
                url={animatingUrl}
                bookmark={resolvedBookmark}
                onDone={onTransitionDone}
              />
            </div>
          )}

          {isInitialLoad
            ? Array.from({length: isGrid || isMedia ? 12 : 12}).map((_, i) =>
                isMedia ? (
                  <div key={i} className={cn(itemMbClass, "break-inside-avoid")}>
                    <MediaSkeleton index={i} />
                  </div>
                ) : isGrid ? (
                  <GridSkeleton key={i} />
                ) : (
                  <RowSkeleton key={i} />
                ),
              )
            : visibleItems.map((item, index) => (
                <AnimatedItem
                  key={item.id}
                  id={item.id}
                  isRemoving={removingIds.has(item.id)}
                  onRemoved={onItemRemoved}
                  variant={isMedia ? "grid" : view}
                  className={isMedia ? cn(itemMbClass, "break-inside-avoid") : undefined}
                  kind={removingIds.get(item.id) ?? "delete"}>
                  <div
                    className={cn(
                      "relative",
                      selectionMode && selectedIds.has(item.id) && "ring-primary rounded-md ring-2",
                    )}
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
              ))}

          {/* Pagination loader */}
          {isFetchingNextPage && <LoadingSpinner className={fetchSpinnerClassName} />}

          {/* Intersection observer sentinel */}
          <div ref={bottomSentinelRef} aria-hidden className={sentinelClassName} />
        </div>
      </ScrollArea>
    </div>
  );
}
