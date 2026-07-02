"use client";
import {useCallback, useEffect, useMemo} from "react";
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import Spinner from "@/components/ui/app/spinner";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import type {Bookmark} from "@/components/bookmark/types";
import {cn} from "@/lib/utils";
import type {SortMode, TypeFilter} from "@/features/home/types";
import type {ViewMode} from "@/store/use-view-options";
import {useViewOptionsStore} from "@/store/use-view-options";
import {
  getCurrentAllItemsView,
  getAllItemsListViewOptions,
  getBookmarkWidthForType,
} from "@/features/all-items/components/all-items-list-view-options";
import {AllItemsAnimatingPlaceholders} from "@/features/all-items/components/AllItemsAnimatingPlaceholders";
import {AllItemsBookmarkRow} from "@/features/all-items/components/AllItemsBookmarkRow";
import {
  getAllItemsListLayoutConfig,
  type AllItemsSurface,
} from "@/features/all-items/components/all-items-list-layout";
import {buildMediaGalleryEntries} from "@/components/bookmark/_utils/media-grid-render";
import type {BookmarkMediaItem} from "@/components/bookmark/types/metadata";
import {getBookmarkMediaPreviewSizeForColumnSize} from "@/components/bookmark/_utils/media-grid-image-config";
import {useMediaGalleryPreview} from "@/features/media/hooks/useMediaGalleryPreview";
import {MediaGalleryOverlay} from "@/features/media/components/MediaGalleryOverlay";
import {
  createMediaGalleryController,
  useMediaGalleryControllerSnapshot,
} from "@/features/media/hooks/useMediaGalleryController";

const GALLERY_PREFETCH_REMAINING_ITEMS = 4;

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
  sort: SortMode;
  visibleItems: Bookmark[];
  onOpenDetail?: (item: Bookmark) => void;
  animatingUrl: string | null;
  animatingItemCount: number;
  pendingMediaItems?: BookmarkMediaItem[];
  resolvedBookmarks: Bookmark[];
  isInitialLoad: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
  scrollAreaRootRef: React.RefObject<HTMLDivElement | null>;
  bottomSentinelRef: React.RefObject<HTMLDivElement | null>;
  fetchNextPage: () => void;
  onTransitionDone: () => void;
  toggleSelected: (id: string) => void;
  setSelected: (id: string, checked: boolean) => void;
  onMenuArchive: (item: Bookmark) => void;
  onMenuDelete: (item: Bookmark) => void;
  onRestore?: (item: Bookmark) => void;
  onDeleteForever?: (item: Bookmark) => void;
  scrollTopPadding?: boolean;
  actionsEnabled?: boolean;
  itemSurface?: AllItemsSurface;
}

