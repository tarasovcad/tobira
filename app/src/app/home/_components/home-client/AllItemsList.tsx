"use client";
import {useCallback, useMemo} from "react";
import {ScrollArea} from "@/components/coss-ui/scroll-area";
import Spinner from "@/components/ui/spinner";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import type {Bookmark} from "@/components/bookmark/types";
import type {TypeFilter} from "../../_types";
import type {ViewMode} from "@/store/use-view-options";
import {useViewOptionsStore} from "@/store/use-view-options";
import {
  getCurrentAllItemsView,
  getAllItemsListViewOptions,
  getBookmarkWidthForType,
} from "../all-items-client/all-items-list-view-options";
import {AllItemsAnimatingPlaceholders} from "../all-items-client/AllItemsAnimatingPlaceholders";
import {AllItemsBookmarkRow} from "../all-items-client/AllItemsBookmarkRow";
import {getAllItemsListLayoutConfig} from "../all-items-client/all-items-list-layout";
import {flattenMediaGridBookmarks} from "@/features/media/components/bookmark/media-grid-render";

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
  animatingTags?: string[];
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
  onMenuArchive: (item: Bookmark) => void;
  onMenuDelete: (item: Bookmark) => void;
}

export function AllItemsList({
  view,
  typeFilter,
  visibleItems,
  animatingUrl,
  animatingItemCount,
  animatingTags,
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
  onMenuArchive,
  onMenuDelete,
  isInitialLoad,
}: AllItemsListProps) {
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
      <AllItemsBookmarkRow
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
        className={typeFilter === "post" && entry.bookmarkIndex === 0 ? "pt-6" : undefined}
        onItemRemoved={onItemRemoved}
        toggleSelected={toggleSelected}
        setSelected={setSelected}
        onMenuArchive={onMenuArchive}
        onMenuDelete={onMenuDelete}
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
    onMenuArchive,
    onMenuDelete,
    removingIds,
    selectedIds,
    selectionMode,
    setSelected,
    toggleSelected,
    typeFilter,
    visibleItems,
  ]);

  const body = (
    <>
      <AllItemsAnimatingPlaceholders
        animatingUrl={animatingUrl}
        animatingItemCount={animatingItemCount}
        animatingTags={animatingTags}
        resolvedBookmarks={resolvedBookmarks}
        flattenMediaBookmarks={isMediaGrid}
        onTransitionDone={onTransitionDone}
        PlaceholderComponent={layoutConfig.NewBookmarkPlaceholder}
      />
      {content}
    </>
  );

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
