"use client";

import {useCallback, type MouseEvent} from "react";
import PostBookmarkList from "@/components/bookmark/_components/post/PostBookmarkList";
import type {Bookmark, PostBookmark} from "@/components/bookmark/types";
import {useViewOptionsStore} from "@/store/use-view-options";
import {getAllItemsBookmarkWidthClass} from "@/features/all-items/components/all-items-list-layout";
import {PostBookmarkDetailHeader} from "@/features/home/components/PostBookmarkDetailHeader";
import {PostBookmarkDetailPostSkeleton} from "@/features/home/components/PostBookmarkDetailViewSkeleton";

export type PostDetailErrorCode = "INVALID_ID" | "NOT_FOUND" | "UNAUTHORIZED" | "UNKNOWN_ERROR";

type PostBookmarkDetailViewProps = {
  detailBookmarkId: string;
  item: PostBookmark | null;
  errorCode: PostDetailErrorCode | null;
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
  errorCode,
  isLoading,
  selectionMode,
  isSelected,
  onBack,
  onOpenMenu,
  setSelected,
  toggleSelected,
}: PostBookmarkDetailViewProps) {
  const bookmarkWidth = useViewOptionsStore(
    (state) => state.viewOptionsByLayout.list.bookmarkWidthByType.post,
  );
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
    <div className="relative flex h-full min-h-0 flex-col overflow-y-auto">
      <PostBookmarkDetailHeader onBack={onBack} />

      <div className="min-h-0 flex-1">
        <div className={getAllItemsBookmarkWidthClass(bookmarkWidth)}>
          {item ? (
            <PostBookmarkDetailLoadedContent
              item={item}
              onOpenMenu={onOpenMenu}
              selectionMode={selectionMode}
              isSelected={isSelected}
              setSelected={setSelected}
              onClickCapture={handleDetailClickCapture}
            />
          ) : (
            <PostDetailState
              detailBookmarkId={detailBookmarkId}
              errorCode={errorCode}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PostBookmarkDetailLoadedContent({
  isSelected,
  item,
  onClickCapture,
  onOpenMenu,
  selectionMode,
  setSelected,
}: {
  isSelected: boolean;
  item: PostBookmark;
  onClickCapture: (event: MouseEvent<HTMLDivElement>) => void;
  onOpenMenu?: (item: Bookmark) => void;
  selectionMode: boolean;
  setSelected: (id: string, checked: boolean) => void;
}) {
  return (
    <div
      data-selection-mode={selectionMode}
      className="group/bookmark-row relative"
      onClickCapture={onClickCapture}>
      <PostBookmarkList
        item={item}
        onOpenMenu={onOpenMenu}
        isPostDetailOpen={true}
        selectionIndex={0}
        isSelected={isSelected}
        setSelected={setSelected}
      />
    </div>
  );
}

function PostDetailState({
  detailBookmarkId,
  errorCode,
  isLoading,
}: {
  detailBookmarkId: string;
  errorCode: PostDetailErrorCode | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <PostBookmarkDetailPostSkeleton />;
  }

  const {title, description} = getPostDetailErrorCopy(errorCode, detailBookmarkId);

  return (
    <div className="px-6 py-12 text-center">
      <h2 className="text-foreground text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">{description}</p>
    </div>
  );
}

const POST_DETAIL_ERROR_COPY = new Map<
  Exclude<PostDetailErrorCode, "NOT_FOUND">,
  {description: string; title: string}
>([
  [
    "INVALID_ID",
    {
      title: "Invalid post link",
      description: "This post link contains an invalid bookmark id.",
    },
  ],
  [
    "UNAUTHORIZED",
    {
      title: "Sign in required",
      description: "You need to be signed in to view saved posts.",
    },
  ],
  [
    "UNKNOWN_ERROR",
    {
      title: "Post unavailable",
      description: "Something went wrong while loading this post.",
    },
  ],
]);

function getPostDetailErrorCopy(errorCode: PostDetailErrorCode | null, detailBookmarkId: string) {
  const notFoundCopy = {
    title: "Post not found",
    description: `No saved post was found for ${detailBookmarkId}.`,
  };

  if (errorCode && errorCode !== "NOT_FOUND") {
    return POST_DETAIL_ERROR_COPY.get(errorCode) ?? notFoundCopy;
  }

  return notFoundCopy;
}
