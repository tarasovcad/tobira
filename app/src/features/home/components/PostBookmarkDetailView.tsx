"use client";

import PostBookmarkList from "@/components/bookmark/_components/post/PostBookmarkList";
import type {Bookmark, PostBookmark} from "@/components/bookmark/types";
import Spinner from "@/components/ui/app/spinner";
import {Button} from "@/components/ui/coss/button";

type PostBookmarkDetailViewProps = {
  detailBookmarkId: string;
  item: PostBookmark | null;
  isError: boolean;
  isLoading: boolean;
  onBack: () => void;
  onOpenMenu?: (item: Bookmark) => void;
};

export function PostBookmarkDetailView({
  detailBookmarkId,
  item,
  isError,
  isLoading,
  onBack,
  onOpenMenu,
}: PostBookmarkDetailViewProps) {
  return (
    <div className="s relative flex h-full min-h-0 flex-col">
      <header className="border-border flex shrink-0 items-center gap-3 stroke-1 px-6 pt-2.5 pb-3">
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
              d="M7.13807 3.52859C7.3984 3.78895 7.3984 4.21105 7.13807 4.47141L4.27615 7.33333H13.3333C13.7015 7.33333 14 7.6318 14 8C14 8.3682 13.7015 8.66667 13.3333 8.66667H4.27614L7.13807 11.5286C7.3984 11.7889 7.3984 12.2111 7.13807 12.4714C6.87773 12.7317 6.45561 12.7317 6.19526 12.4714L2.19526 8.4714C2.07024 8.3464 2 8.1768 2 8C2 7.8232 2.07024 7.6536 2.19526 7.5286L6.19526 3.52859C6.45561 3.26825 6.87773 3.26825 7.13807 3.52859Z"
              fill="currentColor"
            />
          </svg>
        </Button>
        <h1 className="text-foreground/95 text-[17px] font-semibold">Post</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl">
          {item ? (
            <PostBookmarkList item={item} onOpenMenu={onOpenMenu} isPostDetailOpen={true} />
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
