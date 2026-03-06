"use client";
import * as React from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import {cn} from "@/lib/utils";
import Spinner from "@/components/shadcn/coss-ui";
import {Bookmark, GridCard, ItemRow} from "@/components/bookmark/Bookmark";
import {AnimatedItem} from "@/components/bookmark/AnimatedItem";
import {NewBookmarkRow, NewBookmarkGridCard} from "./NewBookmarkPlaceholder";
import type {ViewMode} from "./AllItemsToolbar";

function LoadingSpinner({className}: {className?: string}) {
  return (
    <div className={className}>
      <Spinner className="mx-auto size-4 animate-spin" />
    </div>
  );
}

interface AllItemsListProps {
  view: ViewMode;
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
  visibleItems,
  animatingUrl,
  resolvedBookmark,
  isInitialLoad,
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
}: AllItemsListProps) {
  return (
    <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
      <ScrollArea className="h-full" scrollbarGutter scrollFade>
        {view === "grid" ? (
          <div className="grid grid-cols-1 gap-6 px-6 pb-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Skeleton placeholder for a newly-added bookmark */}
            {animatingUrl && (
              <NewBookmarkGridCard
                url={animatingUrl}
                bookmark={resolvedBookmark}
                onDone={onTransitionDone}
              />
            )}

            {isInitialLoad ? (
              <LoadingSpinner className="text-muted-foreground col-span-full py-8 text-center text-xs" />
            ) : (
              visibleItems.map((item, index) => (
                <AnimatedItem
                  key={item.id}
                  id={item.id}
                  isRemoving={removingIds.has(item.id)}
                  onRemoved={onItemRemoved}
                  variant="grid"
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
                    <GridCard
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
              ))
            )}

            {/* Pagination loader */}
            {isFetchingNextPage && (
              <LoadingSpinner className="text-muted-foreground col-span-full py-6 text-center text-xs" />
            )}

            {/* Intersection observer sentinel */}
            <div ref={bottomSentinelRef} aria-hidden className="col-span-full h-px" />
          </div>
        ) : (
          <div className="border-t">
            {/* Skeleton placeholder for a newly-added bookmark */}
            {animatingUrl && (
              <NewBookmarkRow
                url={animatingUrl}
                bookmark={resolvedBookmark}
                onDone={onTransitionDone}
              />
            )}

            {isInitialLoad ? (
              <LoadingSpinner className="text-muted-foreground px-6 py-8 text-center text-xs" />
            ) : (
              visibleItems.map((item, index) => (
                <AnimatedItem
                  key={item.id}
                  id={item.id}
                  isRemoving={removingIds.has(item.id)}
                  onRemoved={onItemRemoved}
                  variant="list"
                  kind={removingIds.get(item.id) ?? "delete"}>
                  <div
                    className={cn(
                      "relative",
                      selectionMode && selectedIds.has(item.id) && "bg-muted",
                    )}
                    onClickCapture={(e) => {
                      if (!selectionMode) return;
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSelected(item.id);
                    }}>
                    <ItemRow
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
              ))
            )}

            {/* Pagination loader */}
            {isFetchingNextPage && (
              <LoadingSpinner className="text-muted-foreground px-6 py-6 text-center text-xs" />
            )}

            {/* Intersection observer sentinel */}
            <div ref={bottomSentinelRef} aria-hidden className="h-px" />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