export function AllItemsList({
  view,
  typeFilter,
  sort,
  visibleItems,
  onOpenDetail,
  animatingUrl,
  animatingItemCount,
  pendingMediaItems,
  resolvedBookmarks,
  isFetchingNextPage,
  hasNextPage,
  selectionMode,
  selectedIds,
  scrollAreaRootRef,
  bottomSentinelRef,
  fetchNextPage,
  onTransitionDone,
  toggleSelected,
  setSelected,
  onMenuArchive,
  onMenuDelete,
  onRestore,
  onDeleteForever,
  isInitialLoad,
  scrollTopPadding,
  actionsEnabled = true,
  itemSurface = "library",
}: AllItemsListProps) {
  const currentView = getCurrentAllItemsView(view, typeFilter);
  const isMediaGrid = currentView === "grid" && typeFilter === "media";
  const applyScrollTopPadding =
    scrollTopPadding &&
    currentView !== "compact" &&
    !(currentView === "list" && typeFilter === "website") &&
    typeFilter !== "post";

  const gridGap = useViewOptionsStore((state) => state.gridGap);
  const columnSize = useViewOptionsStore((state) => state.columnSize);
  const borderRadius = useViewOptionsStore((state) => state.borderRadius);
  const bookmarkWidth = useViewOptionsStore((state) =>
    getBookmarkWidthForType(state.bookmarkWidthByType, typeFilter),
  );
  const mediaPreviewSize = getBookmarkMediaPreviewSizeForColumnSize(columnSize);

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
        itemSurface,
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
      itemSurface,
    ],
  );

  const skeletonCount = 12;
  const bookmarkItemComponent = layoutConfig.BookmarkItem;
  const animatedVariant = layoutConfig.animatedVariant;

  const getItemSelectionIndex = useCallback(
    (index: number) => (selectionMode ? index : 0),
    [selectionMode],
  );

  const mediaGalleryEntries = useMemo(
    () => (isMediaGrid ? buildMediaGalleryEntries(visibleItems, mediaPreviewSize) : []),
    [isMediaGrid, mediaPreviewSize, visibleItems],
  );
  const mediaGalleryController = useMemo(() => createMediaGalleryController(), []);
  const mediaGalleryState = useMediaGalleryControllerSnapshot(mediaGalleryController);
  const boundedCurrentMediaIndex =
    mediaGalleryState.currentIndex === null || mediaGalleryEntries.length === 0
      ? null
      : Math.min(mediaGalleryState.currentIndex, mediaGalleryEntries.length - 1);
  const currentMediaEntry =
    boundedCurrentMediaIndex !== null
      ? (mediaGalleryEntries.at(boundedCurrentMediaIndex) ?? null)
      : null;
  const shouldPrefetchNextGalleryPage =
    isMediaGrid &&
    mediaGalleryState.open &&
    boundedCurrentMediaIndex !== null &&
    hasNextPage &&
    !isFetchingNextPage &&
    boundedCurrentMediaIndex >= mediaGalleryEntries.length - GALLERY_PREFETCH_REMAINING_ITEMS;

  const mediaGalleryPreview = useMediaGalleryPreview({
    type: currentMediaEntry?.previewItem.type ?? "image",
    addZoom: true,
    onEscape: mediaGalleryController.requestClose,
    onOpenChange: (open) => {
      if (!open) {
        mediaGalleryController.handlePreviewClosed();
      }
    },
  });

  useEffect(() => {
    mediaGalleryController.attachPreview(mediaGalleryPreview);
    return () => {
      mediaGalleryController.attachPreview(null);
    };
  }, [mediaGalleryController, mediaGalleryPreview]);

  useEffect(() => {
    if (!mediaGalleryState.open) {
      return;
    }

    if (
      mediaGalleryEntries.length === 0 ||
      mediaGalleryState.currentIndex === null ||
      mediaGalleryState.currentIndex >= mediaGalleryEntries.length
    ) {
      mediaGalleryController.requestClose();
    }
  }, [
    mediaGalleryController,
    mediaGalleryEntries.length,
    mediaGalleryState.currentIndex,
    mediaGalleryState.open,
  ]);

  useEffect(() => {
    if (!shouldPrefetchNextGalleryPage) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, shouldPrefetchNextGalleryPage]);

  const content = useMemo(() => {
    if (isInitialLoad) {
      return Array.from({length: skeletonCount}, (_, index) =>
        layoutConfig.renderSkeletonItem(index),
      );
    }

    const renderEntries = isMediaGrid
      ? mediaGalleryEntries
      : visibleItems.map((item, bookmarkIndex) => ({
          item,
          bookmarkIndex,
          mediaIndex: undefined,
          renderId: item.id,
        }));

    return renderEntries.map((entry, entryIndex) => (
      <AllItemsBookmarkRow
        key={entry.renderId}
        item={entry.item}
        onOpenDetail={onOpenDetail}
        renderId={entry.renderId}
        mediaIndex={entry.mediaIndex}
        galleryItem={
          isMediaGrid
            ? {
                index: entryIndex,
                renderId: entry.renderId,
                controller: mediaGalleryController,
              }
            : undefined
        }
        selectionIndex={getItemSelectionIndex(entry.bookmarkIndex)}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(entry.item.id)}
        animatedVariant={animatedVariant}
        isMasonry={layoutConfig.isMasonry}
        BookmarkItem={bookmarkItemComponent}
        className={
          typeFilter === "post" &&
          entry.bookmarkIndex === 0 &&
          !animatingUrl &&
          !applyScrollTopPadding
            ? "pt-6"
            : undefined
        }
        toggleSelected={toggleSelected}
        setSelected={setSelected}
        onMenuArchive={onMenuArchive}
        onMenuDelete={onMenuDelete}
        onRestore={onRestore}
        onDeleteForever={onDeleteForever}
        actionsEnabled={actionsEnabled}
      />
    ));
  }, [
    isInitialLoad,
    animatingUrl,
    isMediaGrid,
    layoutConfig,
    bookmarkItemComponent,
    animatedVariant,
    getItemSelectionIndex,
    mediaGalleryEntries,
    mediaGalleryController,
    onOpenDetail,
    onMenuArchive,
    onMenuDelete,
    onRestore,
    onDeleteForever,
    actionsEnabled,
    applyScrollTopPadding,
    selectedIds,
    selectionMode,
    setSelected,
    toggleSelected,
    typeFilter,
    visibleItems,
  ]);

  const placeholder = (
    <AllItemsAnimatingPlaceholders
      animatingUrl={animatingUrl}
      animatingItemCount={animatingItemCount}
      pendingMediaItems={pendingMediaItems}
      resolvedBookmarks={resolvedBookmarks}
      flattenMediaBookmarks={isMediaGrid}
      onTransitionDone={onTransitionDone}
      renderSkeletonItem={layoutConfig.renderSkeletonItem}
    />
  );

  const showPlaceholder = sort !== "az";
  const isNewestAtBottom = sort === "oldest";

  const body = (
    <>
      {!isNewestAtBottom && showPlaceholder && placeholder}
      {content}
      {isNewestAtBottom && showPlaceholder && placeholder}
    </>
  );

  return (
    <>
      <div ref={scrollAreaRootRef} className="h-auto min-h-0 flex-1">
        <ScrollArea className="h-full" hideFocusRing viewportProps={{tabIndex: 0}}>
          <div className={cn(layoutConfig.wrapperClassName, applyScrollTopPadding && "pt-6")}>
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
                <div
                  ref={bottomSentinelRef}
                  aria-hidden
                  className={layoutConfig.sentinelClassName}
                />
              </>
            ) : null}
          </div>
        </ScrollArea>
      </div>
      <MediaGalleryOverlay
        entries={mediaGalleryEntries}
        controller={mediaGalleryController}
        isFetchingNextPage={isFetchingNextPage}
        {...mediaGalleryPreview}
      />
    </>
  );
}
