"use client";
import {useMemo} from "react";
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
} from "../all-items-client/all-items-list-view-options";
import {AllItemsAnimatingPlaceholders} from "../all-items-client/AllItemsAnimatingPlaceholders";
import {AllItemsBookmarkRow} from "../all-items-client/AllItemsBookmarkRow";
import {getAllItemsListLayoutConfig} from "../all-items-client/all-items-list-layout";

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
  const bookmarkWidth = useViewOptionsStore((state) => state.bookmarkWidth);

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
      }),
    [borderRadiusClass, currentView, gapClass, gridColsClass, isMediaGrid, bookmarkWidth],
  );

  const skeletonCount = 12;

  const content = useMemo(() => {
    if (isInitialLoad) {
      return Array.from({length: skeletonCount}, (_, index) =>
        layoutConfig.renderSkeletonItem(index),
      );
    }

    return visibleItems.map((item, index) => (
      <AllItemsBookmarkRow
        key={item.id}
        item={item}
        index={index}
        isRemoving={removingIds.has(item.id)}
        removalKind={removingIds.get(item.id) ?? "delete"}
        selectionMode={selectionMode}
        isSelected={selectedIds.has(item.id)}
        animatedVariant={layoutConfig.animatedVariant}
        BookmarkItem={layoutConfig.BookmarkItem}
        onItemRemoved={onItemRemoved}
        toggleSelected={toggleSelected}
        setSelected={setSelected}
        onMenuArchive={onMenuArchive}
        onMenuDelete={onMenuDelete}
      />
    ));
  }, [
    isInitialLoad,
    layoutConfig,
    onItemRemoved,
    onMenuArchive,
    onMenuDelete,
    removingIds,
    selectedIds,
    selectionMode,
    setSelected,
    toggleSelected,
    visibleItems,
  ]);

  const body = (
    <>
      <AllItemsAnimatingPlaceholders
        animatingUrl={animatingUrl}
        animatingItemCount={animatingItemCount}
        animatingTags={animatingTags}
        resolvedBookmarks={resolvedBookmarks}
        onTransitionDone={onTransitionDone}
        PlaceholderComponent={layoutConfig.NewBookmarkPlaceholder}
      />
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
