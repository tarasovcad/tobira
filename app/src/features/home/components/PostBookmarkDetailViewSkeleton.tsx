"use client";

import {Skeleton} from "@/components/ui/coss/skeleton";
import {getAllItemsBookmarkWidthClass} from "@/features/all-items/components/all-items-list-layout";
import {PostBookmarkDetailHeader} from "@/features/home/components/PostBookmarkDetailHeader";
import {usePostDetailUrl} from "@/features/home/hooks/use-post-detail-url";
import {cn} from "@/lib/utils";
import {useViewOptionsStore} from "@/store/use-view-options";

interface PostBookmarkDetailViewSkeletonProps {
  className?: string;
}

export function PostBookmarkDetailViewSkeleton({className}: PostBookmarkDetailViewSkeletonProps) {
  const {closePostDetail} = usePostDetailUrl();
  const bookmarkWidth = useViewOptionsStore(
    (state) => state.viewOptionsByLayout.list.bookmarkWidthByType.post,
  );

  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", className)}>
      <PostBookmarkDetailHeader onBack={closePostDetail} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={getAllItemsBookmarkWidthClass(bookmarkWidth)}>
          <PostBookmarkDetailPostSkeleton />
        </div>
      </div>
    </div>
  );
}

export function PostBookmarkDetailPostSkeleton() {
  return (
    <article aria-hidden="true" className="border-border flex flex-col gap-[14px] px-4 pt-0 pb-10">
      <div className="relative z-[1] flex flex-col gap-5">
        <div className="flex flex-col gap-[14px]">
          <PostBookmarkDetailAuthorSkeleton />
          <div className="min-w-0 flex-1 space-y-[14px]">
            <PostBookmarkDetailTextSkeleton />
            <PostBookmarkDetailMediaSkeleton />
            <PostBookmarkDetailFooterTextSkeleton />
          </div>
        </div>
      </div>
    </article>
  );
}

function PostBookmarkDetailAuthorSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-2 pr-10">
      <Skeleton className="size-10 rounded-full" />

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <Skeleton className="h-[18px] w-32 rounded" />
          <Skeleton className="h-4.5 w-4.5 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 rounded" />
      </div>
    </div>
  );
}

function PostBookmarkDetailTextSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-[18px] w-full rounded" />
      <Skeleton className="h-[18px] w-11/12 rounded" />
      <Skeleton className="h-[18px] w-4/5 rounded" />
      <Skeleton className="h-[18px] w-2/5 rounded" />
    </div>
  );
}

function PostBookmarkDetailMediaSkeleton() {
  return <Skeleton className="aspect-video w-full rounded-lg" />;
}

function PostBookmarkDetailFooterTextSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-[18px] w-10/12 rounded" />
      <Skeleton className="h-[18px] w-8/12 rounded" />
    </div>
  );
}
