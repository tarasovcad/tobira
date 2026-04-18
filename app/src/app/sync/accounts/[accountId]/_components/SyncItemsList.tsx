"use client";

import {useCallback, useMemo} from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import type {TypeFilter} from "@/app/home/_types";
import type {ViewMode} from "@/store/use-view-options";
import {useViewOptionsStore} from "@/store/use-view-options";
import {
  getCurrentAllItemsView,
  getAllItemsListViewOptions,
} from "@/app/home/_components/all-items-client/all-items-list-view-options";
import {getAllItemsListLayoutConfig} from "@/app/home/_components/all-items-client/all-items-list-layout";
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
  const bookmarkWidth = useViewOptionsStore((state) => state.bookmarkWidthByType[typeFilter]);

  const {borderRadiusClass, gapClass, gridColsClass} = getAllItemsListViewOptions({
    borderRadius,
    gridGap,
    columnSize,
  });

  const layoutConfig = useMemo(
    () =>
      getAllItemsListLayoutConfig({
        view: currentView,
        borderRadiusClass,
        gapClass,
        gridColsClass,
        isMediaGrid,
        bookmarkWidth,
        typeFilter,
      }),
    [
      borderRadiusClass,
      currentView,
      gapClass,
      gridColsClass,
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

    return visibleItems.map((item, index) => (
      <SyncItemRow
        key={item.id}
        item={item}
        selectionIndex={getItemSelectionIndex(index)}
        isRemoving={removingIds.has(item.id)}
        removalKind={removingIds.get(item.id) ?? "delete"}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(item.id)}
        animatedVariant={animatedVariant}
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

  const body = (
    <>
      {content}
      {isFetchingNextPage && <LoadingSpinner className={layoutConfig.fetchSpinnerClassName} />}
    </>
  );

  return (
    <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
      <ScrollArea className="h-full" hideFocusRing viewportProps={{tabIndex: 0}}>
        <div className={layoutConfig.wrapperClassName}>
          <div className={layoutConfig.containerClassName}>
            {layoutConfig.isTable ? <BookmarkTableShell>{body}</BookmarkTableShell> : body}
            <div ref={bottomSentinelRef} aria-hidden className={layoutConfig.sentinelClassName} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
