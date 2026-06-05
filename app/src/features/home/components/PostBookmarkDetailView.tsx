"use client";

import {useCallback, type MouseEvent} from "react";
import PostBookmarkList from "@/components/bookmark/_components/post/PostBookmarkList";
import type {Bookmark, PostBookmark} from "@/components/bookmark/types";
import Spinner from "@/components/ui/app/spinner";
import {Button} from "@/components/ui/coss/button";
import {useViewOptionsStore} from "@/store/use-view-options";
import {getAllItemsBookmarkWidthClass} from "@/features/all-items/components/all-items-list-layout";

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
      <header className="border-border flex shrink-0 items-center gap-3 stroke-1 px-6 pt-2.5 pb-5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to posts"
          onClick={onBack}
          className="rounded-full">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.13807 3.20921C7.3984 3.48816 7.3984 3.94042 7.13807 4.21937L4.27615 7.28572H13.3333C13.7015 7.28572 14 7.60551 14 8.00001C14 8.39451 13.7015 8.7143 13.3333 8.7143H4.27614L7.13807 11.7807C7.3984 12.0596 7.3984 12.5119 7.13807 12.7908C6.87773 13.0697 6.45561 13.0697 6.19526 12.7908L2.19526 8.50508C2.07024 8.37115 2 8.18944 2 8.00001C2 7.81058 2.07024 7.62887 2.19526 7.49494L6.19526 3.20921C6.45561 2.93026 6.87773 2.93026 7.13807 3.20921Z"
              fill="currentColor"
            />
          </svg>
        </Button>
        <h1 className="text-foreground/95 text-[17px] font-semibold">Post</h1>
      </header>

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
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 px-6 py-12 text-sm">
        <Spinner className="size-4 animate-spin" />
        Loading post...
      </div>
    );
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
