"use client";
import {useCallback, useEffect, useMemo, useState} from "react";
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import Spinner from "@/components/ui/app/spinner";
import {BookmarkTableShell} from "@/components/bookmark/BookmarkTableShell";
import type {Bookmark} from "@/components/bookmark/types";
import type {TypeFilter} from "@/features/home/types";
import type {ViewMode} from "@/store/use-view-options";
import {useViewOptionsStore} from "@/store/use-view-options";
import {
  getCurrentAllItemsView,
  getAllItemsListViewOptions,
  getBookmarkWidthForType,
} from "@/features/all-items/components/all-items-list-view-options";
import {AllItemsAnimatingPlaceholders} from "@/features/all-items/components/AllItemsAnimatingPlaceholders";
import {AllItemsBookmarkRow} from "@/features/all-items/components/AllItemsBookmarkRow";
import {getAllItemsListLayoutConfig} from "@/features/all-items/components/all-items-list-layout";
import {buildMediaGalleryEntries} from "@/components/bookmark/_utils/media-grid-render";
import type {MediaMediaItem} from "@/components/bookmark/types/metadata";
import {getBookmarkMediaPreviewSizeForColumnSize} from "@/components/bookmark/_utils/media-grid-image-config";
import type {Rect} from "@/features/media/components/preview/types";
import {useMediaGalleryPreview} from "@/features/media/hooks/useMediaGalleryPreview";
import {MediaGalleryOverlay} from "@/features/media/components/MediaGalleryOverlay";
import {createMediaGalleryVideoSessionStore} from "@/features/media/hooks/useMediaGalleryVideoSessionStore";

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
  pendingMediaItems?: MediaMediaItem[];
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
  pendingMediaItems,
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

  const mediaGalleryEntries = useMemo(
    () => (isMediaGrid ? buildMediaGalleryEntries(visibleItems, mediaPreviewSize) : []),
    [isMediaGrid, mediaPreviewSize, visibleItems],
  );
  const mediaGalleryVideoSessionStore = useMemo(() => createMediaGalleryVideoSessionStore(), []);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number | null>(null);
  const boundedCurrentMediaIndex =
    currentMediaIndex === null || mediaGalleryEntries.length === 0
      ? null
      : Math.min(currentMediaIndex, mediaGalleryEntries.length - 1);
  const currentMediaEntry =
    boundedCurrentMediaIndex !== null
      ? (mediaGalleryEntries.at(boundedCurrentMediaIndex) ?? null)
      : null;

  const mediaGalleryPreview = useMediaGalleryPreview({
    type: currentMediaEntry?.previewItem.type ?? "image",
    addZoom: true,
    onOpenChange: (open) => {
      if (!open) {
        setCurrentMediaIndex(null);
      }
    },
  });
  const {openPreviewFromRect, closePreview} = mediaGalleryPreview;

  const handleOpenMediaGallery = useCallback(
    (galleryIndex: number, triggerElement: HTMLDivElement) => {
      const entry = mediaGalleryEntries.at(galleryIndex);
      if (!entry) {
        return;
      }

      const mediaElement = triggerElement.querySelector("img, video");
      if (!mediaElement) {
        return;
      }

      const thumbRect = mediaElement.getBoundingClientRect();
      const fromRect: Rect = {
        top: thumbRect.top,
        left: thumbRect.left,
        width: thumbRect.width,
        height: thumbRect.height,
      };

      setCurrentMediaIndex(galleryIndex);
      openPreviewFromRect({
        fromRect,
        width: entry.previewItem.width,
        height: entry.previewItem.height,
        originKey: entry.renderId,
      });
    },
    [mediaGalleryEntries, openPreviewFromRect],
  );

  useEffect(() => {
    if (currentMediaIndex === null) {
      return;
    }

    if (mediaGalleryEntries.length === 0) {
      closePreview();
    }
  }, [closePreview, currentMediaIndex, mediaGalleryEntries.length]);

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
        renderId={entry.renderId}
        galleryIndex={isMediaGrid ? entryIndex : undefined}
        mediaIndex={entry.mediaIndex}
        isActiveGalleryItem={isMediaGrid ? boundedCurrentMediaIndex === entryIndex : undefined}
        videoSessionStore={isMediaGrid ? mediaGalleryVideoSessionStore : undefined}
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
        onOpenGallery={isMediaGrid ? handleOpenMediaGallery : undefined}
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
    handleOpenMediaGallery,
    mediaGalleryEntries,
    mediaGalleryVideoSessionStore,
    boundedCurrentMediaIndex,
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
        pendingMediaItems={pendingMediaItems}
        resolvedBookmarks={resolvedBookmarks}
        flattenMediaBookmarks={isMediaGrid}
        onTransitionDone={onTransitionDone}
        PlaceholderComponent={layoutConfig.NewBookmarkPlaceholder}
      />
      {content}
    </>
  );

  return (
    <>
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
        currentIndex={boundedCurrentMediaIndex}
        onSelectIndex={setCurrentMediaIndex}
        videoSessionStore={mediaGalleryVideoSessionStore}
        {...mediaGalleryPreview}
      />
    </>
  );
}
