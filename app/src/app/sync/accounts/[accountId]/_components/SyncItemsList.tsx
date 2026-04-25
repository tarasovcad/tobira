"use client";

import {useCallback, useMemo} from "react";
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import Spinner from "@/components/ui/app/spinner";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import type {TypeFilter} from "@/features/home/types";
import type {ViewMode} from "@/store/use-view-options";
import {useViewOptionsStore} from "@/store/use-view-options";
import {
  getCurrentAllItemsView,
  getAllItemsListViewOptions,
  getBookmarkWidthForType,
} from "@/features/all-items/components/all-items-list-view-options";
import {getAllItemsListLayoutConfig} from "@/features/all-items/components/all-items-list-layout";
import {flattenMediaGridBookmarks} from "@/features/media/components/bookmark/media-grid-render";
import {SyncItemRow} from "./SyncItemRow";
import type {SyncItem} from "../_types";

function LoadingSpinner({className}: {className?: string}) {
  return (
    <div className={className}>
      <Spinner className="mx-auto size-4 animate-spin" />
    </div>
  );
}

interface SyncItemsListProps {
  view: ViewMode;
  typeFilter: TypeFilter;
  visibleItems: SyncItem[];
  isInitialLoad: boolean;
  isFetchingNextPage: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  removingIds: Map<string, "delete" | "archive">;
  scrollAreaRootRef: React.RefObject<HTMLDivElement | null>;
  bottomSentinelRef: React.RefObject<HTMLDivElement | null>;
  onItemRemoved: (id: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  onMenuExclude: (item: SyncItem) => void;
  onItemSave: (item: SyncItem) => void;
  onItemDismiss: (item: SyncItem) => void;
}

export function SyncItemsList({
  view,
  typeFilter,
  visibleItems,
  isInitialLoad,
  isFetchingNextPage,
  selectionMode,
  selectedIds,
  removingIds,
  scrollAreaRootRef,
  bottomSentinelRef,
  onItemRemoved,
  toggleSelected,
  setSelected,
  onMenuExclude,
  onItemSave,
  onItemDismiss,
}: SyncItemsListProps) {
  const currentView = getCurrentAllItemsView(view, typeFilter);
  const isMediaGrid = currentView === "grid" && typeFilter === "media";

  const gridGap = useViewOptionsStore((state) => state.gridGap);
  const columnSize = useViewOptionsStore((state) => state.columnSize);
  const borderRadius = useViewOptionsStore((state) => state.borderRadius);
  const bookmarkWidth = useViewOptionsStore((state) =>
    getBookmarkWidthForType(state.bookmarkWidthByType, typeFilter),
  );

  const {borderRadiusClass, gapClass, gridColsClass, masonryColsClass} = getAllItemsListViewOptions(
    {
      borderRadius,
      gridGap,
      columnSize,
    },
  );

  const layoutConfig = useMemo(
    () =>
      getAllItemsListLayoutConfig({
        view: currentView,
        borderRadiusClass,
        gapClass,
        gridColsClass,
        masonryColsClass,
        isMediaGrid,
        bookmarkWidth,
        typeFilter,
      }),
    [
      borderRadiusClass,
      currentView,
      gapClass,
      gridColsClass,
      masonryColsClass,
      isMediaGrid,
      bookmarkWidth,
      typeFilter,
    ],
  );

  const skeletonCount = 12;
  const bookmarkItemComponent = layoutConfig.BookmarkItem;
  const animatedVariant = layoutConfig.animatedVariant;

  const getItemSelectionIndex = useCallback(
    (index: number) => (selectionMode ? index : 0),
    [selectionMode],
  );

  const content = useMemo(() => {
    if (isInitialLoad) {
      return Array.from({length: skeletonCount}, (_, index) =>
        layoutConfig.renderSkeletonItem(index),
      );
    }

    const renderEntries = isMediaGrid
      ? flattenMediaGridBookmarks(visibleItems)
      : visibleItems.map((item, bookmarkIndex) => ({
          item,
          bookmarkIndex,
          mediaIndex: undefined,
          renderId: item.id,
        }));

    return renderEntries.map((entry) => (
      <SyncItemRow
        key={entry.renderId}
        item={entry.item}
        renderId={entry.renderId}
        mediaIndex={entry.mediaIndex}
        selectionIndex={getItemSelectionIndex(entry.bookmarkIndex)}
        isRemoving={removingIds.has(entry.item.id)}
        removalKind={removingIds.get(entry.item.id) ?? "delete"}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(entry.item.id)}
        animatedVariant={animatedVariant}
        isMasonry={layoutConfig.isMasonry}
        BookmarkItem={bookmarkItemComponent}
        onItemRemoved={onItemRemoved}
        toggleSelected={toggleSelected}
        setSelected={setSelected}
        onMenuExclude={onMenuExclude}
        onItemSave={onItemSave}
        onItemDismiss={onItemDismiss}
      />
    ));
  }, [
    isInitialLoad,
    isMediaGrid,
    layoutConfig,
    bookmarkItemComponent,
    animatedVariant,
    getItemSelectionIndex,
    onItemRemoved,
    onMenuExclude,
    onItemSave,
    onItemDismiss,
    removingIds,
    selectedIds,
    selectionMode,
    setSelected,
    toggleSelected,
    visibleItems,
  ]);

  const body = content;

  return (
    <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
      <ScrollArea className="h-full" hideFocusRing viewportProps={{tabIndex: 0}}>
        <div className={layoutConfig.wrapperClassName}>
          <div className={layoutConfig.containerClassName}>
            {layoutConfig.isTable ? <BookmarkTableShell>{body}</BookmarkTableShell> : body}
            {!layoutConfig.isMasonry ? (
              <>
                {isFetchingNextPage && (
                  <LoadingSpinner className={layoutConfig.fetchSpinnerClassName} />
                )}
                <div
                  ref={bottomSentinelRef}
                  aria-hidden
                  className={layoutConfig.sentinelClassName}
                />
              </>
            ) : null}
          </div>
          {layoutConfig.isMasonry ? (
            <>
              {isFetchingNextPage ? (
                <LoadingSpinner className={layoutConfig.fetchSpinnerClassName} />
              ) : null}
              <div ref={bottomSentinelRef} aria-hidden className={layoutConfig.sentinelClassName} />
            </>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
