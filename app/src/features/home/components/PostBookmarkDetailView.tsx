"use client";

import {useCallback, type MouseEvent} from "react";
import PostBookmarkList from "@/components/bookmark/_components/post/PostBookmarkList";
import type {Bookmark, PostBookmark} from "@/components/bookmark/types";
import {PostSkeletonList} from "@/components/bookmark/_components/shared/BookmarkSkeletons";
import {useViewOptionsStore} from "@/store/use-view-options";
import {getAllItemsBookmarkWidthClass} from "@/features/all-items/components/all-items-list-layout";
import {PostBookmarkDetailHeader} from "@/features/home/components/PostBookmarkDetailHeader";

type PostBookmarkDetailViewProps = {
  detailBookmarkId: string;
  item: PostBookmark | null;
  isError: boolean;
  isLoading: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  onBack: () => void;
  onOpenMenu?: (item: Bookmark) => void;
  setSelected: (id: string, checked: boolean) => void;
  toggleSelected: (id: string) => void;
};

export function PostBookmarkDetailView({
  detailBookmarkId,
  item,
  isError,
  isLoading,
  selectionMode,
  isSelected,
  onBack,
  onOpenMenu,
  setSelected,
  toggleSelected,
}: PostBookmarkDetailViewProps) {
  const bookmarkWidth = useViewOptionsStore((state) => state.bookmarkWidthByType.post);
  const itemId = item?.id;
  const handleDetailClickCapture = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!selectionMode || !itemId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleSelected(itemId);
    },
    [itemId, selectionMode, toggleSelected],
  );

  return (
    <div className="s relative flex h-full min-h-0 flex-col">
      <PostBookmarkDetailHeader onBack={onBack} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={getAllItemsBookmarkWidthClass(bookmarkWidth)}>
          {item ? (
            <div
              data-selection-mode={selectionMode}
              className="group/bookmark-row relative"
              onClickCapture={handleDetailClickCapture}>
              <PostBookmarkList
                item={item}
                onOpenMenu={onOpenMenu}
                isPostDetailOpen={true}
                selectionIndex={0}
                isSelected={isSelected}
                setSelected={setSelected}
              />
            </div>
          ) : (
            <PostDetailState
              detailBookmarkId={detailBookmarkId}
              isError={isError}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PostDetailState({
  detailBookmarkId,
  isError,
  isLoading,
}: {
  detailBookmarkId: string;
  isError: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <PostSkeletonList />;
  }

  return (
    <div className="px-6 py-12 text-center">
      <h2 className="text-foreground text-base font-semibold">
        {isError ? "Post unavailable" : "Post not found"}
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
        {isError
          ? "Something went wrong while loading this post."
          : `No saved post was found for ${detailBookmarkId}.`}
      </p>
    </div>
  );
}
